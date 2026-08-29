import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'ProofFoundry — Proof-carrying ideas',
    template: '%s · ProofFoundry',
  },
  description: 'A visual research foundry where humans and agents turn fragmented evidence into ideas worth testing.',
  applicationName: 'ProofFoundry',
  keywords: ['WebMCP', 'evidence synthesis', 'product research', 'idea validation', 'human-agent workflow'],
  authors: [{ name: 'ProofFoundry' }],
  openGraph: {
    type: 'website',
    siteName: 'ProofFoundry',
    title: 'ProofFoundry — Raw signals in. Proof-carrying ideas out.',
    description: 'Operate a live research factory with WebMCP and trace every final idea decision back to accepted evidence.',
    images: [{ url: '/og.png', width: 1729, height: 910, alt: 'ProofFoundry evidence refinery social preview' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProofFoundry — Proof-carrying ideas',
    description: 'A live research factory for humans and agents, built with WebMCP.',
    images: ['/og.png'],
  },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
