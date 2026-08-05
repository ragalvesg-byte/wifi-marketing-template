'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StoreSettings } from '@/types/database';
import { Gift, ArrowLeft, Loader2, Star, Calendar, ExternalLink } from 'lucide-react';
import { getAspectRatioValue } from '@/lib/aspect-ratio';

function PromocoesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const visitorId = searchParams.get('visitorId');
  const isDemo = searchParams.get('isDemo') === 'true';

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const loggedImpressions = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Fetch settings
        const settingsRes = await fetch('/api/portal/settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData.settings);
        }

        // 2. Fetch campaigns
        const campaignsRes = await fetch(
          `/api/portal/campaigns?visitorId=${visitorId || ''}&stage=promotions_page&isDemo=${isDemo}`
        );
        if (campaignsRes.ok) {
          const campaignsData = await campaignsRes.json();
          setCampaigns(campaignsData.campaigns || []);
        }
      } catch (err) {
        console.warn('Erro ao carregar dados da página de promoções:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [visitorId, isDemo]);

  // Log impressions of visible campaigns on load
  useEffect(() => {
    if (campaigns.length > 0) {
      campaigns.forEach((camp) => {
        if (loggedImpressions.current.has(camp.id)) return;
        loggedImpressions.current.add(camp.id);

        fetch('/api/portal/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'CAMPAIGN_IMPRESSION',
            campaign_id: camp.id,
          }),
        }).catch((err) => console.warn('Erro ao registrar impressão na lista de promoções:', err));
      });
    }
  }, [campaigns]);

  const handleCampaignClick = async (camp: any) => {
    try {
      await fetch('/api/portal/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'CAMPAIGN_CLICK',
          campaign_id: camp.id,
        }),
      });
    } catch (err) {
      console.warn('Erro ao registrar clique:', err);
    }

    if (camp.button_url) {
      const lowerUrl = camp.button_url.toLowerCase().trim();
      if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:')) {
        console.warn('Protocolo inseguro bloqueado:', camp.button_url);
        return;
      }
      window.open(camp.button_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBack = () => {
    const params = searchParams.toString();
    router.push(`/portal${params ? '?' + params : ''}`);
  };

  const primaryColor = settings?.primary_color || '#2563eb';

  const bgStyle = settings?.background_url
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('${settings.background_url}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundColor: '#0f172a',
      };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="font-semibold text-sm">Carregando promoções...</p>
      </div>
    );
  }

  const now = new Date();
  const validCampaigns = campaigns.filter((camp: any) => {
    if (camp.status !== 'ACTIVE') return false;
    if (camp.start_date && new Date(camp.start_date) > now) return false;
    if (camp.end_date && new Date(camp.end_date) < now) return false;
    return true;
  });

  return (
    <div className="min-h-screen text-white flex flex-col pt-4 pb-12 px-4" style={bgStyle}>
      <div className="w-full max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all active:scale-[0.95]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm font-bold tracking-wide uppercase text-slate-300">
            {settings?.store_name || 'Wi-Fi Portal'}
          </span>
          <div className="w-10 h-10" />
        </div>

        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-3">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Promoções & Ofertas</h1>
          <p className="text-xs text-slate-300 mt-1">Aproveite as vantagens exclusivas da nossa rede Wi-Fi.</p>
        </div>

        {/* Promotions List */}
        <div className="space-y-4">
          {validCampaigns.length === 0 ? (
            <div className="text-center p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
              <Star className="w-8 h-8 text-slate-400 opacity-50 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">Nenhuma promoção ativa no momento.</p>
              <p className="text-xs text-slate-400 mt-1">Fique atento, logo teremos novidades!</p>
            </div>
          ) : (
            validCampaigns.map((camp: any) => {
              const posX = camp.media_position_x ?? 50;
              const posY = camp.media_position_y ?? 50;
              const fit = camp.media_fit || 'cover';

              return (
                <div
                  key={camp.id}
                  className="bg-white/95 text-slate-900 rounded-3xl overflow-hidden shadow-xl border border-white/20 flex flex-col"
                >
                  {camp.media_url && (
                    <div 
                      className="w-full relative overflow-hidden"
                      style={{
                        aspectRatio: getAspectRatioValue(camp.aspect_ratio),
                        maxHeight: '35vh'
                      }}
                    >
                      <img
                        src={camp.media_url}
                        alt={camp.title}
                        className="w-full h-full"
                        style={{
                          objectPosition: `${posX}% ${posY}%`,
                          objectFit: fit as any,
                          backgroundColor: fit === 'contain' ? '#0f172a' : 'transparent',
                        }}
                      />
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-base text-slate-900">{camp.title}</h3>
                      {camp.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">{camp.description}</p>
                      )}

                      {(camp.start_date || camp.end_date) && (
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Válido até:{' '}
                            {camp.end_date
                              ? new Date(camp.end_date).toLocaleDateString('pt-BR')
                              : 'Por tempo limitado'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {camp.button_url ? (
                        <button
                          onClick={() => handleCampaignClick(camp)}
                          style={{ backgroundColor: primaryColor }}
                          className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                          {camp.button_text || 'Aproveitar'} <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="w-full py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold text-center">
                          📋 Apresente esta tela ao atendente para resgatar.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Back Button Link */}
        <button
          onClick={handleBack}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-xs text-slate-300 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          Voltar para a Conexão
        </button>

      </div>
    </div>
  );
}

export default function PromocoesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="font-semibold text-sm">Carregando promoções...</p>
      </div>
    }>
      <PromocoesContent />
    </Suspense>
  );
}
