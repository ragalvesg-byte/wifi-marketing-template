import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_STORE_SETTINGS, NEUTRAL_STORE_SETTINGS } from '@/lib/supabase/mock-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_SETTING_FIELDS = [
  'id',
  'store_name',
  'logo_url',
  'background_url',
  'primary_color',
  'welcome_message',
  'post_connect_message',
  'landing_media_type',
  'landing_media_url',
  'featured_promo_title',
  'featured_promo_description',
  'instagram_url',
  'facebook_url',
  'menu_url',
  'google_review_url',
  'google_review_timing',
  'preset_theme',
  'field_email_enabled',
  'field_dob_enabled',
  'field_city_enabled',
  'field_gender_enabled',
  'field_email_required',
  'field_dob_required',
  'field_city_required',
  'field_gender_required',
  'relogin_days_interval',
  'terms_of_service',
  'privacy_policy',
  'pre_signup_enabled',
  'pre_signup_show_banner',
  'pre_signup_show_promo',
  'pre_signup_show_instagram',
  'pre_signup_show_menu',
  'pre_signup_show_google_review',
  'post_signup_action',
  'post_signup_title',
  'post_signup_message',
  'post_signup_url',
  'post_signup_redirect_mode',
  'post_signup_redirect_seconds',
  'post_signup_show_instagram',
  'post_signup_show_menu',
  'post_signup_show_google_review',
  'post_signup_promo_image_url',
  'post_signup_promo_title',
  'post_signup_promo_description',
  'post_signup_promo_button_text',
  'post_signup_promo_button_url',
  'post_signup_promo_image_aspect_ratio',
  'post_signup_banner_enabled',
  'post_signup_banner_closable',
  'landing_media_position_x',
  'landing_media_position_y',
  'landing_media_fit',
  'landing_media_aspect_ratio',
  'post_signup_media_position_x',
  'post_signup_media_position_y',
  'post_signup_media_fit',
  'pre_signup_promotions_enabled',
  'post_signup_promotions_enabled',
  'promotions_button_enabled',
  'promotions_carousel_enabled',
  'customer_wifi_enabled',
  'wifi_network_name',
  'wifi_password_visible',
  'wifi_password_copy_enabled',
  'wifi_section_title',
  'wifi_instruction_text',
  'wifi_android_instructions',
  'wifi_ios_instructions'
];

function filterPublicSettings(settings: any) {
  if (!settings) return null;
  const filtered: any = {};
  for (const field of ALLOWED_SETTING_FIELDS) {
    if (field in settings) {
      filtered[field] = settings[field];
    }
  }
  return filtered;
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`SUPABASE_URL definida: ${supabaseUrl ? 'sim' : 'não'}`);
  console.log(`SERVICE_ROLE definida: ${supabaseServiceRoleKey ? 'sim' : 'não'}`);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e: any) {
    console.error('Falha de inicialização do Supabase Admin:', e?.message || e);
  }

  if (!supabase) {
    return NextResponse.json({ 
      settings: filterPublicSettings(MOCK_STORE_SETTINGS), 
      isDemo: true 
    });
  }

  try {
    const selectFields = ALLOWED_SETTING_FIELDS.join(', ');
    const { data: settings, error } = await supabase
      .from('store_settings')
      .select(selectFields)
      .limit(1)
      .single();

    if (error || !settings) {
      const errMsg = error ? `${error.message} / ${error.code}` : 'Nenhum registro retornado';
      console.error(`erro da consulta: ${errMsg}`);

      let countVal = 0;
      try {
        const { count } = await supabase
          .from('store_settings')
          .select('*', { count: 'exact', head: true });
        countVal = count ?? 0;
      } catch (countErr) {
        // Silently ignore counting errors
      }
      console.error(`quantidade de registros encontrados: ${countVal}`);

      return NextResponse.json(
        { error: 'Erro interno ao buscar as configurações.' },
        { status: 500 }
      );
    }

    console.log(`erro da consulta: nenhum`);
    console.log(`quantidade de registros encontrados: 1`);

    return NextResponse.json({ settings: filterPublicSettings(settings), isDemo: false });
  } catch (err: any) {
    const errMsg = err?.message || err;
    console.error(`erro da consulta: ${errMsg}`);
    return NextResponse.json(
      { error: 'Erro interno ao buscar as configurações.' },
      { status: 500 }
    );
  }
}

