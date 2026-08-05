-- =========================================================================
-- 03_indexes.sql
-- Índices reais e de otimização para tabelas do Wi-Fi Marketing
-- Inclui índices simples de chaves estrangeiras e índices compostos de Analytics
-- =========================================================================

-- 1. store_settings
CREATE INDEX IF NOT EXISTS idx_store_settings_id 
  ON public.store_settings(id);

-- 2. visitors
CREATE INDEX IF NOT EXISTS idx_visitors_phone 
  ON public.visitors(phone);

CREATE INDEX IF NOT EXISTS idx_visitors_name 
  ON public.visitors(name);

-- 3. devices
CREATE INDEX IF NOT EXISTS idx_devices_mac 
  ON public.devices(mac_address);

CREATE INDEX IF NOT EXISTS idx_devices_visitor_id 
  ON public.devices(visitor_id); -- Corrigindo FK devices_visitor_id_fkey unindexed

-- 4. wifi_sessions
CREATE INDEX IF NOT EXISTS idx_wifi_sessions_started_at 
  ON public.wifi_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_wifi_sessions_visitor 
  ON public.wifi_sessions(visitor_id);

-- 5. campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status 
  ON public.campaigns(status);

CREATE INDEX IF NOT EXISTS idx_campaigns_dates 
  ON public.campaigns(start_date, end_date);

-- 6. campaign_audiences
CREATE INDEX IF NOT EXISTS idx_campaign_audiences_campaign 
  ON public.campaign_audiences(campaign_id);

-- 7. coupons (Tabela legada)
CREATE INDEX IF NOT EXISTS idx_coupons_campaign 
  ON public.coupons(campaign_id);

-- 8. coupon_redemptions (Tabela legada)
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_visitor 
  ON public.coupon_redemptions(visitor_id);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon 
  ON public.coupon_redemptions(coupon_id);

-- 9. visitor_events (Fase C Analytics)
CREATE INDEX IF NOT EXISTS idx_visitor_events_type 
  ON public.visitor_events(event_type);

CREATE INDEX IF NOT EXISTS idx_visitor_events_visitor 
  ON public.visitor_events(visitor_id);

CREATE INDEX IF NOT EXISTS idx_visitor_events_wifi_session 
  ON public.visitor_events(wifi_session_id);

CREATE INDEX IF NOT EXISTS idx_visitor_events_created_at 
  ON public.visitor_events(created_at);

-- Otimização e Auditoria de Índices Compostos (Fase C)
CREATE INDEX IF NOT EXISTS idx_visitor_events_type_created_at 
  ON public.visitor_events(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_visitor_events_campaign_type_created_at 
  ON public.visitor_events(campaign_id, event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_visitor_events_visitor_created_at 
  ON public.visitor_events(visitor_id, created_at);
