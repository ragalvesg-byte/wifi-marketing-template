-- Migration 20260804_add_visitor_events_table: Create visitor_events table for tracking visitor interactions

CREATE TABLE IF NOT EXISTS public.visitor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  visitor_id UUID REFERENCES public.visitors(id) ON DELETE SET NULL,
  wifi_session_id UUID REFERENCES public.wifi_sessions(id) ON DELETE SET NULL,
  campaign_id UUID, -- No foreign key reference until campaigns table is created
  anonymous_session_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_visitor_events_type ON public.visitor_events(event_type);
CREATE INDEX IF NOT EXISTS idx_visitor_events_visitor ON public.visitor_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_wifi_session ON public.visitor_events(wifi_session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_created_at ON public.visitor_events(created_at);

-- Enable RLS
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated (admin) read access
DROP POLICY IF EXISTS "Admin read access on visitor_events" ON public.visitor_events;
CREATE POLICY "Admin read access on visitor_events"
  ON public.visitor_events FOR SELECT TO authenticated USING (true);

-- Allow authenticated (admin) write access
DROP POLICY IF EXISTS "Admin write access on visitor_events" ON public.visitor_events;
CREATE POLICY "Admin write access on visitor_events"
  ON public.visitor_events FOR ALL TO authenticated USING (true);
