import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Newsreader } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';
import { Toaster } from 'sonner';
import { getFallbackOpenGraphImage } from '@/lib/seo/open-graph';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontSerif = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['normal', 'italic'],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frasaklausamedia.com';
const defaultOpenGraphImage = getFallbackOpenGraphImage('Frasa Klausa Media', appUrl);

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Frasa Klausa Media — Penerbit Buku & Media Literasi',
    template: '%s | Frasa Klausa Media',
  },
  description:
    'Website resmi dan katalog buku Frasa Klausa Media. Mewujudkan Naskah Menjadi Buku. Temukan novel, puisi, esai, dan karya sastra Indonesia berkualitas tinggi.',
  applicationName: 'Frasa Klausa Media',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Frasa Klausa',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.webmanifest',
  authors: [{ name: 'Frasa Klausa Media', url: appUrl }],
  creator: 'Frasa Klausa Media',
  publisher: 'Frasa Klausa Media',
  keywords: [
    'penerbit buku',
    'penerbitan literasi',
    'buku sastra',
    'novel indonesia',
    'antologi puisi',
    'beli buku online',
    'frasa klausa media',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: appUrl,
    siteName: 'Frasa Klausa Media',
    title: 'Frasa Klausa Media — Penerbit Buku & Media Literasi',
    description:
      'Platform penerbitan literasi modern dan toko buku resmi Frasa Klausa Media. Mewujudkan Naskah Menjadi Buku.',
    images: [defaultOpenGraphImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frasa Klausa Media — Penerbit Buku & Media Literasi',
    description:
      'Platform penerbitan literasi modern dan toko buku resmi Frasa Klausa Media. Mewujudkan Naskah Menjadi Buku.',
    images: [defaultOpenGraphImage.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|; )sidebar_state=([^;]*)/);if(m&&decodeURIComponent(m[1])==='false'){document.documentElement.dataset.sidebar='collapsed';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${fontSans.variable} ${fontSerif.variable} antialiased min-h-screen bg-background text-foreground`}>
        <AppProviders>
          {children}
          <Toaster richColors position="top-right" closeButton />
          <ServiceWorkerRegister />
        </AppProviders>
      </body>
    </html>
  );
}
