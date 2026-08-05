-- Migration: promotions_controls
-- Adds columns for promotional controls in visitor journey settings and campaign targets

ALTER TABLE public.store_settings 
  ADD COLUMN IF NOT EXISTS pre_signup_promotions_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS post_signup_promotions_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS promotions_button_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS promotions_carousel_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS show_pre_signup BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_post_signup BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_promotions_page BOOLEAN DEFAULT true;
