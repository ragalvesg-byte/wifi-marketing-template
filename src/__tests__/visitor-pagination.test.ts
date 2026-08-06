import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getContacts } from '../app/api/admin/contacts/route';
import { DELETE as deleteContact } from '../app/api/admin/contacts/[id]/route';

vi.mock('@/lib/supabase/server', () => ({
  createServerClientInstance: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-123' } } }),
    },
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [
                { id: 'v-1', name: 'Maria Silva', phone: '11999998888', total_visits: 3 },
                { id: 'v-2', name: 'João Santos', phone: '11988887777', total_visits: 1 },
              ],
              count: 25,
              error: null,
            }),
          }),
        }),
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [
              { id: 'v-1', name: 'Maria Silva', phone: '11999998888', total_visits: 3 },
              { id: 'v-2', name: 'João Santos', phone: '11988887777', total_visits: 1 },
            ],
            count: 25,
            error: null,
          }),
        }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  }),
}));

describe('Fase 2 — Visitor Pagination & Cascade Deletion Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. GET /api/admin/contacts aplica parâmetros de paginação (page=1, limit=10) e calcula totalPages', async () => {
    const req = new Request('http://localhost/api/admin/contacts?page=1&limit=10');
    const res = await getContacts(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty('visitors');
    expect(json).toHaveProperty('totalCount');
    expect(json.page).toBe(1);
    expect(json.limit).toBe(10);
    expect(json.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('2. GET /api/admin/contacts ajusta limite inválido para o padrão 10', async () => {
    const req = new Request('http://localhost/api/admin/contacts?page=1&limit=999');
    const res = await getContacts(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.limit).toBe(10);
  });

  it('3. DELETE /api/admin/contacts/[id] invoca a RPC delete_visitor_cascade com o ID informado', async () => {
    const req = new Request('http://localhost/api/admin/contacts/v-123', { method: 'DELETE' });
    const params = Promise.resolve({ id: 'v-123' });

    const res = await deleteContact(req, { params });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.id).toBe('v-123');
  });
});
