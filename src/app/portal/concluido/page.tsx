'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { SuccessOffer } from '@/components/portal/success-offer';
import { parseOpenNdsParams } from '@/lib/opennds';
import { NEUTRAL_STORE_SETTINGS } from '@/lib/supabase/mock-data';
import { StoreSettings, OpenNdsParams } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface ConcluidoPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function ConcluidoPage({ searchParams }: ConcluidoPageProps) {
  const router = useRouter();
  const resolvedParams = use(searchParams);
  const openNdsParamsObj = React.useMemo(() => parseOpenNdsParams(resolvedParams), [JSON.stringify(resolvedParams)]);
  const [openNdsParams, setOpenNdsParams] = useState<OpenNdsParams>({});
  const [settings, setSettings] = useState<StoreSettings>(NEUTRAL_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [visitorName, setVisitorName] = useState('Visitante');
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    setOpenNdsParams(openNdsParamsObj);

    const validateSessionAndLoadData = async () => {
      setLoading(true);
      try {
        // 1. Validar se a sessão do visitante é válida via GET /api/portal/wifi-credentials
        const wifiCredsRes = await fetch('/api/portal/wifi-credentials');
        if (!wifiCredsRes.ok && wifiCredsRes.status === 401) {
          // Sessão inválida ou expirada -> redireciona para a tela inicial pré-cadastro
          router.replace('/portal');
          return;
        }

        // 2. Carregar configurações da loja
        const settingsRes = await fetch('/api/portal/settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.settings) {
            setSettings(settingsData.settings);
          }
        }

        // 3. Tentar carregar visitante identificado se houver clientmac
        if (openNdsParamsObj.clientmac) {
          const macRes = await fetch(`/api/portal/check-mac?mac=${encodeURIComponent(openNdsParamsObj.clientmac)}`);
          if (macRes.ok) {
            const macData = await macRes.json();
            if (macData.found && macData.visitor) {
              setVisitorName(macData.visitor.name || 'Visitante');
              setVisitorId(macData.visitor.id || null);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao validar sessão na tela concluída:', err);
      } finally {
        setLoading(false);
      }
    };

    validateSessionAndLoadData();
  }, [openNdsParamsObj, router]);

  const bgStyle = settings.background_url
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url('${settings.background_url}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundColor: '#0f172a',
      };

  return (
    <main
      className="min-h-screen w-full relative flex flex-col items-center justify-start sm:justify-center p-4 overflow-y-auto"
      style={bgStyle}
    >
      {loading ? (
        <div className="bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-700">Verificando sessão segura...</span>
        </div>
      ) : (
        <SuccessOffer
          settings={settings}
          visitorId={visitorId}
          visitorName={visitorName}
          authUrl=""
          openNdsParams={openNdsParams}
        />
      )}
    </main>
  );
}
