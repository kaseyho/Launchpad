import type { FoundryWorkspace, TraceNode } from '../domain/types';

interface BlueprintViewProps {
  workspace: FoundryWorkspace;
  traceNodes: TraceNode[];
  onTrace: (candidateId: string, componentPath: string) => void;
  onExport: (format: 'markdown' | 'json') => void;
}

export function BlueprintView({ workspace, traceNodes, onTrace, onExport }: BlueprintViewProps) {
  const blueprint = workspace.blueprint;
  if (!blueprint) return null;
  const candidate = workspace.candidates.find((item) => item.id === blueprint.candidateId)!;
  const proofs = blueprint.proofFindingIds.map((id) => workspace.findings.find((finding) => finding.id === id)).filter(Boolean);
  const counters = blueprint.counterEvidenceIds.map((id) => workspace.findings.find((finding) => finding.id === id)).filter(Boolean);

  return (
    <section className="blueprint-view" aria-label="Proof-Carrying Idea Blueprint">
      <header className="blueprint-header"><div><span>FINAL OUTPUT / BLUEPRINT V{blueprint.version}</span><h1>{blueprint.name}</h1><p>{blueprint.proposition}</p></div><div className="blueprint-stamp">PROOF<br />CARRYING</div></header>
      <div className="blueprint-meta"><span>FOR / {blueprint.targetUser}</span><span>STATUS / WORTH TESTING</span><span>NOT / GUARANTEED</span></div>
      <section><h2>Why this can work</h2><div className="proof-stack">{proofs.map((finding) => finding && (
        <article className="proof-card" key={finding.id}>
          <strong>{typeof finding.value === 'number' ? `${finding.value}${finding.unit === 'percent' ? '%' : ''}` : 'FINDING'}</strong>
          <p>{finding.normalizedClaim}</p>
          <small>{finding.population} · {finding.timeframe} · {finding.geography}</small>
          <span>{finding.citation.sourceTitle} · {finding.citation.publishedDate}</span>
        </article>
      ))}</div></section>
      <section><h2>Core design decisions</h2><div className="decision-list">{candidate.features.map((feature, index) => (
        <article key={feature.id}><div><span>0{index + 1}</span><h3>{feature.name}</h3><p>{feature.description}</p></div><button type="button" onClick={() => onTrace(candidate.id, `features.${index}`)} aria-label={`Why ${feature.name} exists`}>WHY THIS EXISTS ↗</button></article>
      ))}</div></section>
      <div className="blueprint-two-column">
        <section className="counter-panel"><h2>Counter-evidence</h2>{counters.map((finding) => finding && <article key={finding.id}><strong>{finding.normalizedClaim}</strong><span>{finding.citation.sourceTitle}</span></article>)}</section>
        <section className="assumption-panel"><h2>What must be true</h2>{blueprint.assumptions.map((assumption) => <article key={assumption.id}><span>{assumption.importance.toUpperCase()}</span><strong>{assumption.statement}</strong><small>{assumption.validationMethod}</small></article>)}</section>
      </div>
      <section className="validation-panel"><h2>What to test next</h2><div><span>HYPOTHESIS</span><strong>{blueprint.validationPlan.hypothesis}</strong></div><dl><div><dt>PARTICIPANTS</dt><dd>{blueprint.validationPlan.targetParticipant}</dd></div><div><dt>SUCCESS METRIC</dt><dd>{blueprint.validationPlan.successMetric}</dd></div><div><dt>FAILURE THRESHOLD</dt><dd>{blueprint.validationPlan.failureThreshold}</dd></div><div><dt>DURATION</dt><dd>{blueprint.validationPlan.expectedDuration}</dd></div></dl></section>
      {traceNodes.length > 0 && <section className="trace-panel" aria-label="Evidence trace"><div className="trace-label">LIVE PROOF PATH</div>{traceNodes.map((node, index) => <div className="trace-node" data-kind={node.kind} key={node.id}><span>{node.kind.replace('_', ' ').toUpperCase()}</span><strong>{node.label}</strong><small>{node.detail}</small>{index < traceNodes.length - 1 && <i aria-hidden="true">↓</i>}</div>)}</section>}
      <footer className="blueprint-actions"><span>Public exports omit private first-party evidence by default.</span><button type="button" onClick={() => onExport('markdown')}>EXPORT .MD</button><button type="button" onClick={() => onExport('json')}>EXPORT .JSON</button></footer>
    </section>
  );
}
