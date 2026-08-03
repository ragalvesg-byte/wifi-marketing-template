# Checklist de Pendências para Implantação em Loja Real

Este documento detalha **todas as etapas pendentes de infraestrutura, hospedagem e hardware** necessárias para instalar o **`wifi-marketing-template`** em um estabelecimento comercial real.

---

## ☁️ 1. Infraestrutura Cloud & Supabase (Instância da Loja)

- [ ] **Criar Projeto no Supabase:**
  - Registrar um novo projeto no Supabase exclusivo para a loja.
- [ ] **Executar Migração de Banco de Dados:**
  - Rodar o script [supabase/schema.sql](file:///c:/Users/USER/Desktop/wifi-markting/supabase/schema.sql) no Editor SQL do Supabase para criar as tabelas (`store_settings`, `visitors`, `devices`, `wifi_sessions`) e aplicar as regras de segurança RLS.
- [ ] **Criar Conta de Acesso do Lojista:**
  - Cadastrar o e-mail e senha do proprietário da loja no Supabase Auth.
- [ ] **Configurar Variáveis de Ambiente (`.env.local` / Vercel):**
  - Preencher `NEXT_PUBLIC_SUPABASE_URL`
  - Preencher `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Preencher `SUPABASE_SERVICE_ROLE_KEY`
  - Preencher `OPENNDS_FAS_KEY` (Chave secreta de 32+ caracteres compartilhada com o roteador para FAS Nível 3).

---

## 🌐 2. Hospedagem Web (Next.js com HTTPS)

- [ ] **Deploy da Aplicação:**
  - Publicar a aplicação Next.js na Vercel, Netlify ou VPS própria.
- [ ] **Configurar Domínio Próprio e Certificado SSL (HTTPS):**
  - Apontar o domínio ou subdomínio da loja (ex: `https://wifi.sualoja.com.br`). O openNDS FAS Nível 3 exige tráfego seguro via HTTPS.

---

## 📶 3. Hardware Físico e Roteador OpenWrt

- [ ] **Aquisição de Hardware Homologado:**
  - Verificar a revisão de placa exata no [Table of Hardware do OpenWrt](https://openwrt.org/toh/start) (ex: GL.iNet GL-MT300N-V2 / GL-AXT1000 ou TP-Link Archer homologado).
- [ ] **Instalação do Firmware OpenWrt:**
  - Instalar versão mantida e suportada (**OpenWrt 23.05 ou superior**).
- [ ] **Configuração da Rede de Convidados (`br-guest`):**
  - Criar sub-rede isolada para clientes do Wi-Fi separada da rede administrativa da loja.
- [ ] **Instalação e Configuração do openNDS (`/etc/config/opennds`):**
  - Instalar pacote `opennds` via `opkg`.
  - Configurar `fasremotefqdn` (ex: `wifi.sualoja.com.br`), `fasport 443`, `fas_secure_enabled 3`, `faskey` e domínios liberados no `walledgarden_fqdn`.
  - Aplicar instruções descritas em [INSTALACAO_PRODUCAO_OPENNDS.md](file:///c:/Users/USER/Desktop/wifi-markting/INSTALACAO_PRODUCAO_OPENNDS.md).

---

## 🧪 4. Validação e Testes em Campo (Presencial)

- [ ] **Teste de Redirecionamento Automático:**
  - Conectar smartphones (iOS e Android) e confirmar que o pop-up do portal cativo abre automaticamente.
- [ ] **Teste de Cadastro e Consentimento LGPD:**
  - Cadastrar um novo visitante e verificar a inserção em tempo real na tabela `visitors` do Supabase.
- [ ] **Teste de Liberação do Firewall:**
  - Confirmar a mudança do estado do dispositivo para "Authenticated" executando `ndsctl status` no roteador.
- [ ] **Teste de Cliente Recorrente:**
  - Reconectar o aparelho e confirmar a liberação em 1-clique via Cookie + MAC.
- [ ] **Validação do Painel do Lojista:**
  - Logar no `/admin`, verificar incremento das métricas de hoje e testar o download do arquivo CSV.
