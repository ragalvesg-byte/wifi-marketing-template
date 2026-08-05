import { NextResponse } from 'next/server';
import { createServerClientInstance } from '@/lib/supabase/server';
import { Campaign, CampaignAudience } from '@/types/database';

// Armazenamento em memória para demonstração/desenvolvimento local (caso Supabase não esteja disponível)
let mockCampaigns: any[] = [
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
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    campaign_audiences: [
      {
        id: 'aud-1',
        campaign_id: 'campaign-1',
        target_type: 'NEW_VISITORS',
        rules: {},
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
    // Busca campanhas com públicos associados (coupons mantidos no select para campanhas legadas)
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
      media_position_x = 50,
      media_position_y = 50,
      media_fit = 'cover',
      show_pre_signup = true,
      show_post_signup = true,
      show_promotions_page = true,
      // Target
      target_type = 'ALL',
      rules = {},
      // Campos legados de cupom são ignorados silenciosamente
    } = body;

    if (media_position_x < 0 || media_position_x > 100 || media_position_y < 0 || media_position_y > 100) {
      return NextResponse.json({ error: 'Os valores de posicionamento X e Y devem estar entre 0 e 100.' }, { status: 400 });
    }

    if (!['cover', 'contain'].includes(media_fit)) {
      return NextResponse.json({ error: 'O enquadramento deve ser cover ou contain.' }, { status: 400 });
    }

    if (!title || !type) {
      return NextResponse.json({ error: 'Título e tipo de campanha são obrigatórios.' }, { status: 400 });
    }

    // Rejeita criação de campanhas do tipo COUPON (legado)
    const effectiveType = type === 'COUPON' ? 'PROMO' : type;

    if (!supabase) {
      // Simula inserção em memória no modo demonstração
      const newCampaignId = 'campaign-' + Math.random().toString(36).substring(2, 9);
      const newCampaign: any = {
        id: newCampaignId,
        title,
        description,
        type: effectiveType,
        status,
        media_url,
        media_type,
        aspect_ratio,
        button_text,
        button_url,
        start_date,
        end_date,
        media_position_x,
        media_position_y,
        media_fit,
        show_pre_signup,
        show_post_signup,
        show_promotions_page,
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

      mockCampaigns = [newCampaign, ...mockCampaigns];
      return NextResponse.json({ success: true, isDemo: true, campaign: newCampaign });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Operações sequenciais (não atômicas) — campanha + audiência
    // 1. Inserir Campanha
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        title,
        description,
        type: effectiveType,
        status,
        media_url,
        media_type,
        aspect_ratio,
        button_text,
        button_url: button_url || null,
        start_date: start_date || null,
        end_date: end_date || null,
        media_position_x,
        media_position_y,
        media_fit,
        show_pre_signup,
        show_post_signup,
        show_promotions_page,
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

    // Cupom NÃO é mais criado — sistema de oferta presencial

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createServerClientInstance();

    const {
      id,
      title,
      description,
      type,
      status,
      media_url,
      media_type = 'IMAGE',
      aspect_ratio = '4:5',
      button_text,
      button_url,
      start_date,
      end_date,
      media_position_x,
      media_position_y,
      media_fit,
      show_pre_signup = true,
      show_post_signup = true,
      show_promotions_page = true,
      // Target
      target_type = 'ALL',
      rules = {},
      // Campos legados de cupom são ignorados silenciosamente
    } = body;

    const positionX = media_position_x ?? 50;
    const positionY = media_position_y ?? 50;
    const fit = media_fit || 'cover';

    if (positionX < 0 || positionX > 100 || positionY < 0 || positionY > 100) {
      return NextResponse.json({ error: 'Os valores de posicionamento X e Y devem estar entre 0 e 100.' }, { status: 400 });
    }
    if (!['cover', 'contain'].includes(fit)) {
      return NextResponse.json({ error: 'O enquadramento deve ser cover ou contain.' }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID da campanha é obrigatório para edição.' }, { status: 400 });
    }

    if (!title || !type) {
      return NextResponse.json({ error: 'Título e tipo de campanha são obrigatórios.' }, { status: 400 });
    }

    // Converte COUPON legado para PROMO ao salvar
    const effectiveType = type === 'COUPON' ? 'PROMO' : type;

    if (!supabase) {
      // Modo de demonstração em memória
      const index = mockCampaigns.findIndex(c => c.id === id);
      if (index === -1) {
        return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
      }

      const updatedCampaign = {
        ...mockCampaigns[index],
        title,
        description,
        type: effectiveType,
        status,
        media_url,
        media_type,
        aspect_ratio,
        button_text,
        button_url,
        start_date,
        end_date,
        media_position_x: positionX,
        media_position_y: positionY,
        media_fit: fit,
        show_pre_signup,
        show_post_signup,
        show_promotions_page,
        updated_at: new Date().toISOString(),
        campaign_audiences: [
          {
            id: mockCampaigns[index].campaign_audiences?.[0]?.id || 'aud-' + Math.random().toString(36).substring(2, 9),
            campaign_id: id,
            target_type,
            rules,
          }
        ]
      };

      mockCampaigns[index] = updatedCampaign;
      return NextResponse.json({ success: true, isDemo: true, campaign: updatedCampaign });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Busca estado anterior para caso de rollback (compensação de falha parcial)
    const { data: prevCampaign, error: fetchCampError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchCampError || !prevCampaign) {
      console.error('Erro ao buscar campanha anterior para edição:', fetchCampError);
      return NextResponse.json({ error: 'Campanha não encontrada para edição.' }, { status: 404 });
    }

    const { data: prevAudience } = await supabase
      .from('campaign_audiences')
      .select('*')
      .eq('campaign_id', id)
      .maybeSingle();

    // Função de rollback manual para tratar falhas parciais (operações sequenciais)
    const runRollback = async () => {
      console.warn(`[Rollback] Iniciando reversão manual das alterações da campanha ${id} devido a falha parcial...`);
      try {
        // Reverte alteração da campanha
        await supabase
          .from('campaigns')
          .update({
            title: prevCampaign.title,
            description: prevCampaign.description,
            type: prevCampaign.type,
            status: prevCampaign.status,
            media_url: prevCampaign.media_url,
            media_type: prevCampaign.media_type,
            aspect_ratio: prevCampaign.aspect_ratio,
            button_text: prevCampaign.button_text,
            button_url: prevCampaign.button_url,
            start_date: prevCampaign.start_date,
            end_date: prevCampaign.end_date,
            media_position_x: prevCampaign.media_position_x,
            media_position_y: prevCampaign.media_position_y,
            media_fit: prevCampaign.media_fit,
            show_pre_signup: prevCampaign.show_pre_signup,
            show_post_signup: prevCampaign.show_post_signup,
            show_promotions_page: prevCampaign.show_promotions_page,
            updated_at: prevCampaign.updated_at,
          })
          .eq('id', id);

        // Reverte alteração de público
        if (prevAudience) {
          await supabase
            .from('campaign_audiences')
            .update({ target_type: prevAudience.target_type, rules: prevAudience.rules })
            .eq('campaign_id', id);
        } else {
          await supabase
            .from('campaign_audiences')
            .delete()
            .eq('campaign_id', id);
        }

        console.log(`[Rollback] Reversão manual concluída com sucesso para campanha ${id}.`);
      } catch (rollbackErr) {
        console.error('[Rollback Critical] Erro catastrófico ao reverter alterações no banco:', rollbackErr);
      }
    };

    // 1. Atualizar Campanha (Operação sequencial 1)
    const { error: campaignError } = await supabase
      .from('campaigns')
      .update({
        title,
        description,
        type: effectiveType,
        status,
        media_url,
        media_type,
        aspect_ratio,
        button_text,
        button_url: button_url || null,
        start_date: start_date || null,
        end_date: end_date || null,
        media_position_x: positionX,
        media_position_y: positionY,
        media_fit: fit,
        show_pre_signup,
        show_post_signup,
        show_promotions_page,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (campaignError) {
      console.error('Erro ao atualizar campanha:', campaignError);
      return NextResponse.json({ error: 'Erro ao atualizar campanha no banco.' }, { status: 500 });
    }

    // 2. Atualizar ou inserir público (Operação sequencial 2)
    const { data: existingAudience } = await supabase
      .from('campaign_audiences')
      .select('id')
      .eq('campaign_id', id)
      .maybeSingle();

    if (existingAudience) {
      const { error: audError } = await supabase
        .from('campaign_audiences')
        .update({ target_type, rules })
        .eq('campaign_id', id);

      if (audError) {
        console.error('Erro ao atualizar regras de público:', audError);
        await runRollback();
        return NextResponse.json({ error: 'Erro ao atualizar regras de público. Alterações revertidas.' }, { status: 500 });
      }
    } else {
      const { error: audError } = await supabase
        .from('campaign_audiences')
        .insert({ campaign_id: id, target_type, rules });

      if (audError) {
        console.error('Erro ao inserir regras de público:', audError);
        await runRollback();
        return NextResponse.json({ error: 'Erro ao inserir regras de público. Alterações revertidas.' }, { status: 500 });
      }
    }

    // Cupom NÃO é mais atualizado/criado — tabelas legadas permanecem intactas

    return NextResponse.json({ success: true, isDemo: false });
  } catch (err) {
    console.error('Erro interno na edição de campanha:', err);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
