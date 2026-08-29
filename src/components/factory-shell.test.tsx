import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FactoryShell } from './factory-shell';

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

afterEach(() => vi.unstubAllGlobals());

describe('FactoryShell autonomous workflow', () => {
  it('requires only one problem statement and keeps WebMCP optional', async () => {
    const user = userEvent.setup();
    render(<FactoryShell />);

    expect(screen.getByRole('heading', { name: /state the problem/i })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /what problem should launchpad solve/i })).toBeVisible();
    expect(screen.getByText(/you stop typing here/i)).toBeVisible();
    expect(screen.getByText(/no api key, source hunting, or manual research workflow/i)).toBeVisible();
    expect(screen.getByLabelText(/webmcp agent run/i)).toHaveTextContent(/optional agent control/i);
    expect(screen.queryByRole('dialog', { name: /activity/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /activity/i }));
    expect(screen.getByRole('dialog', { name: /activity/i })).toBeVisible();
  });

  it('turns one submitted problem into a solution and cited research ledger', async () => {
    mockAcademicSearch();
    const user = userEvent.setup();
    render(<FactoryShell />);

    await user.type(screen.getByRole('textbox', { name: /what problem should launchpad solve/i }), CUSTOM_PROBLEM);
    await user.click(screen.getByRole('button', { name: /research this problem/i }));

    expect(await screen.findByText(CUSTOM_PROBLEM)).toBeVisible();
    expect(await screen.findByRole('heading', { name: /one solution. every claim traceable/i }, { timeout: 5000 })).toBeVisible();
    expect(screen.getByRole('region', { name: /evidence-backed solution/i })).toBeVisible();
    expect(screen.getByRole('heading', { name: /guided practice loop/i })).toBeVisible();
    expect(screen.getByRole('region', { name: /research findings/i })).toHaveTextContent(/7 cited findings/i);
    expect(screen.getAllByRole('link', { name: /open research/i })).toHaveLength(7);
    expect(screen.queryByRole('button', { name: /plan research|add source|accept evidence/i })).not.toBeInTheDocument();
  }, 8000);
});
