-- =========================================================================
-- 01_schema_real.sql
-- Estrutura física real das 10 tabelas do Wi-Fi Marketing extraídas do banco
-- vjwehthlyldrpvdnjpca. Nenhuma alteração manual ou suposição foi aplicada.
-- =========================================================================

-- Habilitar a extensão pgcrypto para geração de UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABELA: store_settings
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name CHARACTER VARYING NOT NULL DEFAULT 'Café & Bistro Central'::character varying,
  logo_url TEXT DEFAULT 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80'::text,
  background_url TEXT DEFAULT 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80'::text,
  primary_color CHARACTER VARYING DEFAULT '#2563eb'::character varying,
  welcome_message TEXT DEFAULT 'Seja bem-vindo ao nosso Wi-Fi gratuito!'::text,
  post_connect_message TEXT DEFAULT 'Internet liberada! Apresente o cupom abaixo no caixa para ganhar 10% de desconto no seu pedido.'::text,
  promo_coupon_code CHARACTER VARYING DEFAULT 'BISTRO10'::character varying,
  promo_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'::text,
  landing_media_type CHARACTER VARYING DEFAULT 'IMAGE'::character varying,
  landing_media_url TEXT DEFAULT 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'::text,
  featured_promo_title CHARACTER VARYING DEFAULT 'Oferta Especial do Dia'::character varying,
  featured_promo_description TEXT DEFAULT 'Aproveite 10% de desconto em todo o cardápio ao se conectar no Wi-Fi da loja.'::text,
  instagram_url TEXT DEFAULT 'https://instagram.com'::text,
  facebook_url TEXT DEFAULT 'https://facebook.com'::text,
  menu_url TEXT DEFAULT 'https://cardapio.sualoja.com.br'::text,
  google_review_url TEXT DEFAULT 'https://g.page/r/sua-loja/review'::text,
  google_review_timing CHARACTER VARYING DEFAULT 'POST_CONNECT'::character varying,
  preset_theme CHARACTER VARYING DEFAULT 'CUSTOM'::character varying,
  field_email_enabled BOOLEAN DEFAULT false,
  field_dob_enabled BOOLEAN DEFAULT false,
  field_city_enabled BOOLEAN DEFAULT false,
  field_gender_enabled BOOLEAN DEFAULT false,
  field_email_required BOOLEAN DEFAULT false,
  field_dob_required BOOLEAN DEFAULT false,
  field_city_required BOOLEAN DEFAULT false,
  field_gender_required BOOLEAN DEFAULT false,
  relogin_days_interval INTEGER DEFAULT 7,
  terms_of_service TEXT DEFAULT 'Ao se conectar, você concorda com os termos de uso do serviço de acesso à internet fornecido por este estabelecimento.'::text,
  privacy_policy TEXT DEFAULT 'Respeitamos sua privacidade conforme a Lei Geral de Proteção de Dados (LGPD). Seus dados serão utilizados apenas para fins de identificação no acesso ao Wi-Fi e relacionamento com a loja.'::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  pre_signup_enabled BOOLEAN DEFAULT true,
  pre_signup_show_banner BOOLEAN DEFAULT true,
  pre_signup_show_promo BOOLEAN DEFAULT true,
  pre_signup_show_instagram BOOLEAN DEFAULT true,
  pre_signup_show_menu BOOLEAN DEFAULT true,
  pre_signup_show_google_review BOOLEAN DEFAULT true,
  post_signup_action CHARACTER VARYING DEFAULT 'SHOW_MESSAGE'::character varying,
  post_signup_title CHARACTER VARYING DEFAULT 'Internet liberada!'::character varying,
  post_signup_message TEXT DEFAULT 'Aproveite sua conexão. Obrigado por nos visitar!'::text,
  post_signup_url TEXT,
  post_signup_redirect_mode CHARACTER VARYING DEFAULT 'NONE'::character varying,
  post_signup_redirect_seconds INTEGER DEFAULT 3,
  post_signup_show_coupon BOOLEAN DEFAULT false,
  post_signup_show_instagram BOOLEAN DEFAULT false,
  post_signup_show_menu BOOLEAN DEFAULT false,
  post_signup_show_google_review BOOLEAN DEFAULT false,
  post_signup_promo_image_url TEXT,
  post_signup_promo_title TEXT,
  post_signup_promo_description TEXT,
  post_signup_promo_button_text TEXT,
  post_signup_promo_button_url TEXT,
  post_signup_promo_image_aspect_ratio TEXT DEFAULT '4:5'::text,
  post_signup_banner_enabled BOOLEAN DEFAULT false,
  post_signup_banner_closable BOOLEAN DEFAULT true
);

-- 2. TABELA: visitors
CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone CHARACTER VARYING NOT NULL,
  name CHARACTER VARYING NOT NULL,
  email CHARACTER VARYING,
  date_of_birth DATE,
  city CHARACTER VARYING,
  gender CHARACTER VARYING,
  terms_accepted BOOLEAN NOT NULL DEFAULT true,
  terms_accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_visits INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT visitors_phone_key UNIQUE (phone)
);

-- 3. TABELA: devices
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL,
  mac_address CHARACTER VARYING NOT NULL,
  user_agent TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT devices_mac_address_key UNIQUE (mac_address),
  CONSTRAINT devices_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.visitors (id) ON DELETE CASCADE
);

-- 4. TABELA: wifi_sessions
CREATE TABLE IF NOT EXISTS public.wifi_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL,
  mac_address CHARACTER VARYING NOT NULL,
  ip_address CHARACTER VARYING,
  opennds_tok TEXT,
  gateway_name CHARACTER VARYING,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status CHARACTER VARYING DEFAULT 'ACTIVE'::character varying,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT wifi_sessions_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.visitors (id) ON DELETE CASCADE
);

-- 5. TABELA: campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title CHARACTER VARYING NOT NULL,
  description TEXT,
  type CHARACTER VARYING NOT NULL,
  status CHARACTER VARYING NOT NULL DEFAULT 'DRAFT'::character varying,
  media_url TEXT,
  media_type CHARACTER VARYING DEFAULT 'IMAGE'::character varying,
  aspect_ratio CHARACTER VARYING DEFAULT '4:5'::character varying,
  button_text CHARACTER VARYING,
  button_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. TABELA: campaign_audiences
CREATE TABLE IF NOT EXISTS public.campaign_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  target_type CHARACTER VARYING NOT NULL,
  rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT campaign_audiences_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns (id) ON DELETE CASCADE
);

-- 7. TABELA: coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID,
  code CHARACTER VARYING NOT NULL,
  discount_type CHARACTER VARYING NOT NULL,
  discount_value NUMERIC NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT coupons_code_key UNIQUE (code),
  CONSTRAINT coupons_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns (id) ON DELETE SET NULL
);

-- 8. TABELA: coupon_redemptions
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL,
  visitor_id UUID NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT unique_visitor_coupon_redemption UNIQUE (coupon_id, visitor_id),
  CONSTRAINT coupon_redemptions_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons (id) ON DELETE CASCADE,
  CONSTRAINT coupon_redemptions_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.visitors (id) ON DELETE CASCADE
);

-- 9. TABELA: visitor_events
CREATE TABLE IF NOT EXISTS public.visitor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type CHARACTER VARYING NOT NULL,
  visitor_id UUID,
  wifi_session_id UUID,
  campaign_id UUID, -- Observação: Não possui FK para campaigns no banco remoto real.
  anonymous_session_id CHARACTER VARYING,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT visitor_events_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.visitors (id) ON DELETE SET NULL,
  CONSTRAINT visitor_events_wifi_session_id_fkey FOREIGN KEY (wifi_session_id) REFERENCES public.wifi_sessions (id) ON DELETE SET NULL
);

-- 10. TABELA: rate_limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip CHARACTER VARYING PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
