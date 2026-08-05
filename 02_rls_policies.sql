-- =========================================================================
-- 02_rls_policies.sql
-- Políticas de Segurança RLS (Row Level Security) e Controle de Acesso Rígido
-- 
-- Correções Aplicadas:
-- 1. Revogação de todos os privilégios da role 'anon' (anônima) das tabelas.
-- 2. Bloqueio total de acesso direto anônimo via RLS (sem leitura, escrita, update ou delete).
-- 3. Definição de políticas administrativas granulares (SELECT, INSERT, UPDATE, DELETE)
--    utilizando o padrão de verificação de role de admin no JWT de forma isolada.
-- =========================================================================

-- =========================================================================
-- 1. REVOGAÇÃO DE PRIVILÉGIOS PARA A ROLE 'ANON'
-- =========================================================================
REVOKE ALL PRIVILEGES ON TABLE public.store_settings FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.visitors FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.devices FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.wifi_sessions FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.campaigns FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.campaign_audiences FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.coupons FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.coupon_redemptions FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.visitor_events FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.rate_limits FROM anon;

-- =========================================================================
-- 2. HABILITAÇÃO DO RLS EM TODAS AS TABELAS
-- =========================================================================
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas pré-existentes
DROP POLICY IF EXISTS "Permitir leitura publica das configuracoes da loja" ON public.store_settings;
DROP POLICY IF EXISTS "Public anon select store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin pode realizar todas operacoes em store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can perform all actions on store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin pode realizar todas operacoes em visitors" ON public.visitors;
DROP POLICY IF EXISTS "Admins can perform all actions on visitors" ON public.visitors;
DROP POLICY IF EXISTS "Public anon select visitors" ON public.visitors;
DROP POLICY IF EXISTS "Admin pode realizar todas operacoes em devices" ON public.devices;
DROP POLICY IF EXISTS "Admins can perform all actions on devices" ON public.devices;
DROP POLICY IF EXISTS "Public anon select devices" ON public.devices;
DROP POLICY IF EXISTS "Admin pode realizar todas operacoes em wifi_sessions" ON public.wifi_sessions;
DROP POLICY IF EXISTS "Admins can perform all actions on wifi_sessions" ON public.wifi_sessions;
DROP POLICY IF EXISTS "Admin full access on campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can perform all actions on campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Anon select active campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admin full access on campaign_audiences" ON public.campaign_audiences;
DROP POLICY IF EXISTS "Admins can perform all actions on campaign_audiences" ON public.campaign_audiences;
DROP POLICY IF EXISTS "Anon select active campaign_audiences" ON public.campaign_audiences;
DROP POLICY IF EXISTS "Admin full access on coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can perform all actions on coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anon select active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin full access on coupon_redemptions" ON public.coupon_redemptions;
DROP POLICY IF EXISTS "Admins can perform all actions on coupon_redemptions" ON public.coupon_redemptions;
DROP POLICY IF EXISTS "Admin read access on visitor_events" ON public.visitor_events;
DROP POLICY IF EXISTS "Admin write access on visitor_events" ON public.visitor_events;
DROP POLICY IF EXISTS "Admins can perform all actions on visitor_events" ON public.visitor_events;
DROP POLICY IF EXISTS "Admin full access on rate_limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Admins can perform all actions on rate_limits" ON public.rate_limits;

-- =========================================================================
-- 3. POLÍTICAS DE RLS DE ADMINISTRADOR POR OPERAÇÃO
-- =========================================================================

-- 3.1 store_settings
CREATE POLICY "store_settings_select_admin" ON public.store_settings
  FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "store_settings_insert_admin" ON public.store_settings
  FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "store_settings_update_admin" ON public.store_settings
  FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "store_settings_delete_admin" ON public.store_settings
  FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- 3.2 visitors
CREATE POLICY "visitors_select_admin" ON public.visitors
  FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "visitors_insert_admin" ON public.visitors
  FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "visitors_update_admin" ON public.visitors
  FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "visitors_delete_admin" ON public.visitors
  FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- 3.3 devices
CREATE POLICY "devices_select_admin" ON public.devices
  FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "devices_insert_admin" ON public.devices
  FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "devices_update_admin" ON public.devices
  FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "devices_delete_admin" ON public.devices
  FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- 3.4 wifi_sessions
CREATE POLICY "wifi_sessions_select_admin" ON public.wifi_sessions
  FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "wifi_sessions_insert_admin" ON public.wifi_sessions
  FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "wifi_sessions_update_admin" ON public.wifi_sessions
  FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "wifi_sessions_delete_admin" ON public.wifi_sessions
  FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- 3.5 campaigns
CREATE POLICY "campaigns_select_admin" ON public.campaigns
  FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "campaigns_insert_admin" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "campaigns_update_admin" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "campaigns_delete_admin" ON public.campaigns
  FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- 3.6 campaign_audiences
CREATE POLICY "campaign_audiences_select_admin" ON public.campaign_audiences
  FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "campaign_audiences_insert_admin" ON public.campaign_audiences
  FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "campaign_audiences_update_admin" ON public.campaign_audiences
  FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "campaign_audiences_delete_admin" ON public.campaign_audiences
  FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- 3.7 coupons (Tabela legada)
CREATE POLICY "coupons_select_admin" ON public.coupons
  FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "coupons_insert_admin" ON public.coupons
  FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "coupons_update_admin" ON public.coupons
  FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "coupons_delete_admin" ON public.coupons
  FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- 3.8 coupon_redemptions (Tabela legada)
CREATE POLICY "coupon_redemptions_select_admin" ON public.coupon_redemptions
  FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "coupon_redemptions_insert_admin" ON public.coupon_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "coupon_redemptions_update_admin" ON public.coupon_redemptions
  FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "coupon_redemptions_delete_admin" ON public.coupon_redemptions
  FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- 3.9 visitor_events
CREATE POLICY "visitor_events_select_admin" ON public.visitor_events
  FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "visitor_events_insert_admin" ON public.visitor_events
  FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "visitor_events_update_admin" ON public.visitor_events
  FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "visitor_events_delete_admin" ON public.visitor_events
  FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- 3.10 rate_limits
CREATE POLICY "rate_limits_select_admin" ON public.rate_limits
  FOR SELECT TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "rate_limits_insert_admin" ON public.rate_limits
  FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "rate_limits_update_admin" ON public.rate_limits
  FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "rate_limits_delete_admin" ON public.rate_limits
  FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
