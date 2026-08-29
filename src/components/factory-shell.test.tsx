import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FactoryShell } from './factory-shell';

const CUSTOM_PROBLEM = 'Independent restaurants lose new staff during first-week training because guidance is inconsistent across managers.';

describe('FactoryShell user-defined workflow', () => {
  it('starts with one focused problem input, a visible WebMCP explanation, and a hidden activity log', async () => {
    const user = userEvent.setup();
    render(<FactoryShell />);

    expect(screen.getByRole('banner')).toHaveTextContent('LaunchPad');
    expect(screen.getByRole('heading', { name: /put your problem on the line/i })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /your problem statement/i })).toBeVisible();
    expect(screen.getByText(/no api key required/i)).toBeVisible();
    expect(screen.getByRole('region', { name: /interactive research factory/i })).toBeVisible();
    expect(screen.getByLabelText(/webmcp agent run/i)).toHaveTextContent(/16 typed tools/i);
    expect(screen.getByRole('button', { name: /copy chatgpt instruction/i })).toBeDisabled();
    expect(screen.queryByRole('dialog', { name: /activity/i })).not.toBeInTheDocument();

    const activityButton = screen.getByRole('button', { name: /activity/i });
    await user.click(activityButton);
    expect(screen.getByRole('dialog', { name: /activity/i })).toBeVisible();
  });

  it('turns the user’s own statement into the active problem and a tailored research path', async () => {
    const user = userEvent.setup();
    render(<FactoryShell />);

    await user.type(screen.getByRole('textbox', { name: /your problem statement/i }), CUSTOM_PROBLEM);
    await user.click(screen.getByRole('button', { name: /start with my problem/i }));

    expect(screen.getByText(CUSTOM_PROBLEM)).toBeVisible();
    expect(screen.queryByRole('button', { name: /load demo problem/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy chatgpt instruction/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /plan research/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /plan research/i }));
    expect(screen.getByRole('button', { name: /add first source/i })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: /add first source/i }));
    expect(screen.getByRole('dialog', { name: /add source/i })).toBeVisible();
  });

  it('lets the user enrich their statement with audience, outcome, timeframe, and constraints', async () => {
    const user = userEvent.setup();
    render(<FactoryShell />);

    await user.type(screen.getByRole('textbox', { name: /your problem statement/i }), CUSTOM_PROBLEM);
    await user.click(screen.getByRole('button', { name: /start with my problem/i }));
    await user.click(screen.getByRole('button', { name: /add audience, outcome \+ constraints/i }));

    const dialog = screen.getByRole('dialog', { name: /edit problem brief/i });
    await user.type(within(dialog).getByLabelText(/target audience/i), 'Independent restaurant managers');
    await user.type(within(dialog).getByLabelText(/desired outcome/i), 'Improve first-week task completion');
    await user.type(within(dialog).getByLabelText(/timeframe/i), 'Four weeks');
    await user.type(within(dialog).getByLabelText(/constraints \/ one per line/i), 'No additional training headcount');
    await user.click(within(dialog).getByRole('button', { name: /save problem brief/i }));

    expect(screen.getByText(/Independent restaurant managers · Improve first-week task completion/)).toBeVisible();
  });
});
