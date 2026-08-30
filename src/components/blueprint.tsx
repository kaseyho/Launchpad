import type { ReactNode } from 'react';
import type { Finding, FoundryWorkspace, TraceNode } from '../domain/types';
import { isEnglishFinding } from '../language/english-only';

interface BlueprintViewProps {
  workspace: FoundryWorkspace;
  traceNodes: TraceNode[];
  onTrace: (candidateId: string, componentPath: string) => void;
  onExport: (format: 'markdown' | 'json') => void;
  researchAppendix?: ReactNode;
}

function concise(text: string, limit = 132) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  const clipped = clean.slice(0, limit - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > limit * .65 ? lastSpace : limit - 1).trim()}…`;
}

function takeaway(finding: Finding, limit = 150) {
  const firstSentence = finding.normalizedClaim.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return concise(firstSentence || finding.normalizedClaim, limit);
}

export function BlueprintView({ workspace, traceNodes, onTrace, onExport, researchAppendix }: BlueprintViewProps) {
  const blueprint = workspace.blueprint;
  if (!blueprint) return null;
  const candidate = workspace.candidates.find((item) => item.id === blueprint.candidateId)!;
  const proofs = blueprint.proofFindingIds
    .map((id) => workspace.findings.find((finding) => finding.id === id))
    .filter((finding): finding is Finding => Boolean(finding))
    .filter(isEnglishFinding);
  const counters = blueprint.counterEvidenceIds
    .map((id) => workspace.findings.find((finding) => finding.id === id))
    .filter((finding): finding is Finding => Boolean(finding))
    .filter(isEnglishFinding);
  const visibleFindings = workspace.findings.filter(isEnglishFinding);
  const studyCount = new Set(visibleFindings.map((finding) => finding.sourceId)).size;
  const mainRisk = counters[0]
    ? takeaway(counters[0], 118)
    : concise(blueprint.assumptions[0]?.statement || 'Validate the core adoption assumption before scaling.', 118);

  return (
    <section className="blueprint-view decision-report" aria-label="Solution report">
      <section className="solution-summary" aria-labelledby="decision-title">
        <div className="solution-summary-topline">
          <span>Solution summary / version {blueprint.version}</span>
          <strong>Quick summary</strong>
        </div>
        <header className="solution-summary-hero">
          <div>
            <span className="decision-eyebrow">Recommended solution</span>
            <h1 id="decision-title">{blueprint.name}</h1>
            <p>{concise(blueprint.proposition, 178)}</p>
          </div>
          <div className="report-verdict"><span>RECOMMENDATION</span><strong>Test this</strong><small>Supported by research. Test before scaling.</small></div>
        </header>

        <div className="solution-summary-grid" aria-label="Solution summary">
          <article><span>HOW IT WORKS</span><strong>{concise(blueprint.mechanism, 112)}</strong></article>
          <article><span>KEY FINDING</span><strong>{proofs[0] ? takeaway(proofs[0], 112) : `${studyCount} sources support the direction.`}</strong></article>
          <article data-risk="true"><span>MAIN RISK</span><strong>{mainRisk}</strong></article>
          <article><span>FIRST TEST</span><strong>{concise(blueprint.validationPlan.successMetric, 112)}</strong></article>
        </div>

        <footer className="solution-summary-actions">
          <div className="solution-webmcp-activity"><span>WEBMCP ACTIVITY</span><strong>Agent tool call → page update</strong><small>{studyCount} sources · {proofs.length} supporting findings · {counters.length} cautions</small></div>
          <div><a href="#full-report">View full report <span aria-hidden="true">↓</span></a><button type="button" onClick={() => onTrace(candidate.id, 'features.0')}>View source path ↗</button></div>
        </footer>
      </section>

      <section className="report-document" id="full-report" aria-labelledby="full-report-title">
        <header className="report-document-header">
          <div><span>LaunchPad research report</span><h2 id="full-report-title">Full report</h2></div>
          <dl>
            <div><dt>Status</dt><dd>Ready to test</dd></div>
            <div><dt>Sources</dt><dd>{studyCount}</dd></div>
            <div><dt>Version</dt><dd>{blueprint.version}</dd></div>
          </dl>
        </header>

        <div className="report-document-layout">
          <aside className="report-document-sidebar" aria-label="Full report sections">
            <span>SECTIONS</span>
            <nav>
              <a href="#recommendation"><b>01</b> Recommendation</a>
              <a href="#evidence-summary"><b>02</b> Evidence</a>
              <a href="#risks"><b>03</b> Risks</a>
              <a href="#next-test"><b>04</b> Next test</a>
              <a href="#research-ledger"><b>05</b> Sources</a>
            </nav>
            <div><span>WEBMCP ACTIVITY</span><strong>Saved</strong><small>Agent calls and page changes use this workspace.</small></div>
          </aside>

          <div className="report-document-body">
            <section className="report-section" id="recommendation">
              <div className="report-section-heading"><span>01</span><div><small>RECOMMENDATION</small><h3>What to build</h3></div></div>
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
                    <button type="button" onClick={() => onTrace(candidate.id, `features.${index}`)} aria-label={`View sources for ${feature.name}`}>View sources ↗</button>
                  </li>
                ))}
              </ol>
            </section>

            <section className="report-section" id="evidence-summary">
              <div className="report-section-heading"><span>02</span><div><small>RESEARCH</small><h3>What the research says</h3></div></div>
              <div className="evidence-readout" aria-label="Evidence summary">
                <div><strong>{studyCount}</strong><span>research sources</span></div>
                <div><strong>{proofs.length}</strong><span>support signals</span></div>
                <div><strong>{counters.length}</strong><span>cautions retained</span></div>
              </div>
              <div className="evidence-signal-list">
                {proofs.slice(0, 3).map((finding, index) => (
                  <article key={finding.id}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><strong>{takeaway(finding)}</strong><small>{finding.citation.sourceTitle} · {finding.citation.publishedDate}</small></div>
                  </article>
                ))}
              </div>
              <a className="report-source-link" href="#research-ledger">View all {visibleFindings.length} source records ↓</a>
            </section>

            <section className="report-section" id="risks">
              <div className="report-section-heading"><span>03</span><div><small>RISKS</small><h3>What could break it</h3></div></div>
              <div className="risk-columns">
                <div><h4>Research cautions</h4>{counters.map((finding) => <p key={finding.id}>{takeaway(finding)}</p>)}</div>
                <div><h4>Critical assumptions</h4>{blueprint.assumptions.slice(0, 2).map((assumption) => <p key={assumption.id}>{assumption.statement}</p>)}</div>
              </div>
            </section>

            <section className="report-section report-test" id="next-test">
              <div className="report-section-heading"><span>04</span><div><small>VALIDATION</small><h3>The next test</h3></div></div>
              <div className="test-hypothesis"><span>HYPOTHESIS</span><strong>{blueprint.validationPlan.hypothesis}</strong></div>
              <dl>
                <div><dt>Test with</dt><dd>{blueprint.validationPlan.targetParticipant}</dd></div>
                <div><dt>Success looks like</dt><dd>{blueprint.validationPlan.successMetric}</dd></div>
                <div><dt>Stop if</dt><dd>{blueprint.validationPlan.failureThreshold}</dd></div>
                <div><dt>Timebox</dt><dd>{blueprint.validationPlan.expectedDuration}</dd></div>
              </dl>
            </section>

            {traceNodes.length > 0 && <section className="trace-panel" aria-label="Source path"><div className="trace-label">Source path</div>{traceNodes.map((node, index) => <div className="trace-node" data-kind={node.kind} key={node.id}><span>{node.kind.replace('_', ' ').toUpperCase()}</span><strong>{node.label}</strong><small>{node.detail}</small>{index < traceNodes.length - 1 && <i aria-hidden="true">↓</i>}</div>)}</section>}
            {researchAppendix}
            <footer className="blueprint-actions"><span>Download report</span><button type="button" onClick={() => onExport('markdown')}>Report .md</button><button type="button" onClick={() => onExport('json')}>Data .json</button></footer>
          </div>
        </div>
      </section>
    </section>
  );
}
