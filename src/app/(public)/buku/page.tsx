import { permanentRedirect } from 'next/navigation';

/**
 * Halaman alias /buku dialihkan secara permanen (HTTP 308) ke /katalog.
 * Mencegah kanibalisasi kata kunci dan duplicate content antara /buku dan /katalog.
 */
export default function BukuRedirectPage() {
  permanentRedirect('/katalog');
}
