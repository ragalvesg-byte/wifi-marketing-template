import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { VisitorEventType } from '@/types/database';

const ALLOWED_EVENTS: Set<VisitorEventType> = new Set([
  'PORTAL_VIEWED',
  'VISITOR_REGISTERED',
  'VISITOR_RETURNED',
  'WIFI_AUTH_SENT',
  'INSTAGRAM_CLICKED',
  'MENU_CLICKED',
  'GOOGLE_REVIEW_CLICKED',
]);

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting (máximo de 30 requisições por minuto por IP)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const rateData = rateLimitMap.get(ip);

    if (rateData && now < rateData.resetAt) {
      if (rateData.count >= 30) {
        return NextResponse.json({ error: 'Muitas requisições. Tente novamente mais tarde.' }, { status: 429 });
      }
      rateData.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    }

    // 2. Parse body
    const body = await request.json();
    const { event_type, visitor_id, wifi_session_id, campaign_id, anonymous_session_id, metadata } = body;

    // 3. Validação do event_type
    if (!event_type || !ALLOWED_EVENTS.has(event_type as VisitorEventType)) {
      return NextResponse.json({ error: 'Tipo de evento inválido ou não permitido.' }, { status: 400 });
    }

    // 4. Validação de estrutura e tamanho do metadata
    if (metadata !== undefined && metadata !== null) {
      if (typeof metadata !== 'object' || Array.isArray(metadata)) {
        return NextResponse.json({ error: 'Formato de metadados inválido.' }, { status: 400 });
      }
      const metadataStr = JSON.stringify(metadata);
      if (metadataStr.length > 5000) { // Limite de 5KB
        return NextResponse.json({ error: 'Tamanho de metadados excede o limite de 5KB.' }, { status: 400 });
      }
    }

    // 5. Anonimização do IP antes de qualquer persistência
    const anonymizedIp = ip.includes(':')
      ? ip.split(':').slice(0, 3).join(':') + ':0:0:0:0:0'
      : ip.split('.').slice(0, 3).join('.') + '.0';

    const safeMetadata = {
      ...(metadata || {}),
      anonymized_ip: anonymizedIp,
    };

    // 6. Gravação segura pelo backend via service role client
    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e) {
      console.warn('Erro ao criar cliente Supabase Admin para eventos (modo demonstração):', e);
    }

    if (supabase) {
      const { error } = await supabase.from('visitor_events').insert({
        event_type,
        visitor_id: visitor_id || null,
        wifi_session_id: wifi_session_id || null,
        campaign_id: campaign_id || null,
        anonymous_session_id: anonymous_session_id || null,
        metadata: safeMetadata,
      });

      if (error) {
        console.error('Erro ao persistir evento no banco:', error);
        return NextResponse.json({ error: 'Erro ao registrar evento.' }, { status: 500 });
      }
    } else {
      console.log('[Demo Mode Event Logged]:', {
        event_type,
        visitor_id,
        wifi_session_id,
        campaign_id,
        anonymous_session_id,
        metadata: safeMetadata,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erro geral na API de eventos:', err);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
