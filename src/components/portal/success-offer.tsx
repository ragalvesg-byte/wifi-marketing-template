'use client';

import React, { useState, useEffect } from 'react';
import { StoreSettings, OpenNdsParams } from '@/types/database';
import { CheckCircle2, Copy, Check, ExternalLink, Star, Camera, Utensils, Loader2, AlertCircle, X, Wifi, WifiOff } from 'lucide-react';
import { sendVisitorEvent } from '@/lib/events';

interface SuccessOfferProps {
  settings: StoreSettings;
  visitorId?: string | null;
  visitorName: string;
  authUrl: string;
  openNdsParams: OpenNdsParams;
}

// ==========================================
// Sub-componentes Refatorados (Etapa 3)
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
  timeLeft: number | null;
  primaryColor: string;
  onCancel: () => void;
  onRedirect: () => void;
}

export function PromoBanner({
  visible,
  settings,
  activePromoCampaign,
  timeLeft,
  primaryColor,
  onCancel,
  onRedirect,
}: PromoBannerProps & { activePromoCampaign?: any }) {
  if (!visible) return null;

  const title = activePromoCampaign?.title || settings.post_signup_promo_title;
  const description = activePromoCampaign?.description || settings.post_signup_promo_description;
  const mediaUrl = activePromoCampaign?.media_url || settings.post_signup_promo_image_url;
  const aspectRatio = activePromoCampaign?.aspect_ratio || settings.post_signup_promo_image_aspect_ratio || '4:5';
  const buttonText = activePromoCampaign?.button_text || settings.post_signup_promo_button_text || 'Ir agora';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative flex flex-col animate-in zoom-in-95">
        {settings.post_signup_banner_closable && (
          <button 
            onClick={onCancel}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {mediaUrl ? (
           <div 
              className="w-full bg-slate-100 relative" 
              style={{
                aspectRatio: aspectRatio === '9:16' ? '9/16' 
                  : aspectRatio === '1:1' ? '1/1'
                  : aspectRatio === '16:9' ? '16/9'
                  : '4/5',
                maxHeight: '60vh'
              }}
            >
              <img src={mediaUrl} alt="Banner" className="w-full h-full object-cover" />
            </div>
        ) : (
           <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white p-6">
             <Star className="w-12 h-12 opacity-50" />
           </div>
        )}

        <div className="p-6 bg-white flex-1 overflow-y-auto">
           {title && <h2 className="text-xl font-black text-slate-900 mb-2">{title}</h2>}
           {description && <p className="text-sm text-slate-600 mb-6">{description}</p>}
           
           {timeLeft !== null ? (
             <div className="space-y-3">
               <p className="text-xs font-bold text-center text-slate-500 mb-2">Redirecionando em {timeLeft} segundos...</p>
               <button 
                 onClick={onRedirect}
                 style={{ backgroundColor: primaryColor }}
                 className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95 transition-opacity"
               >
                 {buttonText}
               </button>
               <button 
                 onClick={onCancel}
                 className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition-colors"
               >
                 Cancelar redirecionamento
               </button>
             </div>
           ) : (
             <div className="space-y-3">
               {buttonText && (
                  <button 
                    onClick={onRedirect}
                    style={{ backgroundColor: primaryColor }}
                    className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95 transition-opacity"
                  >
                    {buttonText}
                  </button>
               )}
               {settings.post_signup_banner_closable && (
                 <button 
                    onClick={onCancel}
                    className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition-colors"
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
        <p className="text-sm font-semibold text-slate-700">Redirecionando em {timeLeft} segundos...</p>
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
        <ExternalLink className="w-5 h-5" />
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
    sendVisitorEvent(type, { visitor_id: visitorId });
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
  const [copied, setCopied] = useState(false);
  const [authState, setAuthState] = useState<'AUTHORIZING' | 'AUTHORIZED' | 'FAILED'>('AUTHORIZING');
  const [bannerVisible, setBannerVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Estados de Campanhas Dinâmicas
  const [activeCouponCampaign, setActiveCouponCampaign] = useState<any>(null);
  const [activePromoCampaign, setActivePromoCampaign] = useState<any>(null);

  // Modo real é ativado somente se openNdsParams.isRealMode for true E houver authUrl válida
  const isRealMode = Boolean(openNdsParams.isRealMode && authUrl);
  const isDemoMode = !isRealMode;

  useEffect(() => {
    let isMounted = true;

    const authorizeWifi = async () => {
      // Se estiver em modo demonstração: NÃO faz fetch para o roteador e NÃO exibe falha de liberação
      if (isDemoMode || !authUrl) {
        if (isMounted) setAuthState('AUTHORIZED');
        return;
      }

      // No modo real: envia autorização para o IP/porta do roteador openNDS
      try {
        await fetch(authUrl, { mode: 'no-cors', cache: 'no-store' });
        if (isMounted) {
          setAuthState('AUTHORIZED');
          sendVisitorEvent('WIFI_AUTH_SENT', {
            visitor_id: visitorId,
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

  // Carrega campanhas dinâmicas assim que o Wi-Fi for autorizado
  useEffect(() => {
    let isMounted = true;
    if (authState === 'AUTHORIZED') {
      const getCampaigns = async () => {
        try {
          const res = await fetch(`/api/portal/campaigns?visitorId=${visitorId || ''}&isDemo=${isDemoMode}`);
          if (res.ok && isMounted) {
            const data = await res.json();
            const list = data.campaigns || [];

            const couponCamp = list.find((c: any) => c.type === 'COUPON');
            if (couponCamp) {
              setActiveCouponCampaign(couponCamp);
              sendVisitorEvent('CAMPAIGN_VIEWED', { visitor_id: visitorId, campaign_id: couponCamp.id });
            }

            const promoCamp = list.find((c: any) => c.type === 'PROMO');
            if (promoCamp) {
              setActivePromoCampaign(promoCamp);
              sendVisitorEvent('CAMPAIGN_VIEWED', { visitor_id: visitorId, campaign_id: promoCamp.id });
            }
          }
        } catch (err) {
          console.warn('Erro ao carregar campanhas dinâmicas:', err);
        }
      };
      getCampaigns();
    }
    return () => {
      isMounted = false;
    };
  }, [authState, visitorId, isDemoMode]);

  useEffect(() => {
    if (authState === 'AUTHORIZED') {
      if (
        (activePromoCampaign && settings.post_signup_banner_enabled !== false) ||
        (!activePromoCampaign && settings.post_signup_action === 'BANNER' && settings.post_signup_banner_enabled !== false)
      ) {
        setBannerVisible(true);
      }

      if (settings.post_signup_redirect_mode !== 'NONE') {
        const delay = settings.post_signup_redirect_seconds || 3;
        setTimeLeft(delay);
      }
    }
  }, [authState, settings, activePromoCampaign]);

  const isValidUrl = (url?: string | null): boolean => {
    if (!url) return false;
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
      sendVisitorEvent('CAMPAIGN_CLICKED', {
        visitor_id: visitorId,
        campaign_id: activePromoCampaign.id,
      });
    }
    if (isValidUrl(url) && typeof window !== 'undefined') {
      window.location.href = url!;
    } else if (isValidUrl(openNdsParams.redir) && typeof window !== 'undefined') {
      window.location.href = openNdsParams.redir!;
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
  }, [timeLeft, activePromoCampaign]);

  const handleCopyCoupon = async (code: string, campaignId?: string, couponId?: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);

    sendVisitorEvent('COUPON_COPIED', {
      visitor_id: visitorId,
      campaign_id: campaignId || null,
      metadata: { coupon_code: code }
    });

    if (couponId && visitorId && visitorId !== 'v-demo-visitor') {
      try {
        await fetch('/api/portal/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coupon_id: couponId, visitor_id: visitorId }),
        });
      } catch (err) {
        console.warn('Erro ao salvar resgate no banco:', err);
      }
    }
  };

  const cancelRedirect = () => {
    setTimeLeft(null);
    setBannerVisible(false);
  };

  const primaryColor = settings.primary_color || '#2563eb';

  // Renderiza tela de carregamento ou erro se no modo real
  if (isRealMode && (authState === 'AUTHORIZING' || authState === 'FAILED')) {
    return (
      <AuthorizationGate 
        authState={authState} 
        isRealMode={isRealMode} 
      />
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

        {/* CUPOM DINÂMICO (PRIORITÁRIO) OU ESTÁTICO (FALLBACK) */}
        {activeCouponCampaign ? (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 text-center mt-4">
             <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block mb-1">
               {activeCouponCampaign.title || 'CUPOM DE DESCONTO'}
             </span>
             {activeCouponCampaign.description && (
               <p className="text-[11px] text-slate-500 mb-2">{activeCouponCampaign.description}</p>
             )}
             <span className="font-mono font-extrabold text-slate-900 text-2xl tracking-wider block mb-3">
               {activeCouponCampaign.coupons?.[0]?.code}
             </span>
             <button
                onClick={() => handleCopyCoupon(
                  activeCouponCampaign.coupons?.[0]?.code,
                  activeCouponCampaign.id,
                  activeCouponCampaign.coupons?.[0]?.id
                )}
                className="w-full py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-emerald-300"
              >
                {copied ? (
                  <><Check className="w-4 h-4" /> Copiado!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copiar Cupom</>
                )}
              </button>
          </div>
        ) : settings.post_signup_action === 'COUPON' && settings.promo_coupon_code ? (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 text-center mt-4">
             <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block mb-1">CUPOM DE DESCONTO</span>
             <span className="font-mono font-extrabold text-slate-900 text-2xl tracking-wider block mb-3">
               {settings.promo_coupon_code}
             </span>
             <button
                onClick={() => handleCopyCoupon(settings.promo_coupon_code)}
                className="w-full py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-emerald-300"
              >
                {copied ? (
                  <><Check className="w-4 h-4" /> Copiado!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copiar Cupom</>
                )}
              </button>
          </div>
        ) : null}

        {/* PROMOÇÃO/BANNER DINÂMICA (PRIORITÁRIA) OU ESTÁTICA (FALLBACK) */}
        {activePromoCampaign ? (
          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm mt-4">
            {activePromoCampaign.media_url && (
              <div 
                className="w-full bg-slate-100 relative overflow-hidden" 
                style={{
                  aspectRatio: activePromoCampaign.aspect_ratio === '9:16' ? '9/16' 
                    : activePromoCampaign.aspect_ratio === '1:1' ? '1/1'
                    : activePromoCampaign.aspect_ratio === '16:9' ? '16/9'
                    : '4/5',
                  maxHeight: '40vh'
                }}
              >
                <img src={activePromoCampaign.media_url} alt="Promoção" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="p-4 text-left">
              <h3 className="font-bold text-sm text-slate-900 mb-1">{activePromoCampaign.title}</h3>
              {activePromoCampaign.description && <p className="text-xs text-slate-600 mb-3">{activePromoCampaign.description}</p>}
              {activePromoCampaign.button_text && (
                <button 
                  onClick={handleMarketingRedirect}
                  className="w-full py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors border border-blue-200"
                >
                  {activePromoCampaign.button_text}
                </button>
              )}
            </div>
          </div>
        ) : settings.post_signup_action === 'PROMO' && settings.post_signup_promo_image_url ? (
          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm mt-4">
            <div 
              className="w-full bg-slate-100 relative overflow-hidden" 
              style={{
                aspectRatio: settings.post_signup_promo_image_aspect_ratio === '9:16' ? '9/16' 
                  : settings.post_signup_promo_image_aspect_ratio === '1:1' ? '1/1'
                  : settings.post_signup_promo_image_aspect_ratio === '16:9' ? '16/9'
                  : '4/5',
                maxHeight: '40vh'
              }}
            >
              <img src={settings.post_signup_promo_image_url} alt="Promoção" className="w-full h-full object-cover" />
            </div>
            
            {(settings.post_signup_promo_title || settings.post_signup_promo_description) && (
              <div className="p-4 text-left">
                {settings.post_signup_promo_title && <h3 className="font-bold text-sm text-slate-900 mb-1">{settings.post_signup_promo_title}</h3>}
                {settings.post_signup_promo_description && <p className="text-xs text-slate-600 mb-3">{settings.post_signup_promo_description}</p>}
                {settings.post_signup_promo_button_text && (
                  <button 
                    onClick={handleMarketingRedirect}
                    className="w-full py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors border border-blue-200"
                  >
                    {settings.post_signup_promo_button_text}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}

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
        activePromoCampaign={activePromoCampaign}
        timeLeft={timeLeft}
        primaryColor={primaryColor}
        onCancel={cancelRedirect}
        onRedirect={handleMarketingRedirect}
      />
    </>
  );
}
