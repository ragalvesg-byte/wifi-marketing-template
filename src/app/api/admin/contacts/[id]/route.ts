import { NextResponse } from 'next/server';
import { createServerClientInstance } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'ID do visitante não informado' }, { status: 400 });
  }

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
    return NextResponse.json({
      success: true,
      message: 'Visitante removido com sucesso (modo demonstração).',
      id,
    });
  }

  try {
    const { data, error } = await adminClient.rpc('delete_visitor_cascade', {
      p_visitor_id: id,
    });

    if (error) {
      console.error('Erro na RPC delete_visitor_cascade:', error);
      return NextResponse.json({ error: 'Falha ao excluir visitante e registros associados' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Visitante e todo o seu histórico foram removidos permanentemente.',
      id,
    });
  } catch (err) {
    console.error('Erro interno na exclusão de visitante:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
