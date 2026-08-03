'use client';

import React, { useEffect, useState, use } from 'react';
import { LandingPage } from '@/components/portal/landing-page';
import { VisitorForm } from '@/components/portal/visitor-form';
import { ReturningVisitor } from '@/components/portal/returning-visitor';
import { SuccessOffer } from '@/components/portal/success-offer';
import { parseOpenNdsParams } from '@/lib/opennds';
import { MOCK_STORE_SETTINGS } from '@/lib/supabase/mock-data';
import { StoreSettings, OpenNdsParams, Visitor } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface PortalPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function PortalPage({ searchParams }: PortalPageProps) {
  const resolvedParams = use(searchParams);
  const [openNdsParams, setOpenNdsParams] = useState<OpenNdsParams>({});
  const [settings, setSettings] = useState<StoreSettings>(MOCK_STORE_SETTINGS);
  const [knownVisitor, setKnownVisitor] = useState<Visitor | null>(null);
  const [checkingMac, setCheckingMac] = useState(true);

  // Estado de fluxo da tela
  const [step, setStep] = useState<'LANDING' | 'FORM' | 'RETURNING' | 'SUCCESS'>('LANDING');
  const [successData, setSuccessData] = useState<{
    visitorName: string;
    authUrl: string;
    totalVisits: number;
  }>({
    visitorName: '',
    authUrl: '',
    totalVisits: 1,
  });

  useEffect(() => {
    const params = parseOpenNdsParams(resolvedParams);
    setOpenNdsParams(params);

    const checkDeviceAndSettings = async () => {
      setCheckingMac(true);
      let loadedSettings = MOCK_STORE_SETTINGS;

      // 1. Buscar configurações reais da loja
      try {
        const settingsRes = await fetch('/api/portal/settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.settings) {
            loadedSettings = settingsData.settings;
            setSettings(loadedSettings);
          }
        }
      } catch {
        // Ignorado, mantém MOCK_STORE_SETTINGS
      }

      // 2. Verificar se o visitante é conhecido pelo MAC ou Cookie
      if (params.clientmac) {
        try {
          const res = await fetch(`/api/portal/check-mac?mac=${encodeURIComponent(params.clientmac)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.found && data.visitor && !data.needsRelogin) {
              setKnownVisitor(data.visitor);
              setStep('RETURNING');
              setCheckingMac(false);
              return;
            }
          }
        } catch {
          // Ignorado em caso de erro, segue fluxo normal
        }
      }

      // Se não é visitante recorrente, decide entre LANDING ou FORM
      if (loadedSettings.pre_signup_enabled !== false) {
        setStep('LANDING');
      } else {
        setStep('FORM');
      }

      setCheckingMac(false);
    };

    checkDeviceAndSettings();
  }, [resolvedParams]);

  const handleSuccess = (data: { visitorName: string; authUrl: string; totalVisits: number }) => {
    setSuccessData(data);
    setStep('SUCCESS');
  };

  return (
    <main
      className="min-h-screen w-full relative flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url('${settings.background_url}')`,
      }}
    >
      {checkingMac ? (
        <div className="bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-700">Verificando conexão Wi-Fi...</span>
        </div>
      ) : step === 'RETURNING' && knownVisitor ? (
        <ReturningVisitor
          settings={settings}
          visitor={knownVisitor}
          openNdsParams={openNdsParams}
          onSuccess={handleSuccess}
        />
      ) : step === 'SUCCESS' ? (
        <SuccessOffer
          settings={settings}
          visitorName={successData.visitorName}
          authUrl={successData.authUrl}
          openNdsParams={openNdsParams}
        />
      ) : step === 'LANDING' ? (
        <LandingPage 
          settings={settings} 
          onContinue={() => setStep('FORM')} 
        />
      ) : (
        <VisitorForm
          settings={settings}
          openNdsParams={openNdsParams}
          onSuccess={handleSuccess}
          onBack={settings.pre_signup_enabled !== false ? () => setStep('LANDING') : undefined}
        />
      )}
    </main>
  );
}
