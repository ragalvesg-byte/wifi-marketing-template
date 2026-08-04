-- =================================================================
-- ESQUEMA EXPANDIDO DE BANCO DE DADOS SUPABASE PARA WIFI MARKETING
-- Fase 1 MVP Comercial Completo (Instalação Single-Tenant por Loja)
-- =================================================================

-- 1. Tabela de Configurações da Loja
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name VARCHAR(255) NOT NULL DEFAULT 'Café & Bistro Central',
  logo_url TEXT DEFAULT 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80',
  background_url TEXT DEFAULT 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80',
  primary_color VARCHAR(30) DEFAULT '#2563eb',
  welcome_message TEXT DEFAULT 'Seja bem-vindo ao nosso Wi-Fi gratuito!',
  post_connect_message TEXT DEFAULT 'Internet liberada! Apresente o cupom abaixo no caixa para ganhar 10% de desconto no seu pedido.',
  promo_coupon_code VARCHAR(100) DEFAULT 'BISTRO10',
  promo_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  
  -- Mídia e Destaques da Landing Page
  landing_media_type VARCHAR(20) DEFAULT 'IMAGE', -- IMAGE, VIDEO
  landing_media_url TEXT DEFAULT 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  featured_promo_title VARCHAR(255) DEFAULT 'Oferta Especial do Dia',
  featured_promo_description TEXT DEFAULT 'Aproveite 10% de desconto em todo o cardápio ao se conectar no Wi-Fi da loja.',

  -- Links Sociais e Utilitários
  instagram_url TEXT DEFAULT 'https://instagram.com',
  facebook_url TEXT DEFAULT 'https://facebook.com',
  menu_url TEXT DEFAULT 'https://cardapio.sualoja.com.br',
  google_review_url TEXT DEFAULT 'https://g.page/r/sua-loja/review',
  google_review_timing VARCHAR(20) DEFAULT 'POST_CONNECT', -- PRE_CONNECT, POST_CONNECT, BOTH

  -- Tema Pré-configurado por Segmento
  preset_theme VARCHAR(50) DEFAULT 'CUSTOM', -- CUSTOM, BURGER, PIZZA, SUSHI, CAFE, RESTAURANT, GYM, CLINIC, HOTEL

  -- Configuração de Campos Dinâmicos de Captura de Leads (Nome e WhatsApp são padrões obrigatórios)
  field_email_enabled BOOLEAN DEFAULT FALSE,
  field_dob_enabled BOOLEAN DEFAULT FALSE,
  field_city_enabled BOOLEAN DEFAULT FALSE,
  field_gender_enabled BOOLEAN DEFAULT FALSE,
  field_email_required BOOLEAN DEFAULT FALSE,
  field_dob_required BOOLEAN DEFAULT FALSE,
  field_city_required BOOLEAN DEFAULT FALSE,
  field_gender_required BOOLEAN DEFAULT FALSE,

  -- Regras de Recadastro e Termos
  relogin_days_interval INT DEFAULT 7,
  terms_of_service TEXT DEFAULT 'Ao se conectar, você concorda com os termos de uso do serviço de acesso à internet fornecido por este estabelecimento.',
  privacy_policy TEXT DEFAULT 'Respeitamos sua privacidade conforme a Lei Geral de Proteção de Dados (LGPD). Seus dados serão utilizados apenas para fins de identificação no acesso ao Wi-Fi e relacionamento com a loja.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração padrão inicial caso não exista
INSERT INTO store_settings (store_name)
SELECT 'Café & Bistro Central'
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- 2. Tabela de Visitantes
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  date_of_birth DATE,
  city VARCHAR(100),
  gender VARCHAR(20),
  terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_visits INT NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Dispositivos (Endereço MAC -> Visitante)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  mac_address VARCHAR(18) UNIQUE NOT NULL,
  user_agent TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Sessões Wi-Fi
CREATE TABLE IF NOT EXISTS wifi_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  mac_address VARCHAR(18) NOT NULL,
  ip_address VARCHAR(45),
  opennds_tok TEXT,
  gateway_name VARCHAR(100),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_visitors_phone ON visitors(phone);
CREATE INDEX IF NOT EXISTS idx_visitors_name ON visitors(name);
CREATE INDEX IF NOT EXISTS idx_devices_mac ON devices(mac_address);
CREATE INDEX IF NOT EXISTS idx_wifi_sessions_started_at ON wifi_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_wifi_sessions_visitor ON wifi_sessions(visitor_id);

-- Regras e Políticas RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE wifi_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura publica das configuracoes da loja" ON store_settings;
CREATE POLICY "Permitir leitura publica das configuracoes da loja" 
  ON store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin pode realizar todas operacoes em store_settings" ON store_settings;
CREATE POLICY "Admin pode realizar todas operacoes em store_settings"
  ON store_settings FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin pode realizar todas operacoes em visitors" ON visitors;
CREATE POLICY "Admin pode realizar todas operacoes em visitors"
  ON visitors FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin pode realizar todas operacoes em devices" ON devices;
CREATE POLICY "Admin pode realizar todas operacoes em devices"
  ON devices FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin pode realizar todas operacoes em wifi_sessions" ON wifi_sessions;
CREATE POLICY "Admin pode realizar todas operacoes em wifi_sessions"
  ON wifi_sessions FOR ALL TO authenticated USING (true);
