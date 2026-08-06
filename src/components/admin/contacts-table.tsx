'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Visitor } from '@/types/database';
import { formatDate, formatPhoneNumber, exportToCSV } from '@/lib/utils';
import { Search, Download, Eye, Phone, ChevronRight, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { ContactDetailsModal } from './contact-details-modal';

interface ContactsTableProps {
  initialVisitors?: Visitor[];
  compact?: boolean;
}

export function ContactsTable({ initialVisitors = [], compact = false }: ContactsTableProps) {
  const [visitors, setVisitors] = useState<Visitor[]>(initialVisitors);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<10 | 20 | 30>(10);
  const [totalCount, setTotalCount] = useState(initialVisitors.length);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [visitorToDelete, setVisitorToDelete] = useState<Visitor | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchPaginatedVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/contacts?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`
      );
      if (res.ok) {
        const data = await res.json();
        setVisitors(data.visitors || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.warn('Erro ao buscar contatos paginados:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchPaginatedVisitors();
  }, [fetchPaginatedVisitors]);

  const handleDeleteVisitor = async () => {
    if (!visitorToDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/contacts/${visitorToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setVisitorToDelete(null);
        fetchPaginatedVisitors();
      } else {
        alert('Falha ao excluir visitante. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro na exclusão do visitante:', err);
      alert('Erro de conexão ao excluir visitante.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = visitors.map((v) => ({
      Nome: v.name,
      WhatsApp: formatPhoneNumber(v.phone),
      Email: v.email || 'Não informado',
      'Total de Visitas': v.total_visits,
      'Primeira Visita': formatDate(v.first_seen_at),
      'Ultima Visita': formatDate(v.last_seen_at),
    }));

    exportToCSV(`wifi-contatos-p${page}-${new Date().toISOString().slice(0, 10)}.csv`, exportData);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Topo com Busca, Seletor de Quantidade por Página e Exportar */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, WhatsApp ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Seletor de itens por página (10, 20, 30) */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Exibir:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value) as 10 | 20 | 30);
                setPage(1);
              }}
              className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={30}>30 por página</option>
            </select>
          </div>

          {!compact && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Contatos */}
      <div className="overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

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
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">
                  {loading ? 'Carregando contatos...' : 'Nenhum visitante encontrado.'}
                </td>
              </tr>
            ) : (
              visitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {visitor.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{visitor.name}</div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">
                    {formatDate(visitor.last_seen_at)}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap space-x-1">
                    <button
                      onClick={() => setSelectedVisitor(visitor)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      Detalhes
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => setVisitorToDelete(visitor)}
                      title="Excluir cadastro do visitante"
                      className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginação (Anterior / Próxima) */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600 font-medium">
        <span>
          Exibindo {visitors.length} de {totalCount} contatos (Página {page} de {totalPages})
        </span>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            Anterior
          </button>
          <span className="font-bold text-slate-800">{page}</span>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Modal de Detalhes */}
      <ContactDetailsModal
        visitor={selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
      />

      {/* Modal de Confirmação de Exclusão Segura */}
      {visitorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 text-left space-y-4 animate-in zoom-in-95 border border-slate-100">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">Excluir Cadastro do Visitante</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tem certeza de que deseja excluir este visitante? Esta ação removerá permanentemente o cadastro e todo o histórico relacionado. Esta ação não poderá ser desfeita.
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs font-semibold text-slate-800">
                <span>Nome: </span><strong className="text-slate-900">{visitorToDelete.name}</strong><br />
                <span>WhatsApp: </span><strong>{formatPhoneNumber(visitorToDelete.phone)}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setVisitorToDelete(null)}
                className="w-1/2 py-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteVisitor}
                className="w-1/2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Excluir Cadastro
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
