export const OFFICIAL_IDENTITY = {
  COMPANY_NAME: 'Frasa Klausa Media',
  TAGLINE: 'Mewujudkan Naskah Menjadi Buku',
  LEGAL_NAME: 'PT Frasa Klausa Media',
  EMAIL: 'frasaklausamedia@gmail.com',
  PHONE: '0813-8060-4256',
  WHATSAPP: '6281380604256',
  ADDRESS: 'Jl. Literasi Nusantara No. 10, Jakarta Selatan, DKI Jakarta 12340',
  MAPS_EMBED_URL: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126920.28318182747!2d106.758839!3d-6.229746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e49fe3dd05%3A0x301576d14feb9e0!2sJakarta%20Selatan!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid',
  SOCIAL_LINKS: {
    INSTAGRAM: 'https://instagram.com/frasaklausamedia',
    TIKTOK: 'https://tiktok.com/@frasaklausamedia',
    FACEBOOK: 'https://facebook.com/frasaklausamedia',
    SHOPEE: 'https://shopee.co.id/frasaklausamedia',
    TOKOPEDIA: 'https://tokopedia.com/frasaklausamedia',
  },
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
