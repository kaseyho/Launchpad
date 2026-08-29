import { Geist, Geist_Mono, Pixelify_Sans } from 'next/font/google';
import { SiteHead } from './site-head';
import { metadata } from './site-metadata';
import './globals.css';

export { metadata };

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const pixelDisplay = Pixelify_Sans({
  variable: '--font-pixel',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head><SiteHead /></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pixelDisplay.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
