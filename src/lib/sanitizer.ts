import DOMPurify from 'isomorphic-dompurify';

/**
 * Daftar tag HTML yang diizinkan untuk konten teks kaya Tiptap (PRD §15.5).
 * Heading dibatasi pada level 2–4 agar konsisten dengan hierarki dokumen semantik.
 */
export const ALLOWED_HTML_TAGS = [
  'h2',
  'h3',
  'h4',
  'p',
  'ul',
  'ol',
  'li',
  'blockquote',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'strike',
  'code',
  'pre',
  'br',
  'hr',
  'a',
] as const;

/**
 * Daftar atribut HTML yang diizinkan pada tag tertentu.
 */
export const ALLOWED_HTML_ATTRS = ['href', 'target', 'rel', 'class'] as const;

/**
 * Protokol URI yang diizinkan pada atribut href/src.
 */
export const ALLOWED_URI_SCHEMES = ['http', 'https', 'mailto'] as const;

/**
 * Konfigurasi sanitasi default menggunakan DOMPurify.
 */
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [...ALLOWED_HTML_TAGS],
  ALLOWED_ATTR: [...ALLOWED_HTML_ATTRS],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target', 'rel'],
  FORCE_BODY: true,
};

// Tambahkan hook DOMPurify untuk mengamankan seluruh tautan <a>
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    // 1. Batasi target hanya "_blank" jika ada
    const target = node.getAttribute('target');
    if (target && target !== '_blank') {
      node.removeAttribute('target');
    }

    // 2. Wajib sertakan rel="noopener noreferrer" pada tautan
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * Sanitasi konten HTML sebelum disimpan ke database atau saat dirender ke DOM.
 * Menghilangkan seluruh vektor serangan XSS (<script>, onerror, onload, javascript: URI, iframe, dll.)
 */
export function sanitizeBookHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  const clean = DOMPurify.sanitize(dirtyHtml, DOMPURIFY_CONFIG);
  return typeof clean === 'string' ? clean.trim() : '';
}
