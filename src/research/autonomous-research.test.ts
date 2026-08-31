import { describe, expect, it, vi } from 'vitest';
import { createInMemoryFoundry } from '../domain/foundry-service';
import { runAutonomousResearch, type GroundedResearchReport } from './autonomous-research';

function groundedReport({
  name = 'Shift Handoff Safety Check',
  sourceType = 'paper',
}: {
  name?: string;
  sourceType?: GroundedResearchReport['sources'][number]['source_type'];
} = {}) {
  return {
    status: 'complete' as const,
    questions: [],
    target_audience: 'Hospital porters working across shift changes',
    desired_outcome: 'Reduce preventable handoff omissions and safety incidents',
    recommendation: {
      name,
      one_liner: 'Use a concise shared handoff check that makes ownership and unresolved safety risks visible at every shift change.',
      mechanism: 'Standardize the highest-risk handoff details, require the outgoing and incoming porter to confirm ownership, and record unresolved hazards before work continues.',
      features: [
        { name: 'Risk handoff', description: 'Capture the safety details most likely to be lost during a shift change.' },
        { name: 'Ownership check', description: 'Require both sides to confirm the next responsible person.' },
        { name: 'Exception record', description: 'Keep unresolved hazards visible until somebody closes them.' },
      ],
      assumptions: [{ statement: 'Porters can complete a concise check during shift change.', validation_method: 'Time the check during a representative pilot shift.' }],
    },
    sources: [
      { title: 'Handoff safety study', url: 'https://research.example.org/handoff-safety', publisher: 'Safety Journal', published_at: '2025-01-01', source_type: sourceType, lane: sourceType === 'community' ? 'community' as const : 'academic' as const, finding: 'Structured handoff checks can reduce omissions when responsibility changes between workers.' },
      { title: 'Shift communication review', url: 'https://research.example.net/shift-communication', publisher: 'Workplace Review', published_at: '2024-06-01', source_type: sourceType, lane: sourceType === 'community' ? 'community' as const : 'academic' as const, finding: 'Explicit ownership confirmation reduces ambiguity about who must act after a handoff.' },
      { title: 'Porter workflow discussion', url: 'https://community.example.com/porter-workflow', publisher: 'Porter Community', published_at: '2026-01-01', source_type: sourceType, lane: 'community' as const, finding: 'Workers report that unresolved exceptions are easily lost when handoffs rely on memory alone.' },
      { title: 'Handoff checklist limitations', url: 'https://research.example.edu/checklist-limits', publisher: 'Implementation Institute', published_at: '2025-08-01', source_type: sourceType, lane: 'counter' as const, finding: 'Long or mandatory checklists can add burden and encourage superficial completion in busy settings.' },
    ],
  };
}

describe('autonomous LaunchPad research', () => {
  it('builds the flight answer from one grounded AI web report instead of generic search templates', async () => {
    const foundry = createInMemoryFoundry();
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      status: 'complete',
      questions: [],
      target_audience: 'Travelers who can compare dates and booking channels',
      desired_outcome: 'Minimize the total payable airfare without hiding baggage or booking fees',
      recommendation: {
        name: 'Fare Search Playbook',
        one_liner: 'Compare flexible-date fares, verify the all-in price with the airline, and track the best viable itinerary before booking.',
        mechanism: 'Search a broad date and airport range, compare total trip cost across reputable metasearch tools, then confirm the same itinerary and fee rules directly with the operating airline.',
        features: [
          { name: 'Flexible search', description: 'Compare nearby dates and airports before fixing the itinerary.' },
          { name: 'All-in comparison', description: 'Include baggage, seat, payment, and transfer costs in the comparison.' },
          { name: 'Price-watch decision', description: 'Track a viable itinerary and book when the total price meets a pre-set threshold.' },
        ],
        assumptions: [{ statement: 'The traveler can change at least one date, airport, or booking channel.', validation_method: 'Compare a fixed search with a flexible search for the same trip.' }],
      },
      sources: [
        { title: 'Google Flights guidance', url: 'https://travel.google/flight-search/', publisher: 'Google', published_at: '2026-01-01', source_type: 'report', lane: 'market', finding: 'Flexible date and airport tools expose lower-priced itinerary combinations.' },
        { title: 'Consumer airfare comparison guidance', url: 'https://consumer.example.org/airfare', publisher: 'Consumer Guide', published_at: '2026-01-02', source_type: 'report', lane: 'market', finding: 'The displayed fare should be compared using the final payable price, including optional fees the traveler needs.' },
        { title: 'Traveler price tracking discussion', url: 'https://community.example.com/flights', publisher: 'Traveler Community', published_at: '2026-01-03', source_type: 'community', lane: 'community', finding: 'Travelers use price alerts to watch viable itineraries, but anecdotes do not establish a universal booking day.' },
        { title: 'Limits of airfare timing rules', url: 'https://research.example.edu/airfare-timing', publisher: 'Travel Research Institute', published_at: '2026-01-04', source_type: 'paper', lane: 'counter', finding: 'No single booking day or advance-purchase window guarantees the lowest fare for every route.' },
      ],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const blueprint = await runAutonomousResearch({
      problem: 'find cheapest flight price booking',
      service: foundry.service,
      getWorkspace: foundry.getWorkspace,
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('/api/research', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ problem: 'find cheapest flight price booking' }),
    }));
    expect(blueprint.name).toBe('Fare Search Playbook');
    expect(blueprint.mechanism).toContain('total trip cost');
    expect(foundry.getWorkspace().findings.map((finding) => finding.normalizedClaim).join(' ')).not.toMatch(/mindfulness|oil products/i);
  });

  it('takes one problem all the way to one finalized, citation-backed solution', async () => {
    const foundry = createInMemoryFoundry();
    const progress: string[] = [];
    const fetcher = vi.fn(async () => new Response(JSON.stringify(groundedReport()), { status: 200, headers: { 'content-type': 'application/json' } }));

    const blueprint = await runAutonomousResearch({
      problem: 'Hospital porters face preventable safety risks because shift handoffs are inconsistent.',
      service: foundry.service,
      getWorkspace: foundry.getWorkspace,
      fetcher,
      onProgress: ({ phase }) => progress.push(phase),
    });
    const workspace = foundry.getWorkspace();

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(progress).toEqual(['planning', 'searching', 'extracting', 'synthesizing', 'ideating', 'stress_testing', 'complete']);
    expect(workspace.stage).toBe('FINALIZED');
    expect(workspace.candidates).toHaveLength(1);
    expect(workspace.sources).toHaveLength(4);
    expect(workspace.findings).toHaveLength(4);
    expect(workspace.findings.filter((finding) => finding.evidenceType === 'counter_evidence')).toHaveLength(1);
    expect(blueprint.name).toBe('Shift Handoff Safety Check');
    expect(blueprint.proofFindingIds.length).toBeGreaterThan(0);
    expect(blueprint.counterEvidenceIds.length).toBeGreaterThan(0);
  });

  it('can complete from mixed public evidence when academic results are not the majority', async () => {
    const foundry = createInMemoryFoundry();
    const fetcher = vi.fn(async () => new Response(JSON.stringify(groundedReport({
      name: 'Urgent Care Guidance Finder',
      sourceType: 'community',
    })), { status: 200, headers: { 'content-type': 'application/json' } }));

    const blueprint = await runAutonomousResearch({
      problem: 'Caregivers struggle to find trustworthy guidance when a new home-care task becomes urgent.',
      service: foundry.service,
      getWorkspace: foundry.getWorkspace,
      fetcher,
    });

    expect(blueprint.status).toBe('finalized');
    expect(foundry.getWorkspace().sources.every((source) => source.sourceType === 'community')).toBe(true);
  });
});
