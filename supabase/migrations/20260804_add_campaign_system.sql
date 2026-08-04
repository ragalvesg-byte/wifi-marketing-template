-- Migration 20260804_add_campaign_system: Create campaigns, campaign_audiences, coupons, and coupon_redemptions tables

-- 1. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'PROMO', 'COUPON', 'BANNER', 'SURVEY'
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED'
  media_url TEXT,
  media_type VARCHAR(20) DEFAULT 'IMAGE', -- 'IMAGE', 'VIDEO'
  aspect_ratio VARCHAR(10) DEFAULT '4:5', -- '9:16', '4:5', '1:1', '16:9'
  button_text VARCHAR(255),
  button_url TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Campaign Audiences (Targeting/Rules) Table
CREATE TABLE IF NOT EXISTS public.campaign_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  target_type VARCHAR(50) NOT NULL, -- 'ALL', 'NEW_VISITORS', 'RETURNING_VISITORS', 'GENDER', 'BIRTHDAY_MONTH', 'CUSTOM_SEGMENT'
  rules JSONB DEFAULT '{}'::jsonb, -- e.g., {"gender": "Feminino", "birthday_month": 8}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL, -- 'PERCENTAGE', 'FIXED'
  discount_value NUMERIC(10,2) NOT NULL,
  expires_at TIMESTAMPTZ,
  max_redemptions INT,
  current_redemptions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Coupon Redemptions Table
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT unique_visitor_coupon_redemption UNIQUE(coupon_id, visitor_id)
);

-- 5. Indexes for optimization
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON public.campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaign_audiences_campaign ON public.campaign_audiences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_coupons_campaign ON public.coupons(campaign_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_visitor ON public.coupon_redemptions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Campaigns Policies
DROP POLICY IF EXISTS "Admin full access on campaigns" ON public.campaigns;
CREATE POLICY "Admin full access on campaigns"
  ON public.campaigns FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Anon select active campaigns" ON public.campaigns;
CREATE POLICY "Anon select active campaigns"
  ON public.campaigns FOR SELECT TO anon USING (status = 'ACTIVE');

-- Campaign Audiences Policies
DROP POLICY IF EXISTS "Admin full access on campaign_audiences" ON public.campaign_audiences;
CREATE POLICY "Admin full access on campaign_audiences"
  ON public.campaign_audiences FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Anon select active campaign_audiences" ON public.campaign_audiences;
CREATE POLICY "Anon select active campaign_audiences"
  ON public.campaign_audiences FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_audiences.campaign_id AND c.status = 'ACTIVE'
    )
  );

-- Coupons Policies
DROP POLICY IF EXISTS "Admin full access on coupons" ON public.coupons;
CREATE POLICY "Admin full access on coupons"
  ON public.coupons FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Anon select active coupons" ON public.coupons;
CREATE POLICY "Anon select active coupons"
  ON public.coupons FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = coupons.campaign_id AND c.status = 'ACTIVE'
    )
  );

-- Coupon Redemptions Policies
DROP POLICY IF EXISTS "Admin full access on coupon_redemptions" ON public.coupon_redemptions;
CREATE POLICY "Admin full access on coupon_redemptions"
  ON public.coupon_redemptions FOR ALL TO authenticated USING (true);
