import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Content Security Policy (CSP) Directives
 * Disesuaikan khusus untuk kebutuhan Next.js 16, Supabase, Google Fonts, dan Google Maps Embed.
 */
const cspDirectives = [
  // 1. Fallback default: hanya izinkan resource dari origin aplikasi sendiri
  "default-src 'self'",

  // 2. Script: Izinkan self dan inline script Next.js; unsafe-eval HANYA untuk dev Turbopack/HMR
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,

  // 3. Stylesheet: Izinkan Tailwind CSS inline styles dan stylesheet Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  // 4. Gambar: Izinkan self, data URI, blob (image preview/crop), Supabase Storage, dan Unsplash
  "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",

  // 5. Font: Izinkan file font dari self, data URI, dan server Google Fonts (gstatic)
  "font-src 'self' data: https://fonts.gstatic.com",

  // 6. Network Connections: Izinkan REST API Supabase dan WebSocket Supabase Realtime
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",

  // 7. Frames: Izinkan penyematan iframe responsif Google Maps (PRD §10.11 / Keputusan #3)
  "frame-src 'self' https://www.google.com https://maps.google.com",

  // 8. Anti-Clickjacking: Melarang situs disematkan ke dalam iframe situs lain
  "frame-ancestors 'none'",

  // 9. Plugin Blocker: Mencegah eksekusi plugin lawas seperti Flash / Java Applet
  "object-src 'none'",

  // 10. Base URI: Batasi manipulasi tag <base> hanya ke domain origin sendiri
  "base-uri 'self'",

  // 11. Form Action: Mencegah form action diarahkan ke domain berbahaya pihak ketiga
  "form-action 'self'",

  // 12. HTTPS Upgrade: Otomatis upgrade koneksi ke HTTPS pada lingkungan production
  ...(isProd ? ["upgrade-insecure-requests"] : []),
];

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspDirectives.join('; '),
  },
  {
    // Mencegah sniffing MIME-type oleh browser
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Fallback proteksi clickjacking untuk browser lawas yang belum mendukung frame-ancestors
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Mencegah kebocoran parameter sensitif URL ketika berpindah ke domain lain
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Membatasi akses API browser/perangkat keras yang tidak relevan bagi CMS/katalog
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  ...(isProd
    ? [
        {
          // HSTS (HTTP Strict Transport Security): Wajib hanya di production
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aieziawkiguwyupgeoei.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
