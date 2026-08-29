'use client';

import { useEffect, useState } from 'react';

type PlanId = 'explorer' | 'builder' | 'studio';

type Plan = {
  id: PlanId;
  name: string;
  price: number;
  audience: string;
  limit: string;
  features: string[];
};

const STORAGE_KEY = 'launchpad.subscription-demo.v1';

const plans: Plan[] = [
  {
    id: 'explorer',
    name: 'Explorer',
    price: 0,
    audience: 'For occasional problem framing',
    limit: '3 research runs / month',
    features: ['One active workspace', 'Citation-linked findings', 'Evidence and limitation report'],
  },
  {
    id: 'builder',
    name: 'Builder',
    price: 24,
    audience: 'For founders and product leads',
    limit: '40 research runs / month',
    features: ['Saved project history', 'Markdown and JSON exports', 'Private problem statements'],
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 89,
    audience: 'For small innovation teams',
    limit: '200 shared runs / month',
    features: ['Five workspace seats', 'Shared evidence libraries', 'Review and audit controls'],
  },
];

function isPlanId(value: string | null): value is PlanId {
  return plans.some((plan) => plan.id === value);
}

function priceLabel(plan: Plan) {
  return plan.price === 0 ? '$0' : `$${plan.price}`;
}

function getDemoStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

export function SubscriptionDemo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('builder');
  const [activePlanId, setActivePlanId] = useState<PlanId>(() => {
    const savedPlan = getDemoStorage()?.getItem(STORAGE_KEY) ?? null;
    return isPlanId(savedPlan) ? savedPlan : 'explorer';
  });

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

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[1];
  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? plans[0];
  const isSelectedActive = selectedPlan.id === activePlan.id;

  const activateDemoPlan = () => {
    getDemoStorage()?.setItem(STORAGE_KEY, selectedPlan.id);
    setActivePlanId(selectedPlan.id);
  };

  const resetDemo = () => {
    getDemoStorage()?.removeItem(STORAGE_KEY);
    setActivePlanId('explorer');
    setSelectedPlanId('builder');
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
            <span>Revenue model / interactive prototype</span>
            <h2 id="subscription-title">A sustainable LaunchPad</h2>
            <p id="subscription-description">Compare the proposed plans, then simulate an upgrade without creating an account or entering payment details.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close plans">Close</button>
        </header>

        <div className="subscription-demo-notice" role="note">
          <strong>Demo mode</strong>
          <span>No card is charged. No subscription or account is created. Your selection is stored only in this browser.</span>
        </div>

        <section className="subscription-section" aria-labelledby="plan-comparison-title">
          <div className="subscription-section-heading">
            <div>
              <span>01 / proposed offering</span>
              <h3 id="plan-comparison-title">Price the completed research run</h3>
            </div>
            <p>Usage follows LaunchPad&apos;s main cost and value unit: one problem researched into one evidence-backed solution.</p>
          </div>

          <div className="subscription-plans" role="radiogroup" aria-label="Proposed LaunchPad plans">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={selectedPlan.id === plan.id}
                data-selected={selectedPlan.id === plan.id}
                data-active={activePlan.id === plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <span className="subscription-plan-select" aria-hidden="true" />
                <span className="subscription-plan-name">
                  <strong>{plan.name}</strong>
                  <small>{plan.audience}</small>
                </span>
                <span className="subscription-plan-price">
                  <strong>{priceLabel(plan)}</strong>
                  <small>{plan.price === 0 ? 'forever' : '/ month'}</small>
                </span>
                <span className="subscription-plan-limit">{plan.limit}</span>
                <span className="subscription-plan-features">{plan.features.join(' · ')}</span>
                {activePlan.id === plan.id && <em>Current demo plan</em>}
              </button>
            ))}
          </div>
        </section>

        <section className="subscription-section subscription-checkout" aria-labelledby="checkout-review-title">
          <div className="subscription-section-heading">
            <div>
              <span>02 / checkout review</span>
              <h3 id="checkout-review-title">Review before activation</h3>
            </div>
          </div>

          <div className="subscription-review-grid">
            <dl>
              <div><dt>Selected plan</dt><dd>{selectedPlan.name}</dd></div>
              <div><dt>Due today</dt><dd>{priceLabel(selectedPlan)} <small>demo</small></dd></div>
              <div><dt>Billing</dt><dd>{selectedPlan.price === 0 ? 'No renewal' : `$${selectedPlan.price} monthly`}</dd></div>
              <div><dt>Terms</dt><dd>{selectedPlan.price === 0 ? 'Free plan' : 'Cancel anytime · no annual lock-in'}</dd></div>
            </dl>

            <div className="subscription-confirm">
              <span>Active now</span>
              <strong>{activePlan.name}</strong>
              <p>{isSelectedActive ? 'This plan is already active in the prototype.' : `This simulates switching to ${selectedPlan.name}. No network request will be made.`}</p>
              <button type="button" onClick={activateDemoPlan} disabled={isSelectedActive}>
                {isSelectedActive ? `${selectedPlan.name} demo active` : `Simulate ${selectedPlan.name} plan — ${priceLabel(selectedPlan)}${selectedPlan.price === 0 ? '' : '/mo'}`}
              </button>
              {activePlan.id !== 'explorer' && <button className="subscription-reset" type="button" onClick={resetDemo}>Reset subscription demo</button>}
            </div>
          </div>
        </section>

        <section className="subscription-section subscription-business" aria-labelledby="business-case-title">
          <div className="subscription-section-heading">
            <div>
              <span>03 / revenue hypothesis</span>
              <h3 id="business-case-title">Show the model, not fake traction</h3>
            </div>
            <p>These figures are an illustrative scenario for judging, not a forecast or evidence of paying customers.</p>
          </div>
          <div className="subscription-math" aria-label="Illustrative monthly recurring revenue scenario">
            <div><span>250 Builders</span><strong>250 × $24</strong><em>$6,000 MRR</em></div>
            <div><span>50 Studios</span><strong>50 × $89</strong><em>$4,450 MRR</em></div>
            <div className="subscription-math-total"><span>Illustrative total</span><strong>300 customers</strong><em>$10,450 MRR</em></div>
          </div>
          <p className="subscription-hypothesis"><strong>Conversion trigger:</strong> upgrade when a user needs repeat research, retained project history, or team review. <strong>Cost control:</strong> cap research runs by plan because external research retrieval and synthesis scale with usage.</p>
        </section>
      </aside>
    </div>
  );
}
