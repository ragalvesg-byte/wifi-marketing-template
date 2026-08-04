import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Campaign, Visitor } from '@/types/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');
    const isDemo = searchParams.get('isDemo') === 'true';

    // 1. Instanciar cliente do Supabase
    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e) {
      console.warn('Supabase Admin não disponível na rota portal/campaigns (modo demo):', e);
    }

    // 2. Mock data para modo demonstração
    if (isDemo || !supabase) {
      const mockActiveCampaigns = [
        {
          id: 'campaign-1',
          title: 'Ganhe 15% na sua próxima Pizza!',
          description: 'Promoção exclusiva de boas-vindas para novos clientes.',
          type: 'COUPON',
          status: 'ACTIVE',
          media_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
          media_type: 'IMAGE',
          aspect_ratio: '4:5',
          button_text: 'Copiar Cupom de 15%',
          button_url: null,
          coupons: [
            {
              id: 'coupon-1',
              campaign_id: 'campaign-1',
              code: 'PIZZA15',
              discount_type: 'PERCENTAGE',
              discount_value: 15.00,
            }
          ]
        },
        {
          id: 'campaign-2',
          title: 'Feliz Aniversário! Seu café é por nossa conta',
          description: 'Parabéns! Apresente esse banner no caixa e ganhe um espresso grátis.',
          type: 'PROMO',
          status: 'ACTIVE',
          media_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
          media_type: 'IMAGE',
          aspect_ratio: '1:1',
          button_text: 'Ver no Cardápio',
          button_url: 'https://exemplo.com/cardapio',
        }
      ];

      // Filtro básico na demonstração
      let matched = [...mockActiveCampaigns];
      if (visitorId === 'visitor-new') {
        matched = [mockActiveCampaigns[0]]; // apenas a de pizza
      } else if (visitorId === 'visitor-bday') {
        matched = [mockActiveCampaigns[1]]; // apenas a de aniversário
      }

      return NextResponse.json({ campaigns: matched, isDemo: true });
    }

    // 3. Buscar dados do visitante
    let visitor: Visitor | null = null;
    if (visitorId && visitorId !== 'null' && visitorId !== 'undefined') {
      const { data, error: visitorError } = await supabase
        .from('visitors')
        .select('*')
        .eq('id', visitorId)
        .single();

      if (!visitorError && data) {
        visitor = data;
      }
    }

    // 4. Buscar todas as campanhas ativas com regras e cupons
    const { data: activeCampaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_audiences (*),
        coupons (*)
      `)
      .eq('status', 'ACTIVE');

    if (campaignsError || !activeCampaigns) {
      console.error('Erro ao buscar campanhas ativas para o portal:', campaignsError);
      return NextResponse.json({ campaigns: [] });
    }

    // 5. Se houver cupons resgatados por este visitante, buscar para filtrar
    const redeemedCouponIds = new Set<string>();
    if (visitor) {
      const { data: redemptions } = await supabase
        .from('coupon_redemptions')
        .select('coupon_id')
        .eq('visitor_id', visitor.id);

      if (redemptions) {
        redemptions.forEach((r: any) => redeemedCouponIds.add(r.coupon_id));
      }
    }

    const currentMonth = new Date().getMonth() + 1; // 1-12

    // 6. Aplicar regras de segmentação (matching logic)
    const matchedCampaigns = activeCampaigns.filter((campaign: any) => {
      // Se a campanha for do tipo COUPON e todos os seus cupons já foram resgatados por este visitante
      if (campaign.type === 'COUPON' && campaign.coupons) {
        const hasUnredeemed = campaign.coupons.some((c: any) => !redeemedCouponIds.has(c.id));
        if (!hasUnredeemed) return false;
      }

      const audience = campaign.campaign_audiences?.[0];
      if (!audience) return true; // Sem segmentação explícita = exibe para todos

      const { target_type, rules = {} } = audience;

      switch (target_type) {
        case 'ALL':
          return true;

        case 'NEW_VISITORS':
          // Novo se não tiver cadastro ou tiver no máximo 1 visita registrada
          return !visitor || visitor.total_visits <= 1;

        case 'RETURNING_VISITORS':
          // Recorrente se tiver mais de 1 visita
          return visitor && visitor.total_visits > 1;

        case 'GENDER':
          if (!visitor || !visitor.gender || !rules.gender) return false;
          return visitor.gender.toLowerCase() === rules.gender.toLowerCase();

        case 'BIRTHDAY_MONTH':
          if (!visitor || !visitor.date_of_birth) return false;
          // data_of_birth está em formato string YYYY-MM-DD
          try {
            const birthMonth = parseInt(visitor.date_of_birth.split('-')[1], 10);
            const targetMonth = rules.birthday_month ? parseInt(rules.birthday_month, 10) : currentMonth;
            return birthMonth === targetMonth;
          } catch {
            return false;
          }

        case 'CUSTOM_SEGMENT':
          // Pode estender para regras específicas (ex: total de visitas maior que N)
          if (rules.min_visits !== undefined && visitor) {
            return visitor.total_visits >= parseInt(rules.min_visits, 10);
          }
          return true;

        default:
          return true;
      }
    });

    return NextResponse.json({ campaigns: matchedCampaigns, isDemo: false });
  } catch (err) {
    console.error('Erro na API de campanhas do portal:', err);
    return NextResponse.json({ error: 'Erro interno ao carregar campanhas.' }, { status: 500 });
  }
}

// Endpoint POST para registrar resgate de cupom de forma segura pelo servidor
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { coupon_id, visitor_id } = body;

    if (!coupon_id || !visitor_id) {
      return NextResponse.json({ error: 'Dados insuficientes.' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e) {
      console.warn('Supabase Admin não disponível na gravação de resgate (modo demo):', e);
    }

    if (!supabase) {
      return NextResponse.json({ success: true, isDemo: true });
    }

    // 1. Verificar se o cupom existe, não expirou e tem cota restante
    const { data: coupon, error: couponErr } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', coupon_id)
      .single();

    if (couponErr || !coupon) {
      return NextResponse.json({ error: 'Cupom não encontrado.' }, { status: 404 });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Este cupom já expirou.' }, { status: 400 });
    }

    if (coupon.max_redemptions !== null && coupon.current_redemptions >= coupon.max_redemptions) {
      return NextResponse.json({ error: 'Limite de resgates esgotado.' }, { status: 400 });
    }

    // 2. Registrar o resgate na tabela (com UNIQUE constraint para evitar múltiplos)
    const { error: redemptionErr } = await supabase
      .from('coupon_redemptions')
      .insert({
        coupon_id,
        visitor_id,
      });

    if (redemptionErr) {
      if (redemptionErr.code === '23505') { // Código de erro postgres para unique constraint violation
        return NextResponse.json({ error: 'Você já resgatou este cupom.' }, { status: 400 });
      }
      console.error('Erro ao salvar resgate no banco:', redemptionErr);
      return NextResponse.json({ error: 'Erro ao registrar resgate.' }, { status: 500 });
    }

    // 3. Incrementar o contador de resgates no cupom
    await supabase
      .from('coupons')
      .update({ current_redemptions: coupon.current_redemptions + 1 })
      .eq('id', coupon.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erro ao processar resgate de cupom:', err);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
