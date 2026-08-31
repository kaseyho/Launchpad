export interface CrossrefWork {
  DOI?: string;
  title?: string[];
  author?: Array<{ given?: string; family?: string }>;
  published?: { 'date-parts'?: number[][] };
  'container-title'?: string[];
  publisher?: string;
  abstract?: string;
}

export interface AcademicSearchResult {
  doi: string;
  title: string;
  authors: string;
  published_at: string;
  venue: string;
  publisher: string;
  url: string;
  excerpt?: string;
  source_type?: 'paper' | 'community' | 'report' | 'competitor';
  lane?: 'academic' | 'community' | 'market' | 'alternatives' | 'counter';
}

function textOnly(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function publicationDate(parts?: number[][]) {
  const [year, month = 1, day = 1] = parts?.[0] ?? [];
  if (!year) return 'Date not supplied';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function mapCrossrefWork(work: CrossrefWork): AcademicSearchResult | undefined {
  const doi = work.DOI?.trim();
  const title = work.title?.[0]?.trim();
  if (!doi || !title) return undefined;
  const authors = work.author
    ?.map((author) => [author.given, author.family].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ') || 'Authors not supplied';
  const excerpt = work.abstract ? textOnly(work.abstract).slice(0, 600) : undefined;
  return {
    doi,
    title: textOnly(title),
    authors,
    published_at: publicationDate(work.published?.['date-parts']),
    venue: work['container-title']?.[0]?.trim() || 'Venue not supplied',
    publisher: work.publisher?.trim() || 'Publisher not supplied',
    url: `https://doi.org/${encodeURI(doi)}`,
    ...(excerpt ? { excerpt } : {}),
  };
}
