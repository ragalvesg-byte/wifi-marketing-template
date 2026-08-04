import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { cleanPhoneNumber } from '@/lib/utils';
import { getRouterDriver } from '@/lib/routers';
import { isValidMac, isValidIp, sanitizeToken } from '@/lib/opennds';
import { RegisterVisitorPayload } from '@/types/database';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    const body: RegisterVisitorPayload = await request.json();
    const cleanPhone = cleanPhoneNumber(body.phone || '');
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e) {
      console.warn('Rodando em modo demonstração: ', e);
    }
    const isDemo = !supabase;

    // 1. In-memory rate limiting (original)
    const now = Date.now();
    const rateData = rateLimitMap.get(ip);
    let inMemoryBlock = false;

    if (rateData && now < rateData.resetAt) {
      if (rateData.count >= 5) {
        inMemoryBlock = true;
      }
      rateData.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    }

    // 2. Persistent rate limiting (parallel execution)
    let persistentBlock = false;
    if (supabase) {
      try {
        // Exclui entradas expiradas de rate limit
        await supabase
          .from('rate_limits')
          .delete()
          .lt('reset_at', new Date().toISOString());

        const { data: limitData, error: limitError } = await supabase
          .from('rate_limits')
          .select('*')
          .eq('ip', ip)
          .single();

        const nowIso = new Date().toISOString();
        if (limitData && nowIso < limitData.reset_at) {
          if (limitData.count >= 5) {
            persistentBlock = true;
          }
          await supabase
            .from('rate_limits')
            .update({
              count: limitData.count + 1,
              updated_at: nowIso
            })
            .eq('ip', ip);
        } else {
          await supabase
            .from('rate_limits')
            .upsert({
              ip,
              count: 1,
              reset_at: new Date(Date.now() + 60000).toISOString(),
              updated_at: nowIso
            }, { onConflict: 'ip' });
        }
      } catch (err) {
        console.warn('Erro ao processar rate limit persistente no Supabase (caindo de volta para in-memory):', err);
      }
    }

    // Registra comparação para fins de auditoria/teste
    console.log(`[Rate Limit] IP: ${ip} | InMemory Blocked: ${inMemoryBlock} | Persistent Blocked: ${persistentBlock}`);

    // Bloqueia com base no inMemoryBlock conforme instrução de transição (Não remova o rate limit atual até o novo estar testado)
    if (inMemoryBlock) {
      return NextResponse.json({ error: 'Muitas requisições. Tente novamente mais tarde.' }, { status: 429 });
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Número de WhatsApp inválido' }, { status: 400 });
    }

    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome completo é obrigatório' }, { status: 400 });
    }

    const rawMac = body.mac_address;
    const validMac = isValidMac(rawMac) ? rawMac!.toLowerCase() : null;

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
    
    // Modo real exige TODOS os 5 parâmetros válidos do openNDS
    const isRealRouterMode = Boolean(
      body.gatewayaddress && isValidIp(body.gatewayaddress) &&
      body.gatewayport && /^\d+$/.test(body.gatewayport) &&
      body.tok && sanitizeToken(body.tok) &&
      body.mac_address && isValidMac(body.mac_address) &&
      body.ip_address && isValidIp(body.ip_address)
    );

    const authUrl = isRealRouterMode ? routerDriver.buildAuthUrl({
      gatewayaddress: body.gatewayaddress,
      gatewayport: body.gatewayport,
      tok: body.tok,
    }) : "";

    return NextResponse.json({
      success: true,
      authUrl,
      visitorName: body.name.trim(),
      totalVisits,
      isDemoMode: !isRealRouterMode,
      message: !isRealRouterMode
        ? 'Cadastro realizado com sucesso. Modo demonstração — roteador não conectado.'
        : 'Autorização enviada ao roteador.',
    });
  } catch (error) {
    console.error('Erro no registro do visitante:', error);
    return NextResponse.json({ error: 'Falha interna no servidor' }, { status: 500 });
  }
}
