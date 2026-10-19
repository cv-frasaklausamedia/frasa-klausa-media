import { OFFICIAL_IDENTITY } from '../../constants/index.ts';
import type { BookDetail } from '@/lib/books/types';
import type { PostDetail } from '@/lib/posts/types';

/**
 * Sanitasi string JSON-LD agar aman disisipkan ke dalam tag <script>
 * Mencegah XSS melalui karakter HTML khusus (<, >, &).
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Membangun Schema.org "Book" untuk halaman detail buku
 */
export function buildBookJsonLd(book: BookDetail, baseUrl: string) {
  const effectivePrice =
    book.price_promo !== null &&
    book.price_promo !== undefined &&
    book.price_promo > 0 &&
    book.price_promo < book.price_regular
      ? book.price_promo
      : book.price_regular;

  const bookUrl = `${baseUrl}/buku/${book.slug}`;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    url: bookUrl,
    inLanguage: 'id',
    author: {
      '@type': 'Person',
      name: book.author,
    },
    publisher: {
      '@type': 'Organization',
      name: book.publisher || OFFICIAL_IDENTITY.COMPANY_NAME,
    },
    offers: {
      '@type': 'Offer',
      price: effectivePrice,
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
      url: bookUrl,
      seller: {
        '@type': 'Organization',
        name: OFFICIAL_IDENTITY.COMPANY_NAME,
      },
    },
  };

  if (book.isbn && book.isbn.trim() !== '') {
    schema.isbn = book.isbn.trim();
  }

  if (book.publish_year && book.publish_year > 0) {
    schema.datePublished = String(book.publish_year);
  }

  if (book.page_count && book.page_count > 0) {
    schema.numberOfPages = book.page_count;
  }

  if (book.cover_url) {
    schema.image = book.cover_url;
  }

  if (book.seo_description) {
    schema.description = book.seo_description;
  }

  return schema;
}

/**
 * Membangun Schema.org "BlogPosting" untuk artikel blog
 */
export function buildArticleJsonLd(post: PostDetail, baseUrl: string) {
  const articleUrl = `${baseUrl}/blog/${post.slug}`;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    url: articleUrl,
    inLanguage: 'id',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    author: [
      {
        '@type': 'Person',
        name: post.author_name || OFFICIAL_IDENTITY.COMPANY_NAME,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: OFFICIAL_IDENTITY.COMPANY_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo/logo.png`,
      },
    },
  };

  if (post.seo_description || post.excerpt) {
    schema.description = post.seo_description || post.excerpt;
  }

  if (post.cover_url) {
    schema.image = [post.cover_url];
  }

  if (post.published_at) {
    schema.datePublished = post.published_at;
  }

  schema.dateModified = post.updated_at || post.published_at || new Date().toISOString();

  return schema;
}

/**
 * Membangun Schema.org "Organization" untuk identitas beranda
 */
export function buildOrganizationJsonLd(baseUrl: string) {
  const socialLinks = [
    OFFICIAL_IDENTITY.SOCIAL_LINKS.INSTAGRAM,
    OFFICIAL_IDENTITY.SOCIAL_LINKS.TIKTOK,
    OFFICIAL_IDENTITY.SOCIAL_LINKS.FACEBOOK,
    OFFICIAL_IDENTITY.SOCIAL_LINKS.SHOPEE,
    OFFICIAL_IDENTITY.SOCIAL_LINKS.TOKOPEDIA,
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: OFFICIAL_IDENTITY.COMPANY_NAME,
    legalName: OFFICIAL_IDENTITY.LEGAL_NAME,
    url: baseUrl,
    logo: `${baseUrl}/logo/logo.png`,
    description: OFFICIAL_IDENTITY.TAGLINE,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${OFFICIAL_IDENTITY.WHATSAPP}`,
      contactType: 'customer service',
      availableLanguage: ['Indonesian'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: OFFICIAL_IDENTITY.ADDRESS,
      addressCountry: 'ID',
    },
    sameAs: socialLinks,
  };
}

/**
 * Membangun Schema.org "WebSite" untuk kotak pencarian mesin pencari
 */
export function buildWebSiteJsonLd(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: OFFICIAL_IDENTITY.COMPANY_NAME,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/katalog?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Membangun Schema.org "BreadcrumbList"
 */
export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[],
  baseUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}
