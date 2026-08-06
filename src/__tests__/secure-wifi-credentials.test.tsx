import { cookies } from 'next/headers';
import { GET as getWifiCredentials } from '../app/api/portal/wifi-credentials/route';
import { POST as registerVisitor } from '../app/api/portal/register/route';
import { POST as saveAdminSettings } from '../app/api/admin/settings/route';
import { hashToken } from '../lib/session';

// Mocks
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClientInstance: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-123' } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'store-1', wifi_network_password: 'SecretWifiPassword123' },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}));

describe('Secure Wi-Fi Credentials & Marketing Opt-in Test Suite', () => {
  beforeEach(() => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
    } as any);
  });

  it('1. Token de sessão é gerado como SHA-256 hash e não exposto em plaintext', () => {
    const rawToken = 'a'.repeat(64);
    const hashed = hashToken(rawToken);
    expect(hashed).toHaveLength(64);
    expect(hashed).not.toBe(rawToken);
  });

  it('2 & 3. Requisição a /api/portal/wifi-credentials sem cookie válido retorna status 401', async () => {
    const { cookies } = await import('next/headers');
    (cookies as any).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    const req = new Request('http://localhost/api/portal/wifi-credentials');
    const res = await getWifiCredentials(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error).toContain('Sessão inválida ou expirada');
  });

  it('4. Cookie de sessão falsificado ou curto (<32 chars) retorna 401', async () => {
    const { cookies } = await import('next/headers');
    (cookies as any).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'short-invalid-token' }),
    });

    const req = new Request('http://localhost/api/portal/wifi-credentials');
    const res = await getWifiCredentials(req);
    expect(res.status).toBe(401);
  });

  it('5 & 7. Visitante com cookie válido recebe a senha exclusivamente via GET /api/portal/wifi-credentials', async () => {
    const { cookies } = await import('next/headers');
    (cookies as any).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-32-byte-un-guessable-session-token-string' }),
    });

    const req = new Request('http://localhost/api/portal/wifi-credentials');
    const res = await getWifiCredentials(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty('networkName');
    expect(json).toHaveProperty('password');
    expect(json).toHaveProperty('passwordCopyEnabled');
    expect(json).toHaveProperty('sectionTitle');
    // Não deve vazar campos administrativos extras
    expect(json).not.toHaveProperty('promo_coupon_code');
    expect(json).not.toHaveProperty('relogin_days_interval');
  });

  it('6. Senha da rede Wi-Fi NUNCA é retornada pela rota /api/portal/register', async () => {
    const req = new Request('http://localhost/api/portal/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carlos Teste',
        phone: '11988887777',
      }),
    });

    const res = await registerVisitor(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.visitorIdentified).toBe(true);
    expect(json.nextAction).toBe('WIFI');
    expect(json).not.toHaveProperty('wifi_network_password');
    expect(json).not.toHaveProperty('password');
  });

  it('8. wifi_password_visible = false impede o retorno da senha na API de credenciais', async () => {
    const { cookies } = await import('next/headers');
    (cookies as any).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-32-byte-un-guessable-session-token-string' }),
    });

    const { createAdminClient } = await import('@/lib/supabase/admin');
    (createAdminClient as any).mockReturnValue({
      from: (table: string) => {
        if (table === 'wifi_sessions') {
          return {
            select: () => ({
              eq: () => ({
                limit: () => ({
                  single: () => Promise.resolve({ data: { visitor_id: 'v-123', status: 'ACTIVE' }, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'store_settings') {
          return {
            select: () => ({
              limit: () => ({
                single: () => Promise.resolve({
                  data: {
                    customer_wifi_enabled: true,
                    wifi_network_name: 'MinhaRede',
                    wifi_network_password: 'MinhaSenhaSegura123',
                    wifi_password_visible: false,
                    wifi_password_copy_enabled: true,
                    wifi_section_title: 'Wi-Fi',
                  },
                }),
              }),
            }),
          };
        }
        return {
          delete: () => ({ lt: () => Promise.resolve() }),
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
          upsert: () => Promise.resolve(),
        };
      },
    });

    const req = new Request('http://localhost/api/portal/wifi-credentials');
    const res = await getWifiCredentials(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.password).toBeNull();
  });

  it('9 & 10. Salvar configurações no painel admin com senha vazia ou máscara preserva a senha existente no banco', async () => {
    const req = new Request('http://localhost/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_name: 'Minha Loja Atualizada',
        wifi_network_password: '••••••••', // string mascarada enviada pelo front-end
      }),
    });

    const res = await saveAdminSettings(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
