import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');

function rule(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`))?.[1] ?? '';
}

describe('site readability contract', () => {
  it('lets the desktop document grow and scroll beyond the viewport', () => {
    const appRule = rule('.launchpad-app');
    const workspaceRule = rule('.launch-workspace');

    expect(appRule).toContain('min-height: 100svh');
    expect(appRule).toContain('overflow-x: clip');
    expect(appRule).not.toMatch(/(^|\s)height:\s*100svh/);
    expect(appRule).not.toContain('overflow: hidden');
    expect(workspaceRule).not.toMatch(/(^|\s)height:\s*calc\(100svh - 68px\)/);
  });

  it('keeps interface copy at an 11px minimum', () => {
    const explicitSizes = [...css.matchAll(/font-size:\s*(\d+)px/g)].map((match) => Number(match[1]));
    const shorthandSizes = [...css.matchAll(/font:[^;\n]*?\s(\d+)px\//g)].map((match) => Number(match[1]));

    expect(Math.min(...explicitSizes, ...shorthandSizes)).toBeGreaterThanOrEqual(11);
  });

  it('does not use single-line leading for supporting interface copy', () => {
    expect(css).not.toMatch(/font:[^;\n]*?\s(?:11|12|13)px\/1(?:\s|;)/);
  });
});
