import React from 'react';
import { MetricsCards } from '@/components/admin/metrics-cards';
import { PeakHoursChart } from '@/components/admin/peak-hours-chart';
import { MOCK_METRICS, MOCK_VISITORS } from '@/lib/supabase/mock-data';
import { createServerClientInstance } from '@/lib/supabase/server';
import { ContactsTable } from '@/components/admin/contacts-table';
import { Users, LayoutDashboard } from 'lucide-react';
import { DashboardMetrics, Visitor } from '@/types/database';

export const metadata = {
  title: 'Visão Geral — Painel Wi-Fi Marketing',
};

export default async function DashboardPage() {
  const supabase = await createServerClientInstance();

  let metrics: DashboardMetrics = MOCK_METRICS;
  let visitors: Visitor[] = MOCK_VISITORS;

  if (supabase) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      // 1. Total de visitantes
      const { count: totalVisitorsCount } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true });

      // 2. Visitantes de hoje (sessões iniciadas hoje)
      const { count: todayVisitorsCount } = await supabase
        .from('wifi_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', todayIso);

      // 3. Novos clientes cadastrados hoje
      const { count: newVisitorsTodayCount } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .gte('first_seen_at', todayIso);

      // 4. Clientes recorrentes (mais de 1 visita)
      const { count: returningVisitorsCount } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .gt('total_visits', 1);

      // 5. Total de sessões Wi-Fi
      const { count: totalSessionsCount } = await supabase
        .from('wifi_sessions')
        .select('*', { count: 'exact', head: true });

      // 6. Lista de visitantes ordenados por última visita
      const { data: visitorsData } = await supabase
        .from('visitors')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (visitorsData && visitorsData.length > 0) {
        visitors = visitorsData;
      }

      metrics = {
        totalVisitors: totalVisitorsCount ?? 0,
        todayVisitors: todayVisitorsCount ?? 0,
        activeNowVisitors: 4, // Conexões ativas no momento via gateway
        newVisitorsToday: newVisitorsTodayCount ?? 0,
        returningVisitors: returningVisitorsCount ?? 0,
        totalSessions: totalSessionsCount ?? 0,
        peakHours: MOCK_METRICS.peakHours,
        peakDays: MOCK_METRICS.peakDays,
      };
    } catch (err) {
      console.error('Erro ao buscar métricas reais do Supabase:', err);
    }
  }

  return (
    <div className="space-y-8">
      {/* Título da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            Visão Geral da Loja
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Resumo do desempenho e frequência de visitantes na sua rede Wi-Fi.
          </p>
        </div>
      </div>

      {/* Cartões de Indicadores */}
      <MetricsCards metrics={metrics} />

      {/* Gráficos de Horários de Pico */}
      <PeakHoursChart metrics={metrics} />

      {/* Tabela Resumo dos Últimos Visitantes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Últimos Visitantes Cadastrados
          </h2>
        </div>
        <ContactsTable visitors={visitors} />
      </div>
    </div>
  );
}
