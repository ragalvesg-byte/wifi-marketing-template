import { NextResponse } from 'next/server';
import { createServerClientInstance } from '@/lib/supabase/server';
import { Campaign, CampaignAudience, Coupon } from '@/types/database';

// Armazenamento em memória para demonstração/desenvolvimento local (caso Supabase não esteja disponível)
let mockCampaigns: any[] = [
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
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    campaign_audiences: [
      {
        id: 'aud-1',
        campaign_id: 'campaign-1',
        target_type: 'NEW_VISITORS',
        rules: {},
      }
    ],
    coupons: [
      {
        id: 'coupon-1',
        campaign_id: 'campaign-1',
        code: 'PIZZA15',
        discount_type: 'PERCENTAGE',
        discount_value: 15.00,
        max_redemptions: 100,
        current_redemptions: 5,
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
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    campaign_audiences: [
      {
        id: 'aud-2',
        campaign_id: 'campaign-2',
        target_type: 'BIRTHDAY_MONTH',
        rules: {},
      }
    ]
  }
];

export async function GET() {
  const supabase = await createServerClientInstance();

  if (!supabase) {
    return NextResponse.json({ campaigns: mockCampaigns, isDemo: true });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Busca campanhas com públicos e cupons associados
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_audiences (*),
        coupons (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar campanhas no banco:', error);
      return NextResponse.json({ campaigns: [], isDemo: false });
    }

    return NextResponse.json({ campaigns: campaigns || [], isDemo: false });
  } catch (err) {
    console.error('Falha de conexão ao buscar campanhas:', err);
    return NextResponse.json({ campaigns: [], isDemo: false });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createServerClientInstance();

    const {
      title,
      description,
      type,
      status = 'DRAFT',
      media_url,
      media_type = 'IMAGE',
      aspect_ratio = '4:5',
      button_text,
      button_url,
      start_date,
      end_date,
      // Target
      target_type = 'ALL',
      rules = {},
      // Coupon
      coupon_code,
      discount_type = 'PERCENTAGE',
      discount_value = 0,
      max_redemptions = null,
      expires_at = null,
    } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Título e tipo de campanha são obrigatórios.' }, { status: 400 });
    }

    if (!supabase) {
      // Simula inserção em memória no modo demonstração
      const newCampaignId = 'campaign-' + Math.random().toString(36).substring(2, 9);
      const newCampaign: any = {
        id: newCampaignId,
        title,
        description,
        type,
        status,
        media_url,
        media_type,
        aspect_ratio,
        button_text,
        button_url,
        start_date,
        end_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        campaign_audiences: [
          {
            id: 'aud-' + Math.random().toString(36).substring(2, 9),
            campaign_id: newCampaignId,
            target_type,
            rules,
          }
        ]
      };

      if (type === 'COUPON' && coupon_code) {
        newCampaign.coupons = [
          {
            id: 'coupon-' + Math.random().toString(36).substring(2, 9),
            campaign_id: newCampaignId,
            code: coupon_code.toUpperCase(),
            discount_type,
            discount_value,
            max_redemptions,
            current_redemptions: 0,
            expires_at,
          }
        ];
      }

      mockCampaigns = [newCampaign, ...mockCampaigns];
      return NextResponse.json({ success: true, isDemo: true, campaign: newCampaign });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Transação manual usando múltiplos inserts via supabase client
    // 1. Inserir Campanha
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        title,
        description,
        type,
        status,
        media_url,
        media_type,
        aspect_ratio,
        button_text,
        button_url: button_url || null,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      console.error('Erro ao salvar campanha:', campaignError);
      return NextResponse.json({ error: 'Erro ao salvar campanha no banco.' }, { status: 500 });
    }

    // 2. Inserir Público da Campanha
    const { error: audienceError } = await supabase
      .from('campaign_audiences')
      .insert({
        campaign_id: campaign.id,
        target_type,
        rules,
      });

    if (audienceError) {
      console.error('Erro ao salvar regras de público-alvo:', audienceError);
      // Apaga a campanha para manter integridade
      await supabase.from('campaigns').delete().eq('id', campaign.id);
      return NextResponse.json({ error: 'Erro ao salvar regras de público-alvo.' }, { status: 500 });
    }

    // 3. Inserir Cupom se aplicável
    if (type === 'COUPON' && coupon_code) {
      const { error: couponError } = await supabase
        .from('coupons')
        .insert({
          campaign_id: campaign.id,
          code: coupon_code.trim().toUpperCase(),
          discount_type,
          discount_value,
          max_redemptions: max_redemptions || null,
          expires_at: expires_at || null,
        });

      if (couponError) {
        console.error('Erro ao salvar cupom:', couponError);
        // Apaga campanha e público para manter integridade
        await supabase.from('campaigns').delete().eq('id', campaign.id);
        return NextResponse.json({ error: 'Erro ao salvar cupom no banco (código duplicado ou inválido).' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, isDemo: false, campaignId: campaign.id });
  } catch (err) {
    console.error('Erro interno na API admin de campanhas:', err);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da campanha é obrigatório.' }, { status: 400 });
    }

    const supabase = await createServerClientInstance();

    if (!supabase) {
      mockCampaigns = mockCampaigns.filter(c => c.id !== id);
      return NextResponse.json({ success: true, isDemo: true });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao apagar campanha no banco:', error);
      return NextResponse.json({ error: 'Erro ao apagar campanha.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, isDemo: false });
  } catch (err) {
    console.error('Erro interno ao apagar campanha:', err);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
