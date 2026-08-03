'use client';

import React from 'react';
import { DashboardMetrics } from '@/types/database';
import { Users, UserPlus, UserCheck, Activity, Calendar, Radio } from 'lucide-react';
import { getRouterDriver } from '@/lib/routers';

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const currentDriver = getRouterDriver('opennds');

  const cards = [
    {
      title: 'Total de Clientes',
      value: metrics.totalVisitors,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
      description: 'Cadastrados no Wi-Fi',
    },
    {
      title: 'Conectados Agora',
      value: currentDriver.supportsActiveConnectionsCount && typeof metrics.activeNowVisitors === 'number'
        ? metrics.activeNowVisitors
        : 'N/D',
      icon: Radio,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      description: currentDriver.supportsActiveConnectionsCount
        ? 'Dispositivos ativos no gateway'
        : 'Não disponível neste equipamento',
    },
    {
      title: 'Visitantes de Hoje',
      value: metrics.todayVisitors,
      icon: Calendar,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
      description: 'Conectaram hoje',
    },
    {
      title: 'Novos Clientes Hoje',
      value: metrics.newVisitorsToday,
      icon: UserPlus,
      color: 'bg-amber-500/10 text-amber-600 border-amber-200',
      description: 'Primeira visita',
    },
    {
      title: 'Total de Acessos',
      value: metrics.totalSessions,
      icon: Activity,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
      description: 'Sessões liberadas',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{card.value}</div>
            <div className="text-xs text-slate-500 mt-1">{card.description}</div>
          </div>
        );
      })}
    </div>
  );
}
