import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/portal/events/route';
import { sendVisitorEvent, getAnonymousSessionId } from '../lib/events';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockImplementation(() => null), // Run in demo/no-supabase mode for test cleanliness
}));

describe('Portal Events Pipeline API & Helper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
  });

  describe('API Endpoint /api/portal/events', () => {
    it('deve rejeitar eventos não permitidos com status 400', async () => {
      const req = new Request('http://localhost/api/portal/events', {
        method: 'POST',
        body: JSON.stringify({ event_type: 'INVALID_EVENT' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Tipo de evento inválido');
    });

    it('deve aceitar eventos permitidos com status 200', async () => {
      const req = new Request('http://localhost/api/portal/events', {
        method: 'POST',
        body: JSON.stringify({
          event_type: 'PORTAL_VIEWED',
          metadata: { device: 'mobile' },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('deve rejeitar metadados de tamanho excessivo', async () => {
      const hugeMetadata = { data: 'a'.repeat(6000) }; // Excede 5KB
      const req = new Request('http://localhost/api/portal/events', {
        method: 'POST',
        body: JSON.stringify({
          event_type: 'PORTAL_VIEWED',
          metadata: hugeMetadata,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Tamanho de metadados excede');
    });

    it('deve anonimizar IP do visitante na resposta/logs', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const req = new Request('http://localhost/api/portal/events', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.15' },
        body: JSON.stringify({
          event_type: 'GOOGLE_REVIEW_CLICKED',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // O console.log no modo demonstração deve mostrar o IP anonimizado (último octeto como .0)
      const loggedArgs = consoleLogSpy.mock.calls[0][1];
      expect(loggedArgs.metadata.anonymized_ip).toBe('192.168.1.0');
    });

    it('deve aplicar rate limit de 30 requisições por IP', async () => {
      const payload = { event_type: 'PORTAL_VIEWED' };

      for (let i = 0; i < 30; i++) {
        const req = new Request('http://localhost/api/portal/events', {
          method: 'POST',
          headers: { 'x-forwarded-for': '9.9.9.9' },
          body: JSON.stringify(payload),
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
      }

      // A 31ª requisição deve dar 429
      const req31 = new Request('http://localhost/api/portal/events', {
        method: 'POST',
        headers: { 'x-forwarded-for': '9.9.9.9' },
        body: JSON.stringify(payload),
      });
      const res31 = await POST(req31);
      expect(res31.status).toBe(429);
    });
  });

  describe('Client Side Helper sendVisitorEvent', () => {
    it('deve gerar session ID anônimo persistente', () => {
      const id1 = getAnonymousSessionId();
      const id2 = getAnonymousSessionId();
      expect(id1).toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
    });

    it('deve evitar duplicidade de PORTAL_VIEWED na mesma sessão', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as any)
      );

      sendVisitorEvent('PORTAL_VIEWED');
      sendVisitorEvent('PORTAL_VIEWED'); // Segunda chamada na mesma sessão

      // Aguarda execução da microtask assíncrona
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Deve disparar o fetch apenas uma vez para PORTAL_VIEWED
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});
