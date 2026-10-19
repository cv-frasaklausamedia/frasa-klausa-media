import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Newsreader } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';
import { Toaster } from 'sonner';

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

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Frasa Klausa Media — Penerbit Buku & Media Literasi',
    template: '%s | Frasa Klausa Media',
  },
  description:
    'Website resmi dan katalog buku Frasa Klausa Media. Mewujudkan Naskah Menjadi Buku. Temukan novel, puisi, esai, dan karya sastra Indonesia berkualitas tinggi.',
  applicationName: 'Frasa Klausa Media',
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
    images: [
      {
        url: '/logo/logo-landscape.jpg',
        width: 1200,
        height: 630,
        alt: 'Frasa Klausa Media',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frasa Klausa Media — Penerbit Buku & Media Literasi',
    description:
      'Platform penerbitan literasi modern dan toko buku resmi Frasa Klausa Media. Mewujudkan Naskah Menjadi Buku.',
    images: ['/logo/logo-landscape.jpg'],
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
    icon: '/favicon.ico',
    apple: '/logo/logo.png',
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
        </AppProviders>
      </body>
    </html>
  );
}
