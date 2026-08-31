import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FactoryShell } from './factory-shell';
import { createInitialWorkspace } from '../domain/foundry-service';
import { createSubscriptionState, DEFAULT_PLAN_QUOTES, SUBSCRIPTION_STORAGE_KEY } from '../subscription/subscription';

const CUSTOM_PROBLEM = 'Independent restaurants lose new staff during first-week training because guidance is inconsistent across managers.';

function researchReport() {
  return {
    status: 'complete',
    questions: [],
    target_audience: 'New restaurant staff and the managers training them',
    desired_outcome: 'Improve first-week task confidence and reduce avoidable staff drop-off',
    recommendation: {
      name: 'First-Week Training Guide',
      one_liner: 'Give each new staff member role-specific examples and a short guided practice path during their first week.',
      mechanism: 'Combine role-specific worked examples with immediate practice and a visible completion check so new staff can reach a useful result consistently across managers.',
      features: [
        { name: 'Role map', description: 'Adapt the first-week path to the staff member’s assigned tasks.' },
        { name: 'Worked shift example', description: 'Show one concrete example before asking the staff member to perform the task.' },
        { name: 'Confidence check', description: 'Confirm task completion and surface where manager support is still needed.' },
      ],
      assumptions: [{ statement: 'Managers can use a shared guide during real shifts.', validation_method: 'Observe guide use during representative first-week shifts.' }],
    },
    sources: [
      { title: 'Workplace learning study', url: 'https://research.example.org/workplace-learning', publisher: 'Learning Journal', published_at: '2025-01-01', source_type: 'paper', lane: 'academic', finding: 'Worked examples and immediate practice can improve confidence during unfamiliar workplace tasks.' },
      { title: 'Restaurant onboarding review', url: 'https://research.example.net/restaurant-onboarding', publisher: 'Hospitality Review', published_at: '2025-02-01', source_type: 'report', lane: 'market', finding: 'Consistent role-specific guidance reduces variation in what new restaurant staff are taught.' },
      { title: 'New staff discussion', url: 'https://community.example.com/restaurant-training', publisher: 'Restaurant Community', published_at: '2026-01-01', source_type: 'community', lane: 'community', finding: 'New staff describe concrete shift examples as useful, though these anecdotes do not establish prevalence.' },
      { title: 'Limits of mandatory training', url: 'https://research.example.edu/training-limits', publisher: 'Implementation Institute', published_at: '2025-03-01', source_type: 'report', lane: 'counter', finding: 'Mandatory guidance can add burden when it is too long or cannot adapt to prior staff experience.' },
    ],
  };
}

function mockAIResearch() {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(researchReport()), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })));
}

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'localStorage', { configurable: true, value: undefined });
});

function installSubscriptionStorage(value: string | null) {
  const values = new Map<string, string>();
  if (value) values.set(SUBSCRIPTION_STORAGE_KEY, value);
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, next: string) => values.set(key, next),
    },
  });
}

describe('FactoryShell autonomous workflow', () => {
  it('requires only one problem statement and keeps WebMCP optional', async () => {
    const user = userEvent.setup();
    render(<FactoryShell />);

    expect(screen.getByRole('heading', { name: /state the problem/i })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /what problem should launchpad solve/i })).toBeVisible();
    expect(screen.getByText(/you stop typing here/i)).toBeVisible();
    expect(screen.getByText(/no api key, source hunting, or manual research workflow/i)).toBeVisible();
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toHaveTextContent(/input open/i);
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toHaveTextContent(/output empty/i);
    expect(screen.getByLabelText(/webmcp agent run/i)).toHaveTextContent(/optional agent control/i);
    expect(screen.queryByRole('dialog', { name: /activity/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /set your research capacity/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /plans/i }));
    expect(screen.getByRole('dialog', { name: /set your research capacity/i })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /close plans/i }));

    await user.click(screen.getByRole('button', { name: /activity/i }));
    expect(screen.getByRole('dialog', { name: /activity/i })).toBeVisible();
  });

  it('turns one submitted problem into a solution and cited research ledger', async () => {
    mockAIResearch();
    const user = userEvent.setup();
    render(<FactoryShell />);

    await user.type(screen.getByRole('textbox', { name: /what problem should launchpad solve/i }), CUSTOM_PROBLEM);
    await user.click(screen.getByRole('button', { name: /research this problem/i }));

    expect(await screen.findByText(CUSTOM_PROBLEM)).toBeVisible();
    expect(await screen.findByRole('heading', { name: /one solution. every claim traceable/i }, { timeout: 5000 })).toBeVisible();
    expect(screen.getByRole('region', { name: /evidence-backed solution/i })).toBeVisible();
    expect(screen.getByRole('heading', { name: /first-week training guide/i })).toBeVisible();
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toHaveTextContent(/problem processed/i);
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toHaveTextContent(/first-week training guide/i);
    expect(screen.getByRole('region', { name: /research findings/i })).toHaveTextContent(/4 findings/i);
    expect(screen.getByRole('region', { name: /research findings/i })).toHaveTextContent(/AI-synthesized from web research/i);
    expect(screen.getByRole('region', { name: /research findings/i })).not.toHaveTextContent(/Source excerpt/i);
    expect(screen.getAllByRole('link', { name: /open original source/i })).toHaveLength(4);
    expect(screen.queryByRole('button', { name: /plan research|add source|accept evidence/i })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /plans/i })).toHaveTextContent(/explorer · 2\/3/i));
  }, 8000);

  it('lets a paused run edit the problem and retry with the new brief', async () => {
    mockAIResearch();
    const user = userEvent.setup();
    const initialWorkspace = createInitialWorkspace();
    initialWorkspace.stage = 'PROBLEM_DEFINED';
    initialWorkspace.problemBrief.problemStatement = 'The original research brief is too narrow to find useful evidence.';
    render(<FactoryShell initialWorkspace={initialWorkspace} />);

    expect(await screen.findByRole('heading', { name: /research run paused/i })).toBeVisible();
    const problem = screen.getByRole('textbox', { name: /problem submitted/i });
    expect(problem).toBeEnabled();
    await user.clear(problem);
    await user.type(problem, 'A broader replacement brief gives the research run enough context to find mixed public evidence.');
    await user.click(screen.getByRole('button', { name: /save & retry research/i }));

    expect(await screen.findByRole('heading', { name: /one solution. every claim traceable/i }, { timeout: 5000 })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /problem submitted/i })).toHaveValue('A broader replacement brief gives the research run enough context to find mixed public evidence.');
  }, 8000);

  it('enforces the configured allowance before starting human or agent research', async () => {
    const exhausted = createSubscriptionState(DEFAULT_PLAN_QUOTES.explorer, new Date(), 3);
    installSubscriptionStorage(JSON.stringify(exhausted));
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<FactoryShell />);

    await user.type(screen.getByRole('textbox', { name: /what problem should launchpad solve/i }), CUSTOM_PROBLEM);
    await user.click(screen.getByRole('button', { name: /research this problem/i }));

    expect(await screen.findByRole('region', { name: /research run/i })).toHaveTextContent(/monthly research allowance reached/i);
    expect(screen.getByRole('button', { name: /change research allowance/i })).toBeVisible();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
