import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/portal/register/route';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockImplementation(() => null), // Force demo/no-supabase mode to run cleanly in test environment
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: () => null,
    set: () => null,
  }),
}));

describe('Portal Register API Route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve retornar erro 400 se o número de WhatsApp for inválido', async () => {
    const req = new Request('http://localhost/api/portal/register', {
      method: 'POST',
      body: JSON.stringify({ phone: '', name: 'João Silva' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('WhatsApp inválido');
  });

  it('deve retornar erro 400 se o nome for inválido', async () => {
    const req = new Request('http://localhost/api/portal/register', {
      method: 'POST',
      body: JSON.stringify({ phone: '11999999999', name: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Nome completo é obrigatório');
  });

  it('deve aplicar rate limit e retornar 429 após 5 requisições do mesmo IP', async () => {
    const payload = { phone: '11999999999', name: 'João Silva' };

    // Faz 5 requisições
    for (let i = 0; i < 5; i++) {
      const req = new Request('http://localhost/api/portal/register', {
        method: 'POST',
        headers: { 'x-forwarded-for': '1.2.3.4' },
        body: JSON.stringify(payload),
      });
      const res = await POST(req);
      expect(res.status).not.toBe(429);
    }

    // A sexta requisição do mesmo IP deve dar 429
    const req6 = new Request('http://localhost/api/portal/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify(payload),
    });
    const res6 = await POST(req6);
    expect(res6.status).toBe(429);
    const data = await res6.json();
    expect(data.error).toContain('Muitas requisições');
  });
});
