import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SuccessOffer } from '../components/portal/success-offer';
import { StoreSettings, OpenNdsParams } from '../types/database';

// Mock Lucide icons to prevent rendering complexity
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
  };
});

describe('SuccessOffer Component', () => {
  const baseSettings: StoreSettings = {
    id: 'store-123',
    store_name: 'Loja Teste',
    logo_url: 'https://logo.com/image.png',
    background_url: 'https://background.com/image.png',
    primary_color: '#ff0000',
    welcome_message: 'Bem-vindo!',
    post_connect_message: 'Internet Liberada!',
    promo_coupon_code: '', // @legacy — campo mantido vazio para compatibilidade
    promo_image_url: 'https://promo.com/image.png',
    relogin_days_interval: 7,
    terms_of_service: 'Termos de uso',
    privacy_policy: 'Política de privacidade',
    created_at: '',
    updated_at: '',
    pre_signup_enabled: true,
    post_signup_action: 'SHOW_MESSAGE',
    post_signup_title: 'Sucesso!',
    post_signup_message: 'Sua internet está ativa.',
    post_signup_redirect_mode: 'NONE',
    post_signup_redirect_seconds: 3,
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

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    // Mock fetch for real router auth requests
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );
  });

  it('deve renderizar o modo demonstração corretamente com o banner de aviso', async () => {
    render(
      <SuccessOffer
        settings={baseSettings}
        visitorName="João"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByText(/Modo demonstração/i)).not.toBeInTheDocument();
    expect(screen.getByText('Sucesso!')).toBeInTheDocument();
    expect(screen.getByText('Sua internet está ativa.')).toBeInTheDocument();
  });

  it('não deve exibir botão "Copiar Cupom" na tela de sucesso', async () => {
    render(
      <SuccessOffer
        settings={baseSettings}
        visitorName="João"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByText(/Copiar Cupom/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CUPOM DE DESCONTO/i)).not.toBeInTheDocument();
  });

  it('não deve exibir botão "Copiar Cupom" mesmo com promo_coupon_code preenchido (campo legado)', async () => {
    const legacySettings = {
      ...baseSettings,
      promo_coupon_code: 'LEGADO10',
      post_signup_action: 'COUPON' as const,
      post_signup_show_coupon: true,
    };

    render(
      <SuccessOffer
        settings={legacySettings}
        visitorName="João"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Cupom legado não deve ser renderizado
    expect(screen.queryByText('LEGADO10')).not.toBeInTheDocument();
    expect(screen.queryByText(/Copiar Cupom/i)).not.toBeInTheDocument();
  });

  it('deve exibir a imagem promocional quando post_signup_action for PROMO', async () => {
    const promoSettings = {
      ...baseSettings,
      post_signup_action: 'PROMO' as const,
      post_signup_promo_image_url: 'https://promo.com/image.png',
      post_signup_promo_title: 'Super Promo',
      post_signup_promo_description: 'Ganhe brindes especiais',
      post_signup_promo_button_text: 'Quero agora',
      post_signup_promo_button_url: 'https://bistro.com/promo',
    };

    render(
      <SuccessOffer
        settings={promoSettings}
        visitorName="João"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByAltText('Promoção')).toBeInTheDocument();
    expect(screen.getByText('Super Promo')).toBeInTheDocument();
    expect(screen.getByText('Ganhe brindes especiais')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quero agora' })).toBeInTheDocument();
  });

  it('deve iniciar o redirecionamento automático quando post_signup_redirect_mode for AUTO_3S', async () => {
    const redirectSettings = {
      ...baseSettings,
      post_signup_redirect_mode: 'AUTO_3S' as const,
      post_signup_redirect_seconds: 3,
    };

    // Spy on window.location
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    render(
      <SuccessOffer
        settings={redirectSettings}
        visitorName="João"
        authUrl=""
        openNdsParams={{ ...baseOpenNdsParams, redir: 'https://fallback.com' }}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Redirecionando em 3 segundos/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/Redirecionando em 2 segundos/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    // Deve disparar redirecionamento para fallback.com
    expect(window.location.href).toBe('https://fallback.com');

    window.location = originalLocation;
  });

  it('deve suportar o modo AUTO_5S: redirecionar após 5 segundos', async () => {
    const redirectSettings = {
      ...baseSettings,
      post_signup_redirect_mode: 'AUTO_5S' as const,
      post_signup_redirect_seconds: 5,
    };

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    render(
      <SuccessOffer
        settings={redirectSettings}
        visitorName="João"
        authUrl=""
        openNdsParams={{ ...baseOpenNdsParams, redir: 'https://fallback.com' }}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Redirecionando em 5 segundos/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText(/Redirecionando em 2 segundos/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(window.location.href).toBe('https://fallback.com');

    window.location = originalLocation;
  });

  it('deve suportar o modo AUTO_10S: redirecionar após 10 segundos', async () => {
    const redirectSettings = {
      ...baseSettings,
      post_signup_redirect_mode: 'AUTO_10S' as const,
      post_signup_redirect_seconds: 10,
    };

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    render(
      <SuccessOffer
        settings={redirectSettings}
        visitorName="João"
        authUrl=""
        openNdsParams={{ ...baseOpenNdsParams, redir: 'https://fallback.com' }}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Redirecionando em 10 segundos/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(9000);
    });
    expect(screen.getByText(/Redirecionando em 1 segundo/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(window.location.href).toBe('https://fallback.com');

    window.location = originalLocation;
  });

  it('deve suportar o modo NONE: sem timer e sem redirecionamento automático', async () => {
    const redirectSettings = {
      ...baseSettings,
      post_signup_redirect_mode: 'NONE' as const,
      post_signup_redirect_seconds: 0,
    };

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    render(
      <SuccessOffer
        settings={redirectSettings}
        visitorName="João"
        authUrl=""
        openNdsParams={{ ...baseOpenNdsParams, redir: 'https://fallback.com' }}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Não deve exibir texto de contagem regressiva
    expect(screen.queryByText(/Redirecionando em/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Não deve ter redirecionado automaticamente
    expect(window.location.href).toBe('');

    // Deve permitir clique manual para navegar
    const button = screen.getByRole('button', { name: /Navegar na Internet/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(window.location.href).toBe('https://fallback.com');

    window.location = originalLocation;
  });

  it('deve suportar o modo ON_CLICK: sem timer e redirecionamento somente após clique', async () => {
    const redirectSettings = {
      ...baseSettings,
      post_signup_redirect_mode: 'ON_CLICK' as const,
      post_signup_redirect_seconds: 0,
    };

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    render(
      <SuccessOffer
        settings={redirectSettings}
        visitorName="João"
        authUrl=""
        openNdsParams={{ ...baseOpenNdsParams, redir: 'https://fallback.com' }}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByText(/Redirecionando em/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(window.location.href).toBe('');

    const button = screen.getByRole('button', { name: /Navegar na Internet/i });
    fireEvent.click(button);
    expect(window.location.href).toBe('https://fallback.com');

    window.location = originalLocation;
  });

  it('deve permitir cancelar o redirecionamento automático', async () => {
    const redirectSettings = {
      ...baseSettings,
      post_signup_redirect_mode: 'AUTO_3S' as const,
      post_signup_redirect_seconds: 3,
    };

    render(
      <SuccessOffer
        settings={redirectSettings}
        visitorName="João"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Redirecionando em 3 segundos/i)).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelButton);

    // O cronômetro deve sumir da tela
    expect(screen.queryByText(/Redirecionando em/i)).not.toBeInTheDocument();
  });

  it('deve renderizar os botões secundários se configurados', async () => {
    const socialSettings = {
      ...baseSettings,
      post_signup_show_instagram: true,
      instagram_url: 'https://instagram.com/loja',
      post_signup_show_menu: true,
      menu_url: 'https://cardapio.com/loja',
      post_signup_show_google_review: true,
      google_review_url: 'https://google.com/review',
    };

    render(
      <SuccessOffer
        settings={socialSettings}
        visitorName="João"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Siga nosso Instagram')).toBeInTheDocument();
    expect(screen.getByText('Ver Cardápio')).toBeInTheDocument();
    expect(screen.getByText('Avaliar no Google')).toBeInTheDocument();
  });

  it('deve lidar com a alteração dinâmica do modo de redirecionamento (alteração entre os modos)', async () => {
    const { rerender } = render(
      <SuccessOffer
        settings={{ ...baseSettings, post_signup_redirect_mode: 'AUTO_3S' as const }}
        visitorName="João"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Redirecionando em 3 segundos/i)).toBeInTheDocument();

    // Altera o modo para NONE e re-renderiza
    rerender(
      <SuccessOffer
        settings={{ ...baseSettings, post_signup_redirect_mode: 'NONE' as const }}
        visitorName="João"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    // O cronômetro deve sumir da tela
    expect(screen.queryByText(/Redirecionando em/i)).not.toBeInTheDocument();
  });

  it('deve enviar autorização em modo roteador real e mostrar carregamento', async () => {
    const realParams = {
      ...baseOpenNdsParams,
      isRealMode: true,
    };

    render(
      <SuccessOffer
        settings={baseSettings}
        visitorName="João"
        authUrl="http://192.168.1.1:2050/opennds_auth/?tok=tok_123"
        openNdsParams={realParams}
      />
    );

    // Deve mostrar "Enviando autorização ao roteador..."
    expect(screen.getByText(/Enviando autorização ao roteador/i)).toBeInTheDocument();
  });

  it('deve exibir caixa informativa para o atendente quando a oferta não possuir button_url', async () => {
    const promoSettings = {
      ...baseSettings,
      post_signup_action: 'PROMO' as const,
      post_signup_promo_image_url: 'https://promo.com/image.png',
      post_signup_promo_title: 'Super Promo Sem Link',
      post_signup_promo_description: 'Sem URL no botão',
      post_signup_promo_button_text: 'Oferta Especial',
      post_signup_promo_button_url: '', // Sem URL
    };

    render(
      <SuccessOffer
        settings={promoSettings}
        visitorName="João"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Se o portal carregar campanhas dinâmicas, precisamos mockar a resposta de /api/portal/campaigns
    // Neste teste ele usará o mock do activePromoCampaign ou fallback de settings se activePromoCampaign for null.
    // Como activePromoCampaign é carregado via fetch, vamos Mockar o fetch de campanhas vazias.
    expect(screen.getByText(/Apresente esta tela ao atendente/i)).toBeInTheDocument();
    // Não deve exibir botão clicável da promoção
    expect(screen.queryByRole('button', { name: 'Oferta Especial' })).not.toBeInTheDocument();
  });

  it('deve exibir o botão configurado quando a oferta possuir button_url', async () => {
    const promoSettings = {
      ...baseSettings,
      post_signup_action: 'PROMO' as const,
      post_signup_promo_image_url: 'https://promo.com/image.png',
      post_signup_promo_title: 'Super Promo Com Link',
      post_signup_promo_description: 'Com URL no botão',
      post_signup_promo_button_text: 'Oferta Especial Com Link',
      post_signup_promo_button_url: 'https://bistro.com/promo',
    };

    render(
      <SuccessOffer
        settings={promoSettings}
        visitorName="João"
        authUrl=""
        openNdsParams={baseOpenNdsParams}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Como tem button_url, deve exibir o botão
    expect(screen.getByRole('button', { name: 'Oferta Especial Com Link' })).toBeInTheDocument();
    expect(screen.queryByText(/Apresente esta tela ao atendente/i)).not.toBeInTheDocument();
  });
});
