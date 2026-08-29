import { mapCrossrefWork, type CrossrefWork } from '../../../src/search/crossref';

export const runtime = 'edge';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() || '';
  if (query.length < 3 || query.length > 200) {
    return Response.json({ error: 'INVALID_QUERY', message: 'Use a focused academic query between 3 and 200 characters.' }, { status: 400 });
  }
  try {
    const url = new URL('https://api.crossref.org/works');
    url.searchParams.set('query.bibliographic', query);
    url.searchParams.set('rows', '5');
    url.searchParams.set('select', 'DOI,title,author,published,container-title,publisher,abstract');
    const upstream = await fetch(url, { headers: { accept: 'application/json' } });
    if (!upstream.ok) throw new Error(`Crossref returned ${upstream.status}.`);
    const payload = await upstream.json() as { message?: { items?: CrossrefWork[] } };
    const results = (payload.message?.items ?? []).map(mapCrossrefWork).filter(Boolean);
    return Response.json({ results }, { headers: { 'cache-control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: 'ACADEMIC_SEARCH_UNAVAILABLE', message: error instanceof Error ? error.message : 'Academic metadata search is unavailable.' }, { status: 502 });
  }
}
