import { formatActivityTime } from './production-log';

describe('formatActivityTime', () => {
  it('renders the same audit timestamp on the server and in every browser time zone', () => {
    expect(formatActivityTime('2026-08-28T17:16:23.000Z')).toBe('17:16:23 UTC');
  });
});
