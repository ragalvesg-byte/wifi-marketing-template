'use client';

import React, { useState } from 'react';
import { formatPhoneNumber } from '@/lib/utils';
import { StoreSettings, OpenNdsParams } from '@/types/database';
import { Wifi, ShieldCheck, ArrowRight, Loader2, Info } from 'lucide-react';
import { getAnonymousSessionId } from '@/lib/events';

interface VisitorFormProps {
  settings: StoreSettings;
  openNdsParams: OpenNdsParams;
  onSuccess: (data: { visitorId?: string | null; visitorName: string; authUrl: string; totalVisits: number }) => void;
  onBack?: () => void;
}

export function VisitorForm({ settings, openNdsParams, onSuccess, onBack }: VisitorFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Por favor, informe seu nome.');
      return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Informe um número de WhatsApp válido.');
      return;
    }

    if (settings.field_email_required && !email.trim()) {
      setErrorMsg('O preenchimento do e-mail é obrigatório.');
      return;
    }

    if (settings.field_dob_required && !dob) {
      setErrorMsg('A data de nascimento é obrigatória.');
      return;
    }

    if (settings.field_city_required && !city.trim()) {
      setErrorMsg('O preenchimento da cidade é obrigatório.');
      return;
    }

    if (settings.field_gender_required && !gender) {
      setErrorMsg('A seleção do gênero é obrigatória.');
      return;
    }

    if (!termsAccepted) {
      setErrorMsg('Você precisa aceitar os termos para se conectar ao Wi-Fi.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/portal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          email: email.trim() || undefined,
          date_of_birth: dob || undefined,
          city: city.trim() || undefined,
          gender: gender || undefined,
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

      if (!res.ok) {
        setErrorMsg(data.error || 'Falha ao processar cadastro. Tente novamente.');
        setLoading(false);
        return;
      }

      onSuccess({
        visitorId: data.visitorId || null,
        visitorName: data.visitorName || name,
        authUrl: data.authUrl,
        totalVisits: data.totalVisits || 1,
      });
    } catch {
      setErrorMsg('Erro de conexão. Verifique sua rede e tente novamente.');
      setLoading(false);
    }
  };

  const primaryColor = settings.primary_color || '#2563eb';
  const hasOptionalFields = Boolean(
    settings.field_email_enabled ||
    settings.field_dob_enabled ||
    settings.field_city_enabled ||
    settings.field_gender_enabled
  );

  return (
    <div className="w-full max-w-md bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
      <div className="text-center">
        {settings.logo_url ? (
          <img
            src={settings.logo_url}
            alt={settings.store_name}
            className="w-16 h-16 mx-auto rounded-full object-cover shadow-md mb-3 ring-4 ring-slate-100"
          />
        ) : (
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            {settings.store_name.charAt(0)}
          </div>
        )}
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{settings.welcome_message || 'Complete seu Cadastro'}</h1>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-center font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Nome (Sempre Obrigatório) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Seu Nome <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ex: João da Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50/50 text-slate-900 text-sm"
          />
        </div>

        {/* WhatsApp (Sempre Obrigatório) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            WhatsApp / Celular <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            required
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={handlePhoneChange}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50/50 text-slate-900 text-sm"
          />
        </div>

        {/* Campo Opcional/Ativável: E-mail */}
        {settings.field_email_enabled && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              E-mail {settings.field_email_required ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">(Opcional)</span>}
            </label>
            <input
              type="email"
              required={settings.field_email_required}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50/50 text-slate-900 text-sm"
            />
          </div>
        )}

        {/* Campo Opcional/Ativável: Data de Nascimento */}
        {settings.field_dob_enabled && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Data de Nascimento {settings.field_dob_required ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">(Opcional)</span>}
            </label>
            <input
              type="date"
              required={settings.field_dob_required}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50/50 text-slate-900 text-sm"
            />
          </div>
        )}

        {/* Campo Opcional/Ativável: Cidade */}
        {settings.field_city_enabled && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Sua Cidade {settings.field_city_required ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">(Opcional)</span>}
            </label>
            <input
              type="text"
              required={settings.field_city_required}
              placeholder="Ex: São Paulo"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50/50 text-slate-900 text-sm"
            />
          </div>
        )}

        {/* Campo Opcional/Ativável: Gênero */}
        {settings.field_gender_enabled && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Gênero {settings.field_gender_required ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">(Opcional)</span>}
            </label>
            <select
              required={settings.field_gender_required}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50/50 text-slate-900 text-sm"
            >
              <option value="">Selecione...</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Outro">Outro / Prefiro não dizer</option>
            </select>
          </div>
        )}

        {/* Explicação Transparente da Finalidade da Coleta de Dados */}
        {hasOptionalFields && (
          <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-start gap-2 text-[11px] text-blue-900 leading-tight">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Informações adicionais são utilizadas exclusivamente para personalização do atendimento e ofertas.
            </span>
          </div>
        )}

        {/* Checkbox Termos LGPD */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-[11px] text-slate-600 leading-normal">
              Aceito os <a href="#terms" className="underline font-medium text-slate-900">Termos de Uso</a> e a{' '}
              <a href="#privacy" className="underline font-medium text-slate-900">Política de Privacidade</a> para acesso à internet.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: primaryColor }}
          className="w-full py-3.5 px-6 rounded-2xl text-white font-bold text-base shadow-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              Conectar e Avançar
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {onBack && (
        <button
          onClick={onBack}
          className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 mt-3 underline"
        >
          ← Voltar
        </button>
      )}

      <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        Conexão Criptografada e Segura (LGPD)
      </div>
    </div>
  );
}
