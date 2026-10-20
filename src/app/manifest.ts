import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Frasa Klausa Media',
    short_name: 'Frasa Klausa',
    description:
      'Website resmi dan katalog buku Frasa Klausa Media. Mewujudkan Naskah Menjadi Buku. Temukan novel, puisi, esai, dan karya sastra Indonesia berkualitas tinggi.',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#9a3412',
    orientation: 'portrait-primary',
    lang: 'id',
    categories: ['books', 'publishing', 'education', 'shopping'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo/logo.jpg',
        sizes: '2048x2048',
        type: 'image/jpeg',
      },
    ],
  };
}
