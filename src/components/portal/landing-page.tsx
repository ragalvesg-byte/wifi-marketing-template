'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StoreSettings } from '@/types/database';
import { Camera, Map, Star, Gift } from 'lucide-react';
import { MediaCarousel, CarouselSlide } from './media-carousel';

interface LandingPageProps {
  settings: StoreSettings;
  onContinue: () => void;
}

export function LandingPage({ settings, onContinue }: LandingPageProps) {
  const primaryColor = settings.primary_color || '#2563eb';
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const loggedImpressions = useRef<Set<string>>(new Set());

  // URL search params for page transitions
  const [urlParams, setUrlParams] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlParams(window.location.search);
    }
  }, []);

  // Fetch only non-segmented campaigns (All visitors) since identity is not known yet
  useEffect(() => {
    if (settings.pre_signup_promotions_enabled === false) {
      return;
    }
    const fetchCampaigns = async () => {
      try {
        const res = await fetch('/api/portal/campaigns?stage=pre_signup');
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns || []);
          setIsDemo(data.isDemo || false);
        }
      } catch (err) {
        console.warn('Erro ao buscar campanhas na Landing Page:', err);
      }
    };
    fetchCampaigns();
  }, [settings.pre_signup_promotions_enabled]);

  // Build slides
  const slides = useMemo(() => {
    const list: CarouselSlide[] = [];
 
    if (settings.pre_signup_promotions_enabled !== false) {
      // 1. Add Main Store Banner if enabled
      if (settings.pre_signup_show_banner && settings.landing_media_url) {
        list.push({
          id: 'main',
          mediaUrl: settings.landing_media_url,
          mediaType: settings.landing_media_type || 'IMAGE',
          title: settings.featured_promo_title || undefined,
          description: settings.featured_promo_description || undefined,
          positionX: settings.landing_media_position_x ?? 50,
          positionY: settings.landing_media_position_y ?? 50,
          fit: settings.landing_media_fit || 'contain',
          isCampaign: false,
          aspectRatio: settings.landing_media_aspect_ratio || '16:9',
        });
      }
 
      // 2. Add campaigns, filtering out duplicates of the main store banner
      campaigns.forEach((camp: any) => {
        if (camp.media_url && camp.media_url !== settings.landing_media_url) {
          list.push({
            id: camp.id,
            mediaUrl: camp.media_url,
            mediaType: camp.media_type || 'IMAGE',
            title: camp.title || undefined,
            description: camp.description || undefined,
            buttonText: camp.button_text || undefined,
            buttonUrl: camp.button_url || undefined,
            positionX: camp.media_position_x ?? 50,
            positionY: camp.media_position_y ?? 50,
            fit: camp.media_fit || 'contain',
            isCampaign: true,
            aspectRatio: camp.aspect_ratio || '16:9',
          });
        }
      });
    }

    return list;
  }, [settings, campaigns]);

  const handleSlideView = React.useCallback(async (slide: CarouselSlide) => {
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
        console.warn('Erro ao registar impressão de campanha:', err);
      }
    }
  }, []);

  const handleSlideClick = React.useCallback(async (slide: CarouselSlide) => {
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
        <button 
          onClick={onContinue}
          style={{ backgroundColor: primaryColor }} 
          className="w-full py-4 rounded-2xl font-extrabold text-base shadow-xl text-white hover:brightness-110 transition-all active:scale-[0.98]"
        >
          Conectar ao Wi-Fi Grátis
        </button>

        {/* View all promos page link */}
        {settings.pre_signup_promotions_enabled !== false && settings.promotions_button_enabled !== false && (
          <a 
            href={`/portal/promocoes${urlParams}`}
            className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2 text-slate-200 backdrop-blur-md transition-all active:scale-[0.98]"
          >
            <Gift className="w-5 h-5 text-emerald-400" /> Ver Promoções & Ofertas
          </a>
        )}

        {settings.pre_signup_show_instagram && settings.instagram_url && (
          <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2 text-white backdrop-blur-md transition-all active:scale-[0.98]">
            <Camera className="w-5 h-5" /> Siga nosso Instagram
          </a>
        )}
        
        {settings.pre_signup_show_menu && settings.menu_url && (
          <a href={settings.menu_url} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2 text-white backdrop-blur-md transition-all active:scale-[0.98]">
            <Map className="w-5 h-5" /> Ver Cardápio
          </a>
        )}
        
        {settings.pre_signup_show_google_review && settings.google_review_url && (
          <a href={settings.google_review_url} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2 text-white backdrop-blur-md transition-all active:scale-[0.98]">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Avaliar no Google
          </a>
        )}
      </div>

    </div>
  );
}
