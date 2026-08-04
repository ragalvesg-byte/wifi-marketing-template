import React from 'react';
import { redirect } from 'next/navigation';
import { createServerClientInstance } from '@/lib/supabase/server';
import { CampaignsManager } from '@/components/admin/campaigns-manager';

export const metadata = {
  title: 'Gerenciador de Campanhas — Painel Wi-Fi Marketing',
};

export default async function CampaignsPage() {
  const supabase = await createServerClientInstance();

  if (supabase) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      redirect('/admin/login');
    }
  }

  return <CampaignsManager />;
}
