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

    const isDemoModeVar = process.env.DEMO_MODE === 'true';

    // 2. Mock data para modo demonstração (sem cupons)
    if (isDemoModeVar && (isDemo || !supabase)) {
      const mockActiveCampaigns = [
        {
          id: 'campaign-1',
          title: 'Ganhe uma sobremesa de boas-vindas!',
          description: 'Promoção exclusiva de boas-vindas para novos clientes. Apresente esta tela ao atendente.',
          type: 'PROMO',
          status: 'ACTIVE',
          media_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
          media_type: 'IMAGE',
          aspect_ratio: '4:5',
          button_text: null,
          button_url: null,
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
        },
        {
          id: 'campaign-3',
          title: 'Campanha Geral',
          description: 'Válida para todos os clientes.',
          type: 'PROMO',
          status: 'ACTIVE',
          media_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
          media_type: 'IMAGE',
          aspect_ratio: '16:9',
          button_text: 'Ver Site',
          button_url: 'https://exemplo.com',
        }
      ];

      // Filtro básico na demonstração
      let matched = [...mockActiveCampaigns];
      if (!visitorId || visitorId === 'null' || visitorId === 'undefined') {
        matched = [mockActiveCampaigns[2]]; // Sem visitante identificado, retorna apenas a geral
      } else if (visitorId === 'visitor-new') {
        matched = [mockActiveCampaigns[0], mockActiveCampaigns[2]]; // boas-vindas + geral
      } else if (visitorId === 'visitor-bday') {
        matched = [mockActiveCampaigns[1], mockActiveCampaigns[2]]; // aniversário + geral
      }

      return NextResponse.json({ campaigns: matched, isDemo: true });
    }

    if (!supabase) {
      return NextResponse.json({ campaigns: [], isDemo: false });
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

    // 4. Buscar todas as campanhas ativas com regras (coupons mantidos no select para compatibilidade)
    const { data: activeCampaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_audiences (*)
      `)
      .eq('status', 'ACTIVE');

    if (campaignsError || !activeCampaigns) {
      console.error('Erro ao buscar campanhas ativas para o portal:', campaignsError);
      return NextResponse.json({ campaigns: [] });
    }

    const currentMonth = new Date().getMonth() + 1; // 1-12

    // 5. Aplicar regras de segmentação (matching logic) — sem filtro de cupons resgatados
    const matchedCampaigns = activeCampaigns.filter((campaign: any) => {
      // Validação do período de início e término da campanha
      const now = new Date();
      if (campaign.start_date && new Date(campaign.start_date) > now) {
        return false;
      }
      if (campaign.end_date && new Date(campaign.end_date) < now) {
        return false;
      }

      const audience = campaign.campaign_audiences?.[0];
      if (!audience) return true; // Sem segmentação explícita = exibe para todos

      const { target_type, rules = {} } = audience;

      // Se o visitante não estiver identificado, só exibe campanhas gerais (ALL)
      if (!visitor) {
        return target_type === 'ALL';
      }

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

// Endpoint POST de resgate de cupom desativado — HTTP 410 Gone
export async function POST() {
  return NextResponse.json(
    { error: 'O sistema de resgate de cupons foi desativado.' },
    { status: 410 }
  );
}
