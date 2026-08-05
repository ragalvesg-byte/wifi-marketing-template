'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StoreSettings, OpenNdsParams } from '@/types/database';
import { CheckCircle2, ExternalLink, Star, Camera, Utensils, Loader2, AlertCircle, X, Wifi, WifiOff, Gift } from 'lucide-react';
import { sendVisitorEvent } from '@/lib/events';
import { MediaCarousel, CarouselSlide } from './media-carousel';

interface SuccessOfferProps {
  settings: StoreSettings;
  visitorId?: string | null;
  visitorName: string;
  authUrl: string;
  openNdsParams: OpenNdsParams;
}

// ==========================================
// Sub-componentes Refatorados
// ==========================================

interface AuthorizationGateProps {
  authState: 'AUTHORIZING' | 'AUTHORIZED' | 'FAILED';
  isRealMode: boolean;
}

export function AuthorizationGate({ authState, isRealMode }: AuthorizationGateProps) {
  if (authState === 'AUTHORIZING' && isRealMode) {
    return (
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
        <h2 className="text-xl font-bold">Enviando autorização ao roteador...</h2>
        <p className="text-sm text-slate-500">Comunicando com o gateway openNDS.</p>
      </div>
    );
  }

  if (authState === 'FAILED' && isRealMode) {
    return (
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Falha na Liberação</h2>
        <p className="text-sm text-slate-500 mb-4">
          Não foi possível enviar o pacote de autorização ao roteador Wi-Fi. Verifique a conexão com o gateway local.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return null;
}

interface PromoBannerProps {
  visible: boolean;
  settings: StoreSettings;
  slides: CarouselSlide[];
  carouselSlides: CarouselSlide[];
  timeLeft: number | null;
  primaryColor: string;
  onCancel: () => void;
  onRedirect: (url: string | null, isCampaign: boolean, campaignId?: string) => void;
  onSlideView: (slide: CarouselSlide) => void;
  onSlideClick: (slide: CarouselSlide) => void;
  activePromoCampaign: any;
}

export function PromoBanner({
  visible,
  settings,
  slides,
  carouselSlides,
  timeLeft,
  primaryColor,
  onCancel,
  onRedirect,
  onSlideView,
  onSlideClick,
  activePromoCampaign,
}: PromoBannerProps) {
  if (!visible || slides.length === 0) return null;

  const hasMultiple = slides.length > 1;
  const activeSlide = slides[0];

  const title = activePromoCampaign?.title || settings.post_signup_promo_title;
  const description = activePromoCampaign?.description || settings.post_signup_promo_description;
  const buttonText = activePromoCampaign?.button_text || settings.post_signup_promo_button_text || 'Ir agora';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-in zoom-in-95">
        {settings.post_signup_banner_closable && (
          <button 
            onClick={onCancel}
            className="absolute top-3 right-3 z-30 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {hasMultiple ? (
          <div className="w-full select-none" style={{ maxHeight: '35vh' }}>
            <MediaCarousel
              slides={carouselSlides}
              onSlideView={onSlideView}
              onSlideClick={onSlideClick}
              containerAspectRatio="4/3"
            />
          </div>
        ) : (
          activeSlide.mediaUrl ? (
            <div 
              className="w-full bg-slate-100 relative overflow-hidden" 
              style={{
                aspectRatio: activeSlide.buttonUrl ? '4/3' : '16/9',
                maxHeight: '35vh'
              }}
            >
              <img 
                src={activeSlide.mediaUrl} 
                alt="Promoção" 
                className="w-full h-full" 
                style={{
                  objectPosition: `${activeSlide.mediaPositionX ?? 50}% ${activeSlide.mediaPositionY ?? 50}%`,
                  objectFit: activeSlide.mediaFit || 'cover',
                  backgroundColor: activeSlide.mediaFit === 'contain' ? '#0f172a' : 'transparent',
                }}
              />
            </div>
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white p-6">
              <Star className="w-12 h-12 opacity-50" />
            </div>
          )
        )}

        <div className="p-5 sm:p-6 bg-white flex-1 overflow-y-auto">
          {title && <h2 className="text-lg font-black text-slate-900 mb-1.5">{title}</h2>}
          {description && <p className="text-xs text-slate-600 mb-4">{description}</p>}

          {timeLeft !== null ? (
            <div className="space-y-2 mt-2">
              <p className="text-[10px] font-bold text-center text-slate-500 mb-1">Redirecionando em {timeLeft} segundos...</p>
              <button 
                onClick={() => {
                  const url = activePromoCampaign?.button_url || settings.post_signup_promo_button_url;
                  onRedirect(url || null, !!activePromoCampaign, activePromoCampaign?.id);
                }}
                style={{ backgroundColor: primaryColor }}
                className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-95 transition-opacity"
              >
                {buttonText}
              </button>
              <button 
                onClick={onCancel}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
              >
                Cancelar redirecionamento
              </button>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {buttonText && (activePromoCampaign?.button_url || settings.post_signup_promo_button_url) && (
                <button 
                  onClick={() => {
                    const url = activePromoCampaign?.button_url || settings.post_signup_promo_button_url;
                    onRedirect(url || null, !!activePromoCampaign, activePromoCampaign?.id);
                  }}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-95 transition-opacity"
                >
                  {buttonText}
                </button>
              )}
              {settings.post_signup_banner_closable && (
                <button 
                  onClick={onCancel}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
                >
                  Fechar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CountdownRedirectProps {
  timeLeft: number | null;
  bannerVisible: boolean;
  primaryColor: string;
  onCancel: () => void;
  onRedirect: () => void;
}

export function CountdownRedirect({
  timeLeft,
  bannerVisible,
  primaryColor,
  onCancel,
  onRedirect,
}: CountdownRedirectProps) {
  if (timeLeft !== null && !bannerVisible) {
    return (
      <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
        <p className="text-sm font-semibold text-slate-700">
          Redirecionando em {timeLeft} segundos...
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={onRedirect} style={{ backgroundColor: primaryColor }} className="flex-1 py-3 rounded-xl text-white font-bold text-xs shadow-md transition-colors">
            Ir agora
          </button>
        </div>
      </div>
    );
  }

  if (!bannerVisible) {
    return (
      <button
        onClick={onRedirect}
        style={{ backgroundColor: primaryColor }}
        className="w-full py-4 rounded-xl text-white font-bold text-base shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2"
      >
        Navegar na Internet
      </button>
    );
  }

  return null;
}

interface SecondaryActionsProps {
  settings: StoreSettings;
  visitorId?: string | null;
}

export function SecondaryActions({ settings, visitorId }: SecondaryActionsProps) {
  const handleActionClick = (type: 'INSTAGRAM_CLICKED' | 'MENU_CLICKED' | 'GOOGLE_REVIEW_CLICKED') => {
    sendVisitorEvent(type);
  };

  return (
    <div className="grid grid-cols-1 gap-3 pt-4">
      {settings.post_signup_show_instagram && settings.instagram_url && (
        <a
          href={settings.instagram_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleActionClick('INSTAGRAM_CLICKED')}
          className="w-full p-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-opacity"
        >
          <Camera className="w-5 h-5" /> Siga nosso Instagram
        </a>
      )}

      {settings.post_signup_show_menu && settings.menu_url && (
        <a
          href={settings.menu_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleActionClick('MENU_CLICKED')}
          className="w-full p-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-slate-800 transition-colors"
        >
          <Utensils className="w-5 h-5 text-amber-400" /> Ver Cardápio
        </a>
      )}

      {settings.post_signup_show_google_review && settings.google_review_url && (
        <a
          href={settings.google_review_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleActionClick('GOOGLE_REVIEW_CLICKED')}
          className="w-full p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-amber-100 transition-colors"
        >
          <Star className="w-5 h-5 text-amber-500" /> Avaliar no Google
        </a>
      )}
    </div>
  );
}

// ==========================================
// Componente Principal
// ==========================================

export function SuccessOffer({ settings, visitorId, visitorName, authUrl, openNdsParams }: SuccessOfferProps) {
  const [authState, setAuthState] = useState<'AUTHORIZING' | 'AUTHORIZED' | 'FAILED'>('AUTHORIZING');
  const [bannerVisible, setBannerVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Estados de Campanhas Dinâmicas
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [activePromoCampaign, setActivePromoCampaign] = useState<any>(null);
  const loggedImpressions = useRef<Set<string>>(new Set());

  // URL search params for page transitions
  const [urlParams, setUrlParams] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlParams(window.location.search);
    }
  }, []);

  const isRealMode = Boolean(openNdsParams.isRealMode && authUrl);
  const isDemoMode = !isRealMode;

  useEffect(() => {
    let isMounted = true;

    const authorizeWifi = async () => {
      if (isDemoMode || !authUrl) {
        if (isMounted) setAuthState('AUTHORIZED');
        return;
      }

      try {
        await fetch(authUrl, { mode: 'no-cors', cache: 'no-store' });
        if (isMounted) {
          setAuthState('AUTHORIZED');
          sendVisitorEvent('WIFI_AUTH_SENT', {
            metadata: {
              auth_url: authUrl,
              gateway: openNdsParams.gatewayname || 'unknown'
            }
          });
        }
      } catch (err) {
        console.error('Falha ao enviar autorização ao roteador', err);
        if (isMounted) {
          setAuthState('FAILED');
        }
      }
    };

    authorizeWifi();

    return () => {
      isMounted = false;
    };
  }, [authUrl, isDemoMode]);

  // Carrega campanhas aplicáveis ao visitante
  useEffect(() => {
    let isMounted = true;
    const getCampaigns = async () => {
      try {
        const res = await fetch(`/api/portal/campaigns?visitorId=${visitorId || ''}&isDemo=${isDemoMode}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          const list = data.campaigns || [];
          setCampaigns(list);

          // Inicializar a primeira campanha ativa como padrão
          const firstCamp = list.find((c: any) => c.media_url && c.media_url !== settings.post_signup_promo_image_url);
          if (firstCamp) {
            setActivePromoCampaign(firstCamp);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar campanhas dinâmicas:', err);
      } finally {
        if (isMounted) {
          setLoadingCampaigns(false);
        }
      }
    };
    getCampaigns();
    return () => {
      isMounted = false;
    };
  }, [visitorId, isDemoMode, settings.post_signup_promo_image_url]);

  const hasPostSignupBannerConfig = useMemo(() => {
    return (settings.post_signup_action === 'PROMO' || settings.post_signup_action === 'BANNER') && !!settings.post_signup_promo_image_url;
  }, [settings]);

  // Build slides for carousel
  const slides = useMemo(() => {
    const list: CarouselSlide[] = [];

    if (hasPostSignupBannerConfig) {
      list.push({
        id: 'post-main',
        mediaUrl: settings.post_signup_promo_image_url!,
        mediaType: 'IMAGE',
        title: settings.post_signup_promo_title || undefined,
        description: settings.post_signup_promo_description || undefined,
        buttonText: settings.post_signup_promo_button_text || 'Aproveitar Oferta',
        buttonUrl: settings.post_signup_promo_button_url || undefined,
        mediaPositionX: settings.post_signup_media_position_x ?? 50,
        mediaPositionY: settings.post_signup_media_position_y ?? 50,
        mediaFit: settings.post_signup_media_fit || 'cover',
        isCampaign: false,
      });
    }

    campaigns.forEach((camp: any) => {
      if (camp.media_url && camp.media_url !== settings.post_signup_promo_image_url) {
        list.push({
          id: camp.id,
          mediaUrl: camp.media_url,
          mediaType: camp.media_type || 'IMAGE',
          title: camp.title || undefined,
          description: camp.description || undefined,
          buttonText: camp.button_text || undefined,
          buttonUrl: camp.button_url || undefined,
          mediaPositionX: camp.media_position_x ?? 50,
          mediaPositionY: camp.media_position_y ?? 50,
          mediaFit: camp.media_fit || 'cover',
          isCampaign: true,
          campaign: camp,
        });
      }
    });

    return list;
  }, [settings, campaigns, hasPostSignupBannerConfig]);

  const hasActiveSlides = slides.length > 0;

  // Strip text attributes for the carousel slides to avoid text overlay duplication (card handles texts)
  const carouselSlides = useMemo(() => {
    return slides.map(slide => ({
      ...slide,
      title: undefined,
      description: undefined,
    }));
  }, [slides]);

  useEffect(() => {
    if (authState === 'AUTHORIZED' && !loadingCampaigns) {
      const hasCampaignSlides = slides.some(s => s.isCampaign);
      const shouldShowModal = (hasCampaignSlides && settings.post_signup_banner_enabled !== false) ||
                              (!hasCampaignSlides && settings.post_signup_action === 'BANNER' && settings.post_signup_banner_enabled !== false);
      
      if (shouldShowModal) {
        setBannerVisible(true);
      }

      if (settings.post_signup_redirect_mode === 'AUTO_3S') {
        setTimeLeft(3);
      } else if (settings.post_signup_redirect_mode === 'AUTO_5S') {
        setTimeLeft(5);
      } else if (settings.post_signup_redirect_mode === 'AUTO_10S') {
        setTimeLeft(10);
      } else {
        setTimeLeft(null);
      }
    }
  }, [authState, loadingCampaigns, settings, hasActiveSlides, slides]);

  const isValidUrl = (url?: string | null): boolean => {
    if (!url) return false;
    const lower = url.toLowerCase().trim();
    if (lower.startsWith('javascript:') || lower.startsWith('data:')) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const getRedirectUrl = () => {
    if (activePromoCampaign?.button_url) {
      return activePromoCampaign.button_url;
    }
    switch (settings.post_signup_action) {
      case 'INSTAGRAM': return settings.instagram_url;
      case 'MENU': return settings.menu_url;
      case 'GOOGLE': return settings.google_review_url;
      case 'CUSTOM_URL': return settings.post_signup_url;
      case 'BANNER': return settings.post_signup_promo_button_url;
      case 'PROMO': return settings.post_signup_promo_button_url;
      default: return null;
    }
  };

  const handleMarketingRedirect = () => {
    const url = getRedirectUrl();
    if (activePromoCampaign) {
      sendVisitorEvent('CAMPAIGN_CLICK', {
        campaign_id: activePromoCampaign.id,
      });
    }
    if (isValidUrl(url) && typeof window !== 'undefined') {
      window.location.href = url!;
    } else if (isValidUrl(openNdsParams.redir) && typeof window !== 'undefined') {
      window.location.href = openNdsParams.redir!;
    }
  };

  const handleRedirectAction = (url: string | null, isCampaign: boolean, campaignId?: string) => {
    if (isCampaign && campaignId) {
      sendVisitorEvent('CAMPAIGN_CLICK', {
        campaign_id: campaignId,
      });
    }
    if (isValidUrl(url) && typeof window !== 'undefined') {
      window.location.href = url!;
    } else if (isValidUrl(openNdsParams.redir) && typeof window !== 'undefined') {
      window.location.href = openNdsParams.redir!;
    }
  };

  const handleSlideView = async (slide: CarouselSlide) => {
    if (slide.isCampaign && slide.campaign) {
      setActivePromoCampaign(slide.campaign);
    } else {
      setActivePromoCampaign(null);
    }

    if (slide.isCampaign && slide.id) {
      if (loggedImpressions.current.has(slide.id)) return;
      loggedImpressions.current.add(slide.id);

      try {
        await fetch('/api/portal/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'CAMPAIGN_IMPRESSION',
            campaign_id: slide.id,
          }),
        });
      } catch (err) {
        console.warn('Erro ao registrar impressão:', err);
      }
    }
  };

  const handleSlideClick = async (slide: CarouselSlide) => {
    if (slide.isCampaign && slide.id) {
      try {
        await fetch('/api/portal/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'CAMPAIGN_CLICK',
            campaign_id: slide.id,
          }),
        });
      } catch (err) {
        console.warn('Erro ao registrar clique:', err);
      }

      if (slide.buttonUrl) {
        if (!isValidUrl(slide.buttonUrl)) return;
        window.open(slide.buttonUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  useEffect(() => {
    if (timeLeft === null) return;
    
    if (timeLeft <= 0) {
      handleMarketingRedirect();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const cancelRedirect = () => {
    setTimeLeft(null);
    setBannerVisible(false);
  };

  const primaryColor = settings.primary_color || '#2563eb';

  if (isRealMode && (authState === 'AUTHORIZING' || authState === 'FAILED')) {
    return (
      <AuthorizationGate 
        authState={authState} 
        isRealMode={isRealMode} 
      />
    );
  }

  if (loadingCampaigns && authState === 'AUTHORIZED') {
    return (
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8 text-center space-y-4 animate-in fade-in">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
        <h2 className="text-lg font-bold">Carregando ofertas exclusivas...</h2>
        <p className="text-xs text-slate-500">Buscando campanhas disponíveis para você.</p>
      </div>
    );
  }

  return (
    <>
      <div className={`w-full max-w-md bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-6 sm:p-8 text-center space-y-4 animate-in fade-in zoom-in-95 transition-all ${bannerVisible ? 'blur-sm scale-95 opacity-50' : ''}`}>
        
        {isDemoMode ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold py-2 px-4 rounded-xl mb-2 flex items-center justify-center gap-1.5 mx-auto">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Cadastro realizado com sucesso. Modo demonstração — roteador não conectado.</span>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold py-2 px-4 rounded-xl mb-2 flex items-center justify-center gap-1.5 mx-auto">
            <Wifi className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Autorização enviada ao roteador</span>
          </div>
        )}

        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{settings.post_signup_title || 'Cadastro Concluído!'}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {settings.post_signup_message || `Obrigado por se conectar, ${visitorName}!`}
          </p>
        </div>

        {/* Carousel de mídias inline na tela de sucesso */}
        {hasActiveSlides && (
          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm mt-4">
            <div className="w-full relative overflow-hidden">
              <MediaCarousel
                slides={carouselSlides}
                onSlideView={handleSlideView}
                onSlideClick={handleSlideClick}
                containerAspectRatio="16/9"
              />
            </div>
            
            {/* Renderizar detalhes do slide ativo */}
            {activePromoCampaign ? (
              <div className="p-4 text-left">
                <h3 className="font-bold text-sm text-slate-900 mb-1">{activePromoCampaign.title}</h3>
                {activePromoCampaign.description && <p className="text-xs text-slate-600 mb-3">{activePromoCampaign.description}</p>}
                {activePromoCampaign.button_text && activePromoCampaign.button_url ? (
                  <button 
                    onClick={() => handleRedirectAction(activePromoCampaign.button_url, true, activePromoCampaign.id)}
                    className="w-full py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors border border-blue-200"
                  >
                    {activePromoCampaign.button_text}
                  </button>
                ) : (
                  <div className="w-full py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold text-center">
                    📋 Apresente esta tela ao atendente para receber a oferta.
                  </div>
                )}
              </div>
            ) : hasPostSignupBannerConfig ? (
              <div className="p-4 text-left">
                {settings.post_signup_promo_title && <h3 className="font-bold text-sm text-slate-900 mb-1">{settings.post_signup_promo_title}</h3>}
                {settings.post_signup_promo_description && <p className="text-xs text-slate-600 mb-3">{settings.post_signup_promo_description}</p>}
                {settings.post_signup_promo_button_text && settings.post_signup_promo_button_url ? (
                  <button 
                    onClick={() => handleRedirectAction(settings.post_signup_promo_button_url || null, false)}
                    className="w-full py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors border border-blue-200"
                  >
                    {settings.post_signup_promo_button_text}
                  </button>
                ) : (
                  <div className="w-full py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold text-center">
                    📋 Apresente esta tela ao atendente para receber a oferta.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* View all promos page link */}
        <a 
          href={`/portal/promocoes${urlParams}`}
          className="w-full py-3.5 rounded-2xl font-bold text-sm bg-slate-900/5 hover:bg-slate-900/10 border border-slate-200 flex items-center justify-center gap-2 text-slate-800 transition-all text-center"
        >
          <Gift className="w-5 h-5 text-emerald-500" /> Ver Minhas Promoções
        </a>

        <SecondaryActions settings={settings} visitorId={visitorId} />

        <CountdownRedirect
          timeLeft={timeLeft}
          bannerVisible={bannerVisible}
          primaryColor={primaryColor}
          onCancel={cancelRedirect}
          onRedirect={handleMarketingRedirect}
        />
      </div>

      <PromoBanner
        visible={bannerVisible}
        settings={settings}
        slides={slides}
        carouselSlides={carouselSlides}
        timeLeft={timeLeft}
        primaryColor={primaryColor}
        onCancel={cancelRedirect}
        onRedirect={handleRedirectAction}
        onSlideView={handleSlideView}
        onSlideClick={handleSlideClick}
        activePromoCampaign={activePromoCampaign}
      />
    </>
  );
}
