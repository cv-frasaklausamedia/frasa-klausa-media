// Domain Types & Models - Frasa Klausa Media
export * from './database';

import type { Database } from './database';

export type UserProfile = Database['public']['Tables']['profiles']['Row'];
export type BookCategory = Database['public']['Tables']['book_categories']['Row'];
export type BlogCategory = Database['public']['Tables']['blog_categories']['Row'];
export type Book = Database['public']['Tables']['books']['Row'];
export type BookImage = Database['public']['Tables']['book_images']['Row'];
export type BookRelated = Database['public']['Tables']['book_related']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Banner = Database['public']['Tables']['banners']['Row'];
export type SiteContent = Database['public']['Tables']['site_content']['Row'];
export type ContactInquiry = Database['public']['Tables']['contact_inquiries']['Row'];

export type SearchGlobalResult = Database['public']['Functions']['search_global_content']['Returns'][number];

// Specific Site Content Payloads
export interface HeroContentPayload {
  badge?: string;
  headline: string;
  subheadline: string;
  primary_cta_label: string;
  primary_cta_url: string;
  secondary_cta_label?: string;
  secondary_cta_url?: string;
  cover_image_url?: string;
}

export interface AboutContentPayload {
  title: string;
  subtitle?: string;
  vision?: string;
  mission?: string[];
  values?: { name: string; description: string }[];
  history?: string;
}

export interface ContactContentPayload {
  company_name: string;
  tagline?: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  operating_hours?: string;
  maps_embed_url?: string;
}

export interface SocialContentPayload {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  twitter?: string;
  shopee?: string;
  tokopedia?: string;
  youtube?: string;
}
