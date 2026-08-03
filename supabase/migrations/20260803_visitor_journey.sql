-- Migration 20260803_visitor_journey: Add new fields for Visitor Journey

ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS pre_signup_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS pre_signup_show_banner BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS pre_signup_show_promo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS pre_signup_show_instagram BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS pre_signup_show_menu BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS pre_signup_show_google_review BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS post_signup_action VARCHAR(50) DEFAULT 'SHOW_MESSAGE',
ADD COLUMN IF NOT EXISTS post_signup_title VARCHAR(255) DEFAULT 'Internet liberada!',
ADD COLUMN IF NOT EXISTS post_signup_message TEXT DEFAULT 'Aproveite sua conexão. Obrigado por nos visitar!',
ADD COLUMN IF NOT EXISTS post_signup_url TEXT,
ADD COLUMN IF NOT EXISTS post_signup_redirect_mode VARCHAR(50) DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS post_signup_redirect_seconds INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS post_signup_show_coupon BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS post_signup_show_instagram BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS post_signup_show_menu BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS post_signup_show_google_review BOOLEAN DEFAULT FALSE;
