import { mapCrossrefWork, type CrossrefWork } from '../../../src/search/crossref';
import { searchReddit } from '../../../src/search/reddit';

export const runtime = 'edge';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() || '';
  if (query.length < 3 || query.length > 200) {
    return Response.json({ error: 'INVALID_QUERY', message: 'Use a focused research query between 3 and 200 characters.' }, { status: 400 });
  }
  try {
    const [academic, community] = await Promise.allSettled([
      (async () => {
        const url = new URL('https://api.crossref.org/works');
        url.searchParams.set('query.bibliographic', query);
        url.searchParams.set('filter', 'has-abstract:true');
        url.searchParams.set('rows', '8');
        url.searchParams.set('select', 'DOI,title,author,published,container-title,publisher,abstract');
        const upstream = await fetch(url, { headers: { accept: 'application/json' }, signal: request.signal });
        if (!upstream.ok) throw new Error(`Crossref returned ${upstream.status}.`);
        const payload = await upstream.json() as { message?: { items?: CrossrefWork[] } };
        return (payload.message?.items ?? []).map(mapCrossrefWork).filter(Boolean).map((result) => ({
          ...result,
          source_type: 'paper' as const,
          lane: 'academic' as const,
        }));
      })(),
      searchReddit(query, fetch, request.signal),
    ]);
    const results = [
      ...(academic.status === 'fulfilled' ? academic.value : []),
      ...(community.status === 'fulfilled' ? community.value : []),
    ];
    if (!results.length) {
      const failures = [academic, community].filter((item): item is PromiseRejectedResult => item.status === 'rejected');
      throw new Error(failures.map((item) => item.reason instanceof Error ? item.reason.message : 'A source adapter failed.').join(' '));
    }
    return Response.json({ results, adapters: { academic: academic.status === 'fulfilled', community: community.status === 'fulfilled' } }, { headers: { 'cache-control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: 'RESEARCH_SEARCH_UNAVAILABLE', message: error instanceof Error ? error.message : 'Research source search is unavailable.' }, { status: 502 });
  }
}
