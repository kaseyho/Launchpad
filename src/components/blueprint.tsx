import type { Finding, FoundryWorkspace, TraceNode } from '../domain/types';

interface BlueprintViewProps {
  workspace: FoundryWorkspace;
  traceNodes: TraceNode[];
  onTrace: (candidateId: string, componentPath: string) => void;
  onExport: (format: 'markdown' | 'json') => void;
}

function takeaway(finding: Finding) {
  const firstSentence = finding.normalizedClaim.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  const text = firstSentence || finding.normalizedClaim;
  return text.length > 150 ? `${text.slice(0, 147).trim()}…` : text;
}

export function BlueprintView({ workspace, traceNodes, onTrace, onExport }: BlueprintViewProps) {
  const blueprint = workspace.blueprint;
  if (!blueprint) return null;
  const candidate = workspace.candidates.find((item) => item.id === blueprint.candidateId)!;
  const proofs = blueprint.proofFindingIds
    .map((id) => workspace.findings.find((finding) => finding.id === id))
    .filter((finding): finding is Finding => Boolean(finding));
  const counters = blueprint.counterEvidenceIds
    .map((id) => workspace.findings.find((finding) => finding.id === id))
    .filter((finding): finding is Finding => Boolean(finding));
  const studyCount = new Set(workspace.findings.map((finding) => finding.sourceId)).size;

  return (
    <section className="blueprint-view decision-report" aria-label="Proof-Carrying Idea Blueprint">
      <header className="blueprint-header report-hero">
        <div>
          <span>Recommended solution / blueprint v{blueprint.version}</span>
          <h1>{blueprint.name}</h1>
          <p>{blueprint.proposition}</p>
        </div>
        <div className="report-verdict"><span>VERDICT</span><strong>Worth testing</strong><small>Evidence-backed, not guaranteed</small></div>
      </header>

      <nav className="report-index" aria-label="Report sections">
        <a href="#recommendation">01 / Recommendation</a>
        <a href="#evidence-summary">02 / Evidence</a>
        <a href="#risks">03 / Risks</a>
        <a href="#next-test">04 / Next test</a>
      </nav>

      <section className="report-recommendation" id="recommendation">
        <div className="report-section-heading"><span>01</span><div><small>THE RECOMMENDATION</small><h2>What to build</h2></div></div>
        <div className="recommendation-grid">
          <div><span>FOR</span><strong>{blueprint.targetUser}</strong></div>
          <div><span>PROBLEM</span><strong>{blueprint.observedProblem}</strong></div>
          <div className="recommendation-mechanism"><span>MECHANISM</span><strong>{blueprint.mechanism}</strong></div>
        </div>
        <ol className="decision-list clean-decision-list">
          {candidate.features.map((feature, index) => (
            <li key={feature.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{feature.name}</strong><p>{feature.description}</p></div>
              <button type="button" onClick={() => onTrace(candidate.id, `features.${index}`)} aria-label={`Why ${feature.name} exists`}>Trace proof ↗</button>
            </li>
          ))}
        </ol>
      </section>

      <section className="report-evidence" id="evidence-summary">
        <div className="report-section-heading"><span>02</span><div><small>EVIDENCE SUMMARY</small><h2>Why it is plausible</h2></div></div>
        <div className="evidence-readout" aria-label="Evidence summary">
          <div><strong>{studyCount}</strong><span>research sources</span></div>
          <div><strong>{proofs.length}</strong><span>direct support signals</span></div>
          <div><strong>{counters.length}</strong><span>counter-signals retained</span></div>
        </div>
        <div className="evidence-signal-list">
          {proofs.slice(0, 3).map((finding, index) => (
            <article key={finding.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{takeaway(finding)}</strong><small>{finding.citation.sourceTitle} · {finding.citation.publishedDate}</small></div>
            </article>
          ))}
        </div>
        <a className="report-source-link" href="#research-ledger">Review all {workspace.findings.length} research findings ↓</a>
      </section>

      <section className="report-risks" id="risks">
        <div className="report-section-heading"><span>03</span><div><small>DECISION RISKS</small><h2>What could break it</h2></div></div>
        <div className="risk-columns">
          <div><h3>Research cautions</h3>{counters.map((finding) => <p key={finding.id}>{takeaway(finding)}</p>)}</div>
          <div><h3>Critical assumption</h3>{blueprint.assumptions.slice(0, 2).map((assumption) => <p key={assumption.id}>{assumption.statement}</p>)}</div>
        </div>
      </section>

      <section className="report-test" id="next-test">
        <div className="report-section-heading"><span>04</span><div><small>VALIDATION PLAN</small><h2>The next test</h2></div></div>
        <div className="test-hypothesis"><span>HYPOTHESIS</span><strong>{blueprint.validationPlan.hypothesis}</strong></div>
        <dl>
          <div><dt>Test with</dt><dd>{blueprint.validationPlan.targetParticipant}</dd></div>
          <div><dt>Success looks like</dt><dd>{blueprint.validationPlan.successMetric}</dd></div>
          <div><dt>Stop if</dt><dd>{blueprint.validationPlan.failureThreshold}</dd></div>
          <div><dt>Timebox</dt><dd>{blueprint.validationPlan.expectedDuration}</dd></div>
        </dl>
      </section>

      {traceNodes.length > 0 && <section className="trace-panel" aria-label="Evidence trace"><div className="trace-label">Why this decision exists</div>{traceNodes.map((node, index) => <div className="trace-node" data-kind={node.kind} key={node.id}><span>{node.kind.replace('_', ' ').toUpperCase()}</span><strong>{node.label}</strong><small>{node.detail}</small>{index < traceNodes.length - 1 && <i aria-hidden="true">↓</i>}</div>)}</section>}
      <footer className="blueprint-actions"><span>Need the complete record?</span><button type="button" onClick={() => onExport('markdown')}>Export report .md</button><button type="button" onClick={() => onExport('json')}>Export data .json</button></footer>
    </section>
  );
}
