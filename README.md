# 📶 Wi-Fi Marketing Template — Instalação Individual por Loja

O **`wifi-marketing-template`** é uma solução completa, moderna e pronta para produção para transformar redes Wi-Fi de estabelecimentos comerciais (hamburguerias, restaurantes, cafeterias, academias, clínicas e hotéis) em um poderoso canal de captura de leads, relacionamento e fidelização de clientes.

Designed for single-tenant store deployments, each client receives a dedicated Supabase database, isolated repository, custom portal branding, and exclusive store owner admin panel.

---

## 🚀 Tecnologias Utilizadas

- **Core & Framework:** Next.js (App Router) + TypeScript.
- **Estilização & UI:** Tailwind CSS v4 + Lucide React + Glassmorphism.
- **Banco de Dados & Autenticação:** Supabase PostgreSQL + Supabase Auth + RLS (Row Level Security).
- **Roteadores & Captive Portal:** openNDS (Forwarding Authentication Service - FAS Nível 1, 2 e 3 com HMAC-SHA256).
- **Gráficos & Relatórios:** Recharts.
- **Testes Automatizados:** Vitest.

---

## 🎨 Principais Funcionalidades (Fase 1 MVP Comercial)

### 📱 Portal Cativo do Visitante (`/portal`)
- **Landing Page de Apresentação:** Mídia em destaque (imagem ou vídeo otimizado), promoção do dia e botões diretos para Instagram, Cardápio Digital e Avaliação no Google.
- **Captura Dinâmica de Leads:** Nome e WhatsApp padrão + E-mail, Nascimento, Cidade e Gênero opcionais e configuráveis por segmento.
- **Reconhecimento Automático em 1-Clique:** Identificação dupla via Cookie Seguro (`wifi_visitor_device_token`) + MAC Address.
- **Tela de Sucesso pós-Conexão:** Badge de liberação, Cupom de Desconto com cópia rápida e autorização openNDS.
- **Presets de Temas:** 8 temas prontos (Hamburgueria, Pizzaria, Sushi, Cafeteria, Restaurante, Academia, Clínica, Hotel).

### 📊 Painel Administrativo do Lojista (`/admin`)
- **Visão Geral & Indicadores:** Total de clientes, visitantes de hoje, novos cadastros, recorrentes e total de sessões.
- **Gráficos de Movimento:** Horários de pico e dias da semana com maior fluxo.
- **Gestão de Contatos:** Busca instantânea por nome/telefone, histórico individual e exportação em CSV/Excel UTF-8.
- **Personalização da Marca:** Configuração do tema, cores, mídias, cupons e regras de recadastro (7, 15, 30 ou 90 dias).

---

## 🏗️ Visão Geral da Arquitetura

```
+------------------+         HTTP Redirect         +----------------------------------+
|  Celular/Device  | ----------------------------> | Roteador OpenWrt + openNDS (FAS) |
+------------------+                               +----------------------------------+
        |                                                           |
        | Redirecionamento HTTPS com Params (tok, clientmac, ip)   |
        v                                                           |
+-------------------------------------------------------------------+--+
|                  Portal Cativo (`/portal`)                           |
|               (Next.js App Router no Vercel / VPS)                   |
+----------------------------------------------------------------------+
        |                                       |
        | 1. Registra dados do visitante        | 2. Redireciona/Autoriza com Token
        v                                       v    HMAC-SHA256 (via faskey)
+-----------------------+              +-------------------------------+
|  Supabase Database    |              | openNDS Auth Gateway Endpoint |
| (Visitors, Sessions,  |              | http://<gw_ip>:<gw_port>/     |
|  Devices, Settings)   |              | opennds_auth/?tok=<signed_tok>|
+-----------------------+              +-------------------------------+
        ^                                               |
        | Leitura/Gestão de Dados                       v
+-----------------------+                      [ Acesso à Internet ]
| Painel Admin (`/admin`)|                      [ Liberado pelo Roteador]
|  (Dono da Loja)       |
+-----------------------+
```

---

## 📁 Documentação de Instalação e Guias

- 📄 [INSTALL.md](file:///c:/Users/USER/Desktop/wifi-markting/INSTALL.md) — Guia de instalação do zero para um novo cliente
- 📄 [CONFIGURACAO.md](file:///c:/Users/USER/Desktop/wifi-markting/CONFIGURACAO.md) — Manual de configurações da loja e temas
- 📄 [TESTE_LOCAL_OPENNDS.md](file:///c:/Users/USER/Desktop/wifi-markting/TESTE_LOCAL_OPENNDS.md) — Guia de testes locais em bancada
- 📄 [INSTALACAO_PRODUCAO_OPENNDS.md](file:///c:/Users/USER/Desktop/wifi-markting/INSTALACAO_PRODUCAO_OPENNDS.md) — Guia de implantação em produção (FAS Nível 3)
- 📄 [BACKUP.md](file:///c:/Users/USER/Desktop/wifi-markting/BACKUP.md) — Guia de backup e restore no Supabase
- 📄 [SEGURANCA.md](file:///c:/Users/USER/Desktop/wifi-markting/SEGURANCA.md) — Arquitetura de segurança e conformidade LGPD
- 📄 [ROADMAP.md](file:///c:/Users/USER/Desktop/wifi-markting/ROADMAP.md) — Planejamento estratégico e evolução em 5 Fases
- 📄 [PENDENCIAS.md](file:///c:/Users/USER/Desktop/wifi-markting/PENDENCIAS.md) — Checklist de infraestrutura para novas instalações

---

## ⚡ Inicialização Rápida em Desenvolvimento

```bash
# 1. Clonar e instalar dependências
git clone https://github.com/seu-usuario/wifi-marketing-template.git
cd wifi-marketing-template
npm install

# 2. Executar testes automatizados
npm test

# 3. Executar o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para acessar o launcher de testes.
