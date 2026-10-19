export interface GeneralSettings {
  site_name: string;
  site_tagline: string;
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  office_address: string;
  default_meta_description: string;
}

export interface FeatureSettings {
  enable_blog_comments: boolean;
  enable_public_registration: boolean;
  maintenance_mode: boolean;
  enable_marketplace_redirect: boolean;
}

export interface SystemSettingsPayload {
  general: GeneralSettings;
  features: FeatureSettings;
}
