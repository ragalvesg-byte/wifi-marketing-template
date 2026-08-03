import { NextResponse } from 'next/server';
import { createServerClientInstance } from '@/lib/supabase/server';
import { MOCK_STORE_SETTINGS } from '@/lib/supabase/mock-data';

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
      return NextResponse.json({ settings: MOCK_STORE_SETTINGS, isDemo: false });
    }

    return NextResponse.json({ settings, isDemo: false });
  } catch {
    return NextResponse.json({ settings: MOCK_STORE_SETTINGS, isDemo: false });
  }
}
