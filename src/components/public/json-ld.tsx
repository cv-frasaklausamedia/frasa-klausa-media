import * as React from 'react';
import { safeJsonLd } from '@/lib/seo/json-ld';

interface JsonLdProps {
  data: unknown;
}

/**
 * Server Component untuk menyematkan skrip Schema.org JSON-LD secara aman.
 * Seluruh payload di-escape untuk mencegah potensi serangan XSS injection.
 */
export function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLd(data),
      }}
    />
  );
}
