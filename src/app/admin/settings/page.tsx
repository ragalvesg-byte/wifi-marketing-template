'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_STORE_SETTINGS } from '@/lib/supabase/mock-data';
import { StoreSettings, ThemePreset, GoogleReviewTiming } from '@/types/database';
import { THEME_PRESETS, applyThemePreset } from '@/lib/themes/presets';
import { Settings, Save, Check, Palette, Loader2, AlertCircle, Sparkles, Link as LinkIcon, UserCheck, Video, LayoutTemplate, Share2, Smartphone } from 'lucide-react';

// Novo componente de Prévia
import { PreviewMobile } from '@/components/admin/preview-mobile';

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(MOCK_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Controle de Abas para a prévia e configurações (0 = Antes, 1 = Form, 2 = Depois)
  const [activeTab, setActiveTab] = useState<'PRE' | 'FORM' | 'POST'>('PRE');

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
            setSettings({
              ...MOCK_STORE_SETTINGS, // fallbacks
              ...data.settings
            });
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
    <div className="flex flex-col xl:flex-row gap-8 max-w-[1400px]">
      
      {/* LADO ESQUERDO: CONFIGURAÇÕES */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Jornada do Visitante & Configurações
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personalize a marca, ative temas pré-configurados e defina exatamente o que o visitante vê antes e depois do cadastro.
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

        {/* NAVEGAÇÃO ENTRE ETAPAS */}
        <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm overflow-hidden">
          <button 
            type="button"
            onClick={() => setActiveTab('PRE')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'PRE' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            1. Antes do Cadastro
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('FORM')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'FORM' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            2. Formulário
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('POST')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'POST' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            3. Depois do Cadastro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ========================================================= */}
          {/* TAB 1: ANTES DO CADASTRO */}
          {/* ========================================================= */}
          <div className={activeTab === 'PRE' ? 'space-y-6 block' : 'hidden'}>
            
            {/* ENABLE/DISABLE PRE-SIGNUP */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-blue-600" />
                  Tela de "Antes do Cadastro"
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Se desativada, o visitante cairá direto no formulário de cadastro.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.pre_signup_enabled} onChange={(e) => setSettings({...settings, pre_signup_enabled: e.target.checked})} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.pre_signup_enabled && (
              <>
                {/* DADOS DA MARCA E CORES GERAIS */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Palette className="w-5 h-5 text-blue-600" />
                    Identidade Visual (Geral)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Nome da Loja</label>
                      <input type="text" required value={settings.store_name} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Cor Primária</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={settings.primary_color || '#2563eb'} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
                        <input type="text" value={settings.primary_color || '#2563eb'} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-500/30" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">URL da Logo</label>
                      <input type="text" value={settings.logo_url || ''} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Imagem de Fundo (Wallpaper)</label>
                      <input type="text" value={settings.background_url || ''} onChange={(e) => setSettings({ ...settings, background_url: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                  </div>
                </div>

                {/* TEMAS PRONTOS */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Temas Prontos
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.values(THEME_PRESETS).map((preset) => {
                      const isSelected = settings.preset_theme === preset.id;
                      return (
                        <button type="button" key={preset.id} onClick={() => handleThemeSelect(preset.id)} className={`p-3 rounded-2xl border text-left transition-all ${isSelected ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/30' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-4 h-4 rounded-full border border-white/50 shadow-xs" style={{ backgroundColor: preset.primaryColor }} />
                            {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                          </div>
                          <span className="text-xs font-extrabold text-slate-900 leading-tight">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* MÍDIA E CONTEÚDO PRÉ */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Video className="w-5 h-5 text-purple-600" />
                    Conteúdo da Tela Inicial
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Mostrar Imagem/Vídeo?</label>
                      <select value={settings.pre_signup_show_banner ? 'true' : 'false'} onChange={(e) => setSettings({...settings, pre_signup_show_banner: e.target.value === 'true'})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold">
                        <option value="true">Sim, exibir banner</option>
                        <option value="false">Não, ocultar banner</option>
                      </select>
                    </div>
                    {settings.pre_signup_show_banner && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Tipo de Mídia</label>
                          <select value={settings.landing_media_type || 'IMAGE'} onChange={(e) => setSettings({ ...settings, landing_media_type: e.target.value as 'IMAGE' | 'VIDEO' })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 font-semibold">
                            <option value="IMAGE">Imagem</option>
                            <option value="VIDEO">Vídeo (YouTube/Vimeo Embed)</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">URL da Mídia</label>
                          <input type="text" value={settings.landing_media_url || ''} onChange={(e) => setSettings({ ...settings, landing_media_url: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2" placeholder="https://" />
                        </div>
                      </>
                    )}

                    <div className="md:col-span-2 mt-4">
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Mostrar Textos de Promoção/Oferta?</label>
                      <select value={settings.pre_signup_show_promo ? 'true' : 'false'} onChange={(e) => setSettings({...settings, pre_signup_show_promo: e.target.value === 'true'})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold">
                        <option value="true">Sim, exibir textos promocionais</option>
                        <option value="false">Não, ocultar textos</option>
                      </select>
                    </div>
                    
                    {settings.pre_signup_show_promo && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Título da Oferta</label>
                          <input type="text" value={settings.featured_promo_title || ''} onChange={(e) => setSettings({ ...settings, featured_promo_title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Descrição Curta</label>
                          <input type="text" value={settings.featured_promo_description || ''} onChange={(e) => setSettings({ ...settings, featured_promo_description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* LINKS EXTERNOS PRE */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Share2 className="w-5 h-5 text-indigo-600" />
                    Botões Secundários
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Botão Instagram</label>
                      <div className="flex gap-2">
                         <select value={settings.pre_signup_show_instagram ? 'true' : 'false'} onChange={(e) => setSettings({...settings, pre_signup_show_instagram: e.target.value === 'true'})} className="w-1/3 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold">
                          <option value="true">Exibir</option>
                          <option value="false">Ocultar</option>
                        </select>
                        <input type="text" value={settings.instagram_url || ''} onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })} className="w-2/3 px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="https://instagram.com/..." />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Botão Cardápio Digital</label>
                      <div className="flex gap-2">
                         <select value={settings.pre_signup_show_menu ? 'true' : 'false'} onChange={(e) => setSettings({...settings, pre_signup_show_menu: e.target.value === 'true'})} className="w-1/3 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold">
                          <option value="true">Exibir</option>
                          <option value="false">Ocultar</option>
                        </select>
                        <input type="text" value={settings.menu_url || ''} onChange={(e) => setSettings({ ...settings, menu_url: e.target.value })} className="w-2/3 px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="URL do cardápio" />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Botão Google Meu Negócio</label>
                      <div className="flex gap-2">
                         <select value={settings.pre_signup_show_google_review ? 'true' : 'false'} onChange={(e) => setSettings({...settings, pre_signup_show_google_review: e.target.value === 'true'})} className="w-[30%] px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold">
                          <option value="true">Exibir</option>
                          <option value="false">Ocultar</option>
                        </select>
                        <input type="text" value={settings.google_review_url || ''} onChange={(e) => setSettings({ ...settings, google_review_url: e.target.value })} className="w-[70%] px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="URL para avaliação do Google" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ========================================================= */}
          {/* TAB 2: FORMULÁRIO DE CADASTRO */}
          {/* ========================================================= */}
          <div className={activeTab === 'FORM' ? 'space-y-6 block' : 'hidden'}>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  Campos do Cadastro
                </h2>
                <p className="text-xs text-slate-500 mt-1">Nome e WhatsApp são obrigatórios por padrão.</p>
              </div>

              {['email', 'dob', 'city', 'gender'].map((field) => {
                const labelMap: Record<string, string> = { email: 'E-mail', dob: 'Data de Nascimento', city: 'Cidade', gender: 'Gênero' };
                const enabledKey = `field_${field}_enabled` as keyof StoreSettings;
                const requiredKey = `field_${field}_required` as keyof StoreSettings;
                
                return (
                  <div key={field} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{labelMap[field]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                        <input type="checkbox" checked={!!settings[enabledKey]} onChange={(e) => setSettings({ ...settings, [enabledKey]: e.target.checked, [requiredKey]: e.target.checked ? settings[requiredKey] : false } as any)} className="w-4 h-4 text-blue-600 rounded" />
                        Ativado
                      </label>
                      {settings[enabledKey] && (
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-rose-600 font-semibold">
                          <input type="checkbox" checked={!!settings[requiredKey]} onChange={(e) => setSettings({ ...settings, [requiredKey]: e.target.checked } as any)} className="w-4 h-4 text-rose-600 rounded" />
                          Obrigatório
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
               <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  Mensagem de Boas Vindas e Termos
               </h2>
               <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Título do Formulário</label>
                  <input type="text" value={settings.welcome_message || ''} onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
               </div>
               <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Re-cadastro após (Dias)</label>
                    <select value={settings.relogin_days_interval || 7} onChange={(e) => setSettings({ ...settings, relogin_days_interval: parseInt(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold">
                      <option value={7}>7 dias</option>
                      <option value={15}>15 dias</option>
                      <option value={30}>30 dias</option>
                    </select>
                  </div>
               </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TAB 3: DEPOIS DO CADASTRO */}
          {/* ========================================================= */}
          <div className={activeTab === 'POST' ? 'space-y-6 block' : 'hidden'}>
            
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <LinkIcon className="w-5 h-5 text-green-600" />
                Ação Principal após Cadastro
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Conteúdo principal após o cadastro</label>
                  <select value={settings.post_signup_action || 'SHOW_MESSAGE'} onChange={(e) => setSettings({ ...settings, post_signup_action: e.target.value as StoreSettings['post_signup_action'] })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold">
                    <option value="SHOW_MESSAGE">Mensagem Simples</option>
                    <option value="COUPON">Cupom de Desconto</option>
                    <option value="PROMO">Promoção com Imagem</option>
                    <option value="BANNER">Banner Principal</option>
                    <option value="MENU">Cardápio Digital</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="GOOGLE">Avaliação Google</option>
                    <option value="CUSTOM_URL">URL Personalizada</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Título de Sucesso</label>
                    <input type="text" value={settings.post_signup_title || ''} onChange={(e) => setSettings({ ...settings, post_signup_title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="Ex: Tudo Certo!" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Mensagem de Sucesso</label>
                    <input type="text" value={settings.post_signup_message || ''} onChange={(e) => setSettings({ ...settings, post_signup_message: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="Sua internet está liberada." />
                  </div>
                </div>

                {settings.post_signup_action === 'COUPON' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Código do Cupom</label>
                    <input type="text" value={settings.promo_coupon_code || ''} onChange={(e) => setSettings({ ...settings, promo_coupon_code: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-sm uppercase text-emerald-600 font-bold bg-emerald-50" placeholder="DESCONTO10" />
                  </div>
                )}

                {(settings.post_signup_action === 'PROMO' || settings.post_signup_action === 'BANNER') && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">URL da Imagem</label>
                        <input type="url" value={settings.post_signup_promo_image_url || ''} onChange={(e) => setSettings({ ...settings, post_signup_promo_image_url: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="https://" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Formato da Imagem</label>
                        <select value={settings.post_signup_promo_image_aspect_ratio || '4:5'} onChange={(e) => setSettings({ ...settings, post_signup_promo_image_aspect_ratio: e.target.value as any })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold">
                          <option value="9:16">9:16 Vertical (Story)</option>
                          <option value="4:5">4:5 Retrato (Recomendado)</option>
                          <option value="1:1">1:1 Quadrado</option>
                          <option value="16:9">16:9 Horizontal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Título da Promoção/Banner</label>
                        <input type="text" value={settings.post_signup_promo_title || ''} onChange={(e) => setSettings({ ...settings, post_signup_promo_title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="Opcional" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Descrição</label>
                        <input type="text" value={settings.post_signup_promo_description || ''} onChange={(e) => setSettings({ ...settings, post_signup_promo_description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="Opcional" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Texto do Botão Principal</label>
                        <input type="text" value={settings.post_signup_promo_button_text || ''} onChange={(e) => setSettings({ ...settings, post_signup_promo_button_text: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="Ex: Aproveitar Oferta" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">URL do Botão</label>
                        <input type="url" value={settings.post_signup_promo_button_url || ''} onChange={(e) => setSettings({ ...settings, post_signup_promo_button_url: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="https:// (Opcional)" />
                      </div>
                    </div>
                  </div>
                )}
                
                {settings.post_signup_action === 'CUSTOM_URL' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">URL Personalizada</label>
                    <input type="url" value={settings.post_signup_url || ''} onChange={(e) => setSettings({ ...settings, post_signup_url: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="https://" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Share2 className="w-5 h-5 text-indigo-600" />
                Redirecionamento e Botões Extras
              </h2>
              
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Automação de Redirecionamento (Marketing)</label>
                <select value={settings.post_signup_redirect_mode || 'NONE'} onChange={(e) => setSettings({ ...settings, post_signup_redirect_mode: e.target.value as StoreSettings['post_signup_redirect_mode'] })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold mb-2">
                  <option value="NONE">Não redirecionar automaticamente (apenas pelo botão)</option>
                  <option value="AUTO_3S">Redirecionar após 3 segundos</option>
                  <option value="AUTO_5S">Redirecionar após 5 segundos</option>
                  <option value="AUTO_10S">Redirecionar após 10 segundos</option>
                </select>
                <p className="text-[11px] text-slate-500 italic">Nota: A autorização do roteador (OpenNDS) ocorrerá silenciosamente no fundo. O redirecionamento será apenas para a URL destino do marketing selecionado acima.</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                 <p className="text-xs font-semibold uppercase text-slate-600 mb-3">Botões de Apoio na Tela de Sucesso</p>
                 <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input type="checkbox" checked={settings.post_signup_show_instagram} onChange={(e) => setSettings({ ...settings, post_signup_show_instagram: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600" /> Mostrar botão do Instagram (se preenchido acima)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input type="checkbox" checked={settings.post_signup_show_menu} onChange={(e) => setSettings({ ...settings, post_signup_show_menu: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600" /> Mostrar botão do Cardápio (se preenchido acima)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input type="checkbox" checked={settings.post_signup_show_google_review} onChange={(e) => setSettings({ ...settings, post_signup_show_google_review: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600" /> Mostrar botão de Avaliação Google (se preenchido acima)
                    </label>
                 </div>
              </div>
            </div>

          </div>

          {/* Botão de Salvar Global */}
          <div className="flex justify-end sticky bottom-6 z-50">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Salvando e Validando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Salvar Toda a Jornada
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* LADO DIREITO: PREVIEW MOBILE EM TEMPO REAL */}
      <div className="hidden xl:block w-[400px] shrink-0">
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
               <Smartphone className="w-4 h-4" /> Prévia em Tempo Real
             </h3>
          </div>
          
          <div className="w-[375px] h-[812px] bg-black rounded-[3.5rem] p-3 shadow-2xl border-[6px] border-slate-800 relative ring-4 ring-slate-900/50 mx-auto">
            {/* Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-50 flex justify-center items-center">
               <div className="w-16 h-4 bg-slate-900 rounded-full"></div>
            </div>
            
            {/* Screen */}
            <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative overflow-y-auto custom-scrollbar">
               <PreviewMobile settings={settings} step={activeTab} />
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
