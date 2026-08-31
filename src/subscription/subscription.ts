export type PlanId = 'explorer' | 'builder' | 'studio';

export type PlanDefinition = {
  id: PlanId;
  name: string;
  audience: string;
  minRuns: number;
  maxRuns: number;
  runStep: number;
  minSeats: number;
  maxSeats: number;
  seatStep: number;
  features: string[];
};

export type PlanQuote = {
  planId: PlanId;
  monthlyRuns: number;
  seats: number;
  monthlyPrice: number;
};

export type SubscriptionState = PlanQuote & {
  version: 2;
  runsUsed: number;
  periodStart: string;
  periodEnd: string;
  mode: 'evaluation';
};

export const SUBSCRIPTION_STORAGE_KEY = 'launchpad.subscription.v2';
export const LEGACY_SUBSCRIPTION_STORAGE_KEY = 'launchpad.subscription-demo.v1';

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    audience: 'For occasional problem framing',
    minRuns: 3,
    maxRuns: 3,
    runStep: 1,
    minSeats: 1,
    maxSeats: 1,
    seatStep: 1,
    features: ['One active workspace', 'Citation-linked findings', 'Evidence and limitation report'],
  },
  builder: {
    id: 'builder',
    name: 'Builder',
    audience: 'For founders and product leads',
    minRuns: 10,
    maxRuns: 100,
    runStep: 5,
    minSeats: 1,
    maxSeats: 1,
    seatStep: 1,
    features: ['Saved project history', 'Markdown and JSON exports', 'Private problem statements'],
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    audience: 'For small innovation teams',
    minRuns: 60,
    maxRuns: 500,
    runStep: 10,
    minSeats: 3,
    maxSeats: 15,
    seatStep: 1,
    features: ['Shared run allowance', 'Shared evidence libraries', 'Review and audit controls'],
  },
};

export const DEFAULT_PLAN_QUOTES: Record<PlanId, PlanQuote> = {
  explorer: { planId: 'explorer', monthlyRuns: 3, seats: 1, monthlyPrice: 0 },
  builder: { planId: 'builder', monthlyRuns: 40, seats: 1, monthlyPrice: 24 },
  studio: { planId: 'studio', monthlyRuns: 200, seats: 5, monthlyPrice: 89 },
};

type SubscriptionStorage = Pick<Storage, 'getItem' | 'setItem'>;

function clampToStep(value: number, min: number, max: number, step: number) {
  const safe = Number.isFinite(value) ? value : min;
  const clamped = Math.min(max, Math.max(min, safe));
  return min + Math.round((clamped - min) / step) * step;
}

export function quotePlan(planId: PlanId, requestedRuns?: number, requestedSeats?: number): PlanQuote {
  const plan = PLAN_DEFINITIONS[planId];
  const fallback = DEFAULT_PLAN_QUOTES[planId];
  const monthlyRuns = clampToStep(requestedRuns ?? fallback.monthlyRuns, plan.minRuns, plan.maxRuns, plan.runStep);
  const seats = clampToStep(requestedSeats ?? fallback.seats, plan.minSeats, plan.maxSeats, plan.seatStep);
  let monthlyPrice = 0;

  if (planId === 'builder') {
    monthlyPrice = 12 + (monthlyRuns - 10) * 0.4;
  } else if (planId === 'studio') {
    monthlyPrice = 49 + (monthlyRuns - 60) * 0.2 + (seats - 3) * 6;
  }

  return { planId, monthlyRuns, seats, monthlyPrice: Math.round(monthlyPrice) };
}

function nextMonthlyBoundary(now: Date) {
  const boundary = new Date(now);
  boundary.setUTCMonth(boundary.getUTCMonth() + 1);
  return boundary;
}

export function createSubscriptionState(
  quote: PlanQuote = DEFAULT_PLAN_QUOTES.explorer,
  now = new Date(),
  runsUsed = 0,
): SubscriptionState {
  return {
    version: 2,
    ...quotePlan(quote.planId, quote.monthlyRuns, quote.seats),
    runsUsed: Math.max(0, Math.floor(runsUsed)),
    periodStart: now.toISOString(),
    periodEnd: nextMonthlyBoundary(now).toISOString(),
    mode: 'evaluation',
  };
}

function isPlanId(value: unknown): value is PlanId {
  return value === 'explorer' || value === 'builder' || value === 'studio';
}

export function normalizeSubscription(value: unknown, now = new Date()): SubscriptionState | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<SubscriptionState>;
  if (candidate.version !== 2 || !isPlanId(candidate.planId)) return undefined;
  const periodEnd = typeof candidate.periodEnd === 'string' ? new Date(candidate.periodEnd) : undefined;
  const periodStart = typeof candidate.periodStart === 'string' ? new Date(candidate.periodStart) : undefined;
  if (!periodEnd || !periodStart || Number.isNaN(periodEnd.getTime()) || Number.isNaN(periodStart.getTime())) return undefined;
  const quote = quotePlan(candidate.planId, candidate.monthlyRuns, candidate.seats);
  if (periodEnd.getTime() <= now.getTime()) return createSubscriptionState(quote, now);
  return {
    version: 2,
    ...quote,
    runsUsed: Math.max(0, Math.floor(candidate.runsUsed ?? 0)),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    mode: 'evaluation',
  };
}

export function loadSubscription(storage: SubscriptionStorage | undefined, now = new Date()) {
  if (!storage) return createSubscriptionState(DEFAULT_PLAN_QUOTES.explorer, now);
  try {
    const saved = storage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (saved) {
      const normalized = normalizeSubscription(JSON.parse(saved), now);
      if (normalized) return normalized;
    }
    const legacyPlan = storage.getItem(LEGACY_SUBSCRIPTION_STORAGE_KEY);
    if (isPlanId(legacyPlan)) return createSubscriptionState(DEFAULT_PLAN_QUOTES[legacyPlan], now);
  } catch {
    // Fall through to a safe free allowance when browser storage is unavailable or malformed.
  }
  return createSubscriptionState(DEFAULT_PLAN_QUOTES.explorer, now);
}

export function saveSubscription(subscription: SubscriptionState, storage: SubscriptionStorage | undefined) {
  if (!storage) return false;
  try {
    storage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
    return true;
  } catch {
    return false;
  }
}

export function applyPlanQuote(subscription: SubscriptionState, quote: PlanQuote, now = new Date()) {
  const current = normalizeSubscription(subscription, now) ?? createSubscriptionState(undefined, now);
  return {
    ...current,
    ...quotePlan(quote.planId, quote.monthlyRuns, quote.seats),
  } satisfies SubscriptionState;
}

export function remainingResearchRuns(subscription: SubscriptionState) {
  return Math.max(0, subscription.monthlyRuns - subscription.runsUsed);
}

export function canStartResearchRun(subscription: SubscriptionState) {
  return remainingResearchRuns(subscription) > 0;
}

export function recordCompletedResearchRun(subscription: SubscriptionState, now = new Date()) {
  const current = normalizeSubscription(subscription, now) ?? createSubscriptionState(undefined, now);
  if (!canStartResearchRun(current)) return current;
  return { ...current, runsUsed: current.runsUsed + 1 } satisfies SubscriptionState;
}
