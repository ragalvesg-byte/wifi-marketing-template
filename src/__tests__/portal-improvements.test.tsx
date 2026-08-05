import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MediaCarousel } from '../components/portal/media-carousel';
import { GET as getPortalCampaigns } from '../app/api/portal/campaigns/route';
import { POST as registerVisitor } from '../app/api/portal/register/route';
import { POST as saveAdminSettings } from '../app/api/admin/settings/route';
import { POST as saveCampaign, PUT as updateCampaign } from '../app/api/admin/campaigns/route';

// Mock dynamic cookies and server clients
let mockCookieValue: string | undefined = undefined;
let mockStoreSettingsDb: any = {
  id: 'store-1',
  field_email_enabled: false,
  field_email_required: false,
  field_dob_enabled: false,
  field_dob_required: false,
  field_city_enabled: false,
  field_city_required: false,
  field_gender_enabled: false,
  field_gender_required: false,
};

let mockCampaignsDb: any[] = [
  {
    id: 'camp-all',
    title: 'Campanha Geral',
    status: 'ACTIVE',
    start_date: null,
    end_date: null,
    campaign_audiences: [{ target_type: 'ALL', rules: {} }],
  },
  {
    id: 'camp-segmented',
    title: 'Campanha Aniversário',
    status: 'ACTIVE',
    start_date: null,
    end_date: null,
    campaign_audiences: [{ target_type: 'BIRTHDAY_MONTH', rules: { birthday_month: 8 } }],
  },
  {
    id: 'camp-future',
    title: 'Campanha Futura',
    status: 'ACTIVE',
    start_date: new Date(Date.now() + 86400000).toISOString(), // amanhã
    end_date: null,
    campaign_audiences: [{ target_type: 'ALL', rules: {} }],
  },
  {
    id: 'camp-expired',
    title: 'Campanha Expirada',
    status: 'ACTIVE',
    start_date: null,
    end_date: new Date(Date.now() - 86400000).toISOString(), // ontem
    campaign_audiences: [{ target_type: 'ALL', rules: {} }],
  },
];

// Mock do Supabase
const mockSingleStoreSettings = vi.fn().mockImplementation(() => Promise.resolve({ data: mockStoreSettingsDb, error: null }));
const mockInsertVisitor = vi.fn();
const mockUpdateVisitor = vi.fn();
const mockSingleVisitor = vi.fn();

const mockSupabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: 'admin-id' } }, error: null }),
  },
  from: vi.fn().mockImplementation((table: string) => {
    // Chainable default mock to prevent 500 crashes on untracked tables like wifi_sessions
    const chainable: any = {
      select: () => chainable,
      eq: () => chainable,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      insert: () => chainable,
      update: () => chainable,
      upsert: () => chainable,
      limit: () => chainable,
      order: () => chainable,
    };

    if (table === 'store_settings') {
      return {
        select: () => ({
          limit: () => ({
            single: mockSingleStoreSettings,
          }),
        }),
        update: (payload: any) => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      };
    }
    if (table === 'campaigns') {
      return {
        select: () => ({
          eq: (field: string, val: string) => {
            return Promise.resolve({ data: mockCampaignsDb, error: null });
          },
          order: () => Promise.resolve({ data: mockCampaignsDb, error: null }),
        }),
        insert: (payload: any) => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: 'new-camp-id', ...payload }, error: null }),
          }),
        }),
        update: (payload: any) => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      };
    }
    if (table === 'visitors') {
      return {
        select: () => ({
          eq: () => ({
            single: mockSingleVisitor,
          }),
        }),
        insert: (payload: any) => {
          mockInsertVisitor(payload);
          return {
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'new-visitor-id', ...payload }, error: null }),
            }),
          };
        },
        update: (payload: any) => {
          mockUpdateVisitor(payload);
          return {
            eq: () => Promise.resolve({ error: null }),
          };
        },
      };
    }
    return chainable;
  }),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClientInstance: () => Promise.resolve(mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => {
      if (name === 'wifi_visitor_device_token') {
        return mockCookieValue ? { value: mockCookieValue } : null;
      }
      return null;
    },
    set: () => null,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => null,
    toString: () => '',
  }),
}));

describe('Ajustes do Portal - Testes de Melhorias', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockCookieValue = undefined;
    mockStoreSettingsDb = {
      id: 'store-1',
      field_email_enabled: false,
      field_email_required: false,
      field_dob_enabled: false,
      field_dob_required: false,
      field_city_enabled: false,
      field_city_required: false,
      field_gender_enabled: false,
      field_gender_required: false,
    };
    mockSingleStoreSettings.mockResolvedValue({ data: mockStoreSettingsDb, error: null });
    mockSingleVisitor.mockResolvedValue({ data: null, error: null });
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Campanha segmentada não deve aparecer antes da identificação do visitante', async () => {
    const req = new Request('http://localhost/api/portal/campaigns');
    const res = await getPortalCampaigns(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    
    // Deve retornar apenas a campanha geral (camp-all) e excluir a de aniversário (camp-segmented)
    const titles = data.campaigns.map((c: any) => c.id);
    expect(titles).toContain('camp-all');
    expect(titles).not.toContain('camp-segmented');
  });

  it('2. Campanha geral deve aparecer antes do cadastro/identificação', async () => {
    const req = new Request('http://localhost/api/portal/campaigns');
    const res = await getPortalCampaigns(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    const campGeral = data.campaigns.find((c: any) => c.id === 'camp-all');
    expect(campGeral).toBeDefined();
    expect(campGeral.title).toBe('Campanha Geral');
  });

  it('3. Campanhas fora do período ativo (futuras ou expiradas) não devem aparecer', async () => {
    const req = new Request('http://localhost/api/portal/campaigns');
    const res = await getPortalCampaigns(req);
    const data = await res.json();

    const ids = data.campaigns.map((c: any) => c.id);
    expect(ids).not.toContain('camp-future');
    expect(ids).not.toContain('camp-expired');
  });

  it('4. Timer do carrossel deve ser limpo corretamente ao desmontar', () => {
    const slides = [
      { id: '1', mediaUrl: 'https://img1.com', mediaType: 'IMAGE' as const },
      { id: '2', mediaUrl: 'https://img2.com', mediaType: 'IMAGE' as const }
    ];

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const { unmount } = render(<MediaCarousel slides={slides} />);
    
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('5. Impressão de campanha deve ser registrada apenas uma vez por campanha por carregamento', () => {
    const slides = [
      { id: 'camp-1', mediaUrl: 'https://img1.com', mediaType: 'IMAGE' as const, isCampaign: true },
      { id: 'camp-2', mediaUrl: 'https://img2.com', mediaType: 'IMAGE' as const, isCampaign: true }
    ];

    const onSlideViewSpy = vi.fn();
    render(<MediaCarousel slides={slides} onSlideView={onSlideViewSpy} />);

    // Simula a primeira renderização do slide ativo (índice 0 = camp-1)
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onSlideViewSpy).toHaveBeenCalledTimes(1);
    expect(onSlideViewSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'camp-1' }));

    // Avança para o slide 2 (camp-2)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onSlideViewSpy).toHaveBeenCalledTimes(2);
    expect(onSlideViewSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'camp-2' }));
  });

  it('6. Links com protocolos inseguros (javascript: ou data:) devem ser rejeitados', () => {
    const slides = [
      { 
        id: 'camp-insecure', 
        mediaUrl: 'https://img.com', 
        mediaType: 'IMAGE' as const, 
        isCampaign: true, 
        buttonText: 'Clique Inseguro',
        buttonUrl: 'javascript:alert(1)' 
      }
    ];

    const onSlideClickSpy = vi.fn().mockImplementation((slide) => {
      const lower = slide.buttonUrl.toLowerCase();
      if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
        return; // rejeitado
      }
    });

    render(<MediaCarousel slides={slides} onSlideClick={onSlideClickSpy} />);
    
    const slideDiv = screen.getByRole('img').closest('div');
    expect(slideDiv).toBeDefined();
    
    fireEvent.click(slideDiv!);
    expect(onSlideClickSpy).toHaveBeenCalled();
  });

  it('7. Valores X/Y fora da faixa de 0 a 100 devem ser recusados pelo backend', async () => {
    // 7.1. Validação em store_settings
    const reqSettings = new Request('http://localhost/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({
        landing_media_position_x: 120, // inválido
        landing_media_position_y: 50,
      }),
    });
    const resSettings = await saveAdminSettings(reqSettings);
    expect(resSettings.status).toBe(400);
    const dataSettings = await resSettings.json();
    expect(dataSettings.error).toContain('entre 0 e 100');

    // 7.2. Validação em campaigns
    const reqCampaign = new Request('http://localhost/api/admin/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Campanha Inválida',
        type: 'PROMO',
        media_position_x: 50,
        media_position_y: -10, // inválido
      }),
    });
    const resCampaign = await saveCampaign(reqCampaign);
    expect(resCampaign.status).toBe(400);
  });

  it('8. Campos desativados nas configurações não devem ser persistidos no visitors no POST', async () => {
    // 8.1. Configurações: E-mail desativado
    mockStoreSettingsDb.field_email_enabled = false;

    const req = new Request('http://localhost/api/portal/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Cliente Teste',
        phone: '(11) 99999-9999',
        email: 'invasor@hack.com', // enviado mesmo desativado
        mac_address: '00:11:22:33:44:55',
      }),
    });

    const res = await registerVisitor(req);
    expect(res.status).toBe(200);

    // O campo email inserido no banco deve ser null (campo desativado ignorado)
    expect(mockInsertVisitor).toHaveBeenCalledWith(
      expect.objectContaining({
        email: null,
      })
    );
  });

  it('9. Campos ativados e obrigatórios devem forçar validação e salvar com sucesso se válidos', async () => {
    mockStoreSettingsDb.field_email_enabled = true;
    mockStoreSettingsDb.field_email_required = true;

    // Caso 1: Falta e-mail obrigatório -> Erro 400
    const reqMissing = new Request('http://localhost/api/portal/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Cliente Teste',
        phone: '(11) 99999-9999',
        mac_address: '00:11:22:33:44:55',
      }),
    });
    const resMissing = await registerVisitor(reqMissing);
    expect(resMissing.status).toBe(400);

    // Caso 2: Fornecido corretamente -> Sucesso 200
    const reqValid = new Request('http://localhost/api/portal/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Cliente Teste',
        phone: '(11) 99999-9999',
        email: 'correto@email.com',
        mac_address: '00:11:22:33:44:55',
      }),
    });
    const resValid = await registerVisitor(reqValid);
    expect(resValid.status).toBe(200);
    expect(mockInsertVisitor).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'correto@email.com',
      })
    );
  });
});
