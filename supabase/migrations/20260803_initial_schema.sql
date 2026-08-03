-- Migration 20260803: Initial Schema & RLS Audit for wifi-marketing-template

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
  require_email BOOLEAN DEFAULT FALSE,
  require_dob BOOLEAN DEFAULT FALSE,
  relogin_days_interval INT DEFAULT 7,
  terms_of_service TEXT DEFAULT 'Ao se conectar, você concorda com os termos de uso do serviço de acesso à internet fornecido por este estabelecimento.',
  privacy_policy TEXT DEFAULT 'Respeitamos sua privacidade conforme a Lei Geral de Proteção de Dados (LGPD). Seus dados serão utilizados apenas para fins de identificação no acesso ao Wi-Fi e relacionamento com a loja.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO store_settings (store_name)
SELECT 'Café & Bistro Central'
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  date_of_birth DATE,
  terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_visits INT NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  mac_address VARCHAR(18) UNIQUE NOT NULL,
  user_agent TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_visitors_phone ON visitors(phone);
CREATE INDEX IF NOT EXISTS idx_visitors_name ON visitors(name);
CREATE INDEX IF NOT EXISTS idx_devices_mac ON devices(mac_address);
CREATE INDEX IF NOT EXISTS idx_wifi_sessions_started_at ON wifi_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_wifi_sessions_visitor ON wifi_sessions(visitor_id);

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
