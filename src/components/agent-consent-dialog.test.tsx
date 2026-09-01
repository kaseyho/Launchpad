import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AgentConsentDialog, type AgentConsentRequest } from './agent-consent-dialog';

const request: AgentConsentRequest = {
  kind: 'review_evidence',
  title: 'Accept browser-found evidence?',
  summary: 'The browser agent wants to accept two findings into the decision ledger.',
  affectedIds: ['finding-a', 'finding-b'],
  privacyScope: 'public_only',
  workspaceVersion: 7,
};

describe('AgentConsentDialog', () => {
  it('shows the exact IDs, privacy scope, and bound workspace version before a human decision', async () => {
    const approve = vi.fn();
    const decline = vi.fn();
    const user = userEvent.setup();
    render(<AgentConsentDialog request={request} onApprove={approve} onDecline={decline} />);

    const dialog = screen.getByRole('dialog', { name: /accept browser-found evidence/i });
    expect(dialog).toHaveTextContent('finding-a');
    expect(dialog).toHaveTextContent('finding-b');
    expect(dialog).toHaveTextContent(/public only/i);
    expect(dialog).toHaveTextContent(/workspace v7/i);

    await user.click(screen.getByRole('button', { name: /approve agent action/i }));
    expect(approve).toHaveBeenCalledOnce();
    expect(decline).not.toHaveBeenCalled();
  });
});
