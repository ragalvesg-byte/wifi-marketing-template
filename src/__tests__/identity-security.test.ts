import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as postEvent } from '../app/api/portal/events/route';

// Mock de Cookies dinâmico
let mockCookieValue: string | undefined = undefined;

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

// Mock do Supabase com rastreamento de chamadas
const mockInsertFn = vi.fn().mockReturnValue({ error: null });
const mockMaybeSingleFn = vi.fn();
const mockEqFn = vi.fn();
const mockSelectFn = vi.fn();

const mockSupabase = {
  from: vi.fn().mockImplementation((table: string) => {
    if (table === 'visitor_events') {
      return { insert: mockInsertFn };
    }
    if (table === 'visitors') {
      return {
        select: (...args: any[]) => {
          mockSelectFn(...args);
          return {
            eq: (...eqArgs: any[]) => {
              mockEqFn(...eqArgs);
              return {
                maybeSingle: mockMaybeSingleFn,
              };
            },
          };
        },
      };
    }
    return {};
  }),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}));

describe('Segurança de Identidade — Events Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieValue = undefined;
    mockMaybeSingleFn.mockResolvedValue({ data: null, error: null });
    mockInsertFn.mockReturnValue({ error: null });
  });

  it('deve ignorar visitor_id enviado pelo navegador no body do POST', async () => {
    // Atacante envia um visitor_id falso no body
    const req = new Request('http://localhost/api/portal/events', {
      method: 'POST',
      body: JSON.stringify({
        event_type: 'PORTAL_VIEWED',
        visitor_id: 'uuid-de-outro-visitante', // TENTATIVA DE INJEÇÃO
      }),
    });

    const res = await postEvent(req);
    expect(res.status).toBe(200);

    // O insert deve ter sido chamado com visitor_id = null (não o valor falso)
    expect(mockInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        visitor_id: null, // NUNCA o valor injetado
      })
    );
  });

  it('deve rejeitar cookie adulterado que não corresponde a um visitor real', async () => {
    // Cookie com UUID que não existe no banco
    mockCookieValue = 'uuid-inexistente-adulterado';
    mockMaybeSingleFn.mockResolvedValue({ data: null, error: null });

    const req = new Request('http://localhost/api/portal/events', {
      method: 'POST',
      body: JSON.stringify({ event_type: 'PORTAL_VIEWED' }),
    });

    const res = await postEvent(req);
    expect(res.status).toBe(200);

    // O insert deve ter visitor_id = null (cookie inválido foi ignorado)
    expect(mockInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        visitor_id: null,
      })
    );
  });

  it('deve aceitar cookie válido que corresponde a um visitor real no banco', async () => {
    const realVisitorId = 'visitor-real-abc-123';
    mockCookieValue = realVisitorId;
    mockMaybeSingleFn.mockResolvedValue({
      data: { id: realVisitorId },
      error: null,
    });

    const req = new Request('http://localhost/api/portal/events', {
      method: 'POST',
      body: JSON.stringify({ event_type: 'PORTAL_VIEWED' }),
    });

    const res = await postEvent(req);
    expect(res.status).toBe(200);

    // O insert deve usar o visitor_id validado
    expect(mockInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        visitor_id: realVisitorId,
      })
    );

    // Deve ter consultado o banco para validar o cookie
    expect(mockEqFn).toHaveBeenCalledWith('id', realVisitorId);
  });

  it('deve ignorar visitor_id do body mesmo quando cookie válido existe', async () => {
    const realVisitorId = 'visitor-real-xyz-789';
    mockCookieValue = realVisitorId;
    mockMaybeSingleFn.mockResolvedValue({
      data: { id: realVisitorId },
      error: null,
    });

    const req = new Request('http://localhost/api/portal/events', {
      method: 'POST',
      body: JSON.stringify({
        event_type: 'PORTAL_VIEWED',
        visitor_id: 'uuid-de-outro-visitante', // TENTATIVA DE INJEÇÃO mesmo com cookie válido
      }),
    });

    const res = await postEvent(req);
    expect(res.status).toBe(200);

    // Deve usar o visitor do cookie validado, NÃO o do body
    expect(mockInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        visitor_id: realVisitorId,
      })
    );
  });

  it('deve registrar evento sem visitor_id quando não há cookie', async () => {
    mockCookieValue = undefined;

    const req = new Request('http://localhost/api/portal/events', {
      method: 'POST',
      body: JSON.stringify({
        event_type: 'INSTAGRAM_CLICKED',
        anonymous_session_id: 'anon-session-123',
      }),
    });

    const res = await postEvent(req);
    expect(res.status).toBe(200);

    // Evento anônimo — visitor_id deve ser null
    expect(mockInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        visitor_id: null,
        anonymous_session_id: 'anon-session-123',
      })
    );
  });

  it('não deve permitir associação incorreta de evento a outro visitante via MAC do body', async () => {
    // Atacante envia um MAC de outro visitante no body
    // O events route não resolve pelo MAC, apenas pelo cookie
    const req = new Request('http://localhost/api/portal/events', {
      method: 'POST',
      body: JSON.stringify({
        event_type: 'CAMPAIGN_VIEWED',
        mac_address: 'aa:bb:cc:dd:ee:ff', // MAC de outro visitante
        visitor_id: 'visitor-de-outro', // Tentativa de injeção
      }),
    });

    const res = await postEvent(req);
    expect(res.status).toBe(200);

    // Nenhum dos valores enviados pelo navegador deve ser usado
    expect(mockInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        visitor_id: null,
      })
    );
  });
});
