import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  getFallbackOpenGraphImage,
  getOpenGraphImage,
  isPublicSupabaseStorageUrl,
} from '../src/lib/seo/open-graph.ts';

function readJpegDimensions(buffer: Buffer): { width: number; height: number } {
  for (let index = 0; index < buffer.length - 9; index += 1) {
    if (buffer[index] !== 0xff || buffer[index + 1] < 0xc0 || buffer[index + 1] > 0xc3) {
      continue;
    }

    return {
      height: buffer.readUInt16BE(index + 5),
      width: buffer.readUInt16BE(index + 7),
    };
  }

  throw new Error('JPEG SOF marker tidak ditemukan.');
}

describe('Open Graph image helper', () => {
  const supabaseUrl = 'https://project-ref.supabase.co';
  const publicCoverUrl =
    'https://project-ref.supabase.co/storage/v1/object/public/books/covers/contoh-buku.jpg';

  test('memilih cover dari Storage Supabase public untuk konten yang memiliki gambar', () => {
    assert.equal(isPublicSupabaseStorageUrl(publicCoverUrl, supabaseUrl), true);

    const image = getOpenGraphImage({ sourceUrl: publicCoverUrl, alt: 'Contoh Buku' });

    assert.equal(image.url, publicCoverUrl);
    assert.equal(image.alt, 'Contoh Buku');
    assert.equal(image.width, undefined);
    assert.equal(image.height, undefined);
  });

  test('menolak signed URL, URL dari project lain, dan URL non-Supabase', () => {
    assert.equal(
      isPublicSupabaseStorageUrl(
        'https://project-ref.supabase.co/storage/v1/object/sign/books/covers/contoh-buku.jpg?token=secret',
        supabaseUrl
      ),
      false
    );
    assert.equal(
      isPublicSupabaseStorageUrl(
        'https://other-project.supabase.co/storage/v1/object/public/books/covers/contoh-buku.jpg',
        supabaseUrl
      ),
      false
    );
    assert.equal(isPublicSupabaseStorageUrl('https://example.com/cover.jpg', supabaseUrl), false);
  });

  test('menggunakan kartu fallback absolut berukuran WhatsApp ketika cover kosong atau tidak valid', () => {
    const fallback = getFallbackOpenGraphImage('Frasa Klausa Media', 'https://example.test');
    const invalidImage = getOpenGraphImage({ sourceUrl: 'https://example.com/cover.jpg', alt: 'Frasa Klausa Media' });

    assert.equal(fallback.url, 'https://example.test/og/frasa-klausa-media.jpg');
    assert.equal(fallback.alt, 'Frasa Klausa Media');
    assert.equal(fallback.width, 1200);
    assert.equal(fallback.height, 630);
    assert.equal(fallback.type, 'image/jpeg');
    assert.equal(invalidImage.url.endsWith('/og/frasa-klausa-media.jpg'), true);
  });

  test('menyediakan aset fallback JPEG 1200×630', () => {
    const assetPath = path.join(process.cwd(), 'public', 'og', 'frasa-klausa-media.jpg');
    const { width, height } = readJpegDimensions(fs.readFileSync(assetPath));

    assert.deepEqual({ width, height }, { width: 1200, height: 630 });
  });
});
