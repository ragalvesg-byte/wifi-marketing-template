'use client';

import React, { useState } from 'react';
import { StoreSettings } from '@/types/database';
import { CheckCircle2, Tag, Copy, Check, ExternalLink, Star, Camera, Utensils } from 'lucide-react';

interface SuccessOfferProps {
  settings: StoreSettings;
  visitorName: string;
  authUrl: string;
}

export function SuccessOffer({ settings, visitorName, authUrl }: SuccessOfferProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCoupon = () => {
    if (settings.promo_coupon_code) {
      navigator.clipboard.writeText(settings.promo_coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenAuth = () => {
    if (typeof window !== 'undefined') {
      window.location.href = authUrl;
    }
  };

  const primaryColor = settings.primary_color || '#2563eb';
  const showGoogleReview = Boolean(
    settings.google_review_url &&
    (settings.google_review_timing === 'POST_CONNECT' || settings.google_review_timing === 'BOTH')
  );

  return (
    <div className="w-full max-w-md bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-6 sm:p-8 text-center space-y-4">
      {/* Ícone de Sucesso */}
      <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Wi-Fi Liberado!</h1>
        <p className="text-xs text-slate-600 mt-1">
          Pronto, <strong className="text-slate-900">{visitorName}</strong>! Sua navegação à internet foi autorizada.
        </p>
      </div>

      {/* Botão de Avaliação no Google (Texto Neutro em Conformidade com Diretrizes do Google) */}
      {showGoogleReview && (
        <a
          href={settings.google_review_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-opacity"
        >
          <Star className="w-4 h-4 fill-white text-white" />
          Deixar Avaliação no Google Meu Negócio
        </a>
      )}

      {/* Cartão da Oferta da Loja */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/60 rounded-2xl p-4 text-left space-y-2.5">
        <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs uppercase tracking-wider">
          <Tag className="w-4 h-4 text-blue-600" />
          {settings.featured_promo_title || 'Oferta Exclusiva'}
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {settings.post_connect_message}
        </p>

        {settings.promo_coupon_code && (
          <div className="pt-1 flex items-center justify-between bg-white border border-blue-200 rounded-xl p-3 shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">CUPOM DE DESCONTO</span>
              <span className="font-mono font-extrabold text-blue-700 text-base tracking-wider">
                {settings.promo_coupon_code}
              </span>
            </div>

            <button
              onClick={handleCopyCoupon}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-blue-200"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Links Sociais de Apoio */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {settings.instagram_url && (
          <a
            href={settings.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-pink-600" /> Instagram
          </a>
        )}

        {settings.menu_url && (
          <a
            href={settings.menu_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <Utensils className="w-3.5 h-3.5 text-amber-600" /> Cardápio
          </a>
        )}
      </div>

      {/* Botão de Garantia de Liberação no Roteador */}
      <button
        onClick={handleOpenAuth}
        style={{ backgroundColor: primaryColor }}
        className="w-full py-3.5 px-6 rounded-2xl text-white font-bold text-base shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
      >
        Navegar na Internet
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}
