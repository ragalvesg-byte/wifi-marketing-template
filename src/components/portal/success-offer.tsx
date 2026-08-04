'use client';

import React, { useState, useEffect } from 'react';
import { StoreSettings, OpenNdsParams } from '@/types/database';
import { CheckCircle2, Tag, Copy, Check, ExternalLink, Star, Camera, Utensils, Loader2, AlertCircle, Map, X } from 'lucide-react';
import { buildOpenNdsAuthUrl } from '@/lib/opennds';

interface SuccessOfferProps {
  settings: StoreSettings;
  visitorName: string;
  authUrl: string;
  openNdsParams: OpenNdsParams;
}

export function SuccessOffer({ settings, visitorName, authUrl, openNdsParams }: SuccessOfferProps) {
  const [copied, setCopied] = useState(false);
  const [authState, setAuthState] = useState<'AUTHORIZING' | 'AUTHORIZED' | 'FAILED'>('AUTHORIZING');
  const [bannerVisible, setBannerVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const authorizeWifi = async () => {
      const finalAuthUrl = authUrl || buildOpenNdsAuthUrl({
        gatewayaddress: openNdsParams.gatewayaddress,
        gatewayport: openNdsParams.gatewayport,
        tok: openNdsParams.tok,
      });

      if (!finalAuthUrl) {
        if (isMounted) setAuthState('AUTHORIZED');
        return;
      }

      try {
        await fetch(finalAuthUrl, { mode: 'no-cors', cache: 'no-store' });
        
        if (isMounted) {
          setAuthState('AUTHORIZED');
        }
      } catch (err) {
        console.error('Falha ao comunicar com o roteador', err);
        if (isMounted) {
          setAuthState('FAILED');
        }
      }
    };

    authorizeWifi();

    return () => {
      isMounted = false;
    };
  }, [authUrl, openNdsParams]);

  useEffect(() => {
    if (authState === 'AUTHORIZED') {
      if (settings.post_signup_action === 'BANNER' && settings.post_signup_banner_enabled !== false) {
        setBannerVisible(true);
      }

      if (settings.post_signup_redirect_mode !== 'NONE') {
        let delay = 0;
        if (settings.post_signup_redirect_mode === 'AUTO_3S') delay = 3;
        if (settings.post_signup_redirect_mode === 'AUTO_5S') delay = 5;
        if (settings.post_signup_redirect_mode === 'AUTO_10S') delay = 10;

        if (delay > 0) {
          setTimeLeft(delay);
        }
      }
    }
  }, [authState, settings]);

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

  const getRedirectUrl = () => {
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
    if (url && typeof window !== 'undefined') {
      window.location.href = url;
    }
  };

  const handleCopyCoupon = () => {
    if (settings.promo_coupon_code) {
      navigator.clipboard.writeText(settings.promo_coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const cancelRedirect = () => {
    setTimeLeft(null);
    setBannerVisible(false);
  };

  const primaryColor = settings.primary_color || '#2563eb';
  const isDemo = !authUrl && (!openNdsParams.tok && !openNdsParams.gatewayaddress);

  if (authState === 'AUTHORIZING') {
    return (
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
        <h2 className="text-xl font-bold">Liberando seu acesso...</h2>
        <p className="text-sm text-slate-500">Comunicando com o roteador da loja.</p>
      </div>
    );
  }

  if (authState === 'FAILED') {
    return (
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Falha na Liberação</h2>
        <p className="text-sm text-slate-500 mb-4">
          Não foi possível confirmar a liberação com o roteador Wi-Fi. Isso pode ocorrer se você já estiver conectado ou se houver um bloqueio na rede.
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

  return (
    <>
      <div className={`w-full max-w-md bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-6 sm:p-8 text-center space-y-4 animate-in fade-in zoom-in-95 transition-all ${bannerVisible ? 'blur-sm scale-95 opacity-50' : ''}`}>
        
        {isDemo && (
          <div className="bg-blue-100 text-blue-800 text-xs font-bold py-1 px-3 rounded-full mb-2 inline-block">
            Modo Demonstração
          </div>
        )}

        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{settings.post_signup_title || 'Wi-Fi Liberado!'}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {settings.post_signup_message || `Pronto, ${visitorName}! Sua navegação à internet foi autorizada.`}
          </p>
        </div>

        {settings.post_signup_action === 'COUPON' && settings.promo_coupon_code && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 text-center mt-4">
             <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block mb-1">CUPOM DE DESCONTO</span>
             <span className="font-mono font-extrabold text-slate-900 text-2xl tracking-wider block mb-3">
               {settings.promo_coupon_code}
             </span>
             <button
                onClick={handleCopyCoupon}
                className="w-full py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-emerald-300"
              >
                {copied ? (
                  <><Check className="w-4 h-4" /> Copiado!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copiar Cupom</>
                )}
              </button>
          </div>
        )}

        {settings.post_signup_action === 'PROMO' && settings.post_signup_promo_image_url && (
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
                    onClick={() => {
                      if (settings.post_signup_promo_button_url) {
                        window.location.href = settings.post_signup_promo_button_url;
                      }
                    }}
                    className="w-full py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors border border-blue-200"
                  >
                    {settings.post_signup_promo_button_text}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 pt-4">
          {settings.post_signup_show_instagram && settings.instagram_url && (
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
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
              className="w-full p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-amber-100 transition-colors"
            >
              <Star className="w-5 h-5 text-amber-500" /> Avaliar no Google
            </a>
          )}
        </div>

        {timeLeft !== null && !bannerVisible ? (
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Redirecionando em {timeLeft} segundos...</p>
            <div className="flex gap-2">
              <button onClick={cancelRedirect} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button onClick={handleMarketingRedirect} style={{ backgroundColor: primaryColor }} className="flex-1 py-3 rounded-xl text-white font-bold text-xs shadow-md transition-colors">
                Ir agora
              </button>
            </div>
          </div>
        ) : (
          !bannerVisible && (
            <button
              onClick={handleMarketingRedirect}
              style={{ backgroundColor: primaryColor }}
              className="w-full py-4 rounded-xl text-white font-bold text-base shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              Navegar na Internet
              <ExternalLink className="w-5 h-5" />
            </button>
          )
        )}
      </div>

      {bannerVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative flex flex-col animate-in zoom-in-95">
            {settings.post_signup_banner_closable && (
              <button 
                onClick={cancelRedirect}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {settings.post_signup_promo_image_url ? (
               <div 
                  className="w-full bg-slate-100 relative" 
                  style={{
                    aspectRatio: settings.post_signup_promo_image_aspect_ratio === '9:16' ? '9/16' 
                      : settings.post_signup_promo_image_aspect_ratio === '1:1' ? '1/1'
                      : settings.post_signup_promo_image_aspect_ratio === '16:9' ? '16/9'
                      : '4/5',
                    maxHeight: '60vh'
                  }}
                >
                  <img src={settings.post_signup_promo_image_url} alt="Banner" className="w-full h-full object-cover" />
                </div>
            ) : (
               <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white p-6">
                 <Star className="w-12 h-12 opacity-50" />
               </div>
            )}

            <div className="p-6 bg-white flex-1 overflow-y-auto">
               {settings.post_signup_promo_title && <h2 className="text-xl font-black text-slate-900 mb-2">{settings.post_signup_promo_title}</h2>}
               {settings.post_signup_promo_description && <p className="text-sm text-slate-600 mb-6">{settings.post_signup_promo_description}</p>}
               
               {timeLeft !== null ? (
                 <div className="space-y-3">
                   <p className="text-xs font-bold text-center text-slate-500 mb-2">Redirecionando em {timeLeft} segundos...</p>
                   <button 
                     onClick={handleMarketingRedirect}
                     style={{ backgroundColor: primaryColor }}
                     className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95 transition-opacity"
                   >
                     {settings.post_signup_promo_button_text || 'Ir agora'}
                   </button>
                   <button 
                     onClick={cancelRedirect}
                     className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition-colors"
                   >
                     Cancelar redirecionamento
                   </button>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {settings.post_signup_promo_button_text && (
                      <button 
                        onClick={() => {
                          if (settings.post_signup_promo_button_url) {
                            window.location.href = settings.post_signup_promo_button_url;
                          }
                        }}
                        style={{ backgroundColor: primaryColor }}
                        className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95 transition-opacity"
                      >
                        {settings.post_signup_promo_button_text}
                      </button>
                   )}
                   {settings.post_signup_banner_closable && (
                     <button 
                        onClick={cancelRedirect}
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
      )}
    </>
  );
}
