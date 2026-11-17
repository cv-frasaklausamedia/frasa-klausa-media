import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  Target,
  Compass,
  Award,
  CheckCircle2,
  ArrowRight,
  Mail,
  ChevronRight,
  Feather,
  Printer,
  Share2,
  FileEdit,
  GraduationCap,
  Check,
  MessageSquare,
  Layers,
} from 'lucide-react';

import { getSiteContent } from '@/lib/site-content/data-access';
import { sanitizeSiteNarrativeHtml } from '@/lib/sanitizer';
import { OFFICIAL_IDENTITY } from '@/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/components/public/json-ld';
import {
  buildAboutPageJsonLd,
  buildPublishingServicesJsonLd,
  buildBreadcrumbJsonLd,
} from '@/lib/seo/json-ld';
import AboutLoadingFallback from './loading';
import { getFallbackOpenGraphImage } from '@/lib/seo/open-graph';

const openGraphImage = getFallbackOpenGraphImage('Tentang Frasa Klausa Media');

export const metadata: Metadata = {
  title: `Tentang Kami | ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
  description:
    'Mengenal visi, misi, sejarah, nilai, dan layanan penerbitan buku profesional CV. Frasa Klausa Media — Mewujudkan naskah bermutu menjadi karya nyata bagi kemajuan literasi bangsa.',
  alternates: {
    canonical: '/tentang-kami',
  },
  keywords: [
    'penerbit buku indonesia',
    'jasa penerbitan buku ber-isbn',
    'penerbit buku indie terpercaya',
    'jasa cetak buku pod',
    'jasa layout naskah buku',
    'jasa edit naskah novel puisi',
    'terbitkan buku ber-isbn',
    'penerbit frasa klausa media',
    'cv frasa klausa media',
    'jasa ghostwriter biografi',
    'konversi e-book google play books',
    'layanan penerbitan naskah lengkap',
  ],
  openGraph: {
    type: 'website',
    url: '/tentang-kami',
    title: `Tentang Kami | ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
    description:
      'Mengenal visi, misi, sejarah, nilai, dan layanan penerbitan buku profesional CV. Frasa Klausa Media — Mewujudkan naskah bermutu menjadi karya nyata bagi kemajuan literasi bangsa.',
    images: [openGraphImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Tentang Kami | ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
    description:
      'Mengenal visi, misi, sejarah, nilai, dan layanan penerbitan buku profesional CV. Frasa Klausa Media — Mewujudkan naskah bermutu menjadi karya nyata bagi kemajuan literasi bangsa.',
    images: [openGraphImage.url],
  },
};

interface ServiceItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

const PUBLISHING_SERVICES: ServiceItem[] = [
  {
    id: 'penerbitan-isbn',
    title: 'Penerbitan Ber-ISBN & QRCBN Resmi',
    badge: 'Legalitas Resmi',
    description:
      'Fasilitas pengurusan legalitas naskah resmi ke Perpustakaan Nasional RI (Perpusnas), pengadaan barcode standar internasional, hingga serah simpan deposit karya cetak.',
    icon: BookOpen,
    features: [
      'Pendaftaran ISBN & QRCBN resmi Perpusnas RI',
      'Pilihan Self-Publishing atau Jalur Kurasi Redaksi',
      'Hak cipta karya 100% tetap berada di tangan penulis',
      'Pengurusan deposit perpustakaan nasional & daerah',
    ],
  },
  {
    id: 'editorial-naskah',
    title: 'Editorial & Penyuntingan Profesional',
    badge: 'Kualitas Redaksi',
    description:
      'Penyuntingan berjenjang oleh tim editor bersertifikat untuk menyempurnakan struktur cerita, keindahan gaya bahasa, ketepatan diksi, serta kepatuhan kaidah ejaan.',
    icon: FileEdit,
    features: [
      'Penyuntingan substantif (Developmental & Line Editing)',
      'Copyediting sesuai kaidah baku EYD Edisi V & KBBI',
      'Proofreading akhir teliti bebas tipo (typo-free guarantee)',
      'Lembar catatan evaluasi naskah menyeluruh untuk penulis',
    ],
  },
  {
    id: 'desain-tata-letak',
    title: 'Desain Sampul & Tata Letak Interior',
    badge: 'Visual Artistik',
    description:
      'Visual sampul buku dirancang eksklusif dan estetik sesuai target pembaca serta penataan interior (typesetting) ergonomis yang memanjakan mata pembaca.',
    icon: Feather,
    features: [
      'Desain cover artistik (depan, punggung, dan belakang)',
      'Tata letak interior buku profesional (Adobe InDesign)',
      'Tipografi proporsional dengan margin ramah baca',
      'Paket materi 3D mockup untuk promosi & prapemesanan',
    ],
  },
  {
    id: 'percetakan-pod',
    title: 'Percetakan POD & Cetak Massal',
    badge: 'Fleksibel',
    description:
      'Kualitas cetak presisi menggunakan teknologi modern. Melayani kuantitas fleksibel mulai dari Print on Demand (POD skala 10–50 eks) hingga ribuan eksemplar sistem offset.',
    icon: Printer,
    features: [
      'Pilihan kertas Bookpaper impor ramah mata & HVS premium',
      'Finishing Softcover & Hardcover eksklusif',
      'Sentuhan laminasi Doff/Glossy, Emboss, & Spot UV',
      'Proses Quality Control ketat sebelum buku dikirim',
    ],
  },
  {
    id: 'distribusi-ebook',
    title: 'Konversi E-Book & Distribusi Multi-Kanal',
    badge: 'Multi-Platform',
    description:
      'Perluas jangkauan pembaca lintas batas melalui konversi naskah digital berstandar industri serta pemasaran buku fisik di gerai marketplace resmi Frasa Klausa Media.',
    icon: Share2,
    features: [
      'Konversi e-book ke format EPUB & PDF Interaktif',
      'Distribusi digital ke Google Play Books & Gramedia Digital',
      'Listing dan etalase resmi di Shopee & Tokopedia',
      'Laporan penjualan berkala serta transparansi royalti',
    ],
  },
  {
    id: 'ghostwriting-biografi',
    title: 'Ghostwriting, Biografi & Buku Lembaga',
    badge: 'Layanan Khusus',
    description:
      'Pendampingan kepenulisan komprehensif bagi tokoh, akademisi, dan institusi yang ingin mengabadikan rekam jejak, biografi inspiratif, atau konversi karya riset.',
    icon: GraduationCap,
    features: [
      'Wawancara mendalam & penelusuran fakta narasi',
      'Penyusunan kerangka hingga draf utuh siap terbit',
      'Penyusunan buku profil lembaga, sekolah, & CSR korporasi',
      'Konversi tesis, disertasi, & skripsi menjadi buku populer',
    ],
  },
];

const PUBLISHING_STEPS = [
  {
    step: '01',
    title: 'Kirim Draf Naskah',
    description:
      'Kirim naskah Anda dalam format dokumen digital melalui email atau WhatsApp redaksi untuk kami pelajari kelayakan teknis dan genre karyanya.',
  },
  {
    step: '02',
    title: 'Penyuntingan & Tata Visual',
    description:
      'Naskah melalui proses editing mendalam, penataan tata letak interior, serta perancangan desain sampul bersama tim kreatif kami.',
  },
  {
    step: '03',
    title: 'Legalisasi & Cetak Perdana',
    description:
      'Pengurusan nomor ISBN/QRCBN resmi Perpustakaan Nasional RI, pengujian dummy book, hingga proses produksi cetak massal/POD.',
  },
  {
    step: '04',
    title: 'Terbit & Distribusi Luas',
    description:
      'Buku resmi terbit, dikirimkan langsung ke alamat Anda, serta siap didistribusikan ke etalase online untuk menyapa pembaca luas.',
  },
];

async function AboutContent() {
  await connection();
  const about = await getSiteContent('about');

  const sanitizedHistory = sanitizeSiteNarrativeHtml(about.history);

  const defaultWaMessage =
    'Halo Redaksi CV. Frasa Klausa Media, saya ingin konsultasi mengenai penerbitan naskah buku.';
  const defaultWaUrl = `https://wa.me/${OFFICIAL_IDENTITY.WHATSAPP}?text=${encodeURIComponent(
    defaultWaMessage
  )}`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frasaklausamedia.com';
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  const aboutJsonLd = buildAboutPageJsonLd(cleanBaseUrl, about);
  const servicesJsonLd = buildPublishingServicesJsonLd(cleanBaseUrl);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Beranda', url: '/' },
      { name: 'Tentang Kami & Layanan', url: '/tentang-kami' },
    ],
    cleanBaseUrl
  );

  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-16">
      <JsonLd data={aboutJsonLd} />
      <JsonLd data={servicesJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* 1. Hero Header Section - Edge-to-Edge Gradient Strip */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/40 via-background to-background py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb Navigasi */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-foreground transition-colors">
              Beranda
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold text-foreground">Tentang Kami</span>
          </nav>

          {/* Teks Hero */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 text-xs border-primary/30 text-primary shadow-2xs inline-flex"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Mengenal Penerbit
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-foreground leading-[1.15]">
              {about.title || 'Tentang Frasa Klausa Media'}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed">
              &ldquo;{about.subtitle || 'Mewujudkan Naskah Menjadi Buku'}&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Konten Utama max-w-7xl */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-20 w-full">
        {/* 2. Sejarah Penerbit */}
        <section className="rounded-2xl border bg-card text-card-foreground p-6 sm:p-10 lg:p-12 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 text-primary text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="h-4 w-4" />
            Sejarah & Komitmen Kami
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            Perjalanan Menghidupkan Gagasan
          </h2>

          {sanitizedHistory ? (
            <div
              className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-base sm:text-lg"
              dangerouslySetInnerHTML={{ __html: sanitizedHistory }}
            />
          ) : (
            <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
              Frasa Klausa Media didirikan dengan dedikasi untuk memperkaya khazanah literasi di Indonesia. Berawal dari komunitas pecinta sastra dan editor independen, kami percaya bahwa setiap gagasan yang ditulis dengan ketulusan berhak menemukan pembaca setianya melalui proses penerbitan yang profesional, apik, dan berintegritas.
            </p>
          )}
        </section>

        {/* 3. Visi & Misi */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Kartu Visi */}
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-muted/20 p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
                <Compass className="h-4 w-4" />
                Visi Kami
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                Arah & Cita-Cita
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
                {about.vision ||
                  'Menjadi penerbit independen rujukan di Indonesia yang melahirkan karya-karya bermutu, menginspirasi akal budi, dan memajukan peradaban literasi bangsa.'}
              </p>
            </div>

            <div className="pt-4 border-t flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-serif italic">
              <span>&ldquo;Narasi terbaik untuk masa depan bangsa.&rdquo;</span>
            </div>
          </div>

          {/* Kartu Misi */}
          <div className="rounded-2xl border bg-card p-6 sm:p-8 lg:p-10 shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
                <Target className="h-4 w-4" />
                Misi Penerbit
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                Langkah Nyata Kami
              </h2>

              <div className="space-y-3.5">
                {about.mission && about.mission.length > 0 ? (
                  about.mission.map((misi, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm sm:text-base text-foreground/90">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{misi}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Mendampingi penulis dari kurasi naskah hingga distribusi karya dengan standar kualitas terbaik.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Nilai-Nilai Utama (Values) */}
        {about.values && about.values.length > 0 && (
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-primary text-xs font-semibold uppercase tracking-wider">
                <Award className="h-3.5 w-3.5" />
                Nilai Budaya
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                Prinsip yang Kami Junjung
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
                Landasan integritas dalam setiap buku yang kami kurasi, terbitkan, dan antarkan ke tangan pembaca.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {about.values.map((val, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border bg-card p-6 sm:p-8 shadow-2xs space-y-3 hover:border-primary/40 hover:shadow-xs transition-all"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    0{idx + 1}
                  </div>
                  <h3 className="font-serif font-bold text-lg text-foreground">
                    {val.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {val.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 5. SECTION LAYANAN & EKOSISTEM PENERBITAN (BARU)             */}
        {/* ============================================================ */}
        <section id="layanan" className="space-y-12 sm:space-y-16 scroll-mt-20">
          {/* Header Section Layanan */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 text-xs border-primary/30 text-primary shadow-2xs inline-flex"
            >
              <Layers className="h-3.5 w-3.5" />
              Layanan & Ekosistem Penerbitan
            </Badge>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground leading-tight">
              Solusi Komprehensif Menerbitkan Karya Anda
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Dari draf gagasan awal hingga buku resmi ber-ISBN yang beredar luas, CV. Frasa Klausa Media menyediakan pendampingan profesional terpadu bagi penulis, akademisi, dan institusi.
            </p>
          </div>

          {/* Grid 6 Kartu Layanan */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {PUBLISHING_SERVICES.map((service) => {
              const IconComp = service.icon;
              const waUrl = `https://wa.me/${OFFICIAL_IDENTITY.WHATSAPP}?text=${encodeURIComponent(
                `Halo Redaksi CV. Frasa Klausa Media, saya ingin konsultasi mengenai layanan: ${service.title}.`
              )}`;

              return (
                <div
                  key={service.id}
                  className="group rounded-2xl border bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-primary/40 hover:shadow-md transition-all duration-200"
                >
                  <div className="space-y-4">
                    {/* Header Kartu: Ikon & Badge */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform duration-200">
                        <IconComp className="h-6 w-6" />
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-normal px-2 py-0.5 bg-muted text-muted-foreground border"
                      >
                        {service.badge}
                      </Badge>
                    </div>

                    {/* Judul & Deskripsi */}
                    <div className="space-y-2">
                      <h3 className="font-serif font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    {/* Fitur Utama */}
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                        Fitur Termasuk:
                      </p>
                      <ul className="space-y-2">
                        {service.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2.5 text-xs text-foreground/85">
                            <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="leading-snug">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Tombol Aksi Konsultasi Layanan */}
                  <div className="pt-4 border-t">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full justify-between text-xs font-medium group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
                    >
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Konsultasikan Layanan
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4 Langkah Alur Penerbitan */}
          <div className="rounded-3xl border bg-muted/30 p-6 sm:p-10 lg:p-12 space-y-8">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-1.5 text-primary text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                Proses Sederhana & Terarah
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                Alur Praktis Menerbitkan Naskah Anda
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Empat langkah mudah menerbitkan buku impian bersama tim editorial profesional kami.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PUBLISHING_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="rounded-2xl border bg-card p-6 shadow-2xs space-y-3 relative overflow-hidden"
                >
                  <div className="text-3xl font-serif font-bold text-primary/30">
                    {step.step}
                  </div>
                  <h4 className="font-serif font-bold text-base text-foreground">
                    {step.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Consultation Callout */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t text-center sm:text-left">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Punya pertanyaan spesifik atau naskah siap terbit?
                </p>
                <p className="text-xs text-muted-foreground">
                  Konsultasikan kebutuhan jumlah eksemplar, estimasi biaya, atau desain cover tanpa dipungut biaya.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button asChild size="sm" className="gap-1.5 text-xs">
                  <a href={defaultWaUrl} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat WhatsApp Redaksi
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Link href="/kontak">
                    <Mail className="h-3.5 w-3.5" />
                    Formulir Kontak
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Identitas Resmi & Ajakan Aksi (CTA Final) */}
        <section className="rounded-3xl border bg-gradient-to-r from-primary/10 via-background to-primary/5 p-8 sm:p-12 lg:p-16 text-center space-y-6">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground">
              Tertarik Menerbitkan Naskah Bersama Kami?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Pintu redaksi Frasa Klausa Media selalu terbuka untuk karya sastra, novel, esai, dan puisi terbaik Anda. Hubungi tim kami atau jelajahi karya yang telah terbit.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button asChild size="lg" className="gap-2 text-sm font-medium px-6 shadow-sm">
              <Link href="/katalog">
                Jelajahi Katalog Buku <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="gap-2 text-sm font-medium px-6">
              <Link href="/kontak">
                <Mail className="h-4 w-4" /> Hubungi Redaksi
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function TentangKamiPage() {
  return (
    <Suspense fallback={<AboutLoadingFallback />}>
      <AboutContent />
    </Suspense>
  );
}
