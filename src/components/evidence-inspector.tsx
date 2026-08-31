import { useState } from 'react';
import type { FoundryWorkspace } from '../domain/types';

interface EvidenceInspectorProps {
  workspace: FoundryWorkspace;
  open: boolean;
  onClose: () => void;
  onReview: (findingId: string, decision: 'accept' | 'reject' | 'qualify') => void;
}

export function EvidenceInspector({ workspace, open, onClose, onReview }: EvidenceInspectorProps) {
  const [selectedId, setSelectedId] = useState(workspace.findings[0]?.id);
  if (!open) return null;

  const resolvedSelectedId = workspace.findings.some((finding) => finding.id === selectedId)
    ? selectedId
    : workspace.findings[0]?.id;
  const finding = workspace.findings.find((item) => item.id === resolvedSelectedId) ?? workspace.findings[0];
  const source = finding && workspace.sources.find((item) => item.id === finding.sourceId);
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="foundry-dialog evidence-dialog" role="dialog" aria-modal="true" aria-label="Evidence inspector">
        <header className="dialog-header">
          <div><span>STATION 03 / INSPECTION BAY</span><h2>EVIDENCE INSPECTOR</h2></div>
          <button type="button" onClick={onClose} aria-label="Close evidence inspector">CLOSE ×</button>
        </header>
        <div className="inspector-layout">
          <nav className="finding-list" aria-label="Findings">
            {workspace.findings.map((item) => (
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
                {finding.synthetic && <span className="synthetic-badge">SYNTHETIC DEMO DATA</span>}
                <span className={`review-badge status-${finding.reviewStatus}`}>{finding.reviewStatus.toUpperCase()}</span>
              </div>
              <h3>{finding.normalizedClaim}</h3>
              {typeof finding.value === 'number' && (
                <div className="finding-number"><strong>{finding.value}{finding.unit === 'percent' ? '%' : ''}</strong><span>of {finding.denominator}</span></div>
              )}
              <dl className="finding-context">
                <div><dt>POPULATION</dt><dd>{finding.population}</dd></div>
                <div><dt>TIMEFRAME</dt><dd>{finding.timeframe}</dd></div>
                <div><dt>GEOGRAPHY</dt><dd>{finding.geography}</dd></div>
                <div><dt>DIRECTNESS</dt><dd>{finding.quality.directness.toUpperCase()}</dd></div>
              </dl>
              <div className="citation-panel">
                <span>{finding.citation.evidenceOrigin === 'ai_web_synthesis' ? 'AI-GROUNDED FINDING' : 'EXACT SOURCE PASSAGE'}</span>
                <blockquote>“{finding.citation.exactExcerpt}”</blockquote>
                <a href={source.url.startsWith('http') ? source.url : undefined} target="_blank" rel="noreferrer" aria-disabled={!source.url.startsWith('http')}>
                  {source.title} · {finding.citation.pageOrSection} ↗
                </a>
              </div>
              <div className="caveat-panel"><span>CAVEATS</span>{finding.caveats.map((caveat) => <p key={caveat}>{caveat}</p>)}</div>
              <div className="review-actions">
                <button type="button" onClick={() => onReview(finding.id, 'accept')}>ACCEPT FINDING</button>
                <button type="button" onClick={() => onReview(finding.id, 'qualify')}>QUALIFY FINDING</button>
                <button type="button" className="reject" onClick={() => onReview(finding.id, 'reject')}>REJECT FINDING</button>
              </div>
            </article>
          ) : <p className="dialog-empty">No extracted findings yet.</p>}
        </div>
      </section>
    </div>
  );
}
