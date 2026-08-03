'use client';

import React from 'react';
import { Visitor } from '@/types/database';
import { formatDate, formatPhoneNumber } from '@/lib/utils';
import { X, User, Phone, Mail, Calendar, Clock, Eye } from 'lucide-react';

interface ContactDetailsModalProps {
  visitor: Visitor | null;
  onClose: () => void;
}

export function ContactDetailsModal({ visitor, onClose }: ContactDetailsModalProps) {
  if (!visitor) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho do Modal */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl text-white">
              {visitor.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">{visitor.name}</h3>
              <span className="text-xs text-blue-400 font-medium">
                {formatPhoneNumber(visitor.phone)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com Informações do Cliente */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Total de Visitas</span>
              <span className="text-xl font-extrabold text-blue-600 mt-1 block">
                {visitor.total_visits} {visitor.total_visits === 1 ? 'visita' : 'visitas'}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Termos LGPD</span>
              <span className="text-sm font-bold text-emerald-600 mt-1 block">
                Aceito em {formatDate(visitor.terms_accepted_at)}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-sm text-slate-700 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-900">WhatsApp:</span>
              <span>{formatPhoneNumber(visitor.phone)}</span>
            </div>

            {visitor.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-900">E-mail:</span>
                <span>{visitor.email}</span>
              </div>
            )}

            {visitor.date_of_birth && (
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-900">Nascimento:</span>
                <span>{visitor.date_of_birth}</span>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-900">Primeiro Acesso:</span>
              <span>{formatDate(visitor.first_seen_at)}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-900">Última Visita:</span>
              <span>{formatDate(visitor.last_seen_at)}</span>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
