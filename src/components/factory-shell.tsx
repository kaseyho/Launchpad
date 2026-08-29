'use client';

import { useState } from 'react';
import { BlueprintView } from './blueprint';
import { CandidateForge } from './candidate-forge';
import { EvidenceInspector } from './evidence-inspector';
import { FactoryFloor } from './factory-floor';
import { FactoryHud } from './factory-hud';
import { ProblemDialog, SourceDialog } from './foundry-dialogs';
import { ProblemPanel } from './problem-panel';
import { ProductionLog } from './production-log';
import { useFoundry } from '../hooks/use-foundry';
import { useWebMCP } from '../hooks/use-webmcp';
import type { FoundryWorkspace } from '../domain/types';

export function FactoryShell({ initialWorkspace }: { initialWorkspace?: FoundryWorkspace }) {
  const foundry = useFoundry(initialWorkspace);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);
  const { workspace } = foundry;
  const webmcpReady = useWebMCP(foundry.service, foundry.acceptAgentTrace, foundry.acceptAgentExport);

  const center = workspace.stage === 'FINALIZED' && workspace.blueprint ? (
    <BlueprintView workspace={workspace} traceNodes={foundry.traceNodes} onTrace={foundry.traceEvidence} onExport={foundry.exportBlueprint} />
  ) : workspace.candidates.length > 0 ? (
    <CandidateForge workspace={workspace} />
  ) : (
    <FactoryFloor workspace={workspace} />
  );

  return (
    <main className="foundry-app">
      <header className="topbar">
        <a className="wordmark" href="#main-workspace" aria-label="ProofFoundry home">PROOF<span>{'//'}</span>FOUNDRY</a>
        <div className="project-readout" aria-label="Active project"><span>PROJECT 001 · D1 {foundry.storageStatus.toUpperCase()}</span><strong>{workspace.title.toUpperCase()}</strong></div>
        <div className="agent-status" data-connected={webmcpReady}><span className="status-light" aria-hidden="true" /><span>{webmcpReady ? 'WEBMCP CONNECTED' : 'MANUAL MODE READY'}</span></div>
      </header>
      <div className="workspace" id="main-workspace">
        <ProblemPanel
          workspace={workspace}
          primaryActionLabel={foundry.primaryActionLabel}
          onPrimaryAction={foundry.runPrimaryAction}
          onInspectEvidence={() => setInspectorOpen(true)}
          onAddSource={() => setSourceDialogOpen(true)}
          onEditProblem={() => setProblemDialogOpen(true)}
          onReset={foundry.resetWorkspace}
        />
        <div className="center-surface">{center}</div>
        <FactoryHud workspace={workspace} webmcpReady={webmcpReady} />
      </div>
      <ProductionLog
        workspace={workspace}
        notice={foundry.notice}
        exportFilename={foundry.lastExport?.filename}
        onDownloadExport={foundry.downloadLastExport}
      />

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
