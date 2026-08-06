import { NextResponse } from 'next/server';
import { validateVisitorSession } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_STORE_SETTINGS } from '@/lib/supabase/mock-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  // 1. Validar sessão estrita do visitante via cookie HttpOnly
  const session = await validateVisitorSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Sessão inválida ou expirada. Faça login novamente.' },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();

  // 2. Persistent rate-limiting usando a tabela rate_limits com chave derivada da ação e hash da sessão
  if (supabase) {
    try {
      const actionKey = `wifi_credentials:${session.tokenHash}`;
      const nowIso = new Date().toISOString();
      const resetTime = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

      // Exclui entradas expiradas
      await supabase
        .from('rate_limits')
        .delete()
        .lt('reset_at', nowIso);

      const { data: limitData } = await supabase
        .from('rate_limits')
        .select('count, reset_at')
        .eq('action_key', actionKey)
        .single();

      if (limitData && nowIso < limitData.reset_at) {
        if (limitData.count >= 10) {
          return NextResponse.json(
            { error: 'Limite de requisições excedido. Tente novamente mais tarde.' },
            { status: 429 }
          );
        }
        await supabase
          .from('rate_limits')
          .update({
            count: limitData.count + 1,
            updated_at: nowIso,
          })
          .eq('action_key', actionKey);
      } else {
        await supabase
          .from('rate_limits')
          .upsert({
            action_key: actionKey,
            ip: 'session-derived',
            count: 1,
            reset_at: resetTime,
            updated_at: nowIso,
          });
      }
    } catch (err) {
      console.warn('Erro ao aplicar rate limit de credenciais:', err);
    }
  }

  // 3. Buscar configurações do banco de dados
  let settings: any = null;
  if (supabase) {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select(`
          customer_wifi_enabled,
          wifi_network_name,
          wifi_network_password,
          wifi_password_visible,
          wifi_password_copy_enabled,
          wifi_section_title,
          wifi_instruction_text,
          wifi_android_instructions,
          wifi_ios_instructions
        `)
        .limit(1)
        .single();
      settings = data;
    } catch (err) {
      console.warn('Erro ao buscar credenciais Wi-Fi no banco:', err);
    }
  }

  if (!settings) {
    settings = {
      customer_wifi_enabled: MOCK_STORE_SETTINGS.customer_wifi_enabled ?? true,
      wifi_network_name: MOCK_STORE_SETTINGS.wifi_network_name || MOCK_STORE_SETTINGS.store_name,
      wifi_network_password: MOCK_STORE_SETTINGS.wifi_network_password || 'wifi12345',
      wifi_password_visible: MOCK_STORE_SETTINGS.wifi_password_visible ?? true,
      wifi_password_copy_enabled: MOCK_STORE_SETTINGS.wifi_password_copy_enabled ?? true,
      wifi_section_title: MOCK_STORE_SETTINGS.wifi_section_title || 'Conecte-se ao Wi-Fi do estabelecimento',
      wifi_instruction_text: MOCK_STORE_SETTINGS.wifi_instruction_text || '',
      wifi_android_instructions: MOCK_STORE_SETTINGS.wifi_android_instructions || '',
      wifi_ios_instructions: MOCK_STORE_SETTINGS.wifi_ios_instructions || '',
    };
  }

  const isWifiEnabled = settings.customer_wifi_enabled !== false;
  const isPasswordVisible = settings.wifi_password_visible !== false;

  if (!isWifiEnabled) {
    return NextResponse.json({
      networkName: '',
      password: null,
      passwordCopyEnabled: false,
      sectionTitle: settings.wifi_section_title || 'Conecte-se ao Wi-Fi do estabelecimento',
      instructionText: '',
      androidInstructions: '',
      iosInstructions: '',
    });
  }

  return NextResponse.json({
    networkName: settings.wifi_network_name || '',
    password: isPasswordVisible ? (settings.wifi_network_password || '') : null,
    passwordCopyEnabled: settings.wifi_password_copy_enabled !== false,
    sectionTitle: settings.wifi_section_title || 'Conecte-se ao Wi-Fi do estabelecimento',
    instructionText: settings.wifi_instruction_text || '',
    androidInstructions: settings.wifi_android_instructions || '',
    iosInstructions: settings.wifi_ios_instructions || '',
  });
}
