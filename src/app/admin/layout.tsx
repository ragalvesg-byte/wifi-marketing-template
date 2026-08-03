import React from 'react';
import { AdminNav } from '@/components/admin/admin-nav';
import { createServerClientInstance } from '@/lib/supabase/server';

export const metadata = {
  title: 'Painel Administrativo — Wi-Fi Marketing',
  description: 'Gestão exclusiva da loja e visitantes Wi-Fi',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClientInstance();
  const isDemo = !supabase;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <AdminNav isDemo={isDemo} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
