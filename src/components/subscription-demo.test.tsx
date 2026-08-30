import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createSubscriptionState, DEFAULT_PLAN_QUOTES } from '../subscription/subscription';
import { SubscriptionDemo } from './subscription-demo';

const explorer = createSubscriptionState(DEFAULT_PLAN_QUOTES.explorer, new Date('2026-08-29T00:00:00.000Z'));

describe('SubscriptionDemo', () => {
  it('stays out of the core flow until opened', () => {
    render(<SubscriptionDemo open={false} onClose={vi.fn()} subscription={explorer} onApply={vi.fn()} />);
    expect(screen.queryByRole('dialog', { name: /set your research capacity/i })).not.toBeInTheDocument();
  });

  it('shows working usage terms and applies the configured product rules', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<SubscriptionDemo open onClose={vi.fn()} subscription={explorer} onApply={onApply} />);

    expect(screen.getByRole('dialog', { name: /set your research capacity/i })).toBeVisible();
    expect(screen.getByText(/usage limits work.*payments are not connected/i)).toBeVisible();
    expect(screen.getByRole('radio', { name: /explorer/i })).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('radio', { name: /builder/i }));
    expect(screen.getByText('$24', { selector: '.subscription-live-quote > strong' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: /use builder/i }));

    expect(onApply).toHaveBeenCalledWith({ planId: 'builder', monthlyRuns: 40, seats: 1, monthlyPrice: 24 });
  });

  it('calculates a user-controlled Studio price from runs and seats', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<SubscriptionDemo open onClose={vi.fn()} subscription={explorer} onApply={onApply} />);

    await user.click(screen.getByRole('radio', { name: /studio/i }));
    fireEvent.change(screen.getByRole('slider', { name: /complete research runs/i }), { target: { value: '300' } });
    fireEvent.change(screen.getByRole('slider', { name: /workspace seats/i }), { target: { value: '8' } });

    expect(screen.getByText('$127', { selector: '.subscription-live-quote > strong' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /use studio/i }));
    expect(onApply).toHaveBeenCalledWith({ planId: 'studio', monthlyRuns: 300, seats: 8, monthlyPrice: 127 });
  });
});
