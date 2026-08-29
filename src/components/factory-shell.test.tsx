import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FactoryShell } from './factory-shell';

describe('FactoryShell manual workflow', () => {
  it('starts with one focused LaunchPad workspace and a hidden activity log', async () => {
    const user = userEvent.setup();
    render(<FactoryShell />);

    expect(screen.getByRole('banner')).toHaveTextContent('LaunchPad');
    expect(screen.getByRole('heading', { name: /an idea that can show its work/i })).toBeVisible();
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toBeVisible();
    expect(screen.getByLabelText(/webmcp agent run/i)).toHaveTextContent(/ChatGPT/);
    expect(screen.getByLabelText(/webmcp agent run/i)).toHaveTextContent(/This page changes/);
    expect(screen.queryByRole('dialog', { name: /activity/i })).not.toBeInTheDocument();

    const activityButton = screen.getByRole('button', { name: /activity/i });
    expect(activityButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(activityButton);
    expect(screen.getByRole('dialog', { name: /activity/i })).toBeVisible();
    expect(activityButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('lets a human define a fresh problem instead of requiring the seeded demo', async () => {
    const user = userEvent.setup();
    render(<FactoryShell />);

    await user.click(screen.getByText(/manual controls/i));
    await user.click(screen.getByRole('button', { name: /define problem/i }));
    const dialog = screen.getByRole('dialog', { name: /edit problem brief/i });
    await user.type(within(dialog).getByLabelText(/problem statement/i), 'Independent restaurants lose new staff during first-week training.');
    await user.type(within(dialog).getByLabelText(/target audience/i), 'Restaurant managers');
    await user.type(within(dialog).getByLabelText(/desired outcome/i), 'Improve first-week task completion');
    await user.type(within(dialog).getByLabelText(/timeframe/i), 'Four weeks');
    await user.click(within(dialog).getByRole('button', { name: /save problem brief/i }));

    expect(screen.getByText('Independent restaurants lose new staff during first-week training.')).toBeVisible();
    expect(screen.getByRole('button', { name: /plan research/i })).toBeEnabled();
  });

  it('moves from an empty problem to an evidence-backed candidate recommendation', async () => {
    const user = userEvent.setup();
    render(<FactoryShell />);

    expect(screen.getByRole('heading', { name: /an idea that can show its work/i })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /load demo problem/i }));
    expect(screen.getByText(/New administrators at mid-market B2B SaaS customers/)).toBeVisible();

    await user.click(screen.getByRole('button', { name: /plan research/i }));
    await user.click(screen.getByRole('button', { name: /source evidence/i }));
    expect(screen.getByTestId('source-count')).toHaveTextContent('009');

    await user.click(screen.getByRole('button', { name: /extract findings/i }));
    await user.click(screen.getByRole('button', { name: /accept all evidence/i }));
    expect(screen.getByTestId('accepted-count')).toHaveTextContent('009');

    await user.click(screen.getByRole('button', { name: /synthesize insights/i }));
    await user.click(screen.getByRole('button', { name: /forge candidates/i }));
    await user.click(screen.getByRole('button', { name: /view ideas/i }));

    expect(screen.getByRole('heading', { name: 'Admin Guild' })).toBeVisible();
    expect(screen.getByText('RECOMMENDED / 98')).toBeVisible();
  });

  it('reassembles the recommendation when weak anecdotes are removed and traces a final feature to its source', async () => {
    const user = userEvent.setup();
    render(<FactoryShell />);

    for (const name of [
      /load demo problem/i,
      /plan research/i,
      /source evidence/i,
      /extract findings/i,
      /accept all evidence/i,
      /synthesize insights/i,
      /forge candidates/i,
    ]) {
      await user.click(screen.getByRole('button', { name }));
    }

    await user.click(screen.getByRole('button', { name: /exclude community anecdotes/i }));
    await user.click(screen.getByRole('button', { name: /view ideas/i }));
    expect(screen.getByText('RECOMMENDED / 90')).toBeVisible();
    const guild = screen.getByTestId('candidate-candidate-a');
    expect(within(guild).getByText('50%')).toBeVisible();
    expect(within(guild).getByText('2 unsupported')).toBeVisible();

    await user.click(screen.getByRole('button', { name: /close workspace artifact/i }));
    await user.click(screen.getByRole('button', { name: /stress-test flightpath/i }));
    await user.click(screen.getByRole('button', { name: /finalize blueprint/i }));
    await user.click(screen.getByRole('button', { name: /view blueprint/i }));

    expect(screen.getByRole('heading', { name: 'Why this can work' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'What must be true' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'What to test next' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: /why outcome preview exists/i }));
    const trace = screen.getByRole('region', { name: /evidence trace/i });
    expect(within(trace).getByText('Outcome preview')).toBeVisible();
    expect(within(trace).getByText('Show the outcome before demanding configuration')).toBeVisible();
    expect(within(trace).getByText(/worked examples reduced extraneous load/i)).toBeVisible();
    expect(within(trace).getByText(/effects of different ratios of worked solution steps/i)).toBeVisible();
  });

  it('lets a human inspect and reject one finding without losing its exact citation', async () => {
    const user = userEvent.setup();
    render(<FactoryShell />);
    for (const name of [/load demo problem/i, /plan research/i, /source evidence/i, /extract findings/i]) {
      await user.click(screen.getByRole('button', { name }));
    }

    await user.click(screen.getByText(/manual controls/i));
    await user.click(screen.getByRole('button', { name: /inspect evidence/i }));
    const inspector = screen.getByRole('dialog', { name: /evidence inspector/i });
    expect(within(inspector).getByText(/181 of 420 new-administrator sessions/i)).toBeVisible();
    await user.click(within(inspector).getByRole('button', { name: /reject finding/i }));
    expect(within(inspector).getAllByText('REJECTED')).toHaveLength(2);
  });
});
