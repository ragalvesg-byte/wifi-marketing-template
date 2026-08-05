import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_STORE_SETTINGS, NEUTRAL_STORE_SETTINGS } from '@/lib/supabase/mock-data';

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
  'post_signup_banner_closable'
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
  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.warn('Rodando settings em modo demonstração: ', e);
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
      console.error('Falha ao buscar configurações da loja em produção (erro ou vazio):', error);
      return NextResponse.json({ 
        settings: filterPublicSettings(NEUTRAL_STORE_SETTINGS), 
        isDemo: false 
      });
    }

    return NextResponse.json({ settings: filterPublicSettings(settings), isDemo: false });
  } catch (err) {
    console.error('Falha de conexão ao buscar configurações da loja em produção:', err);
    return NextResponse.json({ 
      settings: filterPublicSettings(NEUTRAL_STORE_SETTINGS), 
      isDemo: false 
    });
  }
}

