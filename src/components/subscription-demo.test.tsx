import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionDemo } from './subscription-demo';

describe('SubscriptionDemo', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
        clear: () => values.clear(),
      },
    });
  });

  it('stays out of the core flow until opened', () => {
    render(<SubscriptionDemo open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog', { name: /sustainable launchpad/i })).not.toBeInTheDocument();
  });

  it('shows transparent terms and simulates a plan without billing', async () => {
    const user = userEvent.setup();
    render(<SubscriptionDemo open onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: /sustainable launchpad/i })).toBeVisible();
    expect(screen.getByText(/no card is charged/i)).toBeVisible();
    expect(screen.getByRole('radio', { name: /builder/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('$24 monthly')).toBeVisible();

    await user.click(screen.getByRole('button', { name: /simulate builder plan/i }));

    expect(screen.getByText(/current demo plan/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /builder demo active/i })).toBeDisabled();
    expect(window.localStorage.getItem('launchpad.subscription-demo.v1')).toBe('builder');
  });

  it('supports a visible reset path', async () => {
    const user = userEvent.setup();
    render(<SubscriptionDemo open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /simulate builder plan/i }));
    await user.click(screen.getByRole('button', { name: /reset subscription demo/i }));

    expect(screen.getByText('Explorer', { selector: '.subscription-confirm strong' })).toBeVisible();
    expect(window.localStorage.getItem('launchpad.subscription-demo.v1')).toBeNull();
  });
});
