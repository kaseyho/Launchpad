import { mapCrossrefWork } from './crossref';

describe('Crossref metadata mapping', () => {
  it('normalizes DOI, authors, publication date, venue, and a safe text abstract', () => {
    expect(mapCrossrefWork({
      DOI: '10.1000/demo',
      title: ['A useful study'],
      author: [{ given: 'Ada', family: 'Lovelace' }, { family: 'Ng' }],
      published: { 'date-parts': [[2024, 5, 9]] },
      'container-title': ['Journal of Useful Evidence'],
      publisher: 'Evidence Press',
      abstract: '<jats:p>Worked examples &amp; guidance reduced load.</jats:p>',
    })).toEqual({
      doi: '10.1000/demo',
      title: 'A useful study',
      authors: 'Ada Lovelace, Ng',
      published_at: '2024-05-09',
      venue: 'Journal of Useful Evidence',
      publisher: 'Evidence Press',
      url: 'https://doi.org/10.1000/demo',
      excerpt: 'Worked examples & guidance reduced load.',
    });
  });

  it('rejects incomplete works that cannot produce a stable citation', () => {
    expect(mapCrossrefWork({ title: ['No DOI'] })).toBeUndefined();
    expect(mapCrossrefWork({ DOI: '10.1000/no-title' })).toBeUndefined();
  });
});
