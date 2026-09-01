import type { NextConfig } from 'next';

/** Comma-separated hostnames, e.g. cdn.example.com,xyz.cloudfront.net */
function buildImageRemotePatterns(): NonNullable<
  NextConfig['images']
>['remotePatterns'] {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    // Local API / storage during development
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '7000',
      pathname: '/**',
    },
    {
      protocol: 'http',
      hostname: '127.0.0.1',
      port: '7000',
      pathname: '/**',
    },
    // Legacy listing photos still stored on Cloudinary
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      pathname: '/**',
    },
  ];

  const extraHosts = process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTS?.split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  for (const hostname of extraHosts ?? []) {
    patterns.push({
      protocol: 'https',
      hostname,
      pathname: '/**',
    });
  }

  return patterns;
}

const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7000'
).replace(/\/$/, '');

const config: NextConfig = {
  /*
   * Standalone output, so this is not deployable to exactly one host. The staff panel
   * holds the most privileged views in the estate; where it can run should be UZA's
   * decision, not a platform's.
   */
  output: 'standalone',

  // React Compiler (already enabled in this project)
  reactCompiler: true,

  /** Proxy API uploads so next/image can load them from the app origin (dev + prod). */
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },

  // Bundle only what's used from large icon/chart/UI packages
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'radix-ui'],
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: buildImageRemotePatterns(),
    // Dev: allow next/image to optimize remote API URLs when not proxied via /uploads.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
  },

  // Security & compression
  compress: true,
  poweredByHeader: false,

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default config;
