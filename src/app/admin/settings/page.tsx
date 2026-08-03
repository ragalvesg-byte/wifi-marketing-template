'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_STORE_SETTINGS } from '@/lib/supabase/mock-data';
import { StoreSettings, ThemePreset, GoogleReviewTiming } from '@/types/database';
import { THEME_PRESETS, applyThemePreset } from '@/lib/themes/presets';
import { Settings, Save, Check, Palette, Tag, Loader2, AlertCircle, Sparkles, Link as LinkIcon, UserCheck, Video } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(MOCK_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            router.push('/admin/login');
            return;
          }
        }
        
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
          }
          setIsDemo(data.isDemo || false);
        }
      } catch {
        // Ignorado
      }
      setLoading(false);
    };

    fetchSettings();
  }, [router]);

  const handleThemeSelect = (themeId: ThemePreset) => {
    const updated = applyThemePreset(settings, themeId);
    setSettings(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Falha ao salvar configurações.');
        setSaving(false);
        return;
      }

      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setErrorMsg('Erro de conexão ao salvar no servidor.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center flex items-center justify-center gap-2 text-slate-500 font-semibold">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" /> Carregando configurações da loja...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Configurações da Loja & Captura de Leads
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Personalize a marca, ative temas pré-configurados por segmento e defina os dados coletados dos visitantes.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 font-semibold text-sm">
          <Check className="w-5 h-5 text-emerald-600" />
          {isDemo
            ? 'Configurações atualizadas localmente (Modo Demonstração).'
            : 'Configurações salvas no banco Supabase com sucesso!'}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 font-semibold text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BLOCO 1: SELETOR DE TEMAS PRONTOS POR SEGMENTO */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Temas Prontos por Segmento Comercial
            </h2>
            <span className="text-xs text-slate-400">Clique para aplicar predefinições visuais</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(THEME_PRESETS).map((preset) => {
              const isSelected = settings.preset_theme === preset.id;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleThemeSelect(preset.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-4 h-4 rounded-full border border-white/50 shadow-xs"
                      style={{ backgroundColor: preset.primaryColor }}
                    />
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 leading-tight">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BLOCO 2: CAPTURA DINÂMICA DE LEADS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Captura Dinâmica de Leads (Formulário do Visitante)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Nome e WhatsApp são mantidos como obrigatórios padrão. Escolha quais campos adicionais deseja solicitar aos clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Campo E-mail */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 block">E-mail</span>
                <span className="text-xs text-slate-500">Solicitar endereço de e-mail</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={settings.field_email_enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        field_email_enabled: e.target.checked,
                        field_email_required: e.target.checked ? settings.field_email_required : false,
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  Ativado
                </label>
                {settings.field_email_enabled && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-rose-600 font-semibold">
                    <input
                      type="checkbox"
                      checked={settings.field_email_required}
                      onChange={(e) => setSettings({ ...settings, field_email_required: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                    />
                    Obrigatório
                  </label>
                )}
              </div>
            </div>

            {/* Campo Data de Nascimento */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 block">Data de Nascimento</span>
                <span className="text-xs text-slate-500">Identificar aniversariantes</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={settings.field_dob_enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        field_dob_enabled: e.target.checked,
                        field_dob_required: e.target.checked ? settings.field_dob_required : false,
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  Ativado
                </label>
                {settings.field_dob_enabled && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-rose-600 font-semibold">
                    <input
                      type="checkbox"
                      checked={settings.field_dob_required}
                      onChange={(e) => setSettings({ ...settings, field_dob_required: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                    />
                    Obrigatório
                  </label>
                )}
              </div>
            </div>

            {/* Campo Cidade */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 block">Cidade</span>
                <span className="text-xs text-slate-500">Cidade de origem do visitante</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={settings.field_city_enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        field_city_enabled: e.target.checked,
                        field_city_required: e.target.checked ? settings.field_city_required : false,
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  Ativado
                </label>
                {settings.field_city_enabled && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-rose-600 font-semibold">
                    <input
                      type="checkbox"
                      checked={settings.field_city_required}
                      onChange={(e) => setSettings({ ...settings, field_city_required: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                    />
                    Obrigatório
                  </label>
                )}
              </div>
            </div>

            {/* Campo Gênero */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 block">Gênero</span>
                <span className="text-xs text-slate-500">Segmentação demográfica</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={settings.field_gender_enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        field_gender_enabled: e.target.checked,
                        field_gender_required: e.target.checked ? settings.field_gender_required : false,
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  Ativado
                </label>
                {settings.field_gender_enabled && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-rose-600 font-semibold">
                    <input
                      type="checkbox"
                      checked={settings.field_gender_required}
                      onChange={(e) => setSettings({ ...settings, field_gender_required: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                    />
                    Obrigatório
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 3: MÍDIA E DESTAQUES DA LANDING PAGE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Video className="w-5 h-5 text-purple-600" />
            Mídia e Destaques da Landing Page
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Tipo de Mídia em Destaque
              </label>
              <select
                value={settings.landing_media_type || 'IMAGE'}
                onChange={(e) => setSettings({ ...settings, landing_media_type: e.target.value as 'IMAGE' | 'VIDEO' })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-semibold"
              >
                <option value="IMAGE">Imagem em Destaque</option>
                <option value="VIDEO">Vídeo (YouTube / Embed URL)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                URL da Mídia (Imagem ou Vídeo)
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={settings.landing_media_url || ''}
                onChange={(e) => setSettings({ ...settings, landing_media_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Título da Oferta do Dia
              </label>
              <input
                type="text"
                placeholder="Ex: Prato do Dia / Combo Especial"
                value={settings.featured_promo_title || ''}
                onChange={(e) => setSettings({ ...settings, featured_promo_title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Descrição da Promoção
              </label>
              <input
                type="text"
                placeholder="Ex: Ganhe 10% de desconto ao se conectar"
                value={settings.featured_promo_description || ''}
                onChange={(e) => setSettings({ ...settings, featured_promo_description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
        </div>

        {/* BLOCO 4: LINKS SOCIAIS & AVALIAÇÃO GOOGLE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <LinkIcon className="w-5 h-5 text-indigo-600" />
            Links Sociais, Cardápio e Avaliação Google
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                URL do Instagram
              </label>
              <input
                type="text"
                placeholder="https://instagram.com/sualoja"
                value={settings.instagram_url || ''}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                URL do Cardápio Digital
              </label>
              <input
                type="text"
                placeholder="https://cardapio.sualoja.com.br"
                value={settings.menu_url || ''}
                onChange={(e) => setSettings({ ...settings, menu_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Link de Avaliação do Google Meu Negócio
              </label>
              <input
                type="text"
                placeholder="https://g.page/r/.../review"
                value={settings.google_review_url || ''}
                onChange={(e) => setSettings({ ...settings, google_review_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Exibir Botão do Google
              </label>
              <select
                value={settings.google_review_timing || 'POST_CONNECT'}
                onChange={(e) => setSettings({ ...settings, google_review_timing: e.target.value as GoogleReviewTiming })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-semibold"
              >
                <option value="PRE_CONNECT">Antes da Conexão (Landing Page)</option>
                <option value="POST_CONNECT">Depois da Conexão (Tela de Sucesso)</option>
                <option value="BOTH">Em Ambas as Telas</option>
              </select>
            </div>
          </div>
        </div>

        {/* BLOCO 5: DADOS GERAIS DA LOJA E MARCA */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Palette className="w-5 h-5 text-blue-600" />
            Dados da Marca & Regra de Recadastro
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Nome do Estabelecimento
              </label>
              <input
                type="text"
                required
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Cor Primária (Botões e Destaques)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primary_color || '#2563eb'}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={settings.primary_color || '#2563eb'}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                URL da Logomarca
              </label>
              <input
                type="text"
                value={settings.logo_url || ''}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                URL da Imagem de Fundo
              </label>
              <input
                type="text"
                value={settings.background_url || ''}
                onChange={(e) => setSettings({ ...settings, background_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Código do Cupom de Desconto
              </label>
              <input
                type="text"
                value={settings.promo_coupon_code || ''}
                onChange={(e) => setSettings({ ...settings, promo_coupon_code: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Re-cadastro do Cliente Após (Dias)
              </label>
              <select
                value={settings.relogin_days_interval || 7}
                onChange={(e) => setSettings({ ...settings, relogin_days_interval: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-semibold"
              >
                <option value={7}>A cada 7 dias</option>
                <option value={15}>A cada 15 dias</option>
                <option value={30}>A cada 30 dias</option>
                <option value={90}>A cada 90 dias</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
