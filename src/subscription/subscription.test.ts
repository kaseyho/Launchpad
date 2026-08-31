import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLAN_QUOTES,
  applyPlanQuote,
  canStartResearchRun,
  createSubscriptionState,
  loadSubscription,
  quotePlan,
  recordCompletedResearchRun,
  remainingResearchRuns,
  SUBSCRIPTION_STORAGE_KEY,
} from './subscription';

describe('LaunchPad subscription model', () => {
  it('turns user-selected research volume into deterministic monthly pricing', () => {
    expect(quotePlan('builder', 40, 1)).toEqual({ planId: 'builder', monthlyRuns: 40, seats: 1, monthlyPrice: 24 });
    expect(quotePlan('builder', 100, 1).monthlyPrice).toBe(48);
    expect(quotePlan('studio', 200, 5)).toEqual({ planId: 'studio', monthlyRuns: 200, seats: 5, monthlyPrice: 89 });
  });

  it('preserves consumed usage when a plan configuration changes', () => {
    const now = new Date('2026-08-29T00:00:00.000Z');
    const explorer = createSubscriptionState(DEFAULT_PLAN_QUOTES.explorer, now, 2);
    const builder = applyPlanQuote(explorer, quotePlan('builder', 40), now);
    expect(builder.runsUsed).toBe(2);
    expect(remainingResearchRuns(builder)).toBe(38);
  });

  it('consumes completed runs and blocks research at the configured limit', () => {
    const now = new Date('2026-08-29T00:00:00.000Z');
    let subscription = createSubscriptionState(DEFAULT_PLAN_QUOTES.explorer, now);
    subscription = recordCompletedResearchRun(subscription, now);
    subscription = recordCompletedResearchRun(subscription, now);
    subscription = recordCompletedResearchRun(subscription, now);
    expect(remainingResearchRuns(subscription)).toBe(0);
    expect(canStartResearchRun(subscription)).toBe(false);
    expect(recordCompletedResearchRun(subscription, now).runsUsed).toBe(3);
  });

  it('starts a fresh usage period after the monthly boundary', () => {
    const old = createSubscriptionState(DEFAULT_PLAN_QUOTES.builder, new Date('2026-06-01T00:00:00.000Z'), 40);
    const storage = { getItem: (key: string) => key === SUBSCRIPTION_STORAGE_KEY ? JSON.stringify(old) : null, setItem: () => undefined };
    const current = loadSubscription(storage, new Date('2026-08-29T00:00:00.000Z'));
    expect(current.runsUsed).toBe(0);
    expect(current.planId).toBe('builder');
  });
});
