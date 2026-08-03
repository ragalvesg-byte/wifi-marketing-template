'use client';

import React, { useState } from 'react';
import { Visitor } from '@/types/database';
import { formatDate, formatPhoneNumber, exportToCSV } from '@/lib/utils';
import { Search, Download, Eye, Phone, ChevronRight } from 'lucide-react';
import { ContactDetailsModal } from './contact-details-modal';

interface ContactsTableProps {
  visitors: Visitor[];
}

export function ContactsTable({ visitors }: ContactsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  const filteredVisitors = visitors.filter((v) => {
    const term = searchTerm.toLowerCase();
    const cleanPhone = v.phone.replace(/\D/g, '');
    return v.name.toLowerCase().includes(term) || v.phone.includes(term) || cleanPhone.includes(term);
  });

  const handleExportCSV = () => {
    const exportData = filteredVisitors.map((v) => ({
      Nome: v.name,
      WhatsApp: formatPhoneNumber(v.phone),
      Email: v.email || 'Não informado',
      'Total de Visitas': v.total_visits,
      'Primeira Visita': formatDate(v.first_seen_at),
      'Ultima Visita': formatDate(v.last_seen_at),
    }));

    exportToCSV(`wifi-contatos-${new Date().toISOString().slice(0, 10)}.csv`, exportData);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Topo com Busca e Botão Exportar */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-slate-50/50"
          />
        </div>

        <button
          onClick={handleExportCSV}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
        >
          <Download className="w-4 h-4" />
          Exportar CSV / Excel
        </button>
      </div>

      {/* Tabela de Contatos */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">WhatsApp</th>
              <th className="px-6 py-4">Visitas</th>
              <th className="px-6 py-4">Última Visita</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVisitors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Nenhum contato encontrado.
                </td>
              </tr>
            ) : (
              filteredVisitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {visitor.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold">{visitor.name}</div>
                        {visitor.email && <div className="text-xs text-slate-400 font-normal">{visitor.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`https://wa.me/55${visitor.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {formatPhoneNumber(visitor.phone)}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {visitor.total_visits} {visitor.total_visits === 1 ? 'visita' : 'visitas'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {formatDate(visitor.last_seen_at)}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedVisitor(visitor)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      Detalhes
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes */}
      <ContactDetailsModal
        visitor={selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
      />
    </div>
  );
}
