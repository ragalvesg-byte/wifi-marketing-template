import React from 'react';
import { redirect } from 'next/navigation';
import { ContactsTable } from '@/components/admin/contacts-table';
import { MOCK_VISITORS } from '@/lib/supabase/mock-data';
import { createServerClientInstance } from '@/lib/supabase/server';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Lista de Contatos — Painel Wi-Fi Marketing',
};

export default async function ContactsPage() {
  const supabase = await createServerClientInstance();

  if (supabase) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      redirect('/admin/login');
    }
  }
  let visitors = MOCK_VISITORS;

  if (supabase) {
    try {
      const { data } = await supabase
        .from('visitors')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (data && data.length) {
        visitors = data;
      }
    } catch {
      // Fallback para mock data se necessário
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          Lista de Contatos e Histórico
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Consulte o histórico de acessos, telefone de WhatsApp e detalhes de cada cliente cadastrado.
        </p>
      </div>

      <ContactsTable visitors={visitors} />
    </div>
  );
}
