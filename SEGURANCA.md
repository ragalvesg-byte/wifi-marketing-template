# Guia de Segurança e Proteção de Dados (`SEGURANCA.md`)

Este documento apresenta a arquitetura de segurança, privacidade e conformidade com a **Lei Geral de Proteção de Dados (LGPD)** implementada no **`wifi-marketing-template`**.

---

## 🔒 1. Isolamento de Chaves Privadas & Variáveis de Ambiente

- **`SUPABASE_SERVICE_ROLE_KEY`:**
  - Chave administrativa de acesso total ao Supabase.
  - **Nunca possui o prefixo `NEXT_PUBLIC_`** e é usada **exclusivamente nas API Routes do servidor Node.js/Next.js**.
  - O código do navegador (client-side) possui acesso apenas à `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 🛡️ 2. Políticas RLS (Row Level Security) no PostgreSQL

Todas as tabelas do banco de dados possuem RLS ativado:
- **`store_settings`:** `SELECT` público permitido para carregar a marca da loja no portal. `INSERT/UPDATE/DELETE` restritos a usuários autenticados (`authenticated` - Lojista).
- **`visitors`:** **Acesso público anônimo negado.** Visitantes anônimos não possuem permissão para listar ou consultar cadastros de outros clientes.
- **`devices` & `wifi_sessions`:** Acesso direto via client-side negado. Todo cadastro ocorre estritamente no servidor via Server API Route (`/api/portal/register`).

---

## 🍪 3. Identificação Dupla e Cookies Seguros (Cookie + MAC)

- **Cookie HTTP-Only `wifi_visitor_device_token`:**
  - Token gerado no servidor com validade de 1 ano.
  - Atributos: `HttpOnly`, `SameSite=Lax`, `Secure` (em HTTPS).
  - Impede que scripts maliciosos de terceiros (XSS) leiam o token do visitante no navegador.
- **Resistência a MAC Aleatório (iOS/Android):**
  - O sistema consulta primeiro o Cookie Seguro do Navegador e utiliza o MAC apenas como identificador secundário, contornando a troca de MAC privado do iOS 14+ e Android 10+.

---

## 🔑 4. Criptografia HMAC-SHA256 para openNDS FAS Nível 3

- **Chave Compartilhada (`OPENNDS_FAS_KEY`):**
  - Chave secreta de 32+ caracteres conhecida apenas pelo roteador OpenWrt (`faskey`) e pelo backend Next.js (`OPENNDS_FAS_KEY`).
- **Assinatura HMAC SHA-256:**
  - Na integração FAS Nível 3, o backend calcula `generateFasLevel3Token(tok, OPENNDS_FAS_KEY)` antes de redirecionar o cliente para a porta de autorização do roteador (`2050`).
  - O openNDS no roteador verifica a assinatura antes de abrir o firewall, impedindo que terceiros liberem o acesso à internet sem passar pela validação do portal.
