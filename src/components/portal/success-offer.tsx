'use client';

import React, { useState, useEffect } from 'react';
import { StoreSettings, OpenNdsParams } from '@/types/database';
import { CheckCircle2, Tag, Copy, Check, ExternalLink, Star, Camera, Utensils, Loader2, AlertCircle, Map } from 'lucide-react';
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

  useEffect(() => {
    let isMounted = true;
    const authorizeWifi = async () => {
      // Determinar a URL final de autorização do roteador
      const finalAuthUrl = authUrl || buildOpenNdsAuthUrl({
        gatewayaddress: openNdsParams.gatewayaddress,
        gatewayport: openNdsParams.gatewayport,
        tok: openNdsParams.tok,
      });

      if (!finalAuthUrl) {
        // Se não houver parâmetros do OpenNDS (ex: acesso direto para teste), libera instantaneamente
        if (isMounted) setAuthState('AUTHORIZED');
        return;
      }

      try {
        // Chama o roteador silenciosamente em background para liberar o firewall
        // Usamos no-cors pois o openNDS não retorna headers CORS na rota de auth
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
    if (authState === 'AUTHORIZED' && settings.post_signup_redirect_mode !== 'NONE') {
      let delay = 0;
      if (settings.post_signup_redirect_mode === 'AUTO_3S') delay = 3000;
      if (settings.post_signup_redirect_mode === 'AUTO_5S') delay = 5000;
      if (settings.post_signup_redirect_mode === 'AUTO_10S') delay = 10000;

      if (delay > 0) {
        const timer = setTimeout(() => {
          handleMarketingRedirect();
        }, delay);
        return () => clearTimeout(timer);
      }
    }
  }, [authState, settings.post_signup_redirect_mode, settings]);

  const getRedirectUrl = () => {
    switch (settings.post_signup_action) {
      case 'INSTAGRAM': return settings.instagram_url;
      case 'MENU': return settings.menu_url;
      case 'GOOGLE': return settings.google_review_url;
      case 'CUSTOM_URL': return settings.post_signup_url;
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

  const primaryColor = settings.primary_color || '#2563eb';

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

  // AUTHORIZED
  return (
    <div className="w-full max-w-md bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-6 sm:p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
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
                <>
                  <Check className="w-4 h-4" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copiar Cupom
                </>
              )}
            </button>
        </div>
      )}

      {settings.post_signup_action === 'PROMO' && settings.landing_media_url && (
        <div className="w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 aspect-video relative bg-slate-900 mt-4">
          <img src={settings.landing_media_url} alt="Promo" className="w-full h-full object-cover" />
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

      <button
        onClick={handleMarketingRedirect}
        style={{ backgroundColor: primaryColor }}
        className="w-full py-4 rounded-xl text-white font-bold text-base shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2"
      >
        Navegar na Internet
        <ExternalLink className="w-5 h-5" />
      </button>

      {settings.post_signup_redirect_mode !== 'NONE' && getRedirectUrl() && (
        <p className="text-[11px] text-slate-500 mt-2 animate-pulse">
          Redirecionando automaticamente...
        </p>
      )}
    </div>
  );
}
