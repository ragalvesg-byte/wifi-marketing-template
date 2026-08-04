import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getPortalCampaigns } from '../app/api/portal/campaigns/route';
import { PUT as putAdminCampaigns, POST as postAdminCampaigns, DELETE as deleteAdminCampaigns } from '../app/api/admin/campaigns/route';
import { POST as postAdminSettings, GET as getAdminSettings } from '../app/api/admin/settings/route';
import React from 'react';

// Mock Supabase admin and server clients
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

const mockSupabase = {
  from: vi.fn().mockImplementation(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })),
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: 'admin-user-1' } } }),
  }
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClientInstance: () => Promise.resolve(mockSupabase),
}));

// Mock Lucide Icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react') as any;
  return {
    ...actual,
    Wifi: () => React.createElement('div', { 'data-testid': 'wifi-icon' }, 'Wifi'),
    WifiOff: () => React.createElement('div', { 'data-testid': 'wifi-off-icon' }, 'WifiOff'),
    CheckCircle2: () => React.createElement('div', { 'data-testid': 'check-icon' }, 'CheckCircle2'),
    Star: () => React.createElement('div', { 'data-testid': 'star-icon' }, 'Star'),
    Camera: () => React.createElement('div', { 'data-testid': 'camera-icon' }, 'Camera'),
    Utensils: () => React.createElement('div', { 'data-testid': 'utensils-icon' }, 'Utensils'),
    X: () => React.createElement('div', { 'data-testid': 'close-icon' }, 'X'),
    Loader2: () => React.createElement('div', { 'data-testid': 'loader-icon' }, 'Loader2'),
  };
});

describe('Wi-Fi Marketing Stabilization Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockSelect.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
    delete process.env.DEMO_MODE;
  });

  describe('Bug 1 & 2 - Portal campaigns and Mocks', () => {
    it('portal sem campanha deve retornar lista vazia sem mocks se DEMO_MODE nao for true', async () => {
      // Mock db returns empty active campaigns
      mockSelect.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ data: [] }),
      }));

      const req = new Request('http://localhost/api/portal/campaigns');
      const res = await getPortalCampaigns(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.isDemo).toBe(false);
      expect(data.campaigns).toEqual([]);
    });

    it('portal com campanha para todos deve retornar a campanha real', async () => {
      // Mock active campaigns database response
      const mockRealCampaigns = [
        {
          id: 'camp-real-1',
          title: 'Campanha de Pizza Real',
          type: 'PROMO',
          status: 'ACTIVE',
          campaign_audiences: [{ target_type: 'ALL', rules: {} }],
        }
      ];

      mockSelect.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ data: mockRealCampaigns }),
      }));

      const req = new Request('http://localhost/api/portal/campaigns');
      const res = await getPortalCampaigns(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.campaigns.length).toBe(1);
      expect(data.campaigns[0].id).toBe('camp-real-1');
    });
  });

  describe('Bug 3 - settings redirection automation', () => {
    it('deve salvar e carregar corretamente a configuracao de redirecionamento', async () => {
      // POST settings with 0 seconds (NONE/ON_CLICK)
      mockSelect.mockImplementationOnce(() => ({
        limit: vi.fn().mockImplementationOnce(() => ({
          single: () => Promise.resolve({ data: { id: 'settings-id' } }),
        })),
      }));

      mockUpdate.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ error: null }),
      }));

      const payload = {
        post_signup_redirect_mode: 'NONE',
        post_signup_redirect_seconds: 0,
      };

      const req = new Request('http://localhost/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await postAdminSettings(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verificamos que o mockUpdate foi chamado com a propriedade seconds igual a 0
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        post_signup_redirect_seconds: 0,
      }));
    });
  });

  describe('Bug 4 - Campaign CRUD Put and Delete', () => {
    it('deve editar uma campanha com sucesso via PUT', async () => {
      // Mocks para leituras iniciais (estado anterior):
      // 1. SELECT campaigns
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockImplementationOnce(() => ({
          maybeSingle: () => Promise.resolve({ data: { id: 'camp-id-to-edit', title: 'Antiga', type: 'PROMO' } }),
        })),
      }));
      // 2. SELECT campaign_audiences
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockImplementationOnce(() => ({
          maybeSingle: () => Promise.resolve({ data: { id: 'audience-1', target_type: 'ALL' } }),
        })),
      }));

      // Mocks das operações de alteração:
      // 3. UPDATE campaigns
      mockUpdate.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ error: null }),
      }));

      // 4. SELECT existing audience para decidir update ou insert
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockImplementationOnce(() => ({
          maybeSingle: () => Promise.resolve({ data: { id: 'audience-1' } }),
        })),
      }));

      // 5. UPDATE campaign_audiences
      mockUpdate.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ error: null }),
      }));

      const payload = {
        id: 'camp-id-to-edit',
        title: 'Campanha Editada Sucesso',
        type: 'PROMO',
        status: 'ACTIVE',
        target_type: 'ALL',
      };

      const req = new Request('http://localhost/api/admin/campaigns', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const res = await putAdminCampaigns(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Duas atualizações: campanha e regras de público
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it('deve executar rollback se a atualizacao das regras de publico-alvo falhar no PUT', async () => {
      // Mocks para leituras iniciais (estado anterior):
      // 1. SELECT campaigns
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockImplementationOnce(() => ({
          maybeSingle: () => Promise.resolve({ data: { id: 'camp-id-to-edit', title: 'Antiga', type: 'PROMO' } }),
        })),
      }));
      // 2. SELECT campaign_audiences
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockImplementationOnce(() => ({
          maybeSingle: () => Promise.resolve({ data: { id: 'audience-1', target_type: 'ALL', rules: {} } }),
        })),
      }));

      // 3. UPDATE campaigns (sucesso)
      mockUpdate.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ error: null }),
      }));

      // 4. SELECT existing audience para decidir update ou insert
      mockSelect.mockImplementationOnce(() => ({
        eq: vi.fn().mockImplementationOnce(() => ({
          maybeSingle: () => Promise.resolve({ data: { id: 'audience-1' } }),
        })),
      }));

      // 5. UPDATE campaign_audiences (FALHA)
      mockUpdate.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ error: new Error('Banco fora do ar ao salvar público') }),
      }));

      // --- MOCKS DO ROLLBACK (executados após falha) ---
      // 6. Reverter UPDATE campaigns
      mockUpdate.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ error: null }),
      }));
      // 7. Reverter UPDATE campaign_audiences
      mockUpdate.mockImplementationOnce(() => ({
        eq: () => Promise.resolve({ error: null }),
      }));

      const payload = {
        id: 'camp-id-to-edit',
        title: 'Campanha Editada Tentativa',
        type: 'PROMO',
        status: 'ACTIVE',
        target_type: 'ALL',
      };

      const req = new Request('http://localhost/api/admin/campaigns', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const res = await putAdminCampaigns(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain('Alterações revertidas');

      // Verifica se as funções de rollback foram acionadas
      expect(mockUpdate).toHaveBeenCalledTimes(4); 
    });
  });
});
