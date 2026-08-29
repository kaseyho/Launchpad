import type { Metadata } from 'next';

export const PUBLIC_SITE_URL = 'https://proof-foundry.hello18528.chatgpt.site';

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  alternates: { canonical: '/' },
  title: {
    default: 'LaunchPad — Evidence in. Defensible ideas out.',
    template: '%s · LaunchPad',
  },
  description: 'A shared research workspace where humans and agents turn fragmented evidence into ideas worth testing.',
  applicationName: 'LaunchPad',
  keywords: ['WebMCP', 'evidence synthesis', 'product research', 'idea validation', 'human-agent workflow'],
  authors: [{ name: 'LaunchPad' }],
  openGraph: {
    type: 'website',
    siteName: 'LaunchPad',
    title: 'LaunchPad — Evidence in. Defensible ideas out.',
    description: 'Watch an agent operate a live research factory through WebMCP and trace every decision back to accepted evidence.',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'LaunchPad miniature research factory social preview' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LaunchPad — Evidence in. Defensible ideas out.',
    description: 'A live research workspace for humans and agents, built with WebMCP.',
    images: ['/og.png'],
  },
  icons: { icon: '/favicon.svg' },
};
