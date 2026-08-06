'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StoreSettings } from '@/types/database';
import { Camera, Map, Star, Gift } from 'lucide-react';
import { MediaCarousel, CarouselSlide } from './media-carousel';

interface LandingPageProps {
  settings: StoreSettings;
  onContinue: (intent?: 'DEFAULT' | 'PROMOTIONS' | 'WIFI') => void;
  isIdentified?: boolean;
}

export function LandingPage({ settings, onContinue, isIdentified }: LandingPageProps) {
  const primaryColor = settings.primary_color || '#2563eb';
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [urlParams, setUrlParams] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlParams(window.location.search);
    }
  }, []);

  useEffect(() => {
    if (settings.pre_signup_promotions_enabled === false) return;

    fetch('/api/portal/campaigns?stage=pre_signup')
      .then((res) => res.json())
      .then((data) => {
        if (data.campaigns) {
          setCampaigns(data.campaigns);
        }
      })
      .catch((err) => console.error('Erro ao carregar campanhas pré-cadastro:', err));
  }, [settings.pre_signup_promotions_enabled]);

  // Build slides
  const slides = useMemo(() => {
    const list: CarouselSlide[] = [];

    if (settings.pre_signup_promotions_enabled !== false) {
      if (settings.pre_signup_show_banner && settings.landing_media_url) {
        list.push({
          id: 'main-pre',
          mediaUrl: settings.landing_media_url,
          mediaType: settings.landing_media_type || 'IMAGE',
          title: settings.featured_promo_title,
          description: settings.featured_promo_description,
          positionX: settings.landing_media_position_x ?? 50,
          positionY: settings.landing_media_position_y ?? 50,
          fit: settings.landing_media_fit || 'contain',
          aspectRatio: settings.landing_media_aspect_ratio || '16:9',
          isCampaign: false,
        });
      }

      campaigns.forEach((camp) => {
        list.push({
          id: camp.id,
          mediaUrl: camp.media_url,
          mediaType: camp.media_type,
          title: camp.title,
          description: camp.description,
          buttonText: camp.button_text,
          buttonUrl: camp.button_url,
          positionX: camp.media_position_x ?? 50,
          positionY: camp.media_position_y ?? 50,
          fit: camp.media_fit || 'contain',
          aspectRatio: camp.aspect_ratio || '16:9',
          isCampaign: true,
          campaign: camp,
        });
      });
    }

    return list;
  }, [settings, campaigns]);

  const handleSlideView = useCallback(async (slide: CarouselSlide) => {
    if (slide.isCampaign && slide.id) {
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
        console.warn('Erro ao registrar impressão de campanha:', err);
      }
    }
  }, []);

  const handleSlideClick = useCallback(async (slide: CarouselSlide) => {
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
        console.warn('Erro ao registar clique de campanha:', err);
      }

      if (slide.buttonUrl) {
        const lowerUrl = slide.buttonUrl.toLowerCase().trim();
        if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:')) {
          console.warn('Link inseguro bloqueado na Landing Page:', slide.buttonUrl);
          return;
        }
        window.open(slide.buttonUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }, []);

  const handlePromotionsClick = (e: React.MouseEvent) => {
    if (!isIdentified) {
      e.preventDefault();
      onContinue('PROMOTIONS');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      
      {settings.logo_url && (
        <div className="w-24 h-24 rounded-full border-4 border-white/20 shadow-2xl overflow-hidden mb-6 bg-white shrink-0">
          <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
        </div>
      )}
      
      <h1 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-8 drop-shadow-lg">
        {settings.store_name}
      </h1>

      {settings.pre_signup_promotions_enabled !== false && settings.promotions_carousel_enabled !== false && slides.length > 0 && (
        <div className="w-full mb-6">
          <MediaCarousel
            slides={slides}
            onSlideView={handleSlideView}
            onSlideClick={handleSlideClick}
            containerAspectRatio="16/9"
          />
        </div>
      )}

      {settings.pre_signup_promotions_enabled !== false && settings.pre_signup_show_promo && (
        <div className="text-center mb-8 bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 w-full">
          <h2 className="text-xl font-bold text-white mb-2">{settings.featured_promo_title || 'Promoção'}</h2>
          <p className="text-sm text-slate-200">{settings.featured_promo_description}</p>
        </div>
      )}

      <div className="w-full space-y-4">
        {/* BOTÃO PRINCIPAL: QUERO USAR O WI-FI */}
        <button 
          onClick={() => onContinue('WIFI')}
          style={{ backgroundColor: primaryColor }} 
          className="w-full py-4 rounded-2xl font-extrabold text-base shadow-xl text-white hover:brightness-110 transition-all active:scale-[0.98]"
        >
          Quero usar o Wi-Fi
        </button>

        {/* 1. VER CARDÁPIO (EM PRIMEIRO LUGAR) */}
        {settings.pre_signup_show_menu && settings.menu_url && (
          <a href={settings.menu_url} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2 text-white backdrop-blur-md transition-all active:scale-[0.98]">
            <Map className="w-5 h-5" /> Ver Cardápio
          </a>
        )}

        {/* 2. PROMOÇÕES & OFERTAS (REQUER CADASTRO SE VISITANTE NÃO ESTIVER IDENTIFICADO) */}
        {settings.pre_signup_promotions_enabled !== false && settings.promotions_button_enabled !== false && (
          <a 
            href={`/portal/promocoes${urlParams}`}
            onClick={handlePromotionsClick}
            className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2 text-slate-200 backdrop-blur-md transition-all active:scale-[0.98]"
          >
            <Gift className="w-5 h-5 text-emerald-400" /> Promoções & Ofertas
          </a>
        )}

        {/* 3. INSTAGRAM */}
        {settings.pre_signup_show_instagram && settings.instagram_url && (
          <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2 text-white backdrop-blur-md transition-all active:scale-[0.98]">
            <Camera className="w-5 h-5" /> Siga nosso Instagram
          </a>
        )}
        
        {/* 4. AVALIAR NO GOOGLE */}
        {settings.pre_signup_show_google_review && settings.google_review_url && (
          <a href={settings.google_review_url} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2 text-white backdrop-blur-md transition-all active:scale-[0.98]">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Avaliar no Google
          </a>
        )}
      </div>

    </div>
  );
}
