import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeBookHtml } from '../src/lib/sanitizer.ts';

describe('Sanitizer Suite (Fase 1 - XSS Prevention PRD §15.5)', () => {
  it('membersihkan tag <script> berbahaya dan payload di dalamnya', () => {
    const dirty = '<p>Buku ini bagus</p><script>alert("XSS Attack!");</script>';
    const clean = sanitizeBookHtml(dirty);
    assert.ok(!clean.includes('<script'), 'Output tidak boleh memuat tag <script');
    assert.ok(!clean.includes('alert('), 'Payload script berbahaya harus dihilangkan');
    assert.ok(clean.includes('<p>Buku ini bagus</p>'));
  });

  it('membersihkan atribut event handler inline (onerror, onload, onclick, onmouseover)', () => {
    const dirty = '<p onclick="alert(1)" onmouseover="stealCookies()">Teks</p>';
    const clean = sanitizeBookHtml(dirty);
    assert.ok(!clean.includes('onclick'), 'Output tidak boleh memuat atribut onclick');
    assert.ok(!clean.includes('onmouseover'), 'Output tidak boleh memuat atribut onmouseover');
    assert.ok(!clean.includes('alert(1)'));
    assert.ok(!clean.includes('stealCookies()'));
    assert.ok(clean.includes('<p>Teks</p>'));
  });

  it('membersihkan tautan javascript: URI pseudo-protocol', () => {
    const dirty = '<a href="javascript:alert(\'hack\')">Klik di sini</a>';
    const clean = sanitizeBookHtml(dirty);
    assert.ok(!clean.includes('javascript:'), 'Output tidak boleh memuat skema javascript:');
    assert.ok(clean.includes('Klik di sini'));
  });

  it('membersihkan tag iframe, style, dan embed', () => {
    const dirty =
      '<style>body { display: none; }</style><iframe src="https://attacker.com"></iframe><p>Konten</p>';
    const clean = sanitizeBookHtml(dirty);
    assert.ok(!clean.includes('<iframe'), 'Tag iframe harus dibuang');
    assert.ok(!clean.includes('<style'), 'Tag style harus dibuang');
    assert.ok(clean.includes('<p>Konten</p>'));
  });

  it('mempertahankan tag yang diizinkan (h2-h4, p, strong, em, b, i, ul, ol, li, blockquote, code)', () => {
    const dirty = `
      <h2>Sinopsis Cerita</h2>
      <h3>Bab 1</h3>
      <h4>Sub-bab</h4>
      <p>Ini adalah <strong>buku</strong> <em>sastra</em> pilihan.</p>
      <blockquote>Kutipan indah dari penulis.</blockquote>
      <ul>
        <li>Poin 1</li>
        <li>Poin 2</li>
      </ul>
      <code>console.log("hello")</code>
    `;
    const clean = sanitizeBookHtml(dirty);
    assert.ok(clean.includes('<h2>Sinopsis Cerita</h2>'));
    assert.ok(clean.includes('<h3>Bab 1</h3>'));
    assert.ok(clean.includes('<h4>Sub-bab</h4>'));
    assert.ok(clean.includes('<strong>buku</strong>'));
    assert.ok(clean.includes('<em>sastra</em>'));
    assert.ok(clean.includes('<blockquote>Kutipan indah dari penulis.</blockquote>'));
    assert.ok(clean.includes('<ul>'));
    assert.ok(clean.includes('<li>Poin 1</li>'));
    assert.ok(clean.includes('<code>console.log("hello")</code>'));
  });

  it('menyematkan rel="noopener noreferrer" pada tautan <a> dan membatasi target hanya _blank', () => {
    const dirty = '<a href="https://example.com" target="_blank">Tautan Luar</a>';
    const clean = sanitizeBookHtml(dirty);
    assert.ok(clean.includes('href="https://example.com"'));
    assert.ok(clean.includes('rel="noopener noreferrer"'), 'Tautan harus memiliki rel="noopener noreferrer"');
    assert.ok(clean.includes('target="_blank"'));
  });

  it('menolak target non-_blank pada tag <a>', () => {
    const dirty = '<a href="https://example.com" target="_parent">Tautan</a>';
    const clean = sanitizeBookHtml(dirty);
    assert.ok(!clean.includes('target="_parent"'), 'Target selain _blank harus dibuang');
    assert.ok(clean.includes('rel="noopener noreferrer"'));
  });

  it('membersihkan tag <img> dan atribut src sepenuhnya karena toolbar Tiptap tidak mendukung gambar inline', () => {
    const dirty = '<p>Buku</p><img src="https://evil.com/x.png" alt="evil" /><img src="x" onerror="alert(1)" />';
    const clean = sanitizeBookHtml(dirty);
    assert.ok(!clean.includes('<img'), 'Tag <img> harus sepenuhnya dibuang');
    assert.ok(!clean.includes('https://evil.com/x.png'));
    assert.ok(!clean.includes('onerror'));
    assert.equal(clean, '<p>Buku</p>');
  });

  it('menangani input null, undefined, dan string kosong secara elegan', () => {
    assert.equal(sanitizeBookHtml(''), '');
    assert.equal(sanitizeBookHtml(null), '');
    assert.equal(sanitizeBookHtml(undefined), '');
  });
});

