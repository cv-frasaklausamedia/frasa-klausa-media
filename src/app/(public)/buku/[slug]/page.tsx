import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Sparkles, User, Calendar, Hash, FileText, Building2 } from 'lucide-react';
import { getPublicBookBySlug, getRelatedBooks } from '@/lib/books/data-access';
import { BookGallery } from '@/components/public/book-gallery';
import { CheckoutActions } from '@/components/public/checkout-actions';
import { BookCard } from '@/components/public/book-card';
import { JsonLd } from '@/components/public/json-ld';
import { buildBookJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/json-ld';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/validations/book';
import { OFFICIAL_IDENTITY } from '@/constants';
import { getOpenGraphImage } from '@/lib/seo/open-graph';

import { Suspense } from 'react';
import { connection } from 'next/server';
import BookDetailLoading from './loading';

interface BookDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getPublicBookBySlug(slug);

  if (!book) {
    return {
      title: `Buku Tidak Ditemukan | ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
    };
  }

  const effectivePrice = book.price_promo && book.price_promo > 0 ? book.price_promo : book.price_regular;
  const title = book.seo_title || `${book.title} - ${book.author} | ${OFFICIAL_IDENTITY.COMPANY_NAME}`;
  const description =
    book.seo_description ||
    `Pesan buku ${book.title} karya ${book.author} seharga ${formatRupiah(effectivePrice)} terbitan ${book.publisher}.`;
  const image = getOpenGraphImage({ sourceUrl: book.cover_url, alt: book.title });

  return {
    title,
    description,
    alternates: {
      canonical: `/buku/${slug}`,
    },
    openGraph: {
      type: 'book',
      url: `/buku/${slug}`,
      title: `${book.title} — ${book.author}`,
      description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${book.title} — ${book.author}`,
      description,
      images: [image.url],
    },
  };
}

async function BookDetailContent({ params }: BookDetailPageProps) {
  await connection();
  const { slug } = await params;

  // Pertahanan Keamanan: getPublicBookBySlug secara ketat menolak buku non-publik (is_published = false)
  const book = await getPublicBookBySlug(slug);

  if (!book) {
    notFound();
  }

  // Rekomendasi Buku Terkait Hibrida (Manual -> fallback kategori otomatis)
  const relatedBooks = await getRelatedBooks(book.id, book.category_id, 4).catch((err) => {
    console.error('[BookDetailPage] Gagal memuat buku terkait:', err);
    return [];
  });

  const hasPromo =
    book.price_promo !== null &&
    book.price_promo !== undefined &&
    book.price_promo > 0 &&
    book.price_promo < book.price_regular;

  const discountPercent = hasPromo
    ? Math.round(((book.price_regular - (book.price_promo ?? 0)) / book.price_regular) * 100)
    : 0;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.frasaklausamedia.com';
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const bookUrl = `${cleanBaseUrl}/buku/${book.slug}`;
  const bookJsonLd = buildBookJsonLd(book, cleanBaseUrl);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Beranda', url: '/' },
      { name: 'Katalog', url: '/katalog' },
      { name: book.category_name, url: `/katalog?kategori=${encodeURIComponent(book.category_name)}` },
      { name: book.title, url: `/buku/${book.slug}` },
    ],
    cleanBaseUrl
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      <JsonLd data={bookJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* 1. Breadcrumb Navigasi */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">
          Beranda
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <Link href="/katalog" className="hover:text-foreground transition-colors">
          Katalog
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-foreground/80 font-medium">{book.category_name}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="font-semibold text-foreground truncate max-w-xs">{book.title}</span>
      </nav>

      {/* 2. Blok Utama: Galeri (Kiri) + Info & Checkout (Kanan) */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Kolom Kiri: Galeri Foto Buku Interaktif */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <BookGallery
              coverUrl={book.cover_url}
              title={book.title}
              gallery={book.gallery}
            />
          </div>
        </div>

        {/* Kolom Kanan: Rincian Buku & Checkout Multi-Kanal */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="space-y-2 border-b pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
                {book.category_name}
              </Badge>
              {book.is_featured && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Buku Unggulan
                </Badge>
              )}
              {hasPromo && discountPercent > 0 && (
                <Badge variant="destructive" className="text-xs font-bold">
                  Hemat {discountPercent}%
                </Badge>
              )}
            </div>

            {/* Heading Tunggal H1 */}
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground leading-tight pt-1">
              {book.title}
            </h1>

            <p className="text-base text-muted-foreground font-serif italic">
              Karya <span className="font-sans not-italic font-semibold text-foreground">{book.author}</span>
            </p>
          </div>

          {/* Perbandingan Harga Normal vs Promo */}
          <div className="flex items-baseline gap-3 rounded-xl bg-muted/30 p-4 border">
            {hasPromo ? (
              <>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Harga Spesial Promo</span>
                  <span className="text-3xl font-bold text-primary tracking-tight">
                    {formatRupiah(book.price_promo!)}
                  </span>
                </div>
                <div className="flex flex-col pl-4 border-l">
                  <span className="text-xs text-muted-foreground">Harga Normal</span>
                  <span className="text-base text-muted-foreground/70 line-through">
                    {formatRupiah(book.price_regular)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Harga Resmi</span>
                <span className="text-3xl font-bold text-foreground tracking-tight">
                  {formatRupiah(book.price_regular)}
                </span>
              </div>
            )}
          </div>

          {/* Checkout Multi-Kanal (WhatsApp, Shopee, Tokopedia) */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Opsi Pemesanan Langsung
            </span>
            <CheckoutActions
              title={book.title}
              priceRegular={book.price_regular}
              pricePromo={book.price_promo}
              whatsappNumber={book.whatsapp_number}
              whatsappTemplate={book.whatsapp_message_template}
              shopeeUrl={book.shopee_url}
              tokopediaUrl={book.tokopedia_url}
              bookUrl={bookUrl}
            />
          </div>

          {/* Tabel Spesifikasi Buku Terstruktur */}
          <div className="space-y-3 pt-4 border-t">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Spesifikasi Buku
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>Penulis</span>
                </div>
                <p className="font-semibold text-foreground truncate">{book.author}</p>
              </div>

              {book.editor && (
                <div className="rounded-lg border bg-card p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>Editor</span>
                  </div>
                  <p className="font-semibold text-foreground truncate">{book.editor}</p>
                </div>
              )}

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Penerbit</span>
                </div>
                <p className="font-semibold text-foreground truncate">{book.publisher}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Tahun Terbit</span>
                </div>
                <p className="font-semibold text-foreground">{book.publish_year}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Halaman</span>
                </div>
                <p className="font-semibold text-foreground">{book.page_count} hlm</p>
              </div>

              {book.isbn && (
                <div className="rounded-lg border bg-card p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    <span>ISBN</span>
                  </div>
                  <p className="font-semibold font-mono text-foreground">{book.isbn}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tentang Buku (HTML Tersanitasi & Tipografi Nyaman Prose) */}
      <div className="border-t pt-10 space-y-6">
        <h2 className="text-2xl font-serif font-bold text-foreground">
          Tentang Buku
        </h2>
        {book.description ? (
          <div
            className="prose prose-stone dark:prose-invert max-w-none text-foreground/90 leading-relaxed text-base"
            dangerouslySetInnerHTML={{ __html: book.description }}
          />
        ) : (
          <p className="text-sm italic text-muted-foreground">
            Deskripsi lengkap untuk buku ini belum dicantumkan.
          </p>
        )}
      </div>

      {/* 4. Rekomendasi Buku Terkait */}
      {relatedBooks.length > 0 && (
        <div className="border-t pt-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">
                Buku Terkait
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Karya lain dalam kategori yang sama atau direkomendasikan editor
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
              <Link href="/katalog">Katalog Lengkap</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {relatedBooks.map((relBook) => (
              <BookCard key={relBook.id} book={relBook} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookDetailPage({ params }: BookDetailPageProps) {
  return (
    <Suspense fallback={<BookDetailLoading />}>
      <BookDetailContent params={params} />
    </Suspense>
  );
}

