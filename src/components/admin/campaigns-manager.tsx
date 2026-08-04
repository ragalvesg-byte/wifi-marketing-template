'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Tag, Users, Trash2, Plus, 
  Loader2, AlertCircle, CheckCircle, Percent, 
  Image, Calendar, Eye, ExternalLink, RefreshCw 
} from 'lucide-react';
import { Campaign } from '@/types/database';

export function CampaignsManager() {
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PROMO' | 'COUPON' | 'BANNER' | 'SURVEY'>('COUPON');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'PAUSED'>('ACTIVE');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '4:5' | '1:1' | '16:9'>('4:5');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Target State
  const [targetType, setTargetType] = useState<'ALL' | 'NEW_VISITORS' | 'RETURNING_VISITORS' | 'GENDER' | 'BIRTHDAY_MONTH'>('ALL');
  const [genderRule, setGenderRule] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino');
  const [birthdayMonthRule, setBirthdayMonthRule] = useState('8');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [couponExpiresAt, setCouponExpiresAt] = useState('');

  const fetchCampaigns = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/campaigns');
      const data = await res.json();
      if (res.ok) {
        setCampaigns(data.campaigns || []);
      } else {
        setErrorMsg(data.error || 'Falha ao buscar campanhas.');
      }
    } catch {
      setErrorMsg('Erro de rede ao buscar campanhas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta campanha? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/campaigns?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccessMsg('Campanha excluída com sucesso!');
        fetchCampaigns();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Falha ao excluir campanha.');
      }
    } catch {
      setErrorMsg('Erro de rede ao excluir campanha.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('COUPON');
    setStatus('ACTIVE');
    setMediaUrl('');
    setMediaType('IMAGE');
    setAspectRatio('4:5');
    setButtonText('');
    setButtonUrl('');
    setStartDate('');
    setEndDate('');
    setTargetType('ALL');
    setGenderRule('Feminino');
    setBirthdayMonthRule('8');
    setCouponCode('');
    setDiscountType('PERCENTAGE');
    setDiscountValue(10);
    setMaxRedemptions('');
    setCouponExpiresAt('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    const rules: Record<string, any> = {};
    if (targetType === 'GENDER') {
      rules.gender = genderRule;
    } else if (targetType === 'BIRTHDAY_MONTH') {
      rules.birthday_month = birthdayMonthRule;
    }

    const payload = {
      title,
      description,
      type,
      status,
      media_url: mediaUrl || null,
      media_type: mediaType,
      aspect_ratio: aspectRatio,
      button_text: buttonText || null,
      button_url: buttonUrl || null,
      start_date: startDate || null,
      end_date: endDate || null,
      target_type: targetType,
      rules,
      coupon_code: type === 'COUPON' ? couponCode : null,
      discount_type: discountType,
      discount_value: discountValue,
      max_redemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : null,
      expires_at: couponExpiresAt || null,
    };

    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Campanha criada com sucesso!');
        resetForm();
        fetchCampaigns();
        setActiveTab('LIST');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Falha ao salvar campanha.');
      }
    } catch {
      setErrorMsg('Erro ao tentar conectar com a API.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600 animate-pulse" />
            Campanhas & Cupons de Desconto
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie anúncios direcionados, pesquisas ou cupons dinâmicos exibidos na tela de sucesso do visitante.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'LIST'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Listar Campanhas
          </button>
          <button
            onClick={() => setActiveTab('CREATE')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'CREATE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Plus className="w-4 h-4" /> Criar Campanha
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-start gap-2.5">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}

      {activeTab === 'LIST' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span>Buscando campanhas...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="font-medium text-slate-800 mb-1">Nenhuma campanha cadastrada</p>
              <p className="text-sm">Clique em "Criar Campanha" para iniciar sua primeira ação de Wi-Fi Marketing.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <th className="px-6 py-4">Campanha / Título</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Público-Alvo</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Detalhes</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {campaigns.map((campaign: any) => {
                    const audience = campaign.campaign_audiences?.[0];
                    const coupon = campaign.coupons?.[0];
                    return (
                      <tr key={campaign.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {campaign.media_url && (
                              <img
                                src={campaign.media_url}
                                alt={campaign.title}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0"
                              />
                            )}
                            <div>
                              <p className="font-bold text-slate-900">{campaign.title}</p>
                              <p className="text-xs text-slate-500 line-clamp-1">{campaign.description || 'Sem descrição'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            campaign.type === 'COUPON' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {campaign.type === 'COUPON' ? <Tag className="w-3.5 h-3.5" /> : <Megaphone className="w-3.5 h-3.5" />}
                            {campaign.type === 'COUPON' ? 'Cupom' : campaign.type === 'PROMO' ? 'Banner Promo' : campaign.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-700 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-xs">
                              {audience?.target_type === 'ALL' && 'Todos os Visitantes'}
                              {audience?.target_type === 'NEW_VISITORS' && 'Novos Visitantes'}
                              {audience?.target_type === 'RETURNING_VISITORS' && 'Visitantes Recorrentes'}
                              {audience?.target_type === 'GENDER' && `Gênero: ${audience.rules.gender}`}
                              {audience?.target_type === 'BIRTHDAY_MONTH' && `Aniversariantes do Mês`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            campaign.status === 'ACTIVE' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : campaign.status === 'PAUSED' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {campaign.status === 'ACTIVE' ? 'Ativo' : campaign.status === 'PAUSED' ? 'Pausado' : 'Rascunho'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs space-y-1">
                          {coupon && (
                            <p className="font-semibold text-slate-900">
                              Cupom: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">{coupon.code}</span>
                            </p>
                          )}
                          {coupon && (
                            <p className="text-slate-500">
                              Desconto: {coupon.discount_value}% | Resgates: {coupon.current_redemptions || 0}
                            </p>
                          )}
                          {campaign.button_url && (
                            <a
                              href={campaign.button_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                            >
                              Link do botão <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(campaign.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir campanha"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">1. Informações Básicas da Campanha</h2>
            <p className="text-xs text-slate-500">Define o tema, descrição e tipo de ação a ser exibida.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Título Principal *</label>
              <input
                type="text"
                required
                placeholder="Ex: Ganhe uma sobremesa hoje!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Tipo de Campanha *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm font-medium"
              >
                <option value="COUPON">Cupom de Desconto</option>
                <option value="PROMO">Banner Promocional</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Descrição / Texto Secundário</label>
              <textarea
                placeholder="Explique os detalhes da promoção..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
              />
            </div>
          </div>

          <div className="border-b border-slate-100 pb-4 pt-2">
            <h2 className="text-lg font-bold text-slate-900">2. Mídia e Call-To-Action (Botão)</h2>
            <p className="text-xs text-slate-500">Defina imagens de destaque e o link de redirecionamento do botão.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1">
                <Image className="w-4 h-4 text-slate-400" /> URL da Imagem Promocional
              </label>
              <input
                type="url"
                placeholder="https://exemplo.com/imagem.jpg"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Proporção da Imagem</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
              >
                <option value="4:5">Vertical (4:5)</option>
                <option value="1:1">Quadrada (1:1)</option>
                <option value="16:9">Horizontal (16:9)</option>
                <option value="9:16">Story (9:16)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Texto do Botão de Ação</label>
              <input
                type="text"
                placeholder="Ex: Resgatar Agora"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">URL de Destino do Botão</label>
              <input
                type="url"
                placeholder="https://meusite.com/oferta"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
              />
            </div>
          </div>

          <div className="border-b border-slate-100 pb-4 pt-2">
            <h2 className="text-lg font-bold text-slate-900">3. Regras de Público-Alvo e Segmentação</h2>
            <p className="text-xs text-slate-500">Escolha quais visitantes poderão visualizar e resgatar esta oferta.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1">
                <Users className="w-4 h-4 text-slate-400" /> Critério de Segmentação *
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm font-medium"
              >
                <option value="ALL">Todos os Visitantes</option>
                <option value="NEW_VISITORS">Apenas Novos Visitantes (1ª visita)</option>
                <option value="RETURNING_VISITORS">Apenas Visitantes Recorrentes</option>
                <option value="GENDER">Segmentar por Gênero</option>
                <option value="BIRTHDAY_MONTH">Segmentar por Mês de Aniversário</option>
              </select>
            </div>

            {targetType === 'GENDER' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Selecione o Gênero</label>
                <select
                  value={genderRule}
                  onChange={(e) => setGenderRule(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro / Não especificado</option>
                </select>
              </div>
            )}

            {targetType === 'BIRTHDAY_MONTH' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Mês Selecionado (1 a 12)</label>
                <select
                  value={birthdayMonthRule}
                  onChange={(e) => setBirthdayMonthRule(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={String(m)}>
                      {new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {type === 'COUPON' && (
            <>
              <div className="border-b border-slate-100 pb-4 pt-2">
                <h2 className="text-lg font-bold text-slate-900">4. Configurações de Cupom de Desconto</h2>
                <p className="text-xs text-slate-500">Defina os parâmetros de resgate e valores do código de cupom.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Código do Cupom *</label>
                  <input
                    type="text"
                    required={type === 'COUPON'}
                    placeholder="Ex: BEMVINDO10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm font-mono tracking-wider"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Tipo de Desconto</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm font-medium"
                  >
                    <option value="PERCENTAGE">Porcentagem (%)</option>
                    <option value="FIXED">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Valor do Desconto *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required={type === 'COUPON'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Máximo de Resgates (Opcional)</label>
                  <input
                    type="number"
                    placeholder="Sem limites"
                    value={maxRedemptions}
                    onChange={(e) => setMaxRedemptions(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Validade do Cupom (Opcional)</label>
                  <input
                    type="date"
                    value={couponExpiresAt}
                    onChange={(e) => setCouponExpiresAt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <div className="border-b border-slate-100 pb-4 pt-2">
            <h2 className="text-lg font-bold text-slate-900">5. Agendamento e Publicação</h2>
            <p className="text-xs text-slate-500">Defina o período de atividade e o status inicial da campanha.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" /> Data de Início
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" /> Data de Término
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Status da Campanha *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:outline-none text-slate-900 bg-slate-50/50 text-sm font-semibold"
              >
                <option value="ACTIVE">Ativo / Publicado</option>
                <option value="DRAFT">Rascunho</option>
                <option value="PAUSED">Pausado</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveTab('LIST');
              }}
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando Campanha...
                </>
              ) : (
                'Salvar e Publicar'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
