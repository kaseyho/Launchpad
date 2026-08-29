import { describe, expect, it, vi } from 'vitest';
import { createInMemoryFoundry } from '../domain/foundry-service';
import { buildResearchQueries, runAutonomousResearch } from './autonomous-research';

function result(prefix: string, index: number) {
  return {
    doi: `10.1000/${prefix}-${index}`,
    title: `${prefix} research ${index}`,
    authors: `Author ${index}`,
    published_at: `202${index % 5}-01-01`,
    venue: `Journal ${index}`,
    publisher: `Publisher ${prefix} ${index}`,
    url: `https://doi.org/10.1000/${prefix}-${index}`,
    excerpt: `${prefix === 'counter' ? 'Context mismatch and implementation burden can undermine otherwise effective interventions.' : 'Contextual practice and timely feedback can improve learning transfer and confident task completion.'} This abstract reports study ${index} and identifies limitations.`,
  };
}

describe('autonomous LaunchPad research', () => {
  it('keeps generated academic queries within the public route limit', () => {
    const queries = buildResearchQueries('x'.repeat(1200));
    expect(queries).toHaveLength(3);
    expect(Math.max(...queries.map((item) => item.query.length))).toBeLessThanOrEqual(200);
  });

  it('takes one problem all the way to one finalized, citation-backed solution', async () => {
    const foundry = createInMemoryFoundry();
    const progress: string[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const isCounter = String(input).includes('limitations%20barriers');
      const prefix = isCounter ? 'counter' : 'academic';
      const results = Array.from({ length: 7 }, (_, index) => result(prefix, index + 1));
      return new Response(JSON.stringify({ results }), { status: 200, headers: { 'content-type': 'application/json' } });
    });

    const blueprint = await runAutonomousResearch({
      problem: 'Hospital porters face preventable safety risks because shift handoffs are inconsistent.',
      service: foundry.service,
      getWorkspace: foundry.getWorkspace,
      fetcher,
      onProgress: ({ phase }) => progress.push(phase),
    });
    const workspace = foundry.getWorkspace();

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(progress).toEqual(['planning', 'searching', 'extracting', 'synthesizing', 'ideating', 'stress_testing', 'complete']);
    expect(workspace.stage).toBe('FINALIZED');
    expect(workspace.candidates).toHaveLength(1);
    expect(workspace.sources).toHaveLength(7);
    expect(workspace.findings).toHaveLength(7);
    expect(workspace.findings.filter((finding) => finding.evidenceType === 'counter_evidence')).toHaveLength(2);
    expect(blueprint.name).toBe('Readiness Passport');
    expect(blueprint.proofFindingIds.length).toBeGreaterThan(0);
    expect(blueprint.counterEvidenceIds.length).toBeGreaterThan(0);
  });

  it('drops a non-English result even if a future source adapter returns one', async () => {
    const foundry = createInMemoryFoundry();
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const isCounter = String(input).includes('limitations%20barriers');
      const prefix = isCounter ? 'counter' : 'academic';
      const results = Array.from({ length: 7 }, (_, index) => result(prefix, index + 1));
      results[0] = {
        ...results[0],
        title: 'Συστήματα αυτόνομης διαχείρισης',
        excerpt: 'Η σύγχρονη εποχή χαρακτηρίζεται από την ανάπτυξη της αυτοματοποίησης και της τεχνητής νοημοσύνης.',
      };
      return new Response(JSON.stringify({ results }), { status: 200, headers: { 'content-type': 'application/json' } });
    });

    await runAutonomousResearch({
      problem: 'Hospital porters face preventable safety risks because shift handoffs are inconsistent.',
      service: foundry.service,
      getWorkspace: foundry.getWorkspace,
      fetcher,
    });

    expect(foundry.getWorkspace().sources.every((source) => !source.title.includes('Συστήματα'))).toBe(true);
    expect(foundry.getWorkspace().findings.every((finding) => !finding.normalizedClaim.includes('σύγχρονη'))).toBe(true);
  });
});
