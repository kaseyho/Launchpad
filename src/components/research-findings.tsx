import type { FoundryWorkspace } from '../domain/types';

function findingLabel(type: FoundryWorkspace['findings'][number]['evidenceType']) {
  if (type === 'counter_evidence') return 'LIMITATION / COUNTER-SIGNAL';
  if (type === 'primary_research') return 'RESEARCH FINDING';
  return type.replaceAll('_', ' ').toUpperCase();
}

export function ResearchFindings({ workspace }: { workspace: FoundryWorkspace }) {
  const findings = workspace.findings.filter((finding) => finding.reviewStatus === 'qualified' || finding.reviewStatus === 'accepted');
  return (
    <section className="research-ledger" aria-label="Research findings">
      <header className="research-ledger-header">
        <div><span>Research ledger / {findings.length} cited findings</span><h2>The evidence behind the solution</h2></div>
        <p>LaunchPad qualified these findings from citation-linked abstracts. Follow the original papers before making a high-stakes implementation decision.</p>
      </header>
      <ol>
        {findings.map((finding, index) => (
          <li key={finding.id} data-counter={finding.evidenceType === 'counter_evidence'}>
            <span className="research-index">{String(index + 1).padStart(2, '0')}</span>
            <article>
              <div className="research-finding-meta"><span>{findingLabel(finding.evidenceType)}</span><span>{finding.citation.publishedDate}</span></div>
              <h3>{finding.citation.sourceTitle}</h3>
              <p>{finding.normalizedClaim}</p>
              <blockquote>{finding.citation.exactExcerpt}</blockquote>
              <footer>
                <span>{finding.citation.authorOrPublisher}</span>
                <a href={finding.citation.urlOrDocumentId} target="_blank" rel="noreferrer">Open research ↗</a>
              </footer>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
