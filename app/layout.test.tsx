import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteHead } from './site-head';
import { metadata } from './site-metadata';

describe('production metadata', () => {
  it('resolves canonical and social assets against the public site', () => {
    expect(metadata.metadataBase?.toString()).toBe('https://proof-foundry.hello18528.chatgpt.site/');
    expect(metadata.alternates?.canonical).toBe('/');
    expect(metadata.openGraph?.images).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: '/og.png' }),
    ]));
  });

  it('renders the canonical link for runtimes that do not emit metadata alternates', () => {
    render(<SiteHead />);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://proof-foundry.hello18528.chatgpt.site/',
    );
  });
});
