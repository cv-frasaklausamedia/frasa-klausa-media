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
 * Membersihkan string HTML menjadi teks murni agar ramah mesin pencari
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Membangun Schema.org "Book" untuk halaman detail buku
 * Mendukung Rich Results Buku Google secara lengkap
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
  const cleanSynopsis = book.seo_description || stripHtml(book.description) || undefined;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    url: bookUrl,
    inLanguage: 'id',
    bookFormat: 'https://schema.org/Paperback',
    author: {
      '@type': 'Person',
      name: book.author,
      jobTitle: 'Penulis',
      ...(book.author_bio ? { description: book.author_bio } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: book.publisher || OFFICIAL_IDENTITY.COMPANY_NAME,
      legalName: OFFICIAL_IDENTITY.LEGAL_NAME,
      url: baseUrl,
      logo: `${baseUrl}/logo/logo.jpg`,
    },
    offers: {
      '@type': 'Offer',
      price: effectivePrice,
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: bookUrl,
      seller: {
        '@type': 'Organization',
        name: OFFICIAL_IDENTITY.COMPANY_NAME,
        url: baseUrl,
      },
    },
  };

  if (cleanSynopsis) {
    schema.description = cleanSynopsis;
  }

  if (book.category_name) {
    schema.genre = book.category_name;
  }

  if (book.editor && book.editor.trim() !== '') {
    schema.editor = {
      '@type': 'Person',
      name: book.editor.trim(),
      jobTitle: 'Editor',
    };
  }

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

  return schema;
}

/**
 * Membangun Schema.org "ProfessionalService" & "OfferCatalog" untuk Layanan Penerbitan
 */
export function buildPublishingServicesJsonLd(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: `${OFFICIAL_IDENTITY.COMPANY_NAME} — Layanan Penerbitan Buku & Media Literasi`,
    legalName: OFFICIAL_IDENTITY.LEGAL_NAME,
    url: `${baseUrl}/tentang-kami#layanan`,
    telephone: `+${OFFICIAL_IDENTITY.WHATSAPP}`,
    image: `${baseUrl}/logo/logo.jpg`,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: OFFICIAL_IDENTITY.ADDRESS,
      addressCountry: 'ID',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Indonesia',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Layanan Penerbitan & Ekosistem Redaksi Frasa Klausa Media',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Penerbitan Buku Ber-ISBN & QRCBN Resmi',
            description:
              'Layanan legalitas naskah resmi ke Perpustakaan Nasional RI (Perpusnas), pengadaan barcode standar internasional, hingga deposit karya cetak nasional.',
            serviceType: 'Penerbitan Buku Ber-ISBN',
            provider: {
              '@type': 'Organization',
              name: OFFICIAL_IDENTITY.COMPANY_NAME,
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Editorial & Penyuntingan Naskah Profesional',
            description:
              'Penyuntingan substantif (developmental editing), copyediting kaidah EYD V & KBBI, serta proofreading akhir bebas salah ketik.',
            serviceType: 'Penyuntingan Naskah Buku',
            provider: {
              '@type': 'Organization',
              name: OFFICIAL_IDENTITY.COMPANY_NAME,
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Desain Sampul Artistik & Tata Letak Interior Buku (Typesetting)',
            description:
              'Perancangan visual sampul artistik eksklusif serta penataan tata letak interior (typesetting InDesign) ergonomis dan ramah mata.',
            serviceType: 'Desain Cover & Layout Buku',
            provider: {
              '@type': 'Organization',
              name: OFFICIAL_IDENTITY.COMPANY_NAME,
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Percetakan POD & Cetak Massal',
            description:
              'Layanan cetak presisi material Bookpaper/HVS, softcover/hardcover, laminasi doff/glossy/emboss, mulai dari POD 10 eks hingga cetak massal offset.',
            serviceType: 'Percetakan Buku Berkualitas',
            provider: {
              '@type': 'Organization',
              name: OFFICIAL_IDENTITY.COMPANY_NAME,
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Konversi E-Book & Distribusi Multi-Platform',
            description:
              'Konversi format e-book EPUB & PDF Interaktif untuk Google Play Books serta pemasaran fisik di etalase resmi Shopee dan Tokopedia.',
            serviceType: 'Distribusi E-Book & Penjualan Buku',
            provider: {
              '@type': 'Organization',
              name: OFFICIAL_IDENTITY.COMPANY_NAME,
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Ghostwriting, Biografi & Buku Lembaga',
            description:
              'Pendampingan penulisan biografi tokoh, memoar, buku profil sekolah/perusahaan, hingga konversi tesis/disertasi menjadi buku populer.',
            serviceType: 'Jasa Penulisan Buku & Biografi',
            provider: {
              '@type': 'Organization',
              name: OFFICIAL_IDENTITY.COMPANY_NAME,
            },
          },
        },
      ],
    },
  };
}

/**
 * Membangun Schema.org "AboutPage" untuk halaman Tentang Kami
 */
export function buildAboutPageJsonLd(
  baseUrl: string,
  about?: { title?: string; subtitle?: string; vision?: string; history?: string }
) {
  const pageUrl = `${baseUrl}/tentang-kami`;
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: about?.title || `Tentang ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
    description:
      about?.subtitle ||
      'Mengenal visi, misi, sejarah, nilai, dan layanan penerbitan buku profesional CV. Frasa Klausa Media.',
    url: pageUrl,
    inLanguage: 'id',
    mainEntity: {
      '@type': 'Organization',
      name: OFFICIAL_IDENTITY.COMPANY_NAME,
      legalName: OFFICIAL_IDENTITY.LEGAL_NAME,
      url: baseUrl,
      logo: `${baseUrl}/logo/logo.jpg`,
      description: OFFICIAL_IDENTITY.TAGLINE,
    },
  };
}

/**
 * Membangun Schema.org "ItemList" untuk halaman katalog, kategori, dan daftar blog
 */
export function buildItemListJsonLd(
  items: Array<{ name: string; url: string; image?: string | null; author?: string }>,
  baseUrl: string,
  listName: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item, idx) => {
      const fullUrl = item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`;
      return {
        '@type': 'ListItem',
        position: idx + 1,
        url: fullUrl,
        name: item.name,
        ...(item.image ? { image: item.image } : {}),
        ...(item.author
          ? {
              item: {
                '@type': 'Book',
                name: item.name,
                url: fullUrl,
                author: {
                  '@type': 'Person',
                  name: item.author,
                },
                ...(item.image ? { image: item.image } : {}),
              },
            }
          : {}),
      };
    }),
  };
}

/**
 * Membangun Schema.org "BlogPosting" untuk artikel blog
 */
export function buildArticleJsonLd(post: PostDetail, baseUrl: string) {
  const articleUrl = `${baseUrl}/blog/${post.slug}`;
  const cleanDescription = post.seo_description || post.excerpt || stripHtml(post.content).slice(0, 160);

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
        jobTitle: 'Penulis Artikel',
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: OFFICIAL_IDENTITY.COMPANY_NAME,
      legalName: OFFICIAL_IDENTITY.LEGAL_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo/logo.jpg`,
      },
    },
  };

  if (cleanDescription) {
    schema.description = cleanDescription;
  }

  if (post.category?.name) {
    schema.articleSection = post.category.name;
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
    logo: `${baseUrl}/logo/logo.jpg`,
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
