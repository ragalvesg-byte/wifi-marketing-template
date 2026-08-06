-- Migration 20260807000000_fase2_delete_visitor_rpc: Transactional cascade deletion function for visitors

CREATE OR REPLACE FUNCTION public.delete_visitor_cascade(p_visitor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Excluir eventos associados ao visitante
  DELETE FROM public.visitor_events WHERE visitor_id = p_visitor_id;

  -- 2. Excluir sessões Wi-Fi do visitante
  DELETE FROM public.wifi_sessions WHERE visitor_id = p_visitor_id;

  -- 3. Excluir resgates de campanhas se a tabela existir
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campaign_redemptions') THEN
    EXECUTE 'DELETE FROM public.campaign_redemptions WHERE visitor_id = $1' USING p_visitor_id;
  END IF;

  -- 4. Excluir respostas de pesquisas se a tabela existir
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campaign_survey_responses') THEN
    EXECUTE 'DELETE FROM public.campaign_survey_responses WHERE visitor_id = $1' USING p_visitor_id;
  END IF;

  -- 5. Excluir o visitante da tabela principal
  DELETE FROM public.visitors WHERE id = p_visitor_id;

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Falha na exclusão atômica do visitante: %', SQLERRM;
END;
$$;
