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
      const req = new Request('http://localhost/api/portal/campaigns?isDemo=true');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.isDemo).toBe(true);
      expect(data.campaigns.length).toBeGreaterThan(0);
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
          type: 'COUPON',
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

      // Mock do redemptions (nenhuma)
      mockSelect.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ data: [] }),
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

      // Mock redemptions (nenhuma)
      mockSelect.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ data: [] }),
      }));

      const req = new Request('http://localhost/api/portal/campaigns?visitorId=v2');
      const res = await GET(req);
      const data = await res.json();

      expect(data.campaigns.length).toBe(1);
      expect(data.campaigns[0].id).toBe('c-fem');
    });

    it('deve filtrar campanhas por mês de aniversário', async () => {
      const currentMonth = new Date().getMonth() + 1;

      // Mock do visitante nascido neste mês
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockImplementationOnce(() => ({
          single: () => Promise.resolve({ data: { id: 'v3', total_visits: 3, date_of_birth: `1990-0${currentMonth}-15` } }),
        })),
      }));

      // Mock campanhas (uma aniversário mês atual, uma outro mês)
      const mockCampaigns = [
        {
          id: 'c-bday',
          type: 'PROMO',
          status: 'ACTIVE',
          campaign_audiences: [{ target_type: 'BIRTHDAY_MONTH', rules: { birthday_month: currentMonth } }],
        },
        {
          id: 'c-other-bday',
          type: 'PROMO',
          status: 'ACTIVE',
          campaign_audiences: [{ target_type: 'BIRTHDAY_MONTH', rules: { birthday_month: currentMonth === 12 ? 1 : currentMonth + 1 } }],
        },
      ];

      mockSelect.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ data: mockCampaigns }),
      }));

      // Mock redemptions (nenhuma)
      mockSelect.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ data: [] }),
      }));

      const req = new Request('http://localhost/api/portal/campaigns?visitorId=v3');
      const res = await GET(req);
      const data = await res.json();

      expect(data.campaigns.length).toBe(1);
      expect(data.campaigns[0].id).toBe('c-bday');
    });

    it('deve ocultar cupons que o visitante já resgatou', async () => {
      // Mock do visitante
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockImplementationOnce(() => ({
          single: () => Promise.resolve({ data: { id: 'v4', total_visits: 3 } }),
        })),
      }));

      // Mock campanhas com cupons
      const mockCampaigns = [
        {
          id: 'c-coupon-1',
          type: 'COUPON',
          status: 'ACTIVE',
          campaign_audiences: [{ target_type: 'ALL', rules: {} }],
          coupons: [{ id: 'coupon-redeemed', code: 'PROMO10' }],
        },
        {
          id: 'c-coupon-2',
          type: 'COUPON',
          status: 'ACTIVE',
          campaign_audiences: [{ target_type: 'ALL', rules: {} }],
          coupons: [{ id: 'coupon-active', code: 'PROMO20' }],
        },
      ];

      mockSelect.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ data: mockCampaigns }),
      }));

      // Mock de resgates (visitante resgatou o coupon-redeemed)
      mockSelect.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ data: [{ coupon_id: 'coupon-redeemed' }] }),
      }));

      const req = new Request('http://localhost/api/portal/campaigns?visitorId=v4');
      const res = await GET(req);
      const data = await res.json();

      expect(data.campaigns.length).toBe(1);
      expect(data.campaigns[0].id).toBe('c-coupon-2'); // Apenas o cupom não resgatado
    });
  });

  describe('POST coupon redemption', () => {
    it('deve registrar resgates de cupom com sucesso e atualizar contador', async () => {
      // 1. Mock do cupom ativo
      mockSelect.mockImplementationOnce(() => ({
        select: vi.fn(),
        eq: vi.fn().mockImplementationOnce(() => ({
          single: () => Promise.resolve({
            data: { id: 'coupon-id-1', expires_at: null, max_redemptions: 100, current_redemptions: 10 },
          }),
        })),
      }));

      // 2. Mock do insert na tabela de redemptions
      mockInsert.mockImplementationOnce(() => Promise.resolve({ error: null }));

      // 3. Mock do update do contador de redemptions
      mockUpdate.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ error: null }),
      }));

      const req = new Request('http://localhost/api/portal/campaigns', {
        method: 'POST',
        body: JSON.stringify({ coupon_id: 'coupon-id-1', visitor_id: 'visitor-id-1' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro 400 se o cupom estiver expirado', async () => {
      // Mock do cupom expirado
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      mockSelect.mockImplementationOnce(() => ({
        select: vi.fn(),
        eq: vi.fn().mockImplementationOnce(() => ({
          single: () => Promise.resolve({
            data: { id: 'coupon-exp', expires_at: yesterday, max_redemptions: 100, current_redemptions: 10 },
          }),
        })),
      }));

      const req = new Request('http://localhost/api/portal/campaigns', {
        method: 'POST',
        body: JSON.stringify({ coupon_id: 'coupon-exp', visitor_id: 'visitor-id-1' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('já expirou');
    });
  });
});
