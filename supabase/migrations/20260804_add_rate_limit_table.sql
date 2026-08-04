-- Migration 20260804_add_rate_limit_table: Create rate_limits table for persistent rate limiting

CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip VARCHAR(45) PRIMARY KEY,
  count INT NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow authenticated (admin) full access
DROP POLICY IF EXISTS "Admin full access on rate_limits" ON rate_limits;
CREATE POLICY "Admin full access on rate_limits"
  ON rate_limits FOR ALL TO authenticated USING (true);
