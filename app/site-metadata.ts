import type { Metadata } from 'next';

export const PUBLIC_SITE_URL = 'https://proof-foundry.hello18528.chatgpt.site';

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  alternates: { canonical: '/' },
  title: {
    default: 'LaunchPad — One problem in. Evidence-backed solution out.',
    template: '%s · LaunchPad',
  },
  description: 'Type one problem. LaunchPad researches it, recommends one solution, and shows the cited evidence and limitations behind it.',
  applicationName: 'LaunchPad',
  keywords: ['WebMCP', 'evidence synthesis', 'product research', 'idea validation', 'human-agent workflow'],
  authors: [{ name: 'LaunchPad' }],
  openGraph: {
    type: 'website',
    siteName: 'LaunchPad',
    title: 'LaunchPad — One problem in. Evidence-backed solution out.',
    description: 'Type one problem. LaunchPad autonomously researches, ideates, stress-tests, and returns one solution with visible proof.',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'LaunchPad miniature research factory social preview' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LaunchPad — One problem in. Evidence-backed solution out.',
    description: 'Type one problem. Get one solution with cited research, counter-evidence, assumptions, and a validation plan.',
    images: ['/og.png'],
  },
  icons: { icon: '/favicon.svg' },
};
