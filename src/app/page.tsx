import Link from 'next/link';
import { Wifi, LayoutDashboard, ShieldCheck, ArrowRight, BookOpen, Terminal } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Elementos visuais de fundo */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl w-full text-center space-y-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Wifi className="w-4 h-4 text-blue-400 animate-pulse" />
          Modelo Base Reutilizável (wifi-marketing-template)
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Sistema de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Wi-Fi Marketing</span> Individual por Loja
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Portal Cativo para OpenWrt (openNDS) com captura de contatos, aceite de termos LGPD, liberação de acesso e painel administrativo exclusivo do lojista.
        </p>

        {/* Links Principais de Demonstração */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Link
            href="/portal?tok=tok_demo123&clientmac=aa:bb:cc:dd:ee:01&gatewayname=Loja_Demo&gatewayaddress=192.168.1.1&gatewayport=2050"
            className="group bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white p-6 rounded-3xl shadow-xl transition-all border border-blue-400/20 flex flex-col justify-between text-left"
          >
            <div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-1">Testar Portal Cativo</h2>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Simular a experiência do visitante conectando à rede Wi-Fi e autorizando o acesso openNDS.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 font-bold text-sm text-blue-100 group-hover:translate-x-1 transition-transform">
              Abrir Portal do Visitante <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/admin/dashboard"
            className="group bg-slate-900 hover:bg-slate-800 text-white p-6 rounded-3xl shadow-xl transition-all border border-slate-800 flex flex-col justify-between text-left"
          >
            <div>
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold mb-1">Painel do Lojista</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acessar o painel exclusivo para visualizar métricas, lista de contatos, horários de pico e exportar CSV.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 font-bold text-sm text-blue-400 group-hover:translate-x-1 transition-transform">
              Entrar no Dashboard <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Recursos de Infraestrutura e Arquivos */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-left text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Configuração openNDS pronta em <code className="text-slate-200">opennds-config-example.conf</code></span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Esquema SQL Supabase em <code className="text-slate-200">supabase/schema.sql</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}
