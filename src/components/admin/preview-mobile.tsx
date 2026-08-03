'use client';

import React from 'react';
import { StoreSettings } from '@/types/database';
import { Camera, Map, Star, Link as LinkIcon } from 'lucide-react';

interface PreviewMobileProps {
  settings: StoreSettings;
  step: 'PRE' | 'FORM' | 'POST';
}

export function PreviewMobile({ settings, step }: PreviewMobileProps) {
  // Cores dinâmicas
  const primaryColor = settings.primary_color || '#2563eb';
  const bgStyle = {
    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url('${settings.background_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80'}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const renderLogo = () => (
    <div className="w-20 h-20 rounded-full border-4 border-white/20 shadow-xl overflow-hidden mx-auto mb-4 bg-white shrink-0">
      {settings.logo_url ? (
        <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-[10px]">Logo</div>
      )}
    </div>
  );

  if (step === 'PRE') {
    return (
      <div className="w-full h-full text-white flex flex-col pt-8 overflow-y-auto" style={bgStyle}>
        <div className="p-4 flex-1 flex flex-col">
          {renderLogo()}
          <h1 className="text-xl font-bold text-center mb-6">{settings.store_name}</h1>

          {settings.pre_signup_show_banner && (
            <div className="w-full h-40 bg-black/40 rounded-2xl overflow-hidden mb-4 border border-white/10 shrink-0">
              {settings.landing_media_type === 'IMAGE' && settings.landing_media_url ? (
                <img src={settings.landing_media_url} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50 text-xs">Mídia</div>
              )}
            </div>
          )}

          {settings.pre_signup_show_promo && (
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold mb-1">{settings.featured_promo_title || 'Título da Promoção'}</h2>
              <p className="text-xs text-slate-300">{settings.featured_promo_description || 'Descrição da promoção aparecerá aqui.'}</p>
            </div>
          )}

          <div className="mt-auto space-y-3 pb-6">
             <button style={{ backgroundColor: primaryColor }} className="w-full py-3.5 rounded-xl font-bold text-sm shadow-lg text-white">
               Conectar ao Wi-Fi Grátis
             </button>
             
             {settings.pre_signup_show_instagram && (
               <button className="w-full py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2">
                 <Camera className="w-4 h-4" /> Instagram
               </button>
             )}
             
             {settings.pre_signup_show_menu && (
               <button className="w-full py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2">
                 <Map className="w-4 h-4" /> Cardápio
               </button>
             )}
             
             {settings.pre_signup_show_google_review && (
               <button className="w-full py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2">
                 <Star className="w-4 h-4 text-yellow-400" /> Avaliar no Google
               </button>
             )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'FORM') {
    return (
      <div className="w-full h-full text-white flex flex-col pt-8 overflow-y-auto" style={bgStyle}>
        <div className="p-4 flex-1 flex flex-col">
          {renderLogo()}
          
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-xl w-full max-w-sm mx-auto">
            <h2 className="text-lg font-bold text-center mb-4">{settings.welcome_message || 'Complete seu cadastro'}</h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 ml-1">Nome Completo *</label>
                <div className="w-full h-10 bg-white/5 border border-white/10 rounded-xl"></div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 ml-1">WhatsApp *</label>
                <div className="w-full h-10 bg-white/5 border border-white/10 rounded-xl"></div>
              </div>
              
              {settings.field_email_enabled && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-300 ml-1">E-mail {settings.field_email_required ? '*' : ''}</label>
                  <div className="w-full h-10 bg-white/5 border border-white/10 rounded-xl"></div>
                </div>
              )}
              {settings.field_dob_enabled && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-300 ml-1">Data de Nasc. {settings.field_dob_required ? '*' : ''}</label>
                  <div className="w-full h-10 bg-white/5 border border-white/10 rounded-xl"></div>
                </div>
              )}
              {settings.field_city_enabled && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-300 ml-1">Cidade {settings.field_city_required ? '*' : ''}</label>
                  <div className="w-full h-10 bg-white/5 border border-white/10 rounded-xl"></div>
                </div>
              )}
              {settings.field_gender_enabled && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-300 ml-1">Gênero {settings.field_gender_required ? '*' : ''}</label>
                  <div className="w-full h-10 bg-white/5 border border-white/10 rounded-xl"></div>
                </div>
              )}
              
              <div className="flex items-start gap-2 pt-2">
                <div className="w-3 h-3 rounded bg-blue-500 mt-0.5 shrink-0"></div>
                <p className="text-[9px] text-slate-300">Aceito os Termos de Uso e Política de Privacidade.</p>
              </div>

              <button style={{ backgroundColor: primaryColor }} className="w-full py-3 rounded-xl font-bold text-sm shadow-lg text-white mt-2">
                Conectar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // POST
  return (
    <div className="w-full h-full text-white flex flex-col pt-8 overflow-y-auto" style={bgStyle}>
      <div className="p-4 flex-1 flex flex-col items-center justify-center">
        
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl w-full max-w-sm mx-auto text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
             <Star className="w-6 h-6" />
          </div>
          
          <h2 className="text-xl font-bold mb-2">{settings.post_signup_title || 'Sucesso!'}</h2>
          <p className="text-sm text-slate-300 mb-6">{settings.post_signup_message || 'Sua internet está liberada.'}</p>
          
          {settings.post_signup_action === 'COUPON' && settings.promo_coupon_code && (
            <div className="bg-white/10 border border-white/20 border-dashed rounded-xl p-3 mb-6">
              <span className="text-xs text-slate-400 block mb-1">CUPOM</span>
              <span className="text-lg font-mono font-bold text-emerald-400">{settings.promo_coupon_code}</span>
            </div>
          )}
          
          {(settings.post_signup_action === 'PROMO' || settings.post_signup_action === 'BANNER') && settings.post_signup_promo_image_url && (
            <div className="bg-white/10 rounded-xl overflow-hidden mb-6 border border-white/20">
              <div 
                className="w-full bg-black/40 relative overflow-hidden" 
                style={{
                  aspectRatio: settings.post_signup_promo_image_aspect_ratio === '9:16' ? '9/16' 
                    : settings.post_signup_promo_image_aspect_ratio === '1:1' ? '1/1'
                    : settings.post_signup_promo_image_aspect_ratio === '16:9' ? '16/9'
                    : '4/5',
                  maxHeight: '40vh' // Limita a altura para não esconder os botões principais
                }}
              >
                <img src={settings.post_signup_promo_image_url} alt="Promo" className="w-full h-full object-cover" />
              </div>
              
              {(settings.post_signup_promo_title || settings.post_signup_promo_description) && (
                <div className="p-4 text-left">
                  {settings.post_signup_promo_title && <h3 className="font-bold text-sm text-white mb-1">{settings.post_signup_promo_title}</h3>}
                  {settings.post_signup_promo_description && <p className="text-[11px] text-slate-300 mb-3">{settings.post_signup_promo_description}</p>}
                  {settings.post_signup_promo_button_text && (
                    <button className="w-full py-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors">
                      {settings.post_signup_promo_button_text}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 w-full">
            <button style={{ backgroundColor: primaryColor }} className="w-full py-3 rounded-xl font-bold text-sm shadow-lg text-white">
              Navegar na Internet
            </button>
            
            {settings.post_signup_show_instagram && (
               <button className="w-full py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2">
                 <Camera className="w-4 h-4" /> Instagram
               </button>
             )}
             
             {settings.post_signup_show_menu && (
               <button className="w-full py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2">
                 <Map className="w-4 h-4" /> Cardápio
               </button>
             )}
             
             {settings.post_signup_show_google_review && (
               <button className="w-full py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2">
                 <Star className="w-4 h-4 text-yellow-400" /> Avaliar
               </button>
             )}
          </div>
          
          {settings.post_signup_redirect_mode !== 'NONE' && (
            <p className="text-[10px] text-slate-400 mt-4 italic">Redirecionando automaticamente...</p>
          )}
        </div>
        
      </div>
    </div>
  );
}
