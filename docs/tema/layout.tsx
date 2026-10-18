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
    'Website resmi dan katalog buku Frasa Klausa Media. Menghadirkan karya literasi berkualitas dan inspiratif.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontSerif.variable} antialiased min-h-screen`}>
        <AppProviders>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </AppProviders>
      </body>
    </html>
  );
}
