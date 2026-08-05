import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getPortalSettings } from '../app/api/portal/settings/route';
import { GET as getPortalCheckMac } from '../app/api/portal/check-mac/route';

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

// Mock do Supabase
const mockSingle = vi.fn();
const mockLimit = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();

const mockSupabase = {
  from: vi.fn().mockImplementation(() => ({
    select: mockSelect,
    eq: mockEq,
    limit: mockLimit,
    single: mockSingle,
  })),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}));

describe('Supabase Dedicated Migration & RLS Security Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockSingle.mockReset();
    mockLimit.mockReset();
    mockSelect.mockReset();
    mockEq.mockReset();
    mockCookieValue = undefined;
  });

  describe('API /api/portal/settings', () => {
    it('deve retornar apenas os campos publicos permitidos (whitelist) e omitir dados administrativos/legados', async () => {
      const mockDatabaseSettings = {
        id: 'settings-1',
        store_name: 'Bistro Teste',
        logo_url: 'https://logo.png',
        background_url: 'https://bg.png',
        primary_color: '#000000',
        welcome_message: 'Bem-vindo!',
        relogin_days_interval: 5,
        promo_coupon_code: 'BISTRO10', // PRIVADO / LEGADO - Deve ser ocultado!
        post_signup_show_coupon: true, // PRIVADO / LEGADO - Deve ser ocultado!
        created_at: '2026-08-04T00:00:00Z',
      };

      mockSelect.mockReturnValue({
        limit: vi.fn().mockReturnValue({
          single: () => Promise.resolve({ data: mockDatabaseSettings, error: null }),
        }),
      });

      const res = await getPortalSettings();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.isDemo).toBe(false);
      expect(body.settings).toBeDefined();

      // Campos que DEVEM estar na resposta
      expect(body.settings.store_name).toBe('Bistro Teste');
      expect(body.settings.logo_url).toBe('https://logo.png');
      expect(body.settings.relogin_days_interval).toBe(5);

      // Campos que NÃO DEVEM estar na resposta (Segurança)
      expect(body.settings.promo_coupon_code).toBeUndefined();
      expect(body.settings.post_signup_show_coupon).toBeUndefined();
      
      // Garante que a service role key nunca vaza na resposta
      const rawResponseText = JSON.stringify(body);
      expect(rawResponseText).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(rawResponseText).not.toContain('service_role');
    });
  });

  describe('API /api/portal/check-mac', () => {
    it('deve retornar apenas as informacoes minimas necessarias para reconhecer o visitante (sem dados sensiveis)', async () => {
      const mockVisitorFromDb = {
        id: 'visitor-uuid-123',
        name: 'Carlos Santos',
        phone: '11999999999', // SENSÍVEL - Omitir!
        email: 'carlos@teste.com', // SENSÍVEL - Omitir!
        date_of_birth: '1990-01-01', // SENSÍVEL - Omitir!
        last_seen_at: '2026-08-04T12:00:00Z',
      };

      // Simula a busca do dispositivo e depois do visitante associado
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: () => Promise.resolve({
            data: {
              visitor_id: 'visitor-uuid-123',
              visitors: mockVisitorFromDb,
            },
            error: null,
          }),
        }),
      });

      // Mock da busca de configurações (relogin interval)
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          single: () => Promise.resolve({
            data: {
              visitor_id: 'visitor-uuid-123',
              visitors: mockVisitorFromDb,
            },
            error: null,
          }),
        }),
      }).mockReturnValueOnce({
        single: () => Promise.resolve({
          data: { relogin_days_interval: 7 },
          error: null,
        }),
      });

      const request = new Request('http://localhost/api/portal/check-mac?mac=aa:bb:cc:dd:ee:ff');
      const res = await getPortalCheckMac(request);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.found).toBe(true);
      expect(body.visitor).toBeDefined();

      // Campos minimos autorizados
      expect(body.visitor.name).toBe('Carlos Santos');

      // Campos sensíveis e metadados internos ocultados na resposta JSON do portal (Segurança)
      expect(body.visitor.id).toBeUndefined();
      expect(body.visitor.last_seen_at).toBeUndefined();
      expect(body.visitor.phone).toBeUndefined();
      expect(body.visitor.email).toBeUndefined();
      expect(body.visitor.date_of_birth).toBeUndefined();

      const rawResponseText = JSON.stringify(body);
      expect(rawResponseText).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    });
  });
});
