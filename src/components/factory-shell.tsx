'use client';

import { useCallback, useRef, useState } from 'react';
import { ActivityDrawer } from './activity-drawer';
import { BlueprintView } from './blueprint';
import { CandidateForge } from './candidate-forge';
import { EvidenceInspector } from './evidence-inspector';
import { ProblemDialog, SourceDialog } from './foundry-dialogs';
import { InteractiveFactory } from './interactive-factory';
import { LaunchBrief } from './launch-brief';
import { WebMCPRunRail } from './webmcp-run-rail';
import { WorkspaceArtifactDrawer } from './workspace-artifact-drawer';
import { useFoundry } from '../hooks/use-foundry';
import { useWebMCP } from '../hooks/use-webmcp';
import type { FoundryWorkspace } from '../domain/types';
import { getStageProgress } from '../presentation/factory-stages';

function stageTitle(stage: FoundryWorkspace['stage']) {
  const labels: Record<FoundryWorkspace['stage'], string> = {
    EMPTY: 'Ready for a problem',
    PROBLEM_DEFINED: 'Problem defined',
    RESEARCH_PLANNED: 'Research planned',
    SOURCING: 'Gathering sources',
    EVIDENCE_REVIEW: 'Reviewing evidence',
    INSIGHTS_READY: 'Signals synthesized',
    CANDIDATES_READY: 'Ideas ready to compare',
    STRESS_TESTING: 'Testing the strongest idea',
    BLUEPRINT_READY: 'Blueprint ready',
    FINALIZED: 'Blueprint finalized',
  };
  return labels[stage];
}

function StageSummary({ workspace }: { workspace: FoundryWorkspace }) {
  const pending = workspace.findings.filter((finding) => finding.reviewStatus === 'pending').length;
  const counterEvidence = workspace.findings.filter((finding) => finding.evidenceType === 'counter_evidence').length;
  return (
    <section className="stage-summary" aria-label="Current research stage">
      <div>
        <span className="section-kicker">Current artifact</span>
        <h2>{stageTitle(workspace.stage)}</h2>
        <p>The factory shows where this workspace is now. Evidence and decisions accumulate here as the launch advances.</p>
      </div>
      <dl>
        <div><dt>Research questions</dt><dd>{workspace.researchQuestions.length}</dd></div>
        <div><dt>Pending review</dt><dd>{pending}</dd></div>
        <div><dt>Insight clusters</dt><dd>{workspace.insights.length}</dd></div>
        <div><dt>Counter-signals</dt><dd>{counterEvidence}</dd></div>
      </dl>
    </section>
  );
}

export function FactoryShell({ initialWorkspace }: { initialWorkspace?: FoundryWorkspace }) {
  const foundry = useFoundry(initialWorkspace);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [artifactOpen, setArtifactOpen] = useState(false);
  const activityButtonRef = useRef<HTMLButtonElement>(null);
  const artifactButtonRef = useRef<HTMLButtonElement>(null);
  const { workspace } = foundry;
  const webmcp = useWebMCP(foundry.service, foundry.acceptAgentTrace, foundry.acceptAgentExport);
  const progress = getStageProgress(workspace.stage);

  const closeActivity = useCallback(() => {
    setActivityOpen(false);
    window.setTimeout(() => activityButtonRef.current?.focus(), 0);
  }, []);

  const closeArtifact = useCallback(() => {
    setArtifactOpen(false);
    window.setTimeout(() => artifactButtonRef.current?.focus(), 0);
  }, []);

  const workbench = workspace.stage === 'FINALIZED' && workspace.blueprint ? (
    <BlueprintView workspace={workspace} traceNodes={foundry.traceNodes} onTrace={foundry.traceEvidence} onExport={foundry.exportBlueprint} />
  ) : workspace.candidates.length > 0 ? (
    <CandidateForge workspace={workspace} />
  ) : (
    <StageSummary workspace={workspace} />
  );
  const artifactLabel = workspace.stage === 'FINALIZED'
    ? 'View blueprint'
    : workspace.candidates.length > 0
      ? 'View ideas'
      : 'View workspace';

  return (
    <main className="launchpad-app" data-stage={workspace.stage}>
      <header className="launch-header">
        <a className="launch-wordmark" href="#launch-workspace" aria-label="LaunchPad home">
          <span className="launch-mark" aria-hidden="true"><i /><i /><i /></span>
          <strong>LaunchPad</strong>
        </a>
        <div className="launch-project" aria-label="Active project">
          <span>{stageTitle(workspace.stage)}</span>
          <strong>{workspace.title}</strong>
        </div>
        <div className="launch-header-actions">
          <button
            ref={artifactButtonRef}
            type="button"
            className="workspace-artifact-trigger"
            aria-expanded={artifactOpen}
            onClick={() => setArtifactOpen(true)}
          >
            {artifactLabel}
          </button>
          <button
            ref={activityButtonRef}
            type="button"
            className="activity-trigger"
            aria-controls="activity-drawer"
            aria-expanded={activityOpen}
            onClick={() => setActivityOpen(true)}
          >
            Activity <span>{workspace.activity.length}</span>
          </button>
        </div>
      </header>

      <div className="launch-progress" aria-label={`${progress}% of launch workflow complete`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className="launch-workspace" id="launch-workspace">
        <LaunchBrief
          workspace={workspace}
          primaryActionLabel={foundry.primaryActionLabel}
          onPrimaryAction={foundry.runPrimaryAction}
          onInspectEvidence={() => setInspectorOpen(true)}
          onAddSource={() => setSourceDialogOpen(true)}
          onEditProblem={() => setProblemDialogOpen(true)}
          onReset={foundry.resetWorkspace}
        />
        <div className="launch-visual">
          <InteractiveFactory workspace={workspace} />
          <WebMCPRunRail workspace={workspace} ready={webmcp.ready} toolCount={webmcp.toolCount} />
        </div>
      </section>

      <ActivityDrawer
        workspace={workspace}
        open={activityOpen}
        onClose={closeActivity}
        notice={foundry.notice}
        exportFilename={foundry.lastExport?.filename}
        onDownloadExport={foundry.downloadLastExport}
      />
      <WorkspaceArtifactDrawer
        open={artifactOpen}
        onClose={closeArtifact}
        title={stageTitle(workspace.stage)}
        meta={workspace.version > 0 ? `Version ${workspace.version} · persisted ${foundry.storageStatus}` : 'A traceable result will assemble here.'}
      >
        {workbench}
      </WorkspaceArtifactDrawer>
      <EvidenceInspector
        workspace={workspace}
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        onReview={(findingId, decision) => foundry.report(foundry.service.reviewFindings({ findingIds: [findingId], decision }))}
      />
      <ProblemDialog
        open={problemDialogOpen}
        onClose={() => setProblemDialogOpen(false)}
        brief={workspace.problemBrief}
        service={foundry.service}
        report={foundry.report}
      />
      <SourceDialog open={sourceDialogOpen} onClose={() => setSourceDialogOpen(false)} service={foundry.service} report={foundry.report} />
    </main>
  );
}
