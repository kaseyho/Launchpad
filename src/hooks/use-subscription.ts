'use client';

import { useCallback, useRef, useState } from 'react';
import {
  PLAN_DEFINITIONS,
  applyPlanQuote,
  canStartResearchRun,
  loadSubscription,
  normalizeSubscription,
  recordCompletedResearchRun,
  remainingResearchRuns,
  saveSubscription,
  type PlanQuote,
  type SubscriptionState,
} from '../subscription/subscription';

function getStorage(): Pick<Storage, 'getItem' | 'setItem'> | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionState>(() => loadSubscription(getStorage()));
  const subscriptionRef = useRef(subscription);

  const commit = useCallback((update: (current: SubscriptionState) => SubscriptionState) => {
    setSubscription((current) => {
      const next = update(current);
      subscriptionRef.current = next;
      saveSubscription(next, getStorage());
      return next;
    });
  }, []);

  const configurePlan = useCallback((quote: PlanQuote) => {
    commit((current) => applyPlanQuote(current, quote));
  }, [commit]);

  const recordCompletedRun = useCallback(() => {
    commit((current) => recordCompletedResearchRun(current));
  }, [commit]);

  const checkResearchAllowance = useCallback(() => {
    const stored = subscriptionRef.current;
    const current = normalizeSubscription(stored) ?? stored;
    if (current.periodEnd !== stored.periodEnd) {
      subscriptionRef.current = current;
      setSubscription(current);
      saveSubscription(current, getStorage());
    }
    const remaining = remainingResearchRuns(current);
    return canStartResearchRun(current)
      ? { allowed: true as const, remaining }
      : {
          allowed: false as const,
          remaining: 0 as const,
          message: `${PLAN_DEFINITIONS[current.planId].name} has used all ${current.monthlyRuns} research runs for this period. Increase the allowance or wait for the monthly reset.`,
        };
  }, []);

  return {
    subscription,
    remainingRuns: remainingResearchRuns(subscription),
    configurePlan,
    recordCompletedRun,
    checkResearchAllowance,
  };
}
