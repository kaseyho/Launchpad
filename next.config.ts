import type { NextConfig } from 'next';
import path from 'node:path';

const useBrowserStorageFallback = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  turbopack: useBrowserStorageFallback
    ? { resolveAlias: { 'cloudflare:workers': './src/persistence/cloudflare-unavailable.ts' } }
    : undefined,
  webpack(config) {
    if (useBrowserStorageFallback) {
      config.resolve.alias['cloudflare:workers'] = path.resolve(process.cwd(), 'src/persistence/cloudflare-unavailable.ts');
    }
    return config;
  },
};

export default nextConfig;
