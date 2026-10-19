import { sanitizeBookHtml, sanitizePostHtml } from '@/lib/sanitizer';

interface SanitizedHtmlProps {
  html: string | null | undefined;
  className?: string;
  mode?: 'book' | 'post';
}

/**
 * Komponen penyaji HTML yang telah tersanitasi aman di server.
 * Mencegah XSS (PRD §15.5) dan menerapkan gaya tipografi prose.
 * Mendukung mode 'book' (tanpa gambar inline) dan mode 'post' (mengizinkan gambar inline tersanitasi).
 */
export function SanitizedHtml({ html, className, mode = 'book' }: SanitizedHtmlProps) {
  if (!html || typeof html !== 'string' || html.trim() === '') {
    return null;
  }

  // Sanitasi ulang sebelum dirender ke DOM untuk defense-in-depth
  const cleanHtml = mode === 'post' ? sanitizePostHtml(html) : sanitizeBookHtml(html);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
