import { ThemePreset, StoreSettings } from '@/types/database';

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  primaryColor: string;
  backgroundUrl: string;
  welcomeMessage: string;
  featuredPromoTitle: string;
  featuredPromoDescription: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemeConfig> = {
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Personalizado',
    primaryColor: '#2563eb',
    backgroundUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80',
    welcomeMessage: 'Seja bem-vindo ao nosso Wi-Fi gratuito!',
    featuredPromoTitle: 'Oferta Especial do Dia',
    featuredPromoDescription: 'Aproveite nosso cupom especial ao se conectar no Wi-Fi.',
  },
  BURGER: {
    id: 'BURGER',
    name: 'Hamburgueria',
    primaryColor: '#dc2626', // Vermelho vibrante
    backgroundUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1920&q=80',
    welcomeMessage: 'Conecte-se ao Wi-Fi da Hamburgueria e garanta seu cupom!',
    featuredPromoTitle: 'Combo Burger + Batata Suprema',
    featuredPromoDescription: 'Apresente o cupom ao fazer seu pedido e ganhe 10% de desconto.',
  },
  PIZZA: {
    id: 'PIZZA',
    name: 'Pizzaria',
    primaryColor: '#ea580c', // Laranja italiano
    backgroundUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1920&q=80',
    welcomeMessage: 'Bem-vindo à Pizzaria! Conecte-se e aproveite.',
    featuredPromoTitle: 'Borda Recheada Grátis',
    featuredPromoDescription: 'Ganhe borda recheada grátis em qualquer pizza grande hoje.',
  },
  SUSHI: {
    id: 'SUSHI',
    name: 'Sushi & Culinária Japonesa',
    primaryColor: '#e11d48', // Salmão / Rosa escuro elegante
    backgroundUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1920&q=80',
    welcomeMessage: 'Bem-vindo ao nosso Sushi Bar! Conecte-se ao Wi-Fi.',
    featuredPromoTitle: 'Rodízio Premium com Desconto',
    featuredPromoDescription: 'Ganhe 1 temaki grátis ou 10% de desconto no rodízio de hoje.',
  },
  CAFE: {
    id: 'CAFE',
    name: 'Cafeteria & Bistrô',
    primaryColor: '#78350f', // Café amadeirado
    backgroundUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=80',
    welcomeMessage: 'Sinta-se em casa no nosso café! Wi-Fi rápido e gratuito.',
    featuredPromoTitle: 'Espresso + Slice de Bolo',
    featuredPromoDescription: 'Peça um cappuccino especial e ganhe desconto na sobremesa do dia.',
  },
  RESTAURANT: {
    id: 'RESTAURANT',
    name: 'Restaurante Fino',
    primaryColor: '#0f766e', // Verde esmeralda refinado
    backgroundUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80',
    welcomeMessage: 'Seja bem-vindo! Aproveite nossa internet de alta velocidade.',
    featuredPromoTitle: 'Sobremesa Cortesia',
    featuredPromoDescription: 'Apresente este cupom e ganhe uma sobremesa especial da casa.',
  },
  GYM: {
    id: 'GYM',
    name: 'Academia & Fitness',
    primaryColor: '#ca8a04', // Amarelo alto contraste / energia
    backgroundUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80',
    welcomeMessage: 'Bora treinar! Wi-Fi liberado para suas músicas e treinos.',
    featuredPromoTitle: 'Avaliação Física Grátis',
    featuredPromoDescription: 'Apresente seu check-in no Wi-Fi e agende sua avaliação nutricional.',
  },
  CLINIC: {
    id: 'CLINIC',
    name: 'Clínica & Saúde',
    primaryColor: '#0284c7', // Azul suave saúde
    backgroundUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1920&q=80',
    welcomeMessage: 'Sua saúde em primeiro lugar. Wi-Fi cortesia enquanto aguarda.',
    featuredPromoTitle: 'Atendimento & Conforto',
    featuredPromoDescription: 'Siga nossas redes sociais e acompanhe dicas exclusivas de bem-estar.',
  },
  HOTEL: {
    id: 'HOTEL',
    name: 'Hotel & Pousada',
    primaryColor: '#4f46e5', // Índigo hotelaria
    backgroundUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80',
    welcomeMessage: 'Desejamos uma excelente estadia! Wi-Fi de alta velocidade liberado.',
    featuredPromoTitle: 'Drink de Boas-Vindas no Bar',
    featuredPromoDescription: 'Apresente este voucher no bar do hotel e retire seu drink de boas-vindas.',
  },
};

/**
 * Aplica um preset de tema às configurações da loja se selecionado.
 */
export function applyThemePreset(settings: StoreSettings, presetId: ThemePreset): StoreSettings {
  if (presetId === 'CUSTOM' || !THEME_PRESETS[presetId]) {
    return settings;
  }

  const preset = THEME_PRESETS[presetId];
  return {
    ...settings,
    preset_theme: presetId,
    primary_color: preset.primaryColor,
    background_url: preset.backgroundUrl,
    welcome_message: preset.welcomeMessage,
    featured_promo_title: preset.featuredPromoTitle,
    featured_promo_description: preset.featuredPromoDescription,
  };
}
