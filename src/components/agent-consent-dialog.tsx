'use client';

import type { AgentConsentRequest } from '../domain/types';

export type { AgentConsentRequest } from '../domain/types';

export function AgentConsentDialog({
  request,
  onApprove,
  onDecline,
}: {
  request: AgentConsentRequest;
  onApprove: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="agent-consent-backdrop" role="presentation">
      <section className="agent-consent-dialog" role="dialog" aria-modal="true" aria-labelledby="agent-consent-title">
        <small>Human checkpoint · workspace v{request.workspaceVersion}</small>
        <h2 id="agent-consent-title">{request.title}</h2>
        <p>{request.summary}</p>
        <dl>
          <div><dt>Privacy scope</dt><dd>{request.privacyScope === 'includes_private' ? 'Includes private evidence' : 'Public only'}</dd></div>
          <div><dt>Affected records</dt><dd>{request.affectedIds.length}</dd></div>
        </dl>
        <ul aria-label="Affected record IDs">
          {request.affectedIds.map((id) => <li key={id}><code>{id}</code></li>)}
        </ul>
        <div className="agent-consent-actions">
          <button type="button" onClick={onDecline}>Decline</button>
          <button type="button" className="primary" onClick={onApprove}>Approve agent action</button>
        </div>
      </section>
    </div>
  );
}
