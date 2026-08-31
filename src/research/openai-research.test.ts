import { describe, expect, it, vi } from 'vitest';
import { researchWithProvider } from './openai-research';

const flightReport = {
  status: 'complete' as const,
  questions: [],
  target_audience: 'Travelers comparing flight options',
  desired_outcome: 'Minimize the total payable airfare for a viable itinerary',
  recommendation: {
    name: 'Fare Search Playbook',
    one_liner: 'Compare flexible dates, verify the all-in airline price, and use alerts before booking.',
    mechanism: 'Compare dates, airports, and booking channels, then judge the final price with required fees included.',
    features: [
      { name: 'Flexible search', description: 'Search nearby dates and airports.' },
      { name: 'All-in comparison', description: 'Include baggage, seat, and payment fees.' },
      { name: 'Price watch', description: 'Track a viable itinerary against a booking threshold.' },
    ],
    assumptions: [{ statement: 'The traveler has some flexibility.', validation_method: 'Compare fixed and flexible searches.' }],
  },
  sources: [
    { title: 'Google Flights guidance', url: 'https://travel.google/flight-search/', publisher: 'Google', published_at: '2026-01-01', source_type: 'report', lane: 'market', finding: 'Flexible-date and nearby-airport search can reveal lower-priced itinerary combinations.' },
    { title: 'Airfare fee guidance', url: 'https://consumer.example.org/airfare', publisher: 'Consumer Guide', published_at: '2026-01-02', source_type: 'report', lane: 'market', finding: 'Travelers should compare the final payable fare, including the optional services they actually need.' },
    { title: 'Price tracking discussion', url: 'https://community.example.com/flights', publisher: 'Traveler Community', published_at: '2026-01-03', source_type: 'community', lane: 'community', finding: 'Price alerts help travelers monitor a viable itinerary, but anecdotes do not establish a universal best booking day.' },
    { title: 'Limits of airfare timing rules', url: 'https://research.example.edu/airfare-timing', publisher: 'Travel Research Institute', published_at: '2026-01-04', source_type: 'paper', lane: 'counter', finding: 'No single booking day or advance-purchase window guarantees the lowest fare for every route.' },
  ],
};

function responseFor(report = flightReport, citedUrls = flightReport.sources.map((source) => source.url)) {
  return {
    id: 'resp-flight-research',
    status: 'completed',
    output: [
      {
        type: 'web_search_call',
        status: 'completed',
        action: { type: 'search', sources: citedUrls.map((url) => ({ type: 'url', url })) },
      },
      {
        type: 'message',
        status: 'completed',
        content: [{
          type: 'output_text',
          text: JSON.stringify(report),
          annotations: citedUrls.map((url) => ({ type: 'url_citation', url })),
        }],
      },
    ],
  };
}

describe('OpenAI grounded web research', () => {
  it('requires web search and returns only a structured, citation-backed report', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(responseFor()), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    const report = await researchWithProvider('find cheapest flight price booking', {
      apiKey: 'test-key',
      fetcher,
      model: 'gpt-test',
      baseUrl: 'https://soclaas.example.test/v1',
    });

    expect(report).toEqual(flightReport);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('https://soclaas.example.test/v1/responses', expect.anything());
    const [, init] = fetcher.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit | undefined];
    const request = JSON.parse(String(init?.body));
    expect(request.model).toBe('gpt-test');
    expect(request.tools).toEqual([{ type: 'web_search' }]);
    expect(request.tool_choice).toEqual({ type: 'web_search' });
    expect(request.text.format).toMatchObject({ type: 'json_schema', strict: true });
    expect(request.store).toBe(false);
  });

  it('rejects a report source that was not returned by the web search call', async () => {
    const uncited = {
      ...flightReport,
      sources: flightReport.sources.map((source, index) => index === 0
        ? { ...source, url: 'https://invented.example.com/cheap-flights' }
        : source),
    };
    const fetcher = vi.fn(async () => new Response(JSON.stringify(responseFor(uncited)), { status: 200 }));

    await expect(researchWithProvider('find cheapest flight price booking', {
      apiKey: 'test-key',
      fetcher,
    })).rejects.toThrow(/not present in the web search results/i);
  });

  it('rejects the former generic fallback recommendations', async () => {
    const generic = {
      ...flightReport,
      recommendation: {
        ...flightReport.recommendation,
        name: 'Evidence-Guided Pilot',
        one_liner: 'A focused intervention based on the strongest repeated finding.',
        mechanism: 'Turn the strongest repeated finding into one reversible action before scaling.',
      },
    };
    const fetcher = vi.fn(async () => new Response(JSON.stringify(responseFor(generic)), { status: 200 }));

    await expect(researchWithProvider('find cheapest flight price booking', {
      apiKey: 'test-key',
      fetcher,
    })).rejects.toThrow(/generic recommendation/i);
  });

  it('refuses to run without a server-side OpenAI key', async () => {
    const fetcher = vi.fn();

    await expect(researchWithProvider('find cheapest flight price booking', {
      apiKey: '',
      fetcher,
    })).rejects.toThrow(/not configured/i);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
