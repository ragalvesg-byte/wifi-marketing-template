-- 20260804_portal_media_and_banner.sql

DO $$ 
BEGIN 
  -- post_signup_banner_enabled
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'post_signup_banner_enabled') THEN 
    ALTER TABLE public.store_settings ADD COLUMN post_signup_banner_enabled boolean DEFAULT false; 
  END IF;

  -- post_signup_banner_closable
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'post_signup_banner_closable') THEN 
    ALTER TABLE public.store_settings ADD COLUMN post_signup_banner_closable boolean DEFAULT true; 
  END IF;
END $$;

-- Criação do Bucket "portal-media" caso não exista
INSERT INTO storage.buckets (id, name, public) 
SELECT 'portal-media', 'portal-media', true 
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'portal-media');

-- RLS para o bucket
-- Drop policies caso já existam (para evitar erros em execuções múltiplas)
DROP POLICY IF EXISTS "Media is public" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;

-- Permite leitura pública
CREATE POLICY "Media is public" ON storage.objects 
  FOR SELECT USING (bucket_id = 'portal-media');

-- Permite insert para admins autenticados
CREATE POLICY "Admins can upload media" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'portal-media' AND auth.role() = 'authenticated');

-- Permite update para admins autenticados
CREATE POLICY "Admins can update media" ON storage.objects 
  FOR UPDATE WITH CHECK (bucket_id = 'portal-media' AND auth.role() = 'authenticated');

-- Permite delete para admins autenticados
CREATE POLICY "Admins can delete media" ON storage.objects 
  FOR DELETE USING (bucket_id = 'portal-media' AND auth.role() = 'authenticated');
