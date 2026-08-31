import type { AcademicSearchResult } from './crossref';

interface RedditPost {
  id?: string;
  title?: string;
  selftext?: string;
  author?: string;
  subreddit_name_prefixed?: string;
  permalink?: string;
  created_utc?: number;
  is_self?: boolean;
}

interface RedditSearchPayload {
  data?: { children?: Array<{ data?: RedditPost }> };
}

function excerptFor(post: RedditPost) {
  const body = post.selftext?.replace(/\s+/g, ' ').trim();
  if (body && body.length >= 40) return body.slice(0, 600);
  const title = post.title?.trim();
  return title && title.length >= 40 ? title : undefined;
}

function publishedAt(timestamp?: number) {
  if (!timestamp) return 'Date not supplied';
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

export function mapRedditPost(post: RedditPost): AcademicSearchResult | undefined {
  const id = post.id?.trim();
  const title = post.title?.replace(/\s+/g, ' ').trim();
  const permalink = post.permalink?.trim();
  const excerpt = excerptFor(post);
  if (!id || !title || !permalink || !excerpt) return undefined;

  return {
    doi: `reddit:${id}`,
    title,
    authors: post.author ? `u/${post.author}` : 'Author not supplied',
    published_at: publishedAt(post.created_utc),
    venue: post.subreddit_name_prefixed || 'Reddit discussion',
    publisher: 'Reddit',
    url: `https://www.reddit.com${permalink}`,
    excerpt,
    source_type: 'community',
    lane: 'community',
  };
}

export async function searchReddit(query: string, fetcher: typeof fetch = fetch, signal?: AbortSignal) {
  const url = new URL('https://www.reddit.com/search.json');
  url.searchParams.set('q', query);
  url.searchParams.set('sort', 'relevance');
  url.searchParams.set('t', 'year');
  url.searchParams.set('limit', '8');
  const response = await fetcher(url, {
    headers: { accept: 'application/json', 'user-agent': 'LaunchPad research prototype/0.1' },
    signal,
  });
  if (!response.ok) throw new Error(`Reddit returned ${response.status}.`);
  const payload = await response.json() as RedditSearchPayload;
  return (payload.data?.children ?? []).map((child) => mapRedditPost(child.data ?? {})).filter(Boolean) as AcademicSearchResult[];
}
