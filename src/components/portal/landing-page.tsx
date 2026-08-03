'use client';

import React from 'react';
import { StoreSettings } from '@/types/database';
import { Camera, Map, Star } from 'lucide-react';

interface LandingPageProps {
  settings: StoreSettings;
  onContinue: () => void;
}

export function LandingPage({ settings, onContinue }: LandingPageProps) {
  const primaryColor = settings.primary_color || '#2563eb';
  
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

      {settings.pre_signup_show_banner && settings.landing_media_url && (
        <div className="w-full rounded-2xl overflow-hidden shadow-2xl mb-6 bg-black/40 border border-white/10 aspect-video relative">
          {settings.landing_media_type === 'VIDEO' ? (
            <iframe 
              src={settings.landing_media_url} 
              className="absolute top-0 left-0 w-full h-full" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          ) : (
            <img src={settings.landing_media_url} alt="Promo" className="w-full h-full object-cover" />
          )}
        </div>
      )}

      {settings.pre_signup_show_promo && (
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
