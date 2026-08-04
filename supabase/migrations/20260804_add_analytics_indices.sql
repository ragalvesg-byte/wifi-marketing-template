-- Migration 20260804_add_analytics_indices: Criar índices compostos para otimização de consultas de estatísticas
CREATE INDEX IF NOT EXISTS idx_visitor_events_type_created_at 
  ON public.visitor_events(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_visitor_events_campaign_type_created_at 
  ON public.visitor_events(campaign_id, event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_visitor_events_visitor_created_at 
  ON public.visitor_events(visitor_id, created_at);
