import sanitizeHtml from 'sanitize-html';

/**
 * Daftar tag HTML yang diizinkan untuk konten teks kaya Tiptap (PRD §15.5).
 * Heading dibatasi pada level 2–4 agar konsisten dengan hierarki dokumen semantik.
 * Sesuai PRD dan aturan keamanan, tag img, script, style, iframe TIDAK diizinkan.
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
  'code',
  'pre',
  'br',
  'hr',
  'a',
] as const;

/**
 * Atribut HTML yang diizinkan: hanya a: href, target, rel.
 */
export const ALLOWED_HTML_ATTRS = {
  a: ['href', 'target', 'rel'],
};

/**
 * Protokol URI yang diizinkan pada atribut href (tanpa data: dan javascript:).
 */
export const ALLOWED_URI_SCHEMES = ['http', 'https', 'mailto'] as const;

/**
 * Konfigurasi sanitasi default menggunakan sanitize-html (pure js, no jsdom).
 */
const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [...ALLOWED_HTML_TAGS],
  allowedAttributes: ALLOWED_HTML_ATTRS,
  allowedSchemes: [...ALLOWED_URI_SCHEMES],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'iframe'],
  transformTags: {
    a: (tagName, attribs) => {
      const newAttribs = { ...attribs };

      // Paksa rel="noopener noreferrer"
      newAttribs.rel = 'noopener noreferrer';

      // Target hanya boleh "_blank", selain itu dibuang
      if (newAttribs.target && newAttribs.target !== '_blank') {
        delete newAttribs.target;
      }

      return {
        tagName,
        attribs: newAttribs,
      };
    },
  },
};

/**
 * Sanitasi konten HTML sebelum disimpan ke database atau saat dirender ke DOM.
 * Menghilangkan seluruh vektor serangan XSS (<script>, onerror, onload, javascript: URI, iframe, dll.)
 */
export function sanitizeBookHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  const clean = sanitizeHtml(dirtyHtml, SANITIZE_CONFIG);
  return clean.trim();
}
