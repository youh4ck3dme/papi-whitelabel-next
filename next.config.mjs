import withPWAInit from 'next-pwa';
import defaultRuntimeCaching from 'next-pwa/cache.js';

const runtimeCaching = [
  {
    urlPattern: ({ url, request }) =>
      request.method === 'GET' &&
      self.origin === url.origin &&
      (url.pathname === '/api/apps' || url.pathname.startsWith('/api/apps/')),
    handler: 'StaleWhileRevalidate',
    method: 'GET',
    options: {
      cacheName: 'apps-list-swr',
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 10 * 60,
      },
      cacheableResponse: {
        statuses: [200],
      },
    },
  },
  ...defaultRuntimeCaching.map((entry) => {
    if (entry.urlPattern instanceof RegExp && entry.urlPattern.toString() === '/\\.(?:json|xml|csv)$/i') {
      return {
        ...entry,
        handler: 'StaleWhileRevalidate',
        options: {
          ...entry.options,
          cacheName: 'static-data-assets-swr',
        },
      };
    }

    return entry;
  }),
];

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default withPWA(nextConfig);
