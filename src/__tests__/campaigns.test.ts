import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../app/api/portal/campaigns/route';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

const mockSupabase = {
  from: vi.fn().mockImplementation(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  })),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}));

describe('Portal Campaigns Matching Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockSelect.mockReset();
    mockEq.mockReset();
    mockSingle.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
  });

  describe('GET matching rules', () => {
    it('deve retornar campanhas de demonstração se isDemo=true', async () => {
      process.env.DEMO_MODE = 'true';
      const req = new Request('http://localhost/api/portal/campaigns?isDemo=true');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.isDemo).toBe(true);
      expect(data.campaigns.length).toBeGreaterThan(0);
      delete process.env.DEMO_MODE;
    });

    it('deve filtrar campanhas para novos visitantes', async () => {
      // Mock do visitante com 1 visita
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockImplementationOnce(() => ({
          single: () => Promise.resolve({ data: { id: 'v1', total_visits: 1, gender: 'Masculino' } }),
        })),
      }));

      // Mock das campanhas ativas
      const mockCampaigns = [
        {
          id: 'c1',
          type: 'PROMO',
          status: 'ACTIVE',
          campaign_audiences: [{ target_type: 'NEW_VISITORS', rules: {} }],
        },
        {
          id: 'c2',
          type: 'PROMO',
          status: 'ACTIVE',
          campaign_audiences: [{ target_type: 'RETURNING_VISITORS', rules: {} }],
        },
      ];

      mockSelect.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ data: mockCampaigns }),
      }));

      const req = new Request('http://localhost/api/portal/campaigns?visitorId=v1');
      const res = await GET(req);
      const data = await res.json();

      expect(data.campaigns.length).toBe(1);
      expect(data.campaigns[0].id).toBe('c1'); // Apenas a campanha de novos visitantes
    });

    it('deve filtrar campanhas por gênero', async () => {
      // Mock do visitante Feminino
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockImplementationOnce(() => ({
          single: () => Promise.resolve({ data: { id: 'v2', total_visits: 5, gender: 'Feminino' } }),
        })),
      }));

      // Mock das campanhas ativas (uma para Feminino, uma para Masculino)
      const mockCampaigns = [
        {
          id: 'c-fem',
          type: 'PROMO',
          status: 'ACTIVE',
          campaign_audiences: [{ target_type: 'GENDER', rules: { gender: 'Feminino' } }],
        },
        {
          id: 'c-masc',
          type: 'PROMO',
          status: 'ACTIVE',
          campaign_audiences: [{ target_type: 'GENDER', rules: { gender: 'Masculino' } }],
        },
      ];

      mockSelect.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ data: mockCampaigns }),
      }));

      const req = new Request('http://localhost/api/portal/campaigns?visitorId=v2');
      const res = await GET(req);
      const data = await res.json();

      expect(data.campaigns.length).toBe(1);
      expect(data.campaigns[0].id).toBe('c-fem');
    });

    it('deve ocultar campanhas fora do periodo de vigencia', async () => {
      // Mock do visitante
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockImplementationOnce(() => ({
          single: () => Promise.resolve({ data: { id: 'v5', total_visits: 3 } }),
        })),
      }));

      const now = Date.now();
      const future = new Date(now + 24 * 60 * 60 * 1000).toISOString();
      const past = new Date(now - 24 * 60 * 60 * 1000).toISOString();

      // Mock campanhas com datas
      const mockCampaigns = [
        {
          id: 'c-valid',
          type: 'PROMO',
          status: 'ACTIVE',
          start_date: past,
          end_date: future,
        },
        {
          id: 'c-future',
          type: 'PROMO',
          status: 'ACTIVE',
          start_date: future,
        },
        {
          id: 'c-expired',
          type: 'PROMO',
          status: 'ACTIVE',
          end_date: past,
        },
      ];

      mockSelect.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ data: mockCampaigns }),
      }));

      const req = new Request('http://localhost/api/portal/campaigns?visitorId=v5');
      const res = await GET(req);
      const data = await res.json();

      expect(data.campaigns.length).toBe(1);
      expect(data.campaigns[0].id).toBe('c-valid');
    });
  });

  describe('POST coupon redemption (legacy/deprecated endpoint)', () => {
    it('deve retornar erro 410 Gone informando que o sistema de cupom foi desativado', async () => {
      const req = new Request('http://localhost/api/portal/campaigns', {
        method: 'POST',
        body: JSON.stringify({ coupon_id: 'coupon-1', visitor_id: 'visitor-1' }),
      });

      const res = await POST();
      expect(res.status).toBe(410);
      const data = await res.json();
      expect(data.error).toBe('O sistema de resgate de cupons foi desativado.');
    });
  });
});
