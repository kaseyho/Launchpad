import type { Finding, FoundryWorkspace } from '../domain/types';

function findingLabel(finding: Finding) {
  return finding.evidenceType === 'counter_evidence' ? 'Caution' : 'Support';
}

function takeaway(finding: Finding) {
  const firstSentence = finding.normalizedClaim.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  const text = firstSentence || finding.normalizedClaim;
  return text.length > 165 ? `${text.slice(0, 162).trim()}…` : text;
}

function FindingGroup({ title, findings, offset }: { title: string; findings: Finding[]; offset: number }) {
  if (!findings.length) return null;
  return (
    <section className="research-group">
      <header><h3>{title}</h3><span>{findings.length}</span></header>
      <div className="research-rows">
        {findings.map((finding, index) => (
          <details key={finding.id} data-counter={finding.evidenceType === 'counter_evidence'}>
            <summary>
              <span className="research-index">{String(offset + index + 1).padStart(2, '0')}</span>
              <div className="research-row-copy">
                <div><span>{findingLabel(finding)}</span><small>{finding.citation.publishedDate}</small></div>
                <strong>{takeaway(finding)}</strong>
                <small>{finding.citation.sourceTitle}</small>
              </div>
              <i aria-hidden="true">+</i>
            </summary>
            <div className="research-detail">
              <div><span>Abstract excerpt</span><blockquote>{finding.citation.exactExcerpt}</blockquote></div>
              <div className="research-detail-meta"><span>{finding.citation.authorOrPublisher}</span><span>Qualified from abstract — verify the full paper for high-stakes use.</span></div>
              <a href={finding.citation.urlOrDocumentId} target="_blank" rel="noreferrer">Open original research ↗</a>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ResearchFindings({ workspace }: { workspace: FoundryWorkspace }) {
  const findings = workspace.findings.filter((finding) => finding.reviewStatus === 'qualified' || finding.reviewStatus === 'accepted');
  const support = findings.filter((finding) => finding.evidenceType !== 'counter_evidence');
  const cautions = findings.filter((finding) => finding.evidenceType === 'counter_evidence');
  return (
    <section className="research-ledger" id="research-ledger" aria-label="Research findings">
      <header className="research-ledger-header">
        <div><span>Source library / {findings.length} findings</span><h2>Research, without the wall of text.</h2></div>
        <p>Scan the takeaway first. Expand only when you need the abstract excerpt, publication details, or original paper.</p>
      </header>
      <div className="research-groups">
        <FindingGroup title="Supporting research" findings={support} offset={0} />
        <FindingGroup title="Limits and cautions" findings={cautions} offset={support.length} />
      </div>
    </section>
  );
}
