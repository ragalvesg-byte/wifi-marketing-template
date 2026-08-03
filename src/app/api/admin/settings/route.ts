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

    if (!supabase) {
      return NextResponse.json({
        success: true,
        isDemo: true,
        message: 'Modo Demonstração ativo. Alterações aplicadas apenas localmente.',
      });
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
