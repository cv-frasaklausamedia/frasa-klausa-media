import test from 'node:test';
import assert from 'node:assert/strict';

import { sanitizePostHtml, sanitizeBookHtml } from '../src/lib/sanitizer.ts';

test('Post Sanitizer Suite (Tahap 6 — XSS Prevention PRD §15.5)', async (t) => {
  await t.test('1. Membersihkan tag <script> berbahaya dan payload di dalamnya', () => {
    const dirty = '<p>Halo</p><script>alert("XSS")</script><p>Dunia</p>';
    const clean = sanitizePostHtml(dirty);
    assert.equal(clean.includes('<script>'), false);
    assert.equal(clean.includes('alert('), false);
    assert.equal(clean.includes('<p>Halo</p>'), true);
    assert.equal(clean.includes('<p>Dunia</p>'), true);
  });

  await t.test('2. Membersihkan atribut event handler inline (onerror, onload, onclick, onmouseover)', () => {
    const dirty = '<img src="https://example.com/foto.jpg" onerror="alert(1)" onload="alert(2)" />';
    const clean = sanitizePostHtml(dirty);
    assert.equal(clean.includes('onerror'), false);
    assert.equal(clean.includes('onload'), false);
    assert.equal(clean.includes('alert'), false);
    assert.equal(clean.includes('src="https://example.com/foto.jpg"'), true);
  });

  await t.test('3. Menolak dan menetralisasi skema berbahaya javascript: dan data: pada link dan gambar', () => {
    const dirtyLink = '<a href="javascript:alert(1)">Klik Saya</a>';
    const cleanLink = sanitizePostHtml(dirtyLink);
    assert.equal(cleanLink.includes('javascript:'), false);

    const dirtyDataImg = '<img src="data:image/svg+xml;base64,PHN2Zy9vbmxvYWQ9YWxlcnQoMSk+" />';
    const cleanImg = sanitizePostHtml(dirtyDataImg);
    assert.equal(cleanImg.includes('data:'), false);
    assert.equal(cleanImg.includes('src='), false);
  });

  await t.test('4. Mengizinkan dan memvalidasi link dengan skema https, http, dan mailto', () => {
    const dirty = `
      <p><a href="https://frasaklausamedia.com">Website Resmi</a></p>
      <p><a href="mailto:redaksi@frasaklausamedia.com">Kirim Naskah</a></p>
    `;
    const clean = sanitizePostHtml(dirty);
    assert.equal(clean.includes('href="https://frasaklausamedia.com"'), true);
    assert.equal(clean.includes('href="mailto:redaksi@frasaklausamedia.com"'), true);
    // Memastikan disematkan rel="noopener noreferrer"
    assert.equal(clean.includes('rel="noopener noreferrer"'), true);
  });

  await t.test('5. Mengizinkan tag <img> dan menyematkan loading="lazy" secara otomatis', () => {
    const dirty = '<p>Berikut ilustrasi:</p><img src="https://example.com/gambar.webp" alt="Ilustrasi Buku" />';
    const clean = sanitizePostHtml(dirty);
    assert.equal(clean.includes('<img'), true);
    assert.equal(clean.includes('src="https://example.com/gambar.webp"'), true);
    assert.equal(clean.includes('alt="Ilustrasi Buku"'), true);
    assert.equal(clean.includes('loading="lazy"'), true);
  });

  await t.test('6. Mempertahankan format teks kaya (h2-h4, p, strong, em, blockquote, code, ul, ol, li)', () => {
    const dirty = `
      <h2>Judul Artikel</h2>
      <p>Paragraf dengan <strong>tebal</strong> dan <em>miring</em> serta <code>kode inline</code>.</p>
      <blockquote>Kutipan sastra berbobot.</blockquote>
      <ul><li>Poin satu</li><li>Poin dua</li></ul>
    `;
    const clean = sanitizePostHtml(dirty);
    assert.equal(clean.includes('<h2>Judul Artikel</h2>'), true);
    assert.equal(clean.includes('<strong>tebal</strong>'), true);
    assert.equal(clean.includes('<blockquote>Kutipan sastra berbobot.</blockquote>'), true);
    assert.equal(clean.includes('<ul>'), true);
    assert.equal(clean.includes('<li>Poin satu</li>'), true);
  });

  await t.test('7. Menjaga isolasi: sanitizeBookHtml tetap membersihkan tag <img> (tidak ada regresi)', () => {
    const dirty = '<p>Buku</p><img src="https://example.com/cover.jpg" /><p>Keterangan</p>';
    const cleanBook = sanitizeBookHtml(dirty);
    // Buku TIDAK mengizinkan gambar inline pada deskripsinya
    assert.equal(cleanBook.includes('<img'), false);
    assert.equal(cleanBook.includes('src='), false);
    assert.equal(cleanBook.includes('<p>Buku</p>'), true);
  });

  await t.test('8. Menangani input null, undefined, dan string kosong secara aman', () => {
    assert.equal(sanitizePostHtml(null), '');
    assert.equal(sanitizePostHtml(undefined), '');
    assert.equal(sanitizePostHtml('   '), '');
  });
});
