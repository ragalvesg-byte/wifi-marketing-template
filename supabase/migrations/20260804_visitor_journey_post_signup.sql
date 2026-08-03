-- 20260804_visitor_journey_post_signup.sql

-- Adiciona os novos campos para customização da tela de pós-cadastro (promoção e banner)

DO $$ 
BEGIN 
  -- post_signup_promo_image_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'post_signup_promo_image_url') THEN 
    ALTER TABLE public.store_settings ADD COLUMN post_signup_promo_image_url text; 
  END IF;

  -- post_signup_promo_title
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'post_signup_promo_title') THEN 
    ALTER TABLE public.store_settings ADD COLUMN post_signup_promo_title text; 
  END IF;

  -- post_signup_promo_description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'post_signup_promo_description') THEN 
    ALTER TABLE public.store_settings ADD COLUMN post_signup_promo_description text; 
  END IF;

  -- post_signup_promo_button_text
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'post_signup_promo_button_text') THEN 
    ALTER TABLE public.store_settings ADD COLUMN post_signup_promo_button_text text; 
  END IF;

  -- post_signup_promo_button_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'post_signup_promo_button_url') THEN 
    ALTER TABLE public.store_settings ADD COLUMN post_signup_promo_button_url text; 
  END IF;

  -- post_signup_promo_image_aspect_ratio
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'post_signup_promo_image_aspect_ratio') THEN 
    ALTER TABLE public.store_settings ADD COLUMN post_signup_promo_image_aspect_ratio text DEFAULT '4:5'; 
  END IF;
END $$;
