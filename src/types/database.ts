export type ThemePreset =
  | 'CUSTOM'
  | 'BURGER'
  | 'PIZZA'
  | 'SUSHI'
  | 'CAFE'
  | 'RESTAURANT'
  | 'GYM'
  | 'CLINIC'
  | 'HOTEL';

export type GoogleReviewTiming = 'PRE_CONNECT' | 'POST_CONNECT' | 'BOTH';

export interface StoreSettings {
  id: string;
  store_name: string;
  logo_url: string;
  background_url: string;
  primary_color: string;
  welcome_message: string;
  post_connect_message: string;
  promo_coupon_code: string;
  promo_image_url: string;
  
  // Mídia e Destaques da Landing Page
  landing_media_type?: 'IMAGE' | 'VIDEO';
  landing_media_url?: string;
  featured_promo_title?: string;
  featured_promo_description?: string;

  // Links Sociais e Utilitários
  instagram_url?: string;
  facebook_url?: string;
  menu_url?: string;
  google_review_url?: string;
  google_review_timing?: GoogleReviewTiming;

  // Tema Pré-configurado por Segmento
  preset_theme?: ThemePreset;

  // Configuração Dinâmica de Captura de Leads
  field_email_enabled?: boolean;
  field_dob_enabled?: boolean;
  field_city_enabled?: boolean;
  field_gender_enabled?: boolean;
  field_email_required?: boolean;
  field_dob_required?: boolean;
  field_city_required?: boolean;
  field_gender_required?: boolean;

  // Regras de Recadastro e Termos
  relogin_days_interval: number;
  terms_of_service: string;
  privacy_policy: string;
  created_at: string;
  updated_at: string;
}

export interface Visitor {
  id: string;
  phone: string;
  name: string;
  email?: string | null;
  date_of_birth?: string | null;
  city?: string | null;
  gender?: string | null;
  terms_accepted: boolean;
  terms_accepted_at: string;
  total_visits: number;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
}

export interface Device {
  id: string;
  visitor_id: string;
  mac_address: string;
  user_agent?: string | null;
  last_seen_at: string;
  created_at: string;
}

export interface WifiSession {
  id: string;
  visitor_id: string;
  mac_address: string;
  ip_address?: string | null;
  opennds_tok?: string | null;
  gateway_name?: string | null;
  started_at: string;
  expires_at?: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'DISCONNECTED';
  created_at: string;
  visitor?: Visitor;
}

export interface OpenNdsParams {
  tok?: string;
  clientmac?: string;
  clientip?: string;
  gatewayname?: string;
  gatewayaddress?: string;
  gatewayport?: string;
  redir?: string;
}

export interface RegisterVisitorPayload {
  name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  city?: string;
  gender?: string;
  mac_address?: string;
  tok?: string;
  ip_address?: string;
  gateway_name?: string;
  gatewayaddress?: string;
  gatewayport?: string;
}

export interface DashboardMetrics {
  totalVisitors: number;
  todayVisitors: number;
  activeNowVisitors: number;
  newVisitorsToday: number;
  returningVisitors: number;
  totalSessions: number;
  peakHours: { hour: string; visits: number }[];
  peakDays: { day: string; visits: number }[];
  deviceBreakdown?: { category: string; count: number }[];
}
