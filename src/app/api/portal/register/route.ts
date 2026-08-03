import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClientInstance } from '@/lib/supabase/server';
import { cleanPhoneNumber } from '@/lib/utils';
import { getRouterDriver } from '@/lib/routers';
import { isValidMac } from '@/lib/opennds';
import { RegisterVisitorPayload } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body: RegisterVisitorPayload = await request.json();
    const cleanPhone = cleanPhoneNumber(body.phone || '');

    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Número de WhatsApp inválido' }, { status: 400 });
    }

    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome completo é obrigatório' }, { status: 400 });
    }

    const rawMac = body.mac_address;
    const validMac = isValidMac(rawMac) ? rawMac!.toLowerCase() : null;

    const supabase = await createServerClientInstance();
    const isDemo = !supabase;

    let visitorId: string = 'v-demo-visitor';
    let totalVisits = 1;

    if (supabase) {
      // 1. Buscar se o visitante já existe pelo telefone
      const { data: existingVisitor } = await supabase
        .from('visitors')
        .select('*')
        .eq('phone', cleanPhone)
        .single();

      if (existingVisitor) {
        visitorId = existingVisitor.id;
        totalVisits = (existingVisitor.total_visits || 1) + 1;

        await supabase
          .from('visitors')
          .update({
            name: body.name.trim(),
            email: body.email || existingVisitor.email,
            date_of_birth: body.date_of_birth || existingVisitor.date_of_birth,
            city: body.city || existingVisitor.city,
            gender: body.gender || existingVisitor.gender,
            total_visits: totalVisits,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', visitorId);
      } else {
        const { data: newVisitor, error: insertError } = await supabase
          .from('visitors')
          .insert({
            phone: cleanPhone,
            name: body.name.trim(),
            email: body.email || null,
            date_of_birth: body.date_of_birth || null,
            city: body.city || null,
            gender: body.gender || null,
            terms_accepted: true,
            total_visits: 1,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao registrar visitante no Supabase:', insertError);
          return NextResponse.json({ error: 'Erro ao registrar dados do visitante' }, { status: 500 });
        }
        if (newVisitor) {
          visitorId = newVisitor.id;
        }
      }

      // 2. Vincular o MAC address válido à tabela de dispositivos
      if (validMac && visitorId) {
        await supabase.from('devices').upsert(
          {
            visitor_id: visitorId,
            mac_address: validMac,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'mac_address' }
        );
      }

      // 3. Registrar a sessão de Wi-Fi
      if (visitorId) {
        await supabase.from('wifi_sessions').insert({
          visitor_id: visitorId,
          mac_address: validMac || '00:00:00:00:00:00',
          ip_address: body.ip_address || null,
          opennds_tok: body.tok || null,
          gateway_name: body.gateway_name || 'Loja_WiFi',
          status: 'ACTIVE',
        });
      }
    }

    // 4. Salvar Cookie seguro no navegador para identificação persistente (1 ano)
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'wifi_visitor_device_token',
      value: visitorId,
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // 5. Utilizar a arquitetura de Driver de Roteador para construir a URL de liberação
    const routerDriver = getRouterDriver('opennds');
    const authUrl = routerDriver.buildAuthUrl({
      gatewayaddress: body.gatewayaddress,
      gatewayport: body.gatewayport,
      tok: body.tok,
    });

    return NextResponse.json({
      success: true,
      authUrl,
      visitorName: body.name.trim(),
      totalVisits,
      isDemo,
      message: isDemo
        ? 'Cadastro processado em Modo Demonstração (sem gravação no banco real).'
        : 'Cadastro realizado com sucesso!',
    });
  } catch (error) {
    console.error('Erro no registro do visitante:', error);
    return NextResponse.json({ error: 'Falha interna no servidor' }, { status: 500 });
  }
}
