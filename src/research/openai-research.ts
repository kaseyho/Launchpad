import type { GroundedResearchReport } from './autonomous-research';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface ProviderResearchOptions {
  apiKey: string;
  fetcher?: FetchLike;
  baseUrl?: string;
  model?: string;
  signal?: AbortSignal;
}

export interface GroundedResearchClarification {
  status: 'needs_clarification';
  questions: string[];
}

type ProviderResponse = {
  status?: string;
  error?: { message?: string } | null;
  output?: Array<Record<string, unknown>>;
};

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'questions', 'target_audience', 'desired_outcome', 'recommendation', 'sources'],
  properties: {
    status: { type: 'string', enum: ['complete', 'needs_clarification'] },
    questions: { type: 'array', items: { type: 'string' } },
    target_audience: { type: 'string' },
    desired_outcome: { type: 'string' },
    recommendation: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'one_liner', 'mechanism', 'features', 'assumptions'],
      properties: {
        name: { type: 'string' },
        one_liner: { type: 'string' },
        mechanism: { type: 'string' },
        features: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'description'],
            properties: { name: { type: 'string' }, description: { type: 'string' } },
          },
        },
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['statement', 'validation_method'],
            properties: { statement: { type: 'string' }, validation_method: { type: 'string' } },
          },
        },
      },
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'url', 'publisher', 'published_at', 'source_type', 'lane', 'finding'],
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
          publisher: { type: 'string' },
          published_at: { type: 'string' },
          source_type: { type: 'string', enum: ['paper', 'report', 'community', 'competitor'] },
          lane: { type: 'string', enum: ['academic', 'market', 'alternatives', 'community', 'counter'] },
          finding: { type: 'string' },
        },
      },
    },
  },
} as const;

const RESEARCH_INSTRUCTIONS = `You are LaunchPad's grounded research agent. Answer the user's actual request, not a nearby academic topic and never a generic product template.

You must use web search before completing a report. Search broadly enough to compare current authoritative guidance, reputable market or product information, relevant community experience when useful, and at least one credible limitation or counter-signal. Prefer primary and authoritative sources. Do not invent sources, URLs, dates, findings, or quotes.

Classify the request first:
- A request for a general method or strategy is answerable and should return status "complete".
- A request for a specific live result that lacks essential inputs should return status "needs_clarification" with concise questions. For a flight fare, essential inputs include origin, destination, travel dates or flexibility, passenger count, and material baggage constraints.

For a complete report:
- Return 4 to 7 unique sources actually encountered through web search.
- Include at least two supporting sources and at least one source in the counter lane.
- Make every finding a conservative source-grounded paraphrase. Do not present it as a verbatim quote.
- Directly recommend what the user should do. Name concrete tools, steps, tradeoffs, and limits when supported.
- Never recommend an abstract "pilot", "intervention", "loop", or "test" unless the user's problem genuinely asks for a product experiment.
- Treat time-sensitive prices as time-sensitive and never claim a current cheapest option without the inputs and live evidence required to compare it.

For clarification, leave the report strings and arrays empty except for status and questions.`;

function outputText(response: ProviderResponse) {
  for (const item of response.output ?? []) {
    if (item.type !== 'message' || !Array.isArray(item.content)) continue;
    for (const content of item.content as Array<Record<string, unknown>>) {
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return '';
}

function normalizedUrl(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || ['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    throw new Error('The AI research report contained an unsafe source URL.');
  }
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('utm_')) url.searchParams.delete(key);
  }
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

function collectUrls(value: unknown, urls: Set<string>) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, urls);
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'url' && typeof nested === 'string') {
      try { urls.add(normalizedUrl(nested)); } catch { /* Ignore malformed upstream search metadata. */ }
    } else {
      collectUrls(nested, urls);
    }
  }
}

function webSearchUrls(response: ProviderResponse) {
  const urls = new Set<string>();
  for (const item of response.output ?? []) {
    if (item.type === 'web_search_call') {
      collectUrls(item.action, urls);
      collectUrls(item.results, urls);
      continue;
    }
    if (item.type !== 'message' || !Array.isArray(item.content)) continue;
    for (const content of item.content as Array<Record<string, unknown>>) collectUrls(content.annotations, urls);
  }
  return urls;
}

function nonEmpty(value: unknown, minimum = 1): value is string {
  return typeof value === 'string' && value.trim().length >= minimum;
}

function validateReport(value: unknown, allowedUrls: Set<string>): GroundedResearchReport | GroundedResearchClarification {
  if (!value || typeof value !== 'object') throw new Error('The AI research service returned an invalid report.');
  const report = value as Record<string, unknown>;
  if (!Array.isArray(report.questions) || report.questions.some((question) => !nonEmpty(question))) {
    throw new Error('The AI research service returned invalid clarification questions.');
  }
  if (report.status === 'needs_clarification') {
    if (report.questions.length === 0) throw new Error('The AI research service requested clarification without asking a question.');
    return { status: 'needs_clarification', questions: report.questions as string[] };
  }
  if (report.status !== 'complete' || !nonEmpty(report.target_audience, 8) || !nonEmpty(report.desired_outcome, 12)) {
    throw new Error('The AI research service returned an invalid report.');
  }
  const recommendation = report.recommendation as Record<string, unknown> | undefined;
  if (!recommendation
    || !nonEmpty(recommendation.name, 3)
    || !nonEmpty(recommendation.one_liner, 30)
    || !nonEmpty(recommendation.mechanism, 40)
    || !Array.isArray(recommendation.features)
    || recommendation.features.length < 3
    || !Array.isArray(recommendation.assumptions)
    || recommendation.assumptions.length < 1) {
    throw new Error('The AI research service returned an incomplete recommendation.');
  }
  if (/^(?:evidence-guided|focused|friction-first|guided proof|assumption-safe).*(?:pilot|loop|trial)$/i.test(String(recommendation.name).trim())) {
    throw new Error('The AI research service returned a generic recommendation instead of answering the request.');
  }
  if (!Array.isArray(report.sources) || report.sources.length < 4 || report.sources.length > 7) {
    throw new Error('The AI research service did not return 4 to 7 grounded sources.');
  }
  const sources = report.sources as Array<Record<string, unknown>>;
  const seen = new Set<string>();
  let counterCount = 0;
  for (const source of sources) {
    if (!nonEmpty(source.title, 3)
      || !nonEmpty(source.publisher, 2)
      || !nonEmpty(source.published_at, 4)
      || !nonEmpty(source.finding, 40)
      || !['paper', 'report', 'community', 'competitor'].includes(String(source.source_type))
      || !['academic', 'market', 'alternatives', 'community', 'counter'].includes(String(source.lane))
      || !nonEmpty(source.url)) {
      throw new Error('The AI research service returned an incomplete source record.');
    }
    const url = normalizedUrl(source.url);
    if (!allowedUrls.has(url)) throw new Error(`The source ${source.title} was not present in the web search results.`);
    if (seen.has(url)) throw new Error('The AI research service returned duplicate source URLs.');
    seen.add(url);
    if (source.lane === 'counter') counterCount += 1;
  }
  if (counterCount < 1 || sources.length - counterCount < 2) {
    throw new Error('The AI research service did not return both supporting and counter evidence.');
  }
  return value as GroundedResearchReport;
}

export async function researchWithProvider(
  problem: string,
  { apiKey, fetcher = fetch, baseUrl = 'https://soclaas-api.comp.nus.edu.sg/v1', model = 'default', signal }: ProviderResearchOptions,
): Promise<GroundedResearchReport | GroundedResearchClarification> {
  if (!apiKey.trim()) throw new Error('AI web research is not configured on this deployment.');
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/responses`;
  const upstream = await fetcher(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      instructions: RESEARCH_INSTRUCTIONS,
      input: `Research and answer this request:\n\n${problem.trim()}`,
      tools: [{ type: 'web_search' }],
      tool_choice: { type: 'web_search' },
      include: ['web_search_call.action.sources', 'web_search_call.results'],
      text: { format: { type: 'json_schema', name: 'launchpad_research_report', strict: true, schema: REPORT_SCHEMA } },
      store: false,
      max_output_tokens: 6000,
    }),
    signal,
  });
  const response = await upstream.json() as ProviderResponse;
  if (!upstream.ok || response.status === 'failed') {
    throw new Error(response.error?.message || 'The AI web research provider could not complete this request.');
  }
  const text = outputText(response);
  if (!text) throw new Error('The AI web research provider returned no report.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The AI web research provider returned malformed report data.');
  }
  return validateReport(parsed, webSearchUrls(response));
}
