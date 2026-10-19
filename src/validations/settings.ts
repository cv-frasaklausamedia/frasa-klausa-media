import { z } from 'zod';

/**
 * Regex pendeteksi pola token / secret sensitif (PRD §15.1, §15.4)
 * Mencegah admin secara tidak sengaja menaruh secret pada form pengaturan umum
 */
const SUSPECTED_SECRET_REGEX = /(eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}|sk_live_[a-zA-Z0-9]{20,}|sbp_[a-zA-Z0-9]{20,}|[a-zA-Z0-9_-]{32,}:[a-zA-Z0-9_-]{32,})/;

function ensureNoSecret(val: string, ctx: z.RefinementCtx, fieldName: string) {
  if (SUSPECTED_SECRET_REGEX.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${fieldName} tidak boleh berisi token autentikasi atau secret terenkripsi`,
    });
  }
}

/**
 * Dokumentasi Setting: Identitas & Kontak Umum Platform
 */
export const generalSettingsSchema = z.object({
  // Nama publik penerbit / platform (ditampilkan di header, footer, meta title)
  site_name: z
    .string()
    .trim()
    .min(2, 'Nama situs minimal 2 karakter')
    .max(100, 'Nama situs maksimal 100 karakter'),

  // Slogan / deskripsi singkat di samping nama situs
  site_tagline: z
    .string()
    .trim()
    .min(2, 'Slogan situs minimal 2 karakter')
    .max(200, 'Slogan situs maksimal 200 karakter'),

  // Alamat email operasional untuk korespondensi publik
  contact_email: z
    .string()
    .trim()
    .min(1, 'Email kontak wajib diisi')
    .email('Format alamat email kontak tidak valid')
    .max(150, 'Panjang email maksimal 150 karakter'),

  // Nomor telepon kantor penerbit
  contact_phone: z
    .string()
    .trim()
    .min(5, 'Nomor telepon minimal 5 karakter')
    .max(30, 'Nomor telepon maksimal 30 karakter'),

  // Nomor WhatsApp utama untuk pemesanan langsung katalog buku
  contact_whatsapp: z
    .string()
    .trim()
    .min(8, 'Nomor WhatsApp minimal 8 karakter')
    .max(30, 'Nomor WhatsApp maksimal 30 karakter'),

  // Alamat fisik kantor penerbit
  office_address: z
    .string()
    .trim()
    .max(300, 'Alamat kantor maksimal 300 karakter'),

  // Deskripsi meta SEO default jika halaman tidak memiliki deskripsi spesifik
  default_meta_description: z
    .string()
    .trim()
    .min(10, 'Deskripsi SEO minimal 10 karakter')
    .max(300, 'Deskripsi SEO maksimal 300 karakter'),
}).superRefine((data, ctx) => {
  ensureNoSecret(data.site_name, ctx, 'Nama situs');
  ensureNoSecret(data.site_tagline, ctx, 'Slogan situs');
  ensureNoSecret(data.contact_email, ctx, 'Email kontak');
  ensureNoSecret(data.office_address, ctx, 'Alamat kantor');
  ensureNoSecret(data.default_meta_description, ctx, 'Deskripsi SEO');
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;

/**
 * Dokumentasi Setting: Toggle Fitur & Layanan Platform
 */
export const featureSettingsSchema = z.object({
  // Mengaktifkan kolom komentar pembaca pada artikel blog (default: false pada v1.0)
  enable_blog_comments: z.boolean({
    required_error: 'Pengaturan komentar blog wajib ditentukan',
  }),

  // Izinkan registrasi publik (pada v1.0 SELALU false sesuai PRD §5 & §6.1)
  enable_public_registration: z.boolean({
    required_error: 'Pengaturan registrasi publik wajib ditentukan',
  }),

  // Mode pemeliharaan sistem (menampilkan banner pemeliharaan di frontend jika aktif)
  maintenance_mode: z.boolean({
    required_error: 'Pengaturan mode pemeliharaan wajib ditentukan',
  }),

  // Mengizinkan tombol checkout eksternal ke Shopee/Tokopedia/WhatsApp
  enable_marketplace_redirect: z.boolean({
    required_error: 'Pengaturan redirect marketplace wajib ditentukan',
  }),
});

export type FeatureSettingsInput = z.infer<typeof featureSettingsSchema>;

/**
 * Gabungan formulir Pengaturan Sistem
 */
export const systemSettingsFormSchema = z.object({
  general: generalSettingsSchema,
  features: featureSettingsSchema,
});

export type SystemSettingsFormInput = z.infer<typeof systemSettingsFormSchema>;
