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

export const metadata: Metadata = {
  title: 'Frasa Klausa Media — Penerbit Buku & Media Literasi',
  description:
    'Website resmi dan katalog buku Frasa Klausa Media. Mewujudkan Naskah Menjadi Buku.',
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
