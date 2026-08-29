import type { Metadata } from 'next';

export const PUBLIC_SITE_URL = 'https://proof-foundry.hello18528.chatgpt.site';

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  alternates: { canonical: '/' },
  title: {
    default: 'LaunchPad — Evidence in. Defensible ideas out.',
    template: '%s · LaunchPad',
  },
  description: 'Enter your own problem, then work with a browser agent to turn evidence into an idea worth testing.',
  applicationName: 'LaunchPad',
  keywords: ['WebMCP', 'evidence synthesis', 'product research', 'idea validation', 'human-agent workflow'],
  authors: [{ name: 'LaunchPad' }],
  openGraph: {
    type: 'website',
    siteName: 'LaunchPad',
    title: 'LaunchPad — Evidence in. Defensible ideas out.',
    description: 'Bring your own problem. A browser agent operates LaunchPad through WebMCP while every decision stays traceable to accepted evidence.',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'LaunchPad miniature research factory social preview' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LaunchPad — Evidence in. Defensible ideas out.',
    description: 'Enter your own problem and build a traceable, evidence-backed idea with a WebMCP browser agent.',
    images: ['/og.png'],
  },
  icons: { icon: '/favicon.svg' },
};
