import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidMac } from '@/lib/opennds';
import { MOCK_DEVICES, MOCK_VISITORS, MOCK_STORE_SETTINGS } from '@/lib/supabase/mock-data';

function filterPublicVisitor(visitor: any) {
  if (!visitor) return null;
  return {
    name: visitor.name
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawMac = searchParams.get('mac');
  const mac = isValidMac(rawMac || '') ? rawMac!.toLowerCase() : null;

  // Ler o token seguro salvo em cookie do navegador do visitante
  const cookieStore = await cookies();
  const deviceCookieToken = cookieStore.get('wifi_visitor_device_token')?.value;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.warn('Rodando check-mac em modo demonstração: ', e);
  }

  // MODO DEMONSTRAÇÃO (Supabase não configurado)
  if (!supabase) {
    let mockVisitor = null;

    if (deviceCookieToken) {
      mockVisitor = MOCK_VISITORS.find((v) => v.id === deviceCookieToken);
    }

    if (!mockVisitor && mac) {
      const mockDevice = MOCK_DEVICES.find((d) => d.mac_address.toLowerCase() === mac);
      if (mockDevice) {
        mockVisitor = MOCK_VISITORS.find((v) => v.id === mockDevice.visitor_id) || null;
      }
    }

    if (mockVisitor) {
      const lastSeen = new Date(mockVisitor.last_seen_at);
      const daysDiff = (Date.now() - lastSeen.getTime()) / (1000 * 3600 * 24);
      const needsRelogin = daysDiff > MOCK_STORE_SETTINGS.relogin_days_interval;

      return NextResponse.json({
        found: true,
        visitor: filterPublicVisitor(mockVisitor),
        needsRelogin,
        isDemo: true,
        identifiedBy: deviceCookieToken ? 'cookie_token' : 'mac_address',
      });
    }

    return NextResponse.json({ found: false, needsRelogin: true, isDemo: true });
  }

  // MODO REAL SUPABASE (Exclusivamente no servidor com service_role)
  try {
    let visitorData = null;
    let identifiedBy = null;

    // 1. Tenta identificar primeiro pelo Cookie Seguro do Navegador (resiste à aleatorização de MAC no iOS/Android)
    if (deviceCookieToken) {
      const { data: visitorByCookie } = await supabase
        .from('visitors')
        .select('id, name, last_seen_at')
        .eq('id', deviceCookieToken)
        .single();

      if (visitorByCookie) {
        visitorData = visitorByCookie;
        identifiedBy = 'cookie_token';
      }
    }

    // 2. Se não encontrou pelo Cookie, tenta pelo MAC Address
    if (!visitorData && mac) {
      const { data: device } = await supabase
        .from('devices')
        .select('visitor_id, visitors(id, name, last_seen_at)')
        .eq('mac_address', mac)
        .single();

      if (device && device.visitors) {
        // O Supabase JS typings de sub-tabelas retornam como array ou objeto simples dependendo do relacionamento
        const relatedVisitor = Array.isArray(device.visitors) ? device.visitors[0] : device.visitors;
        if (relatedVisitor) {
          visitorData = relatedVisitor;
          identifiedBy = 'mac_address';
        }
      }
    }

    if (!visitorData) {
      return NextResponse.json({ found: false, needsRelogin: true, isDemo: false });
    }

    // 3. Verificar se ultrapassou o período de recadastro da loja
    const { data: settings } = await supabase
      .from('store_settings')
      .select('relogin_days_interval')
      .single();

    const reloginDays = settings?.relogin_days_interval ?? 7;
    const lastSeen = new Date(visitorData.last_seen_at);
    const daysDiff = (Date.now() - lastSeen.getTime()) / (1000 * 3600 * 24);
    const needsRelogin = daysDiff > reloginDays;

    return NextResponse.json({
      found: true,
      visitor: filterPublicVisitor(visitorData),
      needsRelogin,
      isDemo: false,
      identifiedBy,
    });
  } catch (err) {
    console.error('Erro na rota check-mac:', err);
    return NextResponse.json({ found: false, needsRelogin: true, isDemo: false });
  }
}

