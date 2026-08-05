'use client';

import React, { useState } from 'react';
import { StoreSettings, OpenNdsParams, Visitor } from '@/types/database';
import { Wifi, Sparkles, ArrowRight, Loader2, Info } from 'lucide-react';
import { getAnonymousSessionId } from '@/lib/events';

interface ReturningVisitorProps {
  settings: StoreSettings;
  visitor: Visitor;
  openNdsParams: OpenNdsParams;
  onSuccess: (data: { visitorId?: string | null; visitorName: string; authUrl: string; totalVisits: number }) => void;
}

export function ReturningVisitor({ settings, visitor, openNdsParams, onSuccess }: ReturningVisitorProps) {
  const [loading, setLoading] = useState(false);

  const handleQuickConnect = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/portal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: visitor.name,
          phone: visitor.phone,
          email: visitor.email || undefined,
          date_of_birth: visitor.date_of_birth || undefined,
          mac_address: openNdsParams.clientmac,
          tok: openNdsParams.tok,
          ip_address: openNdsParams.clientip,
          gateway_name: openNdsParams.gatewayname,
          gatewayaddress: openNdsParams.gatewayaddress,
          gatewayport: openNdsParams.gatewayport,
          anonymous_session_id: getAnonymousSessionId(),
        }),
      });

      const data = await res.json();

      onSuccess({
        visitorId: visitor.id,
        visitorName: visitor.name,
        authUrl: data.authUrl,
        totalVisits: (visitor.total_visits || 1) + 1,
      });
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-6 sm:p-8 text-center">
      {/* Logo e Boas-Vindas */}
      {settings.logo_url ? (
        <img
          src={settings.logo_url}
          alt={settings.store_name}
          className="w-20 h-20 mx-auto rounded-2xl object-cover shadow-md mb-3 ring-4 ring-blue-500/20"
        />
      ) : (
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-md"
          style={{ backgroundColor: settings.primary_color }}
        >
          {settings.store_name.charAt(0)}
        </div>
      )}

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-3 border border-amber-200">
        <Sparkles className="w-3.5 h-3.5" />
        {visitor.total_visits ? `Cliente Frequente — ${visitor.total_visits}ª visita!` : 'Cliente Reconhecido'}
      </div>

      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
        Que bom ter você de volta, <br />
        <span className="text-blue-600">{visitor.name.split(' ')[0]}</span>!
      </h1>

      <p className="text-sm text-slate-600 mt-2 mb-6">
        Seu aparelho foi reconhecido. Clique abaixo para conectar instantaneamente ao Wi-Fi do{' '}
        <strong className="text-slate-800">{settings.store_name}</strong>.
      </p>

      {/* Botão de Conexão Rápida */}
      <button
        onClick={handleQuickConnect}
        disabled={loading}
        style={{ backgroundColor: settings.primary_color }}
        className="w-full py-4 px-6 rounded-2xl text-white font-bold text-lg shadow-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-4"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Conectando ao Roteador...
          </>
        ) : (
          <>
            <Wifi className="w-5 h-5" />
            Conectar com 1-Clique
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Nota sobre Reconhecimento de Dispositivo */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-left flex items-start gap-2 text-[11px] text-slate-500 leading-normal">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <span>
          O reconhecimento automático utiliza um identificador salvo no navegador e o MAC do celular. Em celulares com Wi-Fi aleatório ativado ou se limpar os cookies, o formulário pode ser solicitado novamente.
        </span>
      </div>
    </div>
  );
}
