import { StoreSettings, Visitor, WifiSession, DashboardMetrics } from "@/types/database";

export const MOCK_STORE_SETTINGS: StoreSettings = {
  id: "store-001",
  store_name: "Café & Bistro Central",
  logo_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80",
  background_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80",
  primary_color: "#2563eb",
  welcome_message: "Seja bem-vindo ao Wi-Fi gratuito do Café & Bistro Central!",
  post_connect_message: "Sua internet foi liberada com sucesso! Apresente este cupom ao garçom ou no caixa e ganhe 10% de desconto.",
  promo_coupon_code: "BISTRO10OFF",
  promo_image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  
  landing_media_type: "IMAGE",
  landing_media_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  featured_promo_title: "Combo Espresso + Croissant Especial",
  featured_promo_description: "Aproveite 10% de desconto em todo o cardápio ao se conectar na nossa rede Wi-Fi.",

  instagram_url: "https://instagram.com",
  facebook_url: "https://facebook.com",
  menu_url: "https://cardapio.sualoja.com.br",
  google_review_url: "https://g.page/r/sua-loja/review",
  google_review_timing: "POST_CONNECT",

  preset_theme: "CUSTOM",

  field_email_enabled: true,
  field_dob_enabled: true,
  field_city_enabled: false,
  field_gender_enabled: false,
  field_email_required: false,
  field_dob_required: false,
  field_city_required: false,
  field_gender_required: false,

  relogin_days_interval: 7,
  terms_of_service: "Ao se conectar a este serviço de Wi-Fi, você aceita os termos e condições do Café & Bistro Central para uso correto da internet.",
  privacy_policy: "Garantimos a total proteção dos seus dados pessoais em conformidade com a LGPD. Não compartilhamos suas informações com terceiros.",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const NEUTRAL_STORE_SETTINGS: StoreSettings = {
  id: "neutral-settings",
  store_name: "Portal Wi-Fi",
  logo_url: "",
  background_url: "",
  primary_color: "#2563eb",
  welcome_message: "Conecte-se ao Wi-Fi grátis",
  post_connect_message: "Sua internet foi liberada com sucesso!",
  promo_coupon_code: "",
  promo_image_url: "",
  
  landing_media_type: "IMAGE",
  landing_media_url: "",
  featured_promo_title: "",
  featured_promo_description: "",

  instagram_url: "",
  facebook_url: "",
  menu_url: "",
  google_review_url: "",
  google_review_timing: "POST_CONNECT",

  preset_theme: "CUSTOM",

  field_email_enabled: false,
  field_dob_enabled: false,
  field_city_enabled: false,
  field_gender_enabled: false,
  field_email_required: false,
  field_dob_required: false,
  field_city_required: false,
  field_gender_required: false,

  relogin_days_interval: 7,
  terms_of_service: "Ao se conectar a este serviço de Wi-Fi, você aceita os termos e condições padrão de uso correto da internet.",
  privacy_policy: "Garantimos a total proteção dos seus dados pessoais em conformidade com a LGPD.",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_VISITORS: Visitor[] = [
  {
    id: "v-001",
    phone: "11987654321",
    name: "João Silva",
    email: "joao.silva@email.com",
    date_of_birth: "1990-05-14",
    city: "São Paulo",
    gender: "Masculino",
    terms_accepted: true,
    terms_accepted_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    total_visits: 5,
    first_seen_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    last_seen_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
  },
  {
    id: "v-002",
    phone: "11976543210",
    name: "Maria Oliveira",
    email: "maria.oliveira@email.com",
    date_of_birth: "1995-11-20",
    city: "Campinas",
    gender: "Feminino",
    terms_accepted: true,
    terms_accepted_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    total_visits: 3,
    first_seen_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    last_seen_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: "v-003",
    phone: "11965432109",
    name: "Carlos Eduardo Santos",
    email: "carlos.eduardo@email.com",
    date_of_birth: "1988-03-08",
    city: "Santo André",
    gender: "Masculino",
    terms_accepted: true,
    terms_accepted_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    total_visits: 1,
    first_seen_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    last_seen_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

export const MOCK_DEVICES = [
  { mac_address: "aa:bb:cc:dd:ee:01", visitor_id: "v-001" },
  { mac_address: "aa:bb:cc:dd:ee:02", visitor_id: "v-002" },
  { mac_address: "aa:bb:cc:dd:ee:03", visitor_id: "v-003" },
];

export const MOCK_SESSIONS: WifiSession[] = [
  {
    id: "s-001",
    visitor_id: "v-001",
    mac_address: "aa:bb:cc:dd:ee:01",
    ip_address: "192.168.1.101",
    opennds_tok: "tok_abc123",
    gateway_name: "Loja_WiFi",
    started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "ACTIVE",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    visitor: MOCK_VISITORS[0],
  },
];

export const MOCK_METRICS: DashboardMetrics = {
  totalVisitors: 48,
  todayVisitors: 12,
  activeNowVisitors: 4,
  newVisitorsToday: 5,
  returningVisitors: 7,
  totalSessions: 142,
  peakHours: [
    { hour: "08h", visits: 2 },
    { hour: "10h", visits: 5 },
    { hour: "12h", visits: 18 },
    { hour: "14h", visits: 14 },
    { hour: "16h", visits: 8 },
    { hour: "18h", visits: 16 },
    { hour: "20h", visits: 11 },
  ],
  peakDays: [
    { day: "Seg", visits: 15 },
    { day: "Ter", visits: 18 },
    { day: "Qua", visits: 22 },
    { day: "Qui", visits: 20 },
    { day: "Sex", visits: 35 },
    { day: "Sáb", visits: 42 },
    { day: "Dom", visits: 28 },
  ],
  deviceBreakdown: [
    { category: "Android", count: 28 },
    { category: "iPhone / iOS", count: 16 },
    { category: "Windows / Outros", count: 4 },
  ],
};
