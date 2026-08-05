-- Migration: Add image positioning and enquadramento visual preferences
-- Timestamp: 2026-08-05T12:00:00Z

ALTER TABLE public.store_settings 
  ADD COLUMN IF NOT EXISTS landing_media_position_x INTEGER DEFAULT 50 CHECK (landing_media_position_x BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS landing_media_position_y INTEGER DEFAULT 50 CHECK (landing_media_position_y BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS landing_media_fit CHARACTER VARYING DEFAULT 'cover' CHECK (landing_media_fit IN ('cover', 'contain')),
  ADD COLUMN IF NOT EXISTS post_signup_media_position_x INTEGER DEFAULT 50 CHECK (post_signup_media_position_x BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS post_signup_media_position_y INTEGER DEFAULT 50 CHECK (post_signup_media_position_y BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS post_signup_media_fit CHARACTER VARYING DEFAULT 'cover' CHECK (post_signup_media_fit IN ('cover', 'contain'));

ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS media_position_x INTEGER DEFAULT 50 CHECK (media_position_x BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS media_position_y INTEGER DEFAULT 50 CHECK (media_position_y BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS media_fit CHARACTER VARYING DEFAULT 'cover' CHECK (media_fit IN ('cover', 'contain'));
