import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { cleanPhoneNumber } from '@/lib/utils';
import { getRouterDriver } from '@/lib/routers';
import { isValidMac, isValidIp, sanitizeToken } from '@/lib/opennds';
import { RegisterVisitorPayload } from '@/types/database';
import { MOCK_STORE_SETTINGS } from '@/lib/supabase/mock-data';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    const body: RegisterVisitorPayload = await request.json();
    let cleanPhone = cleanPhoneNumber(body.phone || '');
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

    // Fallback: se o telefone ou nome não for enviado (Quick Connect de visitante recorrente)
    let finalPhone = cleanPhone;
    let finalName = body.name || '';

    if ((!finalPhone || finalPhone.length < 10 || !finalName || finalName.trim().length < 2) && supabase) {
      try {
        const cookieStore = await cookies();
        const deviceCookieToken = cookieStore.get('wifi_visitor_device_token')?.value;
        const rawMac = body.mac_address;
        const validMac = isValidMac(rawMac) ? rawMac!.toLowerCase() : null;

        let foundVisitor = null;

        if (deviceCookieToken) {
          const { data: vByCookie } = await supabase
            .from('visitors')
            .select('phone, name')
            .eq('id', deviceCookieToken)
            .maybeSingle();
          if (vByCookie) foundVisitor = vByCookie;
        }

        if (!foundVisitor && validMac) {
          const { data: dev } = await supabase
            .from('devices')
            .select('visitors(phone, name)')
            .eq('mac_address', validMac)
            .maybeSingle();
          if (dev && dev.visitors) {
            foundVisitor = Array.isArray(dev.visitors) ? dev.visitors[0] : dev.visitors;
          }
        }

        if (foundVisitor) {
          finalPhone = cleanPhoneNumber(foundVisitor.phone || '');
          finalName = foundVisitor.name || '';
          body.phone = foundVisitor.phone;
          body.name = foundVisitor.name;
        }
      } catch (err) {
        console.warn('Erro ao buscar fallback do visitante no register:', err);
      }
    }

    if (!finalPhone || finalPhone.length < 10) {
      return NextResponse.json({ error: 'Número de WhatsApp inválido' }, { status: 400 });
    }

    if (!finalName || finalName.trim().length < 2) {
      return NextResponse.json({ error: 'Nome completo é obrigatório' }, { status: 400 });
    }

    cleanPhone = finalPhone;
    body.name = finalName;

    // Buscar configurações de campos dinâmicos do formulário
    let fieldSettings = {
      field_email_enabled: false,
      field_dob_enabled: false,
      field_city_enabled: false,
      field_gender_enabled: false,
      field_email_required: false,
      field_dob_required: false,
      field_city_required: false,
      field_gender_required: false,
    };

    if (supabase) {
      try {
        const { data: dbSettings } = await supabase
          .from('store_settings')
          .select('field_email_enabled, field_dob_enabled, field_city_enabled, field_gender_enabled, field_email_required, field_dob_required, field_city_required, field_gender_required')
          .limit(1)
          .single();
        if (dbSettings) {
          fieldSettings = dbSettings;
        }
      } catch (err) {
        console.warn('Erro ao carregar configurações de campos do formulário:', err);
      }
    } else {
      fieldSettings = MOCK_STORE_SETTINGS as any;
    }

    // Validar campos ativados e obrigatórios no backend (Segurança)
    if (fieldSettings.field_email_enabled && fieldSettings.field_email_required && (!body.email || !body.email.trim())) {
      return NextResponse.json({ error: 'O preenchimento do e-mail é obrigatório.' }, { status: 400 });
    }
    if (fieldSettings.field_dob_enabled && fieldSettings.field_dob_required && !body.date_of_birth) {
      return NextResponse.json({ error: 'A data de nascimento é obrigatória.' }, { status: 400 });
    }
    if (fieldSettings.field_city_enabled && fieldSettings.field_city_required && (!body.city || !body.city.trim())) {
      return NextResponse.json({ error: 'O preenchimento da cidade é obrigatório.' }, { status: 400 });
    }
    if (fieldSettings.field_gender_enabled && fieldSettings.field_gender_required && !body.gender) {
      return NextResponse.json({ error: 'A seleção do gênero é obrigatória.' }, { status: 400 });
    }



    const rawMac = body.mac_address;
    const validMac = isValidMac(rawMac) ? rawMac!.toLowerCase() : null;

    let visitorId: string = 'v-demo-visitor';
    let totalVisits = 1;

    let isNewVisitor = false;

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
            email: fieldSettings.field_email_enabled ? (body.email || existingVisitor.email) : existingVisitor.email,
            date_of_birth: fieldSettings.field_dob_enabled ? (body.date_of_birth || existingVisitor.date_of_birth) : existingVisitor.date_of_birth,
            city: fieldSettings.field_city_enabled ? (body.city || existingVisitor.city) : existingVisitor.city,
            gender: fieldSettings.field_gender_enabled ? (body.gender || existingVisitor.gender) : existingVisitor.gender,
            total_visits: totalVisits,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', visitorId);
      } else {
        isNewVisitor = true;
        const { data: newVisitor, error: insertError } = await supabase
          .from('visitors')
          .insert({
            phone: cleanPhone,
            name: body.name.trim(),
            email: fieldSettings.field_email_enabled ? (body.email || null) : null,
            date_of_birth: fieldSettings.field_dob_enabled ? (body.date_of_birth || null) : null,
            city: fieldSettings.field_city_enabled ? (body.city || null) : null,
            gender: fieldSettings.field_gender_enabled ? (body.gender || null) : null,
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

      // 3. Registrar a sessão de Wi-Fi e obter ID da sessão
      let wifiSessionId: string | null = null;
      if (visitorId) {
        const { data: newSession, error: sessionError } = await supabase
          .from('wifi_sessions')
          .insert({
            visitor_id: visitorId,
            mac_address: validMac || '00:00:00:00:00:00',
            ip_address: body.ip_address || null,
            opennds_tok: body.tok || null,
            gateway_name: body.gateway_name || 'Loja_WiFi',
            status: 'ACTIVE',
          })
          .select('id')
          .single();

        if (sessionError) {
          console.error('Erro ao criar sessão Wi-Fi no Supabase:', sessionError);
        } else if (newSession) {
          wifiSessionId = newSession.id;
        }
      }

      // 3.5 Registrar evento do pipeline de forma segura no servidor
      if (visitorId) {
        const { error: eventError } = await supabase
          .from('visitor_events')
          .insert({
            event_type: isNewVisitor ? 'VISITOR_REGISTERED' : 'VISITOR_RETURNED',
            visitor_id: visitorId,
            wifi_session_id: wifiSessionId,
            anonymous_session_id: body.anonymous_session_id || null,
            metadata: {
              method: isNewVisitor ? 'registration_form' : 'form_submit',
              total_visits: totalVisits
            }
          });

        if (eventError) {
          console.error('Erro ao registrar evento de cadastro/retorno no Supabase:', eventError);
        }
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
      visitorId,
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
