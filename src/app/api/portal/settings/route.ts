import { NextResponse } from 'next/server';
import { createServerClientInstance } from '@/lib/supabase/server';
import { MOCK_STORE_SETTINGS, NEUTRAL_STORE_SETTINGS } from '@/lib/supabase/mock-data';

export async function GET() {
  const supabase = await createServerClientInstance();

  if (!supabase) {
    return NextResponse.json({ settings: MOCK_STORE_SETTINGS, isDemo: true });
  }

  try {
    const { data: settings, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !settings) {
      console.error('Falha ao buscar configurações da loja em produção (erro ou vazio):', error);
      return NextResponse.json({ settings: NEUTRAL_STORE_SETTINGS, isDemo: false });
    }

    return NextResponse.json({ settings, isDemo: false });
  } catch (err) {
    console.error('Falha de conexão ao buscar configurações da loja em produção:', err);
    return NextResponse.json({ settings: NEUTRAL_STORE_SETTINGS, isDemo: false });
  }
}
