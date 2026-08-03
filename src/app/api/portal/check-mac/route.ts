import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClientInstance } from '@/lib/supabase/server';
import { isValidMac } from '@/lib/opennds';
import { MOCK_DEVICES, MOCK_VISITORS, MOCK_STORE_SETTINGS } from '@/lib/supabase/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawMac = searchParams.get('mac');
  const mac = isValidMac(rawMac || '') ? rawMac!.toLowerCase() : null;

  // Ler o token seguro salvo em cookie do navegador do visitante
  const cookieStore = await cookies();
  const deviceCookieToken = cookieStore.get('wifi_visitor_device_token')?.value;

  const supabase = await createServerClientInstance();

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
        visitor: mockVisitor,
        needsRelogin,
        isDemo: true,
        identifiedBy: deviceCookieToken ? 'cookie_token' : 'mac_address',
      });
    }

    return NextResponse.json({ found: false, needsRelogin: true, isDemo: true });
  }

  // MODO REAL SUPABASE
  try {
    let visitorData = null;
    let identifiedBy = null;

    // 1. Tenta identificar primeiro pelo Cookie Seguro do Navegador (resiste à aleatorização de MAC no iOS/Android)
    if (deviceCookieToken) {
      const { data: visitorByCookie } = await supabase
        .from('visitors')
        .select('*')
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
        .select('*, visitors(*)')
        .eq('mac_address', mac)
        .single();

      if (device && device.visitors) {
        visitorData = device.visitors;
        identifiedBy = 'mac_address';
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
      visitor: visitorData,
      needsRelogin,
      isDemo: false,
      identifiedBy,
    });
  } catch {
    return NextResponse.json({ found: false, needsRelogin: true, isDemo: false });
  }
}
