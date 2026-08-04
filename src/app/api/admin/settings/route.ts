import { NextResponse } from 'next/server';
import { createServerClientInstance } from '@/lib/supabase/server';
import { MOCK_STORE_SETTINGS } from '@/lib/supabase/mock-data';
import { StoreSettings } from '@/types/database';

function validateUrl(url?: string): string | undefined {
  if (!url || !url.trim()) return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  // Se informou algo sem protocolo, adiciona https://
  return `https://${trimmed}`;
}

export async function GET() {
  const supabase = await createServerClientInstance();

  if (!supabase) {
    return NextResponse.json({ settings: MOCK_STORE_SETTINGS, isDemo: true });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { data: settings } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .single();

    return NextResponse.json({
      settings: settings || MOCK_STORE_SETTINGS,
      isDemo: false,
    });
  } catch {
    return NextResponse.json({ settings: MOCK_STORE_SETTINGS, isDemo: false });
  }
}

export async function POST(request: Request) {
  try {
    const body: Partial<StoreSettings> = await request.json();
    const supabase = await createServerClientInstance();

    // Validação estrita de URLs enviadas
    const sanitizedMediaUrl = validateUrl(body.landing_media_url);
    const sanitizedLogoUrl = validateUrl(body.logo_url);
    const sanitizedBgUrl = validateUrl(body.background_url);
    const sanitizedInstagram = validateUrl(body.instagram_url);
    const sanitizedFacebook = validateUrl(body.facebook_url);
    const sanitizedMenu = validateUrl(body.menu_url);
    const sanitizedGoogle = validateUrl(body.google_review_url);
    const sanitizedPostSignupUrl = validateUrl(body.post_signup_url);
    const sanitizedPostSignupPromoImage = validateUrl(body.post_signup_promo_image_url);
    const sanitizedPostSignupPromoButton = validateUrl(body.post_signup_promo_button_url);

    if (!supabase) {
      return NextResponse.json({
        success: true,
        isDemo: true,
        message: 'Modo Demonstração ativo. Alterações aplicadas apenas localmente.',
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = {
      store_name: body.store_name?.trim() || 'Minha Loja',
      logo_url: sanitizedLogoUrl,
      background_url: sanitizedBgUrl,
      primary_color: body.primary_color || '#2563eb',
      welcome_message: body.welcome_message,
      post_connect_message: body.post_connect_message,
      promo_coupon_code: body.promo_coupon_code,
      
      landing_media_type: body.landing_media_type || 'IMAGE',
      landing_media_url: sanitizedMediaUrl,
      featured_promo_title: body.featured_promo_title,
      featured_promo_description: body.featured_promo_description,

      instagram_url: sanitizedInstagram,
      facebook_url: sanitizedFacebook,
      menu_url: sanitizedMenu,
      google_review_url: sanitizedGoogle,
      google_review_timing: body.google_review_timing || 'POST_CONNECT',

      preset_theme: body.preset_theme || 'CUSTOM',

      // Jornada do Visitante: Antes do Cadastro
      pre_signup_enabled: body.pre_signup_enabled ?? true,
      pre_signup_show_banner: body.pre_signup_show_banner ?? true,
      pre_signup_show_promo: body.pre_signup_show_promo ?? true,
      pre_signup_show_instagram: body.pre_signup_show_instagram ?? true,
      pre_signup_show_menu: body.pre_signup_show_menu ?? true,
      pre_signup_show_google_review: body.pre_signup_show_google_review ?? true,

      // Jornada do Visitante: Depois do Cadastro
      post_signup_action: body.post_signup_action || 'SHOW_MESSAGE',
      post_signup_banner_enabled: body.post_signup_banner_enabled ?? false,
      post_signup_banner_closable: body.post_signup_banner_closable ?? true,
      post_signup_title: body.post_signup_title || 'Internet liberada!',
      post_signup_message: body.post_signup_message || 'Aproveite sua conexão. Obrigado por nos visitar!',
      post_signup_url: sanitizedPostSignupUrl,
      post_signup_promo_image_url: sanitizedPostSignupPromoImage,
      post_signup_promo_title: body.post_signup_promo_title,
      post_signup_promo_description: body.post_signup_promo_description,
      post_signup_promo_button_text: body.post_signup_promo_button_text,
      post_signup_promo_button_url: sanitizedPostSignupPromoButton,
      post_signup_promo_image_aspect_ratio: body.post_signup_promo_image_aspect_ratio || '4:5',
      post_signup_redirect_mode: body.post_signup_redirect_mode || 'NONE',
      post_signup_redirect_seconds: body.post_signup_redirect_seconds || 3,
      post_signup_show_coupon: body.post_signup_show_coupon ?? false,
      post_signup_show_instagram: body.post_signup_show_instagram ?? false,
      post_signup_show_menu: body.post_signup_show_menu ?? false,
      post_signup_show_google_review: body.post_signup_show_google_review ?? false,

      field_email_enabled: body.field_email_enabled ?? false,
      field_dob_enabled: body.field_dob_enabled ?? false,
      field_city_enabled: body.field_city_enabled ?? false,
      field_gender_enabled: body.field_gender_enabled ?? false,
      field_email_required: body.field_email_required ?? false,
      field_dob_required: body.field_dob_required ?? false,
      field_city_required: body.field_city_required ?? false,
      field_gender_required: body.field_gender_required ?? false,

      relogin_days_interval: body.relogin_days_interval || 7,
      updated_at: new Date().toISOString(),
    };

    const { data: current } = await supabase
      .from('store_settings')
      .select('id')
      .limit(1)
      .single();

    if (current?.id) {
      const { error: updateError } = await supabase
        .from('store_settings')
        .update(payload)
        .eq('id', current.id);

      if (updateError) {
        return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase.from('store_settings').insert(payload);

      if (insertError) {
        return NextResponse.json({ error: 'Erro ao salvar novas configurações' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, isDemo: false });
  } catch {
    return NextResponse.json({ error: 'Erro interno ao salvar configurações' }, { status: 500 });
  }
}
