import { NextResponse } from 'next/server';
import { createServerClientInstance } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_VISITORS } from '@/lib/supabase/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const rawLimit = parseInt(searchParams.get('limit') || '10', 10);
  const limit = [10, 20, 30].includes(rawLimit) ? rawLimit : 10;
  const search = searchParams.get('search')?.trim() || '';

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let supabase;
  try {
    supabase = await createServerClientInstance();
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    }
  } catch (e) {
    console.warn('Erro na verificação de auth:', e);
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (e) {
    console.warn('Rodando em modo demonstração:', e);
  }

  if (!adminClient) {
    let filtered = MOCK_VISITORS;
    if (search) {
      const term = search.toLowerCase();
      filtered = MOCK_VISITORS.filter(
        (v) => v.name.toLowerCase().includes(term) || v.phone.includes(term) || (v.email && v.email.toLowerCase().includes(term))
      );
    }

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const paginated = filtered.slice(from, from + limit);

    return NextResponse.json({
      visitors: paginated,
      totalCount,
      page,
      limit,
      totalPages,
      isDemo: true,
    });
  }

  try {
    let query = adminClient
      .from('visitors')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('last_seen_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Erro ao buscar visitantes paginados:', error);
      return NextResponse.json({ error: 'Falha ao buscar contatos' }, { status: 500 });
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      visitors: data || [],
      totalCount,
      page,
      limit,
      totalPages,
      isDemo: false,
    });
  } catch (err) {
    console.error('Erro na API de contatos paginados:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
