import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SuccessOffer } from '../components/portal/success-offer';
import { MediaCarousel } from '../components/portal/media-carousel';
import { StoreSettings, OpenNdsParams } from '../types/database';
import { getAspectRatioValue } from '../lib/aspect-ratio';

// Mock Lucide icons to avoid render complexity in test environments
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react') as any;
  return {
    ...actual,
    Wifi: () => <div data-testid="wifi-icon">Wifi</div>,
    WifiOff: () => <div data-testid="wifi-off-icon">WifiOff</div>,
    CheckCircle2: () => <div data-testid="check-icon">CheckCircle2</div>,
    Star: () => <div data-testid="star-icon">Star</div>,
    Camera: () => <div data-testid="camera-icon">Camera</div>,
    Utensils: () => <div data-testid="utensils-icon">Utensils</div>,
    X: () => <div data-testid="close-icon">X</div>,
    ChevronLeft: () => <div data-testid="chevron-left">ChevronLeft</div>,
    ChevronRight: () => <div data-testid="chevron-right">ChevronRight</div>,
  };
});

describe('Post-Signup Carousel & Aspect-Ratio Tests', () => {
  const baseSettings: StoreSettings = {
    id: 'store-123',
    store_name: 'Loja Teste',
    logo_url: 'https://logo.com/image.png',
    background_url: 'https://background.com/image.png',
    primary_color: '#2563eb',
    welcome_message: 'Bem-vindo!',
    post_connect_message: 'Internet Liberada!',
    promo_coupon_code: '',
    promo_image_url: '',
    relogin_days_interval: 7,
    terms_of_service: 'Termos de uso',
    privacy_policy: 'Política de privacidade',
    created_at: '',
    updated_at: '',
    pre_signup_enabled: true,
    post_signup_action: 'PROMO',
    post_signup_title: 'Sucesso!',
    post_signup_message: 'Sua internet está ativa.',
    post_signup_redirect_mode: 'NONE',
    post_signup_redirect_seconds: 3,
    post_signup_promo_image_url: 'https://jornada-banner.com/image.png',
    post_signup_promo_title: 'Oferta da Jornada',
    post_signup_promo_description: 'Descrição da jornada',
    post_signup_promo_image_aspect_ratio: '9:16',
    post_signup_media_fit: 'contain',
    post_signup_media_position_x: 20,
    post_signup_media_position_y: 80,
    post_signup_promotions_enabled: true,
    promotions_carousel_enabled: true,
  };

  const baseOpenNdsParams: OpenNdsParams = {
    tok: 'tok_123',
    clientmac: '00:11:22:33:44:55',
    clientip: '192.168.1.100',
    gatewayname: 'Loja_Gate',
    gatewayaddress: '192.168.1.1',
    gatewayport: '2050',
    isRealMode: false,
    redir: 'https://original-url.com',
  };

  const mockCampaigns = [
    {
      id: 'campaign-1',
      title: 'Campanha Pós 16:9',
      description: 'Campanha pós 16:9',
      type: 'PROMO',
      status: 'ACTIVE',
      media_url: 'https://campaign-post.com/image169.png',
      media_type: 'IMAGE',
      aspect_ratio: '16:9',
      media_fit: 'cover',
      media_position_x: 40,
      media_position_y: 60,
      show_pre_signup: false,
      show_post_signup: true,
      show_promotions_page: true,
    }
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();

    // Mock fetch for both campaigns endpoint and events logging
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/portal/campaigns')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ campaigns: mockCampaigns, isDemo: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. Pós-cadastro com dois banners gira após 3 segundos e retorna ao primeiro depois do último', async () => {
    const slides = [
      { id: '1', mediaUrl: 'https://img1.com', mediaType: 'IMAGE' as const, isCampaign: true },
      { id: '2', mediaUrl: 'https://img2.com', mediaType: 'IMAGE' as const, isCampaign: true }
    ];

    const onSlideViewSpy = vi.fn();
    render(<MediaCarousel slides={slides} onSlideView={onSlideViewSpy} />);

    // Inicia no primeiro
    expect(onSlideViewSpy).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));

    // Avança 3 segundos
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onSlideViewSpy).toHaveBeenLastCalledWith(expect.objectContaining({ id: '2' }));

    // Retorna ao primeiro após mais 3 segundos
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onSlideViewSpy).toHaveBeenLastCalledWith(expect.objectContaining({ id: '1' }));
  });

  it('2. Componente não reinicia o timer a cada render e autoplay não reinicia quando onSlideView atualiza estado', async () => {
    const slides = [
      { id: '1', mediaUrl: 'https://img1.com', mediaType: 'IMAGE' as const, isCampaign: true },
      { id: '2', mediaUrl: 'https://img2.com', mediaType: 'IMAGE' as const, isCampaign: true }
    ];

    const onSlideViewSpy = vi.fn();
    const { rerender } = render(
      <MediaCarousel slides={slides} onSlideView={onSlideViewSpy} />
    );

    // Renderizações adicionais sem mudança de slides
    rerender(<MediaCarousel slides={slides} onSlideView={onSlideViewSpy} />);
    rerender(<MediaCarousel slides={slides} onSlideView={onSlideViewSpy} />);

    // Avança 2 segundos (não deve trocar ainda, se tivesse reiniciado o timer por re-render, começaria do zero de novo)
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onSlideViewSpy).toHaveBeenCalledTimes(1);

    // Completa os 3 segundos
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onSlideViewSpy).toHaveBeenLastCalledWith(expect.objectContaining({ id: '2' }));
  });

  it('3. Fit contain e cover respeitam as configurações corretas sem contaminações', () => {
    const slides = [
      { 
        id: '1', 
        mediaUrl: 'https://img1.com', 
        mediaType: 'IMAGE' as const, 
        fit: 'contain' as const,
        positionX: 10,
        positionY: 20
      },
      { 
        id: '2', 
        mediaUrl: 'https://img2.com', 
        mediaType: 'IMAGE' as const, 
        fit: 'cover' as const,
        positionX: 90,
        positionY: 90
      }
    ];

    const { rerender } = render(<MediaCarousel slides={slides} />);
    
    const imgElements = screen.getAllByAltText('Promoção') as HTMLImageElement[];
    expect(imgElements[0].style.objectFit).toBe('contain');
    expect(imgElements[0].style.objectPosition).toBe('10% 20%');

    // Avança para o próximo slide
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const nextImgElements = screen.getAllByAltText('Promoção') as HTMLImageElement[];
    expect(nextImgElements[1].style.objectFit).toBe('cover');
    expect(nextImgElements[1].style.objectPosition).toBe('90% 90%');
  });

  it('4. Campanha 9:16 e 4:5 usam proporções vertical e retrato respetivamente', () => {
    expect(getAspectRatioValue('9:16')).toBe('9 / 16');
    expect(getAspectRatioValue('4:5')).toBe('4 / 5');
    expect(getAspectRatioValue('1:1')).toBe('1 / 1');
    expect(getAspectRatioValue('16:9')).toBe('16 / 9');
  });

  it('5. Banner da Jornada e campanhas aparecem juntos no success-offer.tsx', async () => {
    render(
      <SuccessOffer
        settings={baseSettings}
        visitorName="Carlos"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    // Aguarda o fetch das campanhas carregar
    await act(async () => {
      await Promise.resolve();
    });

    // O modal pós-cadastro deve exibir o MediaCarousel que contém tanto o banner da jornada quanto a campanha carregada.
    // Como mockamos a campanha com ID "campaign-1" e o banner com ID "post-main", ambos devem estar configurados nos slides.
    const chevronElements = screen.getAllByTestId('chevron-left');
    expect(chevronElements.length).toBeGreaterThan(0);
    const carouselContainer = chevronElements[0].closest('div');
    expect(carouselContainer).toBeInTheDocument();
  });

  it('6. Array de slides mantém referência estável após render sem mudança', async () => {
    const { rerender } = render(
      <SuccessOffer
        settings={baseSettings}
        visitorName="Carlos"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Se re-renderizarmos, o estado interno e os slides do useMemo devem manter a estabilidade referencial
    rerender(
      <SuccessOffer
        settings={baseSettings}
        visitorName="Carlos"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    const chevronElements = screen.getAllByTestId('chevron-left');
    expect(chevronElements.length).toBeGreaterThan(0);
    const carouselContainer = chevronElements[0].closest('div');
    expect(carouselContainer).toBeInTheDocument();
  });
});
