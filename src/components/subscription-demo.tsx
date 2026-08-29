'use client';

import { useEffect, useState } from 'react';
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
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(subscription.planId === 'explorer' ? 'builder' : subscription.planId);
  const selectedInitial = subscription.planId === selectedPlanId ? subscription : DEFAULT_PLAN_QUOTES[selectedPlanId];
  const [selectedRuns, setSelectedRuns] = useState(selectedInitial.monthlyRuns);
  const [selectedSeats, setSelectedSeats] = useState(selectedInitial.seats);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open]);

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

  return (
    <div className="subscription-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
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
            <span>Plans / live product controls</span>
            <h2 id="subscription-title">Set your research capacity</h2>
            <p id="subscription-description">Choose how many complete problem-to-solution runs LaunchPad should provide each month. The selected allowance is enforced across human and WebMCP runs.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close plans">Close</button>
        </header>

        <div className="subscription-demo-notice" role="note">
          <strong>Evaluation billing</strong>
          <span>The usage meter and limits work now. Payment collection is not connected, so no card is charged; this browser holds the evaluation account.</span>
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
            <span>Monthly configuration</span>
            <strong>{priceLabel(subscription.monthlyPrice)} · {subscription.seats} {subscription.seats === 1 ? 'seat' : 'seats'}</strong>
          </div>
          <div>
            <span>Allowance resets</span>
            <strong>{formatPeriodEnd(subscription.periodEnd)}</strong>
          </div>
          <div className="subscription-usage-track" aria-label={`${usagePercent}% of research allowance used`}><span style={{ width: `${usagePercent}%` }} /></div>
        </section>

        <section className="subscription-section" aria-labelledby="plan-comparison-title">
          <div className="subscription-section-heading">
            <div>
              <span>01 / choose operating mode</span>
              <h3 id="plan-comparison-title">The run is the value unit</h3>
            </div>
            <p>One run searches connected sources, extracts findings, synthesizes a solution, stress-tests it, and produces the cited report.</p>
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
                  {subscription.planId === plan.id && <em>Current product plan</em>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="subscription-section subscription-configurator" aria-labelledby="capacity-title">
          <div className="subscription-section-heading">
            <div>
              <span>02 / control the price</span>
              <h3 id="capacity-title">Match capacity to real usage</h3>
            </div>
            <p>The quote is calculated from the cost-bearing product inputs. There are no hidden overages: research stops when the included allowance reaches zero.</p>
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
              <span>Live monthly configuration</span>
              <strong>{priceLabel(selectedQuote.monthlyPrice)}<small>/ month</small></strong>
              <dl>
                <div><dt>Plan</dt><dd>{selectedPlan.name}</dd></div>
                <div><dt>Included</dt><dd>{selectedQuote.monthlyRuns} complete runs</dd></div>
                <div><dt>Access</dt><dd>{selectedQuote.seats} {selectedQuote.seats === 1 ? 'seat' : 'seats'}</dd></div>
                <div><dt>Effective rate</dt><dd>{selectedQuote.monthlyPrice === 0 ? '$0' : `$${perRun.toFixed(2)}`} / included run</dd></div>
                <div><dt>Overage</dt><dd>Blocked at limit · no surprise fee</dd></div>
              </dl>
              <button type="button" onClick={() => onApply(selectedQuote)} disabled={isSelectedActive}>
                {isSelectedActive ? 'Current product configuration' : `Apply ${selectedPlan.name} rules to LaunchPad — ${priceLabel(selectedQuote.monthlyPrice)}/mo`}
              </button>
            </div>
          </div>
        </section>

        <section className="subscription-section subscription-business" aria-labelledby="business-case-title">
          <div className="subscription-section-heading">
            <div>
              <span>03 / revenue logic</span>
              <h3 id="business-case-title">The economics move with usage</h3>
            </div>
            <p>This is an illustrative revenue scenario, not paying-customer traction. The product behavior above is functional; external payment collection is the remaining production integration.</p>
          </div>
          <div className="subscription-math" aria-label="Illustrative monthly recurring revenue scenario">
            <div><span>Selected configuration</span><strong>{selectedQuote.monthlyRuns} runs · {selectedQuote.seats} {selectedQuote.seats === 1 ? 'seat' : 'seats'}</strong><em>{priceLabel(selectedQuote.monthlyPrice)} / mo</em></div>
            <div><span>100 customers</span><strong>100 × {priceLabel(selectedQuote.monthlyPrice)}</strong><em>${scenarioMrr.toLocaleString()} MRR</em></div>
            <div className="subscription-math-total"><span>Metered product proof</span><strong>Human + WebMCP runs share one allowance</strong><em>Enforced now</em></div>
          </div>
          <p className="subscription-hypothesis"><strong>Conversion trigger:</strong> upgrade when repeat research or collaboration needs exceed the current allowance. <strong>Cost control:</strong> LaunchPad blocks the next research run at the limit instead of creating an unapproved overage.</p>
        </section>
      </aside>
    </div>
  );
}
