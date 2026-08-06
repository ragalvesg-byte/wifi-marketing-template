-- Migration 20260806100000_secure_wifi_and_consent: Add customer Wi-Fi settings, marketing consent, session token hashing, and rate limiting key extensions

-- 1. Add customer Wi-Fi columns to store_settings
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS customer_wifi_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS wifi_network_name VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS wifi_network_password TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS wifi_password_visible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS wifi_password_copy_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS wifi_section_title VARCHAR(255) DEFAULT 'Conecte-se ao Wi-Fi do estabelecimento',
  ADD COLUMN IF NOT EXISTS wifi_instruction_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS wifi_android_instructions TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS wifi_ios_instructions TEXT DEFAULT '';

-- 2. Add marketing consent columns to visitors
ALTER TABLE public.visitors
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ NULL;

-- 3. Add session token hash column to wifi_sessions
ALTER TABLE public.wifi_sessions
  ADD COLUMN IF NOT EXISTS session_token_hash TEXT NULL;

-- 4. Extend rate_limits table to support composite/derived action keys
ALTER TABLE public.rate_limits DROP CONSTRAINT IF EXISTS rate_limits_pkey;
ALTER TABLE public.rate_limits ADD COLUMN IF NOT EXISTS action_key VARCHAR(255);
UPDATE public.rate_limits SET action_key = ip WHERE action_key IS NULL OR action_key = '';
ALTER TABLE public.rate_limits ADD PRIMARY KEY (action_key);

-- 5. Safe Data Migration: Update legacy text copies in store_settings
UPDATE public.store_settings
SET 
  post_signup_title = 'Tudo certo!',
  post_signup_message = 'Obrigado por nos visitar! Confira as opções e benefícios disponíveis para você.'
WHERE 
  post_signup_title LIKE '%Internet liberada%' OR
  post_signup_title LIKE '%Modo demonstração%' OR
  post_signup_title LIKE '%Roteador não conectado%' OR
  post_signup_message LIKE '%Internet liberada%' OR
  post_signup_message LIKE '%Modo demonstração%' OR
  post_signup_message LIKE '%Roteador não conectado%';
