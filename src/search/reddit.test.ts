import { describe, expect, it } from 'vitest';
import { mapRedditPost } from './reddit';

describe('Reddit source mapping', () => {
  it('keeps a public discussion traceable without treating it as research', () => {
    expect(mapRedditPost({
      id: 'abc123',
      title: 'How do you handle this recurring onboarding problem?',
      selftext: 'Several managers described the same recurring issue and the workaround they use during a busy shift.',
      author: 'example-user',
      subreddit_name_prefixed: 'r/operations',
      permalink: '/r/operations/comments/abc123/example/',
      created_utc: 1_720_000_000,
    })).toMatchObject({
      doi: 'reddit:abc123',
      source_type: 'community',
      lane: 'community',
      publisher: 'Reddit',
      url: 'https://www.reddit.com/r/operations/comments/abc123/example/',
    });
  });

  it('ignores posts without a usable passage', () => {
    expect(mapRedditPost({ id: 'empty', title: 'Short title', permalink: '/r/test/comments/empty/' })).toBeUndefined();
  });
});
