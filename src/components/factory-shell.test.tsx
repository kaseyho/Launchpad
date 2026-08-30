import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FactoryShell } from './factory-shell';
import { createSubscriptionState, DEFAULT_PLAN_QUOTES, SUBSCRIPTION_STORAGE_KEY } from '../subscription/subscription';

const CUSTOM_PROBLEM = 'Independent restaurants lose new staff during first-week training because guidance is inconsistent across managers.';

function researchResults(prefix: string) {
  return Array.from({ length: 6 }, (_, index) => ({
    doi: `10.1000/${prefix}-${index}`,
    title: `${prefix === 'counter' ? 'Limits of training interventions' : 'Workplace learning intervention'} ${index + 1}`,
    authors: `Researcher ${index + 1}`,
    published_at: `202${index % 5}-01-01`,
    venue: `Journal ${index + 1}`,
    publisher: `Publisher ${prefix} ${index + 1}`,
    url: `https://doi.org/10.1000/${prefix}-${index}`,
    excerpt: `${prefix === 'counter' ? 'Implementation barriers and context mismatch can reduce transfer and create unintended burden.' : 'Contextual practice, worked examples, and timely feedback improve task confidence and transfer.'} Study sample ${index + 1} reported a measurable effect with important limitations.`,
  }));
}

function mockAcademicSearch() {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const results = String(input).includes('limitations%20barriers') ? researchResults('counter') : researchResults('academic');
    return new Response(JSON.stringify({ results }), { status: 200, headers: { 'content-type': 'application/json' } });
  }));
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

    expect(screen.getByRole('heading', { name: /describe a problem. get a researched solution/i })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /what problem should launchpad solve/i })).toBeVisible();
    expect(screen.getByText(/searches research, checks conflicting findings/i)).toBeVisible();
    expect(screen.getByText(/you only enter the problem/i)).toBeVisible();
    expect(screen.getByText(/no api key or source search/i)).toBeVisible();
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toHaveTextContent(/input open/i);
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toHaveTextContent(/output empty/i);
    expect(screen.getByRole('region', { name: /live webmcp activity/i })).toHaveTextContent(/webmcp not detected here/i);
    expect(screen.getByRole('region', { name: /live webmcp activity/i })).toHaveTextContent(/17 tools available/i);
    expect(screen.queryByRole('dialog', { name: /activity/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /set your research capacity/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /plans/i }));
    expect(screen.getByRole('dialog', { name: /set your research capacity/i })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /close plans/i }));

    await user.click(screen.getByRole('button', { name: /activity/i }));
    expect(screen.getByRole('dialog', { name: /activity/i })).toBeVisible();
  });

  it('applies a selected plan to the workspace and its shared research allowance', async () => {
    const user = userEvent.setup();
    render(<FactoryShell />);

    await user.click(screen.getByRole('button', { name: /plans/i }));
    expect(screen.getByRole('radio', { name: /explorer/i })).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('radio', { name: /builder/i }));
    await user.click(screen.getByRole('button', { name: /use builder/i }));

    expect(await screen.findByText(/builder is now active/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /^plans —/i })).toHaveTextContent(/builder · 40\/40/i);
    expect(screen.getByRole('region', { name: /current research allowance/i })).toHaveTextContent(/builder/i);

    await user.click(screen.getByRole('button', { name: /close plans/i }));
    expect(screen.getByRole('region', { name: /problem brief/i })).toHaveTextContent(/builder \/ 40 of 40 runs left/i);

    mockAcademicSearch();
    await user.type(screen.getByRole('textbox', { name: /what problem should launchpad solve/i }), CUSTOM_PROBLEM);
    await user.click(screen.getByRole('button', { name: /research this problem/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /^plans —/i })).toHaveTextContent(/builder · 39\/40/i), { timeout: 5000 });
  }, 8000);

  it('turns one submitted problem into a solution and cited research ledger', async () => {
    mockAcademicSearch();
    const user = userEvent.setup();
    render(<FactoryShell />);

    await user.type(screen.getByRole('textbox', { name: /what problem should launchpad solve/i }), CUSTOM_PROBLEM);
    await user.click(screen.getByRole('button', { name: /research this problem/i }));

    expect(await screen.findByText(CUSTOM_PROBLEM)).toBeVisible();
    expect(await screen.findByRole('heading', { name: /solution ready/i }, { timeout: 5000 })).toBeVisible();
    expect(screen.getByRole('region', { name: /research solution/i })).toBeVisible();
    expect(screen.getByRole('heading', { name: /guided practice loop/i })).toBeVisible();
    expect(screen.getByText(/quick summary/i)).toBeVisible();
    expect(screen.getByRole('link', { name: /view full report/i })).toBeVisible();
    expect(screen.getByRole('heading', { name: /full report/i })).toBeVisible();
    expect(screen.getByRole('heading', { name: /source details/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /view solution/i })).toBeVisible();
    expect(document.body).not.toHaveTextContent(/passport/i);
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toHaveTextContent(/problem processed/i);
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toHaveTextContent(/guided practice loop/i);
    expect(screen.getByRole('region', { name: /research findings/i })).toHaveTextContent(/7 findings/i);
    expect(screen.getAllByRole('link', { name: /open original research/i })).toHaveLength(7);
    expect(screen.queryByRole('button', { name: /plan research|add source|accept evidence/i })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /plans/i })).toHaveTextContent(/explorer · 2\/3/i));
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
