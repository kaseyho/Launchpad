'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_PLAN_QUOTES,
  PLAN_DEFINITIONS,
  quotePlan,
  remainingResearchRuns,
  type PlanId,
  type PlanQuote,
  type SubscriptionState,
} from '../subscription/subscription';

function priceLabel(price: number) {
  return price === 0 ? '$0' : `$${price}`;
}

function formatPeriodEnd(isoTimestamp: string) {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoTimestamp));
}

function matchesQuote(subscription: SubscriptionState, quote: PlanQuote) {
  return subscription.planId === quote.planId
    && subscription.monthlyRuns === quote.monthlyRuns
    && subscription.seats === quote.seats;
}

export function SubscriptionDemo({
  open,
  onClose,
  subscription,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  subscription: SubscriptionState;
  onApply: (quote: PlanQuote) => void;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(subscription.planId);
  const [selectedRuns, setSelectedRuns] = useState(subscription.monthlyRuns);
  const [selectedSeats, setSelectedSeats] = useState(subscription.seats);
  const [appliedQuote, setAppliedQuote] = useState<PlanQuote | null>(null);

  const closeDrawer = useCallback(() => {
    setAppliedQuote(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeDrawer, open]);

  if (!open) return null;

  const selectedPlan = PLAN_DEFINITIONS[selectedPlanId];
  const activePlan = PLAN_DEFINITIONS[subscription.planId];
  const selectedQuote = quotePlan(selectedPlanId, selectedRuns, selectedSeats);
  const isSelectedActive = matchesQuote(subscription, selectedQuote);
  const remaining = remainingResearchRuns(subscription);
  const usagePercent = Math.min(100, Math.round((subscription.runsUsed / subscription.monthlyRuns) * 100));
  const perRun = selectedQuote.monthlyPrice === 0 ? 0 : selectedQuote.monthlyPrice / selectedQuote.monthlyRuns;
  const scenarioMrr = selectedQuote.monthlyPrice * 100;
  const pricingFormula = selectedPlanId === 'builder'
    ? '$12 base includes 10 runs; each additional run adds $0.40.'
    : selectedPlanId === 'studio'
      ? '$49 base includes 60 runs and 3 seats; additional runs add $0.20 and seats add $6.'
      : 'Explorer is fixed at 3 research runs and one seat for $0.';

  const selectPlan = (planId: PlanId) => {
    const next = subscription.planId === planId ? subscription : DEFAULT_PLAN_QUOTES[planId];
    setSelectedPlanId(planId);
    setSelectedRuns(next.monthlyRuns);
    setSelectedSeats(next.seats);
  };

  const applySelectedPlan = () => {
    onApply(selectedQuote);
    setAppliedQuote(selectedQuote);
  };

  return (
    <div className="subscription-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) closeDrawer(); }}>
      <aside
        className="subscription-drawer"
        id="subscription-demo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-title"
        aria-describedby="subscription-description"
      >
        <header className="subscription-header">
          <div>
            <span>Plans</span>
            <h2 id="subscription-title">Set your research capacity</h2>
            <p id="subscription-description">Set how many research runs this workspace can use each month. Manual and WebMCP runs share the same limit.</p>
          </div>
          <button type="button" onClick={closeDrawer} aria-label="Close plans">Close</button>
        </header>

        <div className="subscription-demo-notice" role="note">
          <strong>Demo billing</strong>
          <span>Usage limits work. Payments are not connected, so this demo will not charge you.</span>
        </div>

        <section className="subscription-usage" aria-label="Current research allowance">
          <div>
            <span>Current plan</span>
            <strong>{activePlan.name}</strong>
          </div>
          <div>
            <span>Runs remaining</span>
            <strong>{remaining} / {subscription.monthlyRuns}</strong>
          </div>
          <div>
            <span>Monthly price</span>
            <strong>{priceLabel(subscription.monthlyPrice)} · {subscription.seats} {subscription.seats === 1 ? 'seat' : 'seats'}</strong>
          </div>
          <div>
            <span>Allowance resets</span>
            <strong>{formatPeriodEnd(subscription.periodEnd)}</strong>
          </div>
          <div className="subscription-usage-track" aria-label={`${usagePercent}% of research allowance used`}><span style={{ width: `${usagePercent}%` }} /></div>
        </section>

        {appliedQuote && isSelectedActive && (
          <p className="subscription-application-status" role="status">
            <strong>{selectedPlan.name} is now active.</strong>
            {remaining} of {subscription.monthlyRuns} research runs remain for this period. This limit is shared by manual and WebMCP research.
          </p>
        )}

        <section className="subscription-section" aria-labelledby="plan-comparison-title">
          <div className="subscription-section-heading">
            <div>
              <span>01 / choose plan</span>
              <h3 id="plan-comparison-title">Choose a plan</h3>
            </div>
            <p>One run searches sources and returns one solution with citations.</p>
          </div>

          <div className="subscription-plans" role="radiogroup" aria-label="LaunchPad plans">
            {(Object.keys(PLAN_DEFINITIONS) as PlanId[]).map((planId) => {
              const plan = PLAN_DEFINITIONS[planId];
              const displayQuote = subscription.planId === planId ? subscription : DEFAULT_PLAN_QUOTES[planId];
              return (
                <button
                  key={plan.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedPlan.id === plan.id}
                  data-selected={selectedPlan.id === plan.id}
                  data-active={subscription.planId === plan.id}
                  onClick={() => selectPlan(plan.id)}
                >
                  <span className="subscription-plan-select" aria-hidden="true" />
                  <span className="subscription-plan-name">
                    <strong>{plan.name}</strong>
                    <small>{plan.audience}</small>
                  </span>
                  <span className="subscription-plan-price">
                    <strong>{priceLabel(displayQuote.monthlyPrice)}</strong>
                    <small>{displayQuote.monthlyPrice === 0 ? 'forever' : '/ month at shown volume'}</small>
                  </span>
                  <span className="subscription-plan-limit">{displayQuote.monthlyRuns} runs · {displayQuote.seats} {displayQuote.seats === 1 ? 'seat' : 'seats'}</span>
                  <span className="subscription-plan-features">{plan.features.join(' · ')}</span>
                  {subscription.planId === plan.id && <em>Current plan</em>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="subscription-section subscription-configurator" aria-labelledby="capacity-title">
          <div className="subscription-section-heading">
            <div>
              <span>02 / set usage</span>
              <h3 id="capacity-title">Set monthly runs</h3>
            </div>
            <p>Price changes with runs and seats. Research stops at the limit.</p>
          </div>

          <div className="subscription-control-grid">
            <div className="subscription-sliders">
              <label htmlFor="monthly-runs">
                <span>Complete research runs / month</span>
                <output htmlFor="monthly-runs">{selectedQuote.monthlyRuns}</output>
              </label>
              <input
                id="monthly-runs"
                type="range"
                min={selectedPlan.minRuns}
                max={selectedPlan.maxRuns}
                step={selectedPlan.runStep}
                value={selectedQuote.monthlyRuns}
                disabled={selectedPlan.id === 'explorer'}
                onChange={(event) => setSelectedRuns(Number(event.target.value))}
              />
              <div className="subscription-range-labels"><span>{selectedPlan.minRuns}</span><span>{selectedPlan.maxRuns}</span></div>

              <label htmlFor="plan-seats">
                <span>Workspace seats</span>
                <output htmlFor="plan-seats">{selectedQuote.seats}</output>
              </label>
              <input
                id="plan-seats"
                type="range"
                min={selectedPlan.minSeats}
                max={selectedPlan.maxSeats}
                step={selectedPlan.seatStep}
                value={selectedQuote.seats}
                disabled={selectedPlan.maxSeats === selectedPlan.minSeats}
                onChange={(event) => setSelectedSeats(Number(event.target.value))}
              />
              <div className="subscription-range-labels"><span>{selectedPlan.minSeats}</span><span>{selectedPlan.maxSeats}</span></div>
              <p className="subscription-pricing-formula"><strong>Formula</strong>{pricingFormula}</p>
            </div>

            <div className="subscription-live-quote" aria-live="polite">
              <span>Monthly price</span>
              <strong>{priceLabel(selectedQuote.monthlyPrice)}<small>/ month</small></strong>
              <dl>
                <div><dt>Plan</dt><dd>{selectedPlan.name}</dd></div>
                <div><dt>Included</dt><dd>{selectedQuote.monthlyRuns} complete runs</dd></div>
                <div><dt>Access</dt><dd>{selectedQuote.seats} {selectedQuote.seats === 1 ? 'seat' : 'seats'}</dd></div>
                <div><dt>Effective rate</dt><dd>{selectedQuote.monthlyPrice === 0 ? '$0' : `$${perRun.toFixed(2)}`} / included run</dd></div>
                <div><dt>Overage</dt><dd>Blocked at limit · no surprise fee</dd></div>
              </dl>
              <button type="button" onClick={applySelectedPlan} disabled={isSelectedActive}>
                {isSelectedActive ? 'Current plan' : `Use ${selectedPlan.name} — ${priceLabel(selectedQuote.monthlyPrice)}/mo`}
              </button>
            </div>
          </div>
        </section>

        <section className="subscription-section subscription-business" aria-labelledby="business-case-title">
          <div className="subscription-section-heading">
            <div>
              <span>03 / pricing example</span>
              <h3 id="business-case-title">How revenue changes</h3>
            </div>
            <p>Example only. Payments are not connected.</p>
          </div>
          <div className="subscription-math" aria-label="Illustrative monthly recurring revenue scenario">
            <div><span>Selected plan</span><strong>{selectedQuote.monthlyRuns} runs · {selectedQuote.seats} {selectedQuote.seats === 1 ? 'seat' : 'seats'}</strong><em>{priceLabel(selectedQuote.monthlyPrice)} / mo</em></div>
            <div><span>100 customers</span><strong>100 × {priceLabel(selectedQuote.monthlyPrice)}</strong><em>${scenarioMrr.toLocaleString()} MRR</em></div>
            <div className="subscription-math-total"><span>Usage rules</span><strong>Manual + WebMCP runs share one limit</strong><em>Working now</em></div>
          </div>
          <p className="subscription-hypothesis"><strong>Why users upgrade:</strong> more research runs or team seats. LaunchPad stops new runs at the limit.</p>
        </section>
      </aside>
    </div>
  );
}
