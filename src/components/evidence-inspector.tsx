import { useState } from 'react';
import type { FoundryWorkspace } from '../domain/types';
import { isEnglishFinding } from '../language/english-only';

interface EvidenceInspectorProps {
  workspace: FoundryWorkspace;
  open: boolean;
  onClose: () => void;
  onReview: (findingId: string, decision: 'accept' | 'reject' | 'qualify') => void;
}

export function EvidenceInspector({ workspace, open, onClose, onReview }: EvidenceInspectorProps) {
  const visibleFindings = workspace.findings.filter(isEnglishFinding);
  const [selectedId, setSelectedId] = useState(visibleFindings[0]?.id);
  if (!open) return null;

  const resolvedSelectedId = visibleFindings.some((finding) => finding.id === selectedId)
    ? selectedId
    : visibleFindings[0]?.id;
  const finding = visibleFindings.find((item) => item.id === resolvedSelectedId) ?? visibleFindings[0];
  const source = finding && workspace.sources.find((item) => item.id === finding.sourceId);
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="foundry-dialog evidence-dialog" role="dialog" aria-modal="true" aria-label="Source graph">
        <header className="dialog-header">
          <div><span>SOURCES</span><h2>Source graph</h2></div>
          <button type="button" onClick={onClose} aria-label="Close source graph">Close ×</button>
        </header>
        <div className="inspector-layout">
          <nav className="finding-list" aria-label="Findings">
            {visibleFindings.map((item) => (
              <button key={item.id} type="button" data-selected={item.id === finding?.id} onClick={() => setSelectedId(item.id)}>
                <span data-status={item.reviewStatus}>{item.reviewStatus.toUpperCase()}</span>
                <strong>{item.normalizedClaim}</strong>
                <small>{item.evidenceType.replaceAll('_', ' ')}</small>
              </button>
            ))}
          </nav>
          {finding && source ? (
            <article className="finding-detail">
              <div className="finding-badges">
                <span className={`evidence-kind kind-${finding.evidenceType}`}>{finding.evidenceType.replaceAll('_', ' ')}</span>
                {finding.synthetic && <span className="synthetic-badge">DEMO DATA</span>}
                <span className={`review-badge status-${finding.reviewStatus}`}>{finding.reviewStatus.toUpperCase()}</span>
              </div>
              <h3>{finding.normalizedClaim}</h3>
              {typeof finding.value === 'number' && (
                <div className="finding-number"><strong>{finding.value}{finding.unit === 'percent' ? '%' : ''}</strong><span>of {finding.denominator}</span></div>
              )}
              <dl className="finding-context">
                <div><dt>People</dt><dd>{finding.population}</dd></div>
                <div><dt>Time</dt><dd>{finding.timeframe}</dd></div>
                <div><dt>Place</dt><dd>{finding.geography}</dd></div>
                <div><dt>Relevance</dt><dd>{finding.quality.directness}</dd></div>
              </dl>
              <div className="citation-panel">
                <span>Source excerpt</span>
                <blockquote>“{finding.citation.exactExcerpt}”</blockquote>
                <a href={source.url.startsWith('http') ? source.url : undefined} target="_blank" rel="noreferrer" aria-disabled={!source.url.startsWith('http')}>
                  {source.title} · {finding.citation.pageOrSection} ↗
                </a>
              </div>
              <div className="caveat-panel"><span>Limits</span>{finding.caveats.map((caveat) => <p key={caveat}>{caveat}</p>)}</div>
              <div className="review-actions">
                <button type="button" onClick={() => onReview(finding.id, 'accept')}>Accept</button>
                <button type="button" onClick={() => onReview(finding.id, 'qualify')}>Keep with limits</button>
                <button type="button" className="reject" onClick={() => onReview(finding.id, 'reject')}>Reject</button>
              </div>
            </article>
          ) : <p className="dialog-empty">No extracted findings yet.</p>}
        </div>
      </section>
    </div>
  );
}
