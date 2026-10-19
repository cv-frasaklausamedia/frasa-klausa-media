import sanitizeHtml from 'sanitize-html';

/**
 * Daftar tag HTML yang diizinkan untuk konten teks kaya Tiptap Buku (PRD §15.5).
 * Heading dibatasi pada level 2–4 agar konsisten dengan hierarki dokumen semantik.
 * Sesuai PRD dan aturan keamanan buku, tag img, script, style, iframe TIDAK diizinkan.
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
 * Atribut HTML yang diizinkan untuk buku: hanya a: href, target, rel.
 */
export const ALLOWED_HTML_ATTRS = {
  a: ['href', 'target', 'rel'],
};

/**
 * Protokol URI yang diizinkan pada atribut href (tanpa data: dan javascript:).
 */
export const ALLOWED_URI_SCHEMES = ['http', 'https', 'mailto'] as const;

/**
 * Konfigurasi sanitasi default buku menggunakan sanitize-html (pure js, no jsdom).
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
 * Sanitasi konten HTML buku sebelum disimpan ke database atau saat dirender ke DOM.
 * Menghilangkan seluruh vektor serangan XSS (<script>, onerror, onload, javascript: URI, iframe, dll.)
 */
export function sanitizeBookHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  const clean = sanitizeHtml(dirtyHtml, SANITIZE_CONFIG);
  return clean.trim();
}

// ============================================================================
// SANITASI KONTEN BLOG / POST (Dukungan Gambar Inline Aman & rel="noopener noreferrer")
// ============================================================================

/**
 * Daftar tag HTML yang diizinkan untuk artikel blog (termasuk tag img per PRD §6.2.F).
 */
export const ALLOWED_POST_HTML_TAGS = [
  ...ALLOWED_HTML_TAGS,
  'img',
] as const;

/**
 * Atribut yang diizinkan pada artikel blog.
 */
export const ALLOWED_POST_HTML_ATTRS = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
};

/**
 * Konfigurasi sanitasi artikel blog.
 */
const POST_SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [...ALLOWED_POST_HTML_TAGS],
  allowedAttributes: ALLOWED_POST_HTML_ATTRS,
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'iframe'],
  transformTags: {
    a: (tagName, attribs) => {
      const newAttribs = { ...attribs };
      // Paksa rel="noopener noreferrer" pada link
      newAttribs.rel = 'noopener noreferrer';

      if (newAttribs.target && newAttribs.target !== '_blank') {
        delete newAttribs.target;
      }

      return {
        tagName,
        attribs: newAttribs,
      };
    },
    img: (tagName, attribs) => {
      const newAttribs = { ...attribs };

      // Paksa lazy loading untuk performa Core Web Vitals
      newAttribs.loading = 'lazy';

      // Jika tidak ada alt, sediakan string kosong agar ramah aksesibilitas
      if (!newAttribs.alt) {
        newAttribs.alt = '';
      }

      return {
        tagName,
        attribs: newAttribs,
      };
    },
  },
};

/**
 * Sanitasi konten HTML artikel blog sebelum disimpan ke database atau saat dirender.
 * Mengizinkan gambar inline yang aman (http/https) sambil menangkal seluruh serangan XSS.
 */
export function sanitizePostHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  const clean = sanitizeHtml(dirtyHtml, POST_SANITIZE_CONFIG);
  return clean.trim();
}
