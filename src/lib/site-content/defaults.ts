import type {
  HeroContentPayload,
  AboutContentPayload,
  ContactContentPayload,
  SocialContentPayload,
} from '../../types/index.ts';

// ============================================================================
// DEFAULT SITE CONTENT (PRD §6.2.C, §8)
// Memastikan halaman publik tidak pernah kosong / rusak sekalipun basis data kosong.
// ============================================================================

export const DEFAULT_HERO_CONTENT: HeroContentPayload = {
  badge: 'Penerbit Buku Berkualitas & Independen',
  headline: 'Mewujudkan Naskah Menjadi Karya Nyata',
  subheadline:
    'Frasa Klausa Media adalah rumah bagi para penulis, pembaca, dan pencinta literasi. Kami mengkurasi, merawat, dan menerbitkan naskah bermutu dengan dedikasi estetika dan narasi terbaik.',
  primary_cta_label: 'Jelajahi Katalog Buku',
  primary_cta_url: '/katalog',
  secondary_cta_label: 'Hubungi Redaksi',
  secondary_cta_url: '/kontak',
  cover_image_url:
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop',
};

export const DEFAULT_ABOUT_CONTENT: AboutContentPayload = {
  title: 'Tentang Frasa Klausa Media',
  subtitle: 'Mewujudkan Naskah Menjadi Buku',
  vision:
    'Menjadi penerbit independen rujukan di Indonesia yang melahirkan karya-karya bermutu, menginspirasi akal budi, dan memajukan peradaban literasi bangsa.',
  mission: [
    'Mendampingi penulis dari tahap kurasi naskah hingga penerbitan dengan standar editorial profesional.',
    'Menyediakan buku-buku bermutu dengan tata letak artistik dan bahan berkualitas bagi para pembaca.',
    'Membangun komunitas literasi yang inklusif, kritis, dan berdaya melalui diskusi dan bedah karya.',
  ],
  values: [
    {
      name: 'Integritas Karya',
      description:
        'Menghormati hak cipta dan orisinalitas setiap gagasan yang dipercayakan kepada kami.',
    },
    {
      name: 'Kualitas Editorial',
      description:
        'Penyuntingan teliti yang menjaga suara asli penulis sekaligus memperkuat narasi.',
    },
    {
      name: 'Aksesibilitas',
      description:
        'Memudahkan pembaca mendapatkan buku melalui berbagai saluran pemesanan yang fleksibel.',
    },
  ],
  history:
    'Berdiri dengan semangat memperkaya khazanah perbukuan Indonesia, Frasa Klausa Media berawal dari kumpulan editor dan penikmat sastra yang percaya bahwa setiap gagasan yang ditulis dengan ketulusan berhak menemukan pembacanya.',
};

export const DEFAULT_CONTACT_CONTENT: ContactContentPayload = {
  company_name: 'Frasa Klausa Media',
  tagline: 'Mewujudkan Naskah Menjadi Buku',
  email: 'frasaklausamedia@gmail.com',
  phone: '0813-8060-4256',
  whatsapp: '0813-8060-4256',
  address: 'Jl. Literasi No. 42, RT 03 / RW 05, Jakarta Timur, DKI Jakarta 13420',
  operating_hours: 'Senin – Jumat: 09.00 – 17.00 WIB',
  maps_embed_url:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126920.28639849206!2d106.758849!3d-6.229746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e49fe3ddb3%3A0x72a5a51c4a034638!2sJakarta!5e0!3m2!1sid!2sid!4v1700000000000',
};

export const DEFAULT_SOCIAL_CONTENT: SocialContentPayload = {
  instagram: 'https://instagram.com/frasaklausamedia',
  facebook: 'https://facebook.com/frasaklausamedia',
  tiktok: 'https://tiktok.com/@frasaklausamedia',
  twitter: 'https://x.com/frasaklausa',
  shopee: 'https://shopee.co.id/frasaklausamedia',
  tokopedia: 'https://tokopedia.com/frasaklausamedia',
  youtube: '',
};

/**
 * Peta fallback konten default berdasarkan key
 */
export const DEFAULT_SITE_CONTENT_MAP = {
  hero: DEFAULT_HERO_CONTENT,
  about: DEFAULT_ABOUT_CONTENT,
  contact: DEFAULT_CONTACT_CONTENT,
  social: DEFAULT_SOCIAL_CONTENT,
} as const;
