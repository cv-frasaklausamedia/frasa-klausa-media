import { sanitizeBookHtml } from '@/lib/sanitizer';

interface SanitizedHtmlProps {
  html: string | null | undefined;
  className?: string;
}

/**
 * Komponen penyaji HTML yang telah tersanitasi aman di server.
 * Mencegah XSS (PRD §15.5) dan menerapkan gaya tipografi prose.
 */
export function SanitizedHtml({ html, className }: SanitizedHtmlProps) {
  if (!html || typeof html !== 'string' || html.trim() === '') {
    return null;
  }

  // Sanitasi ulang sebelum dirender ke DOM untuk defense-in-depth
  const cleanHtml = sanitizeBookHtml(html);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
