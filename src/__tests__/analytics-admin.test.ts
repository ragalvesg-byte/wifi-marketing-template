import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../app/api/admin/analytics/route';

const mockSelect = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();

const mockSupabase = {
  from: vi.fn().mockImplementation(() => ({
    select: mockSelect,
  })),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-user' } } }),
  }
};

vi.mock('@/lib/supabase/server', () => ({
  createServerClientInstance: () => Promise.resolve(mockSupabase),
}));

describe('Admin Analytics API Route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockSelect.mockReset();
    mockGte.mockReset();
    mockLte.mockReset();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin-user' } } });
  });

  it('deve retornar 401 Unauthorized se o usuário não estiver logado', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

    const req = new Request('http://localhost/api/admin/analytics');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Não autorizado');
  });

  it('deve usar o período padrão de últimos 7 dias se nenhuma data for fornecida', async () => {
    mockSelect.mockImplementation(() => ({
      gte: mockGte.mockImplementation(() => ({
        lte: mockLte.mockResolvedValue({ data: [], error: null })
      }))
    }));

    const req = new Request('http://localhost/api/admin/analytics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.period).toBeDefined();

    const start = new Date(data.period.start);
    const end = new Date(data.period.end);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    // Deve ser aproximadamente 7 dias (devido a microssegundos pode dar fracionado próximo a 7)
    expect(diffDays).toBeCloseTo(7, 0);
  });

  it('deve retornar 400 se apenas uma das datas for fornecida', async () => {
    const req = new Request('http://localhost/api/admin/analytics?startDate=2026-08-01');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Ambas as datas');
  });

  it('deve retornar 400 se forem passadas datas com formato inválido', async () => {
    const req = new Request('http://localhost/api/admin/analytics?startDate=invalido&endDate=2026-08-04');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('inválidos');
  });

  it('deve retornar 400 se a data de início for maior que a de fim', async () => {
    const req = new Request('http://localhost/api/admin/analytics?startDate=2026-08-05&endDate=2026-08-04');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('não pode ser maior');
  });

  it('deve retornar 400 se o período selecionado for maior que 90 dias', async () => {
    const req = new Request('http://localhost/api/admin/analytics?startDate=2026-01-01&endDate=2026-05-01');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('90 dias');
  });

  it('deve tratar e retornar métricas vazias (estado sem dados) apropriadamente', async () => {
    mockSelect.mockImplementation(() => ({
      gte: mockGte.mockImplementation(() => ({
        lte: mockLte.mockResolvedValue({ data: [], error: null })
      }))
    }));

    const req = new Request('http://localhost/api/admin/analytics?startDate=2026-08-01&endDate=2026-08-04');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.metrics.portalOpenings).toBe(0);
    expect(data.metrics.wifiSessions).toBe(0);
    expect(data.chartVisits).toEqual([]);
  });

  it('deve realizar deduplicação de aberturas de portal e visualizações/cliques de campanha corretamente', async () => {
    const mockEvents = [
      // Portal Openings: 3 eventos, mas apenas 2 sessões diferentes (anon-1 e wifi-1). O terceiro evento simula recarga na mesma sessão
      { event_type: 'PORTAL_VIEWED', anonymous_session_id: 'anon-1', wifi_session_id: null },
      { event_type: 'PORTAL_VIEWED', anonymous_session_id: 'anon-1', wifi_session_id: null },
      { event_type: 'PORTAL_VIEWED', anonymous_session_id: null, wifi_session_id: 'wifi-1' },

      // Campaign Views: 3 eventos para camp-1, mas 2 na mesma sessão 'wifi-1'. Total visualizações deduplicadas da campanha deve ser 2
      { event_type: 'CAMPAIGN_VIEWED', campaign_id: 'camp-1', wifi_session_id: 'wifi-1' },
      { event_type: 'CAMPAIGN_VIEWED', campaign_id: 'camp-1', wifi_session_id: 'wifi-1' },
      { event_type: 'CAMPAIGN_VIEWED', campaign_id: 'camp-1', wifi_session_id: 'wifi-2' },

      // Campaign Clicks: 2 eventos para camp-1 na mesma sessão 'wifi-1'. Total cliques deduplicados deve ser 1
      { event_type: 'CAMPAIGN_CLICKED', campaign_id: 'camp-1', wifi_session_id: 'wifi-1' },
      { event_type: 'CAMPAIGN_CLICKED', campaign_id: 'camp-1', wifi_session_id: 'wifi-1' },

      // Cliques em redes/cardápios individuais
      { event_type: 'INSTAGRAM_CLICKED', visitor_id: 'v1' },
      { event_type: 'MENU_CLICKED', visitor_id: 'v1' },
      { event_type: 'GOOGLE_REVIEW_CLICKED', visitor_id: 'v1' },
    ];

    const mockSessions = [
      { id: 'wifi-1', visitor_id: 'v1', started_at: '2026-08-02T12:00:00Z' },
      { id: 'wifi-2', visitor_id: 'v2', started_at: '2026-08-03T15:30:00Z' },
    ];

    // Mock das campanhas ativas
    const mockCampaignsList = [
      { id: 'camp-1', title: 'Oferta Especial de Pizza', status: 'ACTIVE', start_date: null, end_date: null }
    ];

    // Mocking sequencial do Supabase Client:
    // 1. Busca em visitor_events
    mockSelect.mockImplementationOnce(() => ({
      gte: () => ({
        lte: () => Promise.resolve({ data: mockEvents, error: null })
      })
    }));

    // 2. Busca em wifi_sessions
    mockSelect.mockImplementationOnce(() => ({
      gte: () => ({
        lte: () => Promise.resolve({ data: mockSessions, error: null })
      })
    }));

    // 3. Busca em campaigns (para o map)
    mockSelect.mockImplementationOnce(() => Promise.resolve({ data: mockCampaignsList, error: null }));

    const req = new Request('http://localhost/api/admin/analytics?startDate=2026-08-01&endDate=2026-08-04');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    // Verificações
    expect(data.metrics.portalOpenings).toBe(2); // 3 eventos, mas 2 sessões únicas
    expect(data.metrics.campaignViews).toBe(2);    // 3 visualizações, mas 2 sessões únicas
    expect(data.metrics.campaignClicks).toBe(1);   // 2 cliques, mas 1 sessão única
    expect(data.metrics.instagramClicks).toBe(1);
    expect(data.metrics.menuClicks).toBe(1);
    expect(data.metrics.googleClicks).toBe(1);

    // CTR: 1 clique / 2 visualizações * 100 = 50%
    expect(data.metrics.ctr).toBe(50);
  });

  it('deve retornar CTR zero se não existirem visualizações de campanha', async () => {
    const mockEvents = [
      { event_type: 'PORTAL_VIEWED', anonymous_session_id: 'anon-1', wifi_session_id: null },
    ];

    // 1. Busca em visitor_events
    mockSelect.mockImplementationOnce(() => ({
      gte: () => ({
        lte: () => Promise.resolve({ data: mockEvents, error: null })
      })
    }));

    // 2. Busca em wifi_sessions
    mockSelect.mockImplementationOnce(() => ({
      gte: () => ({
        lte: () => Promise.resolve({ data: [], error: null })
      })
    }));

    // 3. Busca em campaigns
    mockSelect.mockImplementationOnce(() => Promise.resolve({ data: [], error: null }));

    const req = new Request('http://localhost/api/admin/analytics?startDate=2026-08-01&endDate=2026-08-04');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.metrics.campaignViews).toBe(0);
    expect(data.metrics.ctr).toBe(0);
  });

  it('deve agrupar visitas por dia e horário no fuso America/Sao_Paulo', async () => {
    const mockSessions = [
      // started_at em UTC. Em America/Sao_Paulo (UTC-3), isso cai em 2026-08-01 21:00:00 (dia 01)
      { id: 's1', visitor_id: 'v1', started_at: '2026-08-02T00:00:00Z' }, 
      // started_at em UTC. Em America/Sao_Paulo, cai em 2026-08-02 07:00:00 (dia 02, hora 7)
      { id: 's2', visitor_id: 'v2', started_at: '2026-08-02T10:00:00Z' },
    ];

    mockSelect.mockImplementationOnce(() => ({
      gte: () => ({
        lte: () => Promise.resolve({ data: [], error: null })
      })
    }));

    mockSelect.mockImplementationOnce(() => ({
      gte: () => ({
        lte: () => Promise.resolve({ data: mockSessions, error: null })
      })
    }));

    mockSelect.mockImplementationOnce(() => Promise.resolve({ data: [], error: null }));

    const req = new Request('http://localhost/api/admin/analytics?startDate=2026-08-01&endDate=2026-08-04');
    const res = await GET(req);
    const data = await res.json();

    // Verificação de agrupamento diário
    expect(data.chartVisits).toContainEqual({ date: '2026-08-01', visits: 1 });
    expect(data.chartVisits).toContainEqual({ date: '2026-08-02', visits: 1 });

    // Verificação de agrupamento de horário (s2 está na hora 7 no fuso de SP)
    expect(data.chartHourly[7].visits).toBe(1);
    expect(data.chartHourly[21].visits).toBe(1);
  });

  it('deve separar novos e recorrentes de acordo com os tipos de eventos recebidos', async () => {
    const mockEvents = [
      { event_type: 'VISITOR_REGISTERED', visitor_id: 'v1' },
      { event_type: 'VISITOR_RETURNED', visitor_id: 'v2' },
      { event_type: 'VISITOR_RETURNED', visitor_id: 'v3' },
    ];

    mockSelect.mockImplementationOnce(() => ({
      gte: () => ({
        lte: () => Promise.resolve({ data: mockEvents, error: null })
      })
    }));

    mockSelect.mockImplementationOnce(() => ({
      gte: () => ({
        lte: () => Promise.resolve({ data: [], error: null })
      })
    }));

    mockSelect.mockImplementationOnce(() => Promise.resolve({ data: [], error: null }));

    const req = new Request('http://localhost/api/admin/analytics?startDate=2026-08-01&endDate=2026-08-04');
    const res = await GET(req);
    const data = await res.json();

    expect(data.metrics.newRegistrations).toBe(1);
    expect(data.metrics.returningVisitors).toBe(2);
  });

  it('nunca deve retornar dados pessoais dos visitantes como e-mail, telefone, nome, MAC ou IP', async () => {
    const mockEvents = [
      { event_type: 'PORTAL_VIEWED', visitor_id: 'v1', metadata: { ip: '192.168.1.1', mac: '00:11:22:33:44:55' } },
    ];

    const mockSessions = [
      { id: 's1', visitor_id: 'v1', ip_address: '192.168.1.1', mac_address: '00:11:22:33:44:55', started_at: '2026-08-02T12:00:00Z' },
    ];

    mockSelect.mockImplementationOnce(() => ({
      gte: () => ({
        lte: () => Promise.resolve({ data: mockEvents, error: null })
      })
    }));

    mockSelect.mockImplementationOnce(() => ({
      gte: () => ({
        lte: () => Promise.resolve({ data: mockSessions, error: null })
      })
    }));

    mockSelect.mockImplementationOnce(() => Promise.resolve({ data: [], error: null }));

    const req = new Request('http://localhost/api/admin/analytics?startDate=2026-08-01&endDate=2026-08-04');
    const res = await GET(req);
    const data = await res.json();

    // Dados agregados gerais
    expect(data.metrics).toBeDefined();
    
    // Nenhuma informação sensitiva deve vazar nos nós raiz ou objetos da resposta
    const stringified = JSON.stringify(data);
    expect(stringified).not.toContain('00:11:22:33:44:55');
    expect(stringified).not.toContain('192.168.1.1');
    expect(stringified).not.toContain('mac_address');
    expect(stringified).not.toContain('ip_address');
    expect(stringified).not.toContain('email');
    expect(stringified).not.toContain('phone');
    expect(stringified).not.toContain('name');
  });
});
