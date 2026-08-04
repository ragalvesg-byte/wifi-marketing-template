-- Migration 20260804_add_missing_fields: Add field_* and landing_media_* columns to store_settings table if they do not exist

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS landing_media_type VARCHAR(20) DEFAULT 'IMAGE',
ADD COLUMN IF NOT EXISTS landing_media_url TEXT DEFAULT 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
ADD COLUMN IF NOT EXISTS featured_promo_title VARCHAR(255) DEFAULT 'Oferta Especial do Dia',
ADD COLUMN IF NOT EXISTS featured_promo_description TEXT DEFAULT 'Aproveite 10% de desconto em todo o cardápio ao se conectar no Wi-Fi da loja.',
ADD COLUMN IF NOT EXISTS field_email_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS field_dob_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS field_city_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS field_gender_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS field_email_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS field_dob_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS field_city_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS field_gender_required BOOLEAN DEFAULT FALSE;
