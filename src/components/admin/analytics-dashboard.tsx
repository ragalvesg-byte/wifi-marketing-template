'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Calendar, Loader2, Eye, MousePointerClick, Award, HelpCircle,
  TrendingUp, Clock, Camera, FileText, Star, AlertCircle, ArrowRight
} from 'lucide-react';

interface AnalyticsData {
  period: { start: string; end: string };
  metrics: {
    portalOpenings: number;
    uniqueVisitors: number;
    newRegistrations: number;
    returningVisitors: number;
    wifiSessions: number;
    campaignViews: number;
    campaignClicks: number;
    ctr: number;
    instagramClicks: number;
    menuClicks: number;
    googleClicks: number;
  };
  funnel: { step: string; count: number; percentage: number }[];
  campaigns: {
    id: string;
    title: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    views: number;
    clicks: number;
    ctr: number;
  }[];
  chartVisits: { date: string; visits: number }[];
  chartHourly: { hour: string; visits: number }[];
}

export function AnalyticsDashboard() {
  const [periodOption, setPeriodOption] = useState<'TODAY' | '7DAYS' | '30DAYS' | 'CUSTOM'>('7DAYS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let url = '/api/admin/analytics';
      if (periodOption === 'CUSTOM') {
        if (!startDate || !endDate) {
          setErrorMsg('Selecione as datas de início e fim.');
          setLoading(false);
          return;
        }
        url += `?startDate=${new Date(startDate).toISOString()}&endDate=${new Date(endDate).toISOString()}`;
      } else {
        const now = new Date();
        let start: Date;
        if (periodOption === 'TODAY') {
          // Início do dia de hoje (00:00:00)
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (periodOption === '7DAYS') {
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        url += `?startDate=${start.toISOString()}&endDate=${now.toISOString()}`;
      }

      const res = await fetch(url);
      const resData = await res.json();

      if (res.ok) {
        setData(resData);
      } else {
        setErrorMsg(resData.error || 'Falha ao buscar estatísticas.');
      }
    } catch {
      setErrorMsg('Erro de rede ao buscar estatísticas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (periodOption !== 'CUSTOM') {
      fetchAnalytics();
    }
  }, [periodOption]);

  const hasData = data && (
    data.metrics.portalOpenings > 0 ||
    data.metrics.wifiSessions > 0 ||
    data.metrics.campaignViews > 0
  );

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#3b82f6'];

  return (
    <div className="space-y-6">
      {/* Topo / Filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Estatísticas do Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Analise a conversão e o engajamento dos seus visitantes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={periodOption}
            onChange={(e) => setPeriodOption(e.target.value as any)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none"
          >
            <option value="TODAY">Hoje</option>
            <option value="7DAYS">Últimos 7 dias</option>
            <option value="30DAYS">Últimos 30 dias</option>
            <option value="CUSTOM">Período personalizado</option>
          </select>

          {periodOption === 'CUSTOM' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm"
              />
              <span className="text-slate-400 text-sm">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm"
              />
              <button
                onClick={fetchAnalytics}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Filtrar
              </button>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span>Buscando métricas...</span>
        </div>
      ) : !hasData ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-4">
          <HelpCircle className="w-12 h-12 text-slate-300 animate-bounce" />
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Ainda não há dados suficientes neste período.</h3>
            <p className="text-sm text-slate-400 mt-1">Conecte novos usuários ao Wi-Fi para começar a gerar métricas.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Grid de Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center md:text-left">
              <span className="text-xs text-slate-500 block mb-1">Aberturas do Portal</span>
              <span className="text-2xl font-black text-slate-900 block">{data.metrics.portalOpenings}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center md:text-left">
              <span className="text-xs text-slate-500 block mb-1">Visitantes Únicos</span>
              <span className="text-2xl font-black text-slate-900 block">{data.metrics.uniqueVisitors}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center md:text-left">
              <span className="text-xs text-slate-500 block mb-1">Sessões Wi-Fi</span>
              <span className="text-2xl font-black text-slate-900 block">{data.metrics.wifiSessions}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center md:text-left">
              <span className="text-xs text-slate-500 block mb-1">Taxa de Cliques Geral</span>
              <span className="text-2xl font-black text-emerald-600 block">{data.metrics.ctr}%</span>
            </div>
          </div>

          {/* Novos vs Recorrentes e Engajamento Redes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-800 mb-4">Novos vs. Recorrentes</h2>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Novos', value: data.metrics.newRegistrations },
                        { name: 'Recorrentes', value: data.metrics.returningVisitors }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#2563eb" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-800">Engajamento Externo (Cliques)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl flex flex-col items-center text-center">
                  <Camera className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Instagram</span>
                  <span className="text-xl font-bold text-slate-900 mt-1">{data.metrics.instagramClicks}</span>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex flex-col items-center text-center">
                  <FileText className="w-8 h-8 text-orange-600 mb-2" />
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Cardápio</span>
                  <span className="text-xl font-bold text-slate-900 mt-1">{data.metrics.menuClicks}</span>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex flex-col items-center text-center">
                  <Star className="w-8 h-8 text-amber-500 mb-2" />
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Google Avaliar</span>
                  <span className="text-xl font-bold text-slate-900 mt-1">{data.metrics.googleClicks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Visitas por Dia e Distribuição Horária */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Sessões de Conexão Diárias
              </h3>
              <div className="h-64 w-full">
                {data.chartVisits.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.chartVisits} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="visits" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">Sem visitas registradas.</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-blue-600" />
                Fluxo por Hora do Dia
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartHourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="visits" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Funil Visual */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 mb-6">Funil de Conversão do Portal</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {data.funnel.map((item, index) => (
                <div key={item.step} className="relative flex flex-col items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.step}</span>
                  <span className="text-2xl font-black text-slate-800 mt-2">{item.count}</span>
                  <span className="text-xs text-blue-600 font-bold mt-1">{item.percentage}%</span>
                  
                  {index < 3 && (
                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white border border-slate-200 rounded-full p-1 shadow-xs">
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Campanhas Ativas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Desempenho de Campanhas</h2>
            </div>
            {data.campaigns.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Nenhuma campanha exibida no período.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
                      <th className="px-6 py-4">Campanha</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Visualizações</th>
                      <th className="px-6 py-4 text-center">Cliques</th>
                      <th className="px-6 py-4 text-center">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {data.campaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-50/30">
                        <td className="px-6 py-4 font-bold text-slate-800">{camp.title}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            camp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {camp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold">{camp.views}</td>
                        <td className="px-6 py-4 text-center font-semibold">{camp.clicks}</td>
                        <td className="px-6 py-4 text-center font-bold text-blue-600">{camp.ctr}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
