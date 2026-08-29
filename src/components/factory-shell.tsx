'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityDrawer } from './activity-drawer';
import { BlueprintView } from './blueprint';
import { EvidenceInspector } from './evidence-inspector';
import { InteractiveFactory } from './interactive-factory';
import { LaunchBrief } from './launch-brief';
import { ResearchFindings } from './research-findings';
import { SubscriptionDemo } from './subscription-demo';
import { WebMCPRunRail } from './webmcp-run-rail';
import { useFoundry } from '../hooks/use-foundry';
import { useSubscription } from '../hooks/use-subscription';
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

export function FactoryShell({ initialWorkspace }: { initialWorkspace?: FoundryWorkspace }) {
  const subscription = useSubscription();
  const allowance = useMemo(() => ({
    check: subscription.checkResearchAllowance,
    recordCompletedRun: subscription.recordCompletedRun,
  }), [subscription.checkResearchAllowance, subscription.recordCompletedRun]);
  const foundry = useFoundry(initialWorkspace, allowance);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const activityButtonRef = useRef<HTMLButtonElement>(null);
  const subscriptionButtonRef = useRef<HTMLButtonElement>(null);
  const { workspace } = foundry;
  const webmcp = useWebMCP(foundry.service, foundry.acceptAgentTrace, foundry.acceptAgentExport, foundry.startResearch);
  const progress = getStageProgress(workspace.stage);

  const closeActivity = useCallback(() => {
    setActivityOpen(false);
    window.setTimeout(() => activityButtonRef.current?.focus(), 0);
  }, []);

  const closeSubscription = useCallback(() => {
    setSubscriptionOpen(false);
    window.setTimeout(() => subscriptionButtonRef.current?.focus(), 0);
  }, []);

  return (
    <main className="launchpad-app" data-stage={workspace.stage} data-run={foundry.researchRun.phase}>
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
            ref={subscriptionButtonRef}
            type="button"
            className="subscription-trigger"
            aria-controls="subscription-demo"
            aria-expanded={subscriptionOpen}
            onClick={() => setSubscriptionOpen(true)}
          >
            Plans <span>{subscription.subscription.planId} · {subscription.remainingRuns}/{subscription.subscription.monthlyRuns}</span>
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
          researchRun={foundry.researchRun}
          onStartResearch={foundry.startResearch}
          onStop={foundry.stopResearch}
          onRetry={foundry.retryResearch}
          onReset={foundry.resetWorkspace}
          planName={subscription.subscription.planId}
          remainingRuns={subscription.remainingRuns}
          monthlyRuns={subscription.subscription.monthlyRuns}
          onOpenPlans={() => setSubscriptionOpen(true)}
        />
        <div className="launch-visual">
          <InteractiveFactory workspace={workspace} researchRun={foundry.researchRun} />
          <WebMCPRunRail workspace={workspace} ready={webmcp.ready} toolCount={webmcp.toolCount} researchRun={foundry.researchRun} />
        </div>
      </section>

      {workspace.blueprint && (
        <section className="launch-result" id="launch-result" aria-label="Evidence-backed solution">
          <div className="launch-result-topline">
            <span>Output / evidence-backed solution</span>
            <button type="button" onClick={() => setInspectorOpen(true)}>Inspect evidence graph ↗</button>
          </div>
          <BlueprintView
            workspace={workspace}
            traceNodes={foundry.traceNodes}
            onTrace={foundry.traceEvidence}
            onExport={foundry.exportBlueprint}
            researchAppendix={<ResearchFindings workspace={workspace} />}
          />
        </section>
      )}

      <ActivityDrawer
        workspace={workspace}
        open={activityOpen}
        onClose={closeActivity}
        notice={foundry.notice}
        exportFilename={foundry.lastExport?.filename}
        onDownloadExport={foundry.downloadLastExport}
      />
      <SubscriptionDemo
        open={subscriptionOpen}
        onClose={closeSubscription}
        subscription={subscription.subscription}
        onApply={subscription.configurePlan}
      />
      <EvidenceInspector
        workspace={workspace}
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        onReview={(findingId, decision) => foundry.report(foundry.service.reviewFindings({ findingIds: [findingId], decision }))}
      />
    </main>
  );
}
