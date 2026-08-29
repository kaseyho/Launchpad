import { createInitialWorkspace } from '../domain/foundry-service';
import { decodeWorkspaceSnapshot, encodeWorkspaceSnapshot } from './workspace-snapshot';

describe('workspace snapshots', () => {
  it('round-trips a versioned Foundry workspace without losing evidence arrays', () => {
    const workspace = createInitialWorkspace();
    workspace.title = 'Persistent workspace';
    workspace.problemBrief.constraints = ['Six weeks'];

    const decoded = decodeWorkspaceSnapshot(encodeWorkspaceSnapshot(workspace));

    expect(decoded).toMatchObject({
      id: 'workspace-demo',
      title: 'Persistent workspace',
      version: 1,
      problemBrief: { constraints: ['Six weeks'] },
    });
    expect(decoded).not.toBe(workspace);
  });

  it('rejects corrupt, oversized, or structurally invalid snapshots', () => {
    expect(() => decodeWorkspaceSnapshot('{not-json')).toThrow('valid JSON');
    expect(() => decodeWorkspaceSnapshot(JSON.stringify({ id: 'x' }))).toThrow('valid LaunchPad workspace');
    expect(() => decodeWorkspaceSnapshot(' '.repeat(1_500_001))).toThrow('maximum size');
  });
});
