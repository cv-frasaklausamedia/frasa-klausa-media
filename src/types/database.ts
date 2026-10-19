// Database types for Supabase - Frasa Klausa Media
// Auto-generated mapping from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'super_admin';
export type PostStatus = 'draft' | 'published';
export type InquiryStatus = 'unread' | 'replied' | 'archived';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      book_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          cover_url: string | null;
          category_id: string;
          author: string;
          editor: string | null;
          publisher: string;
          publish_year: number;
          isbn: string | null;
          page_count: number;
          price_regular: number;
          price_promo: number | null;
          is_featured: boolean;
          is_published: boolean;
          shopee_url: string | null;
          tokopedia_url: string | null;
          whatsapp_number: string;
          whatsapp_message_template: string | null;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string;
          cover_url?: string | null;
          category_id: string;
          author: string;
          editor?: string | null;
          publisher?: string;
          publish_year: number;
          isbn?: string | null;
          page_count: number;
          price_regular: number;
          price_promo?: number | null;
          is_featured?: boolean;
          is_published?: boolean;
          shopee_url?: string | null;
          tokopedia_url?: string | null;
          whatsapp_number?: string;
          whatsapp_message_template?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          cover_url?: string | null;
          category_id?: string;
          author?: string;
          editor?: string | null;
          publisher?: string;
          publish_year?: number;
          isbn?: string | null;
          page_count?: number;
          price_regular?: number;
          price_promo?: number | null;
          is_featured?: boolean;
          is_published?: boolean;
          shopee_url?: string | null;
          tokopedia_url?: string | null;
          whatsapp_number?: string;
          whatsapp_message_template?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'books_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'book_categories';
            referencedColumns: ['id'];
          }
        ];
      };
      book_images: {
        Row: {
          id: string;
          book_id: string;
          image_url: string;
          alt_text: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          image_url: string;
          alt_text?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          image_url?: string;
          alt_text?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'book_images_book_id_fkey';
            columns: ['book_id'];
            referencedRelation: 'books';
            referencedColumns: ['id'];
          }
        ];
      };
      book_related: {
        Row: {
          book_id: string;
          related_id: string;
          created_at: string;
        };
        Insert: {
          book_id: string;
          related_id: string;
          created_at?: string;
        };
        Update: {
          book_id?: string;
          related_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'book_related_book_id_fkey';
            columns: ['book_id'];
            referencedRelation: 'books';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'book_related_related_id_fkey';
            columns: ['related_id'];
            referencedRelation: 'books';
            referencedColumns: ['id'];
          }
        ];
      };
      posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          cover_url: string | null;
          author_name: string;
          author_id: string | null;
          category_id: string;
          status: PostStatus;
          published_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string;
          content?: string;
          cover_url?: string | null;
          author_name: string;
          author_id?: string | null;
          category_id: string;
          status?: PostStatus;
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string;
          content?: string;
          cover_url?: string | null;
          author_name?: string;
          author_id?: string | null;
          category_id?: string;
          status?: PostStatus;
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_author_id_fkey';
            columns: ['author_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posts_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'blog_categories';
            referencedColumns: ['id'];
          }
        ];
      };
      banners: {
        Row: {
          id: string;
          message: string;
          link_url: string | null;
          starts_at: string;
          ends_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          message: string;
          link_url?: string | null;
          starts_at: string;
          ends_at: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          message?: string;
          link_url?: string | null;
          starts_at?: string;
          ends_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_content: {
        Row: {
          id: string;
          key: 'hero' | 'about' | 'contact' | 'social';
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: 'hero' | 'about' | 'contact' | 'social';
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: 'hero' | 'about' | 'contact' | 'social';
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string;
          message: string;
          status: InquiryStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          subject: string;
          message: string;
          status?: InquiryStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          subject?: string;
          message?: string;
          status?: InquiryStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_active_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      search_global_content: {
        Args: {
          search_query: string;
          result_limit?: number;
        };
        Returns: {
          id: string;
          type: 'book' | 'post';
          title: string;
          slug: string;
          cover_url: string | null;
          subtitle: string | null;
          price: number | null;
          promo_price: number | null;
          published_at: string | null;
          similarity_score: number;
        }[];
      };
      upsert_book_atomic: {
        Args: {
          p_book_id: string | null;
          p_title: string;
          p_slug: string;
          p_description: string;
          p_cover_url: string | null;
          p_category_id: string;
          p_author: string;
          p_editor: string | null;
          p_publisher: string;
          p_publish_year: number;
          p_isbn: string | null;
          p_page_count: number;
          p_price_regular: number;
          p_price_promo: number | null;
          p_is_featured: boolean;
          p_is_published: boolean;
          p_shopee_url: string | null;
          p_tokopedia_url: string | null;
          p_whatsapp_number: string;
          p_whatsapp_message_template: string | null;
          p_seo_title: string | null;
          p_seo_description: string | null;
          p_gallery_images?: Json;
          p_related_book_ids?: string[];
        };
        Returns: {
          book_id: string;
          unused_image_urls: string[];
        };
      };
    };
    Enums: {
      user_role: UserRole;
      post_status: PostStatus;
      inquiry_status: InquiryStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
