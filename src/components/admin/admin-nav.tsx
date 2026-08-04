'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut, Wifi, AlertTriangle, Megaphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AdminNavProps {
  storeName?: string;
  isDemo?: boolean;
}

export function AdminNav({ storeName = 'Café & Bistro Central', isDemo = true }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/admin/login');
  };

  const navItems = [
    { label: 'Visão Geral', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Lista de Contatos', href: '/admin/contacts', icon: Users },
    { label: 'Campanhas', href: '/admin/campaigns', icon: Megaphone },
    { label: 'Configurações', href: '/admin/settings', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      {/* Banner de Alerta do Modo Demonstração */}
      {isDemo && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 px-4 py-1.5 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>
            <strong>MODO DEMONSTRAÇÃO ATIVO:</strong> O Supabase real não está configurado. Os dados exibidos são simulados e alterações não serão salvas permanentemente.
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Marca */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight block leading-tight text-slate-100">
                  {storeName}
                </span>
                {isDemo && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 uppercase tracking-wider">
                    Modo Demonstração
                  </span>
                )}
              </div>
              <span className="text-[11px] text-blue-400 font-semibold tracking-wider uppercase block">
                Painel Wi-Fi Marketing
              </span>
            </div>
          </div>

          {/* Links de Navegação */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Botão Sair */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Navegação Mobile */}
      <div className="md:hidden border-t border-slate-800 px-4 py-2 flex items-center justify-around bg-slate-900/95">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 ${
                isActive ? 'text-blue-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
