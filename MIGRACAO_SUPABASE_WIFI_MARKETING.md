# MIGRACAO_SUPABASE_WIFI_MARKETING.md - Plano de Migração do Wi-Fi Marketing para Projeto Supabase Exclusivo (Revisado)

Este documento apresenta o planejamento consolidado e corrigido para migrar o sistema Wi-Fi Marketing do banco compartilhado (`ai-employees-dev`) para um projeto Supabase dedicado (ex: `wifi-marketing-prod`), garantindo isolamento total de dados, segurança rígida e conformidade com as regras de RLS e Administração.

---

## 1. Tabela de Comparação de DDL (Físico vs. Proposto)

A tabela a seguir compara a estrutura extraída diretamente do banco de dados remoto atual com o script DDL proposto para a nova instância.

| Tabela / Item | Banco remoto atual | Script proposto | Diferença encontrada |
| :--- | :--- | :--- | :--- |
| **extensão pgcrypto** | Ativada | Ativada | Nenhuma |
| **store_settings** | 56 colunas. Colunas de mídias/urls com tipo `TEXT`. | 56 colunas idênticas, tipos exatos `TEXT` e `character varying`, colunas de cupons mantidas por retrocompatibilidade. | Nenhuma |
| **visitors** | `phone` VARCHAR UNIQUE, `total_visits` INT DEFAULT 1. | Idêntico | Nenhuma |
| **devices** | FK `devices_visitor_id_fkey` para `visitors(id) ON DELETE CASCADE`. Sem índice em `visitor_id`. | Idêntico, com o índice de performance sugerido adicionado. | Adicionado `idx_devices_visitor_id` para cobrir a Foreign Key. |
| **campaigns** | `aspect_ratio` VARCHAR DEFAULT '4:5', `media_type` VARCHAR DEFAULT 'IMAGE'. | Idêntico | Nenhuma |
| **visitor_events** | Coluna `campaign_id UUID` sem constraint física de Foreign Key para `campaigns`. | Removida a restrição de FK em `campaign_id`. | Correção: O script anterior adicionava uma FK inexistente que quebraria cargas de dados órfãos. |
| **Políticas RLS** | Políticas gerais `FOR ALL TO authenticated USING (true)`. | Restringido para admins via claims JWT `role = 'admin'` (com `WITH CHECK` e `USING`) por operação. | Segurança: Políticas de administrador foram fechadas de `USING (true)` para validação de JWT admin específica por operação. |
| **Acesso Público Anon** | Permissivo em múltiplas tabelas. | Removidas todas as políticas públicas de SELECT nas tabelas de dados. Sem uso de View Pública. | Segurança: Todo o acesso público anônimo direto via cliente HTTP do Supabase está bloqueado. |

---

## 2. Estratégia de RLS (Segurança)

### 2.1 Bloqueio de Acesso Direto Anônimo
A role `anon` do Supabase **não possui nenhuma política** de leitura, escrita, atualização ou exclusão nas 10 tabelas operacionais.
* Todos os privilégios diretos da role `anon` foram revogados via `REVOKE ALL PRIVILEGES` no script `02_rls_policies.sql`.
* Qualquer tentativa do navegador de acessar o Supabase diretamente usando a anon key resultará em erro de permissão bloqueada.

### 2.2 Migração de Configurações Públicas (`/api/portal/settings`)
* **Remoção da View**: Não criamos nenhuma view pública (`public_store_settings`).
* **Consulta no Backend**: A rota `/api/portal/settings` deve ser alterada no código backend para consultar a tabela `store_settings` exclusivamente no servidor utilizando `createAdminClient()` (service_role), contornando as barreiras do RLS do lado do servidor de forma segura.
* **Filtro de Resposta (Whitelist)**: A rota retornará apenas os campos de configuração visuais necessários para renderizar o portal, omitindo campos legados e credenciais administrativas.
* **Campos Públicos Permitidos na Resposta JSON**:
  * `store_name`, `logo_url`, `background_url`, `primary_color`, `welcome_message`, `post_connect_message`, `landing_media_type`, `landing_media_url`, `featured_promo_title`, `featured_promo_description`, `instagram_url`, `facebook_url`, `menu_url`, `google_review_url`, `google_review_timing`, `preset_theme`
  * Campos de exibição do formulário: `field_email_enabled`, `field_dob_enabled`, `field_city_enabled`, `field_gender_enabled`, `field_email_required`, `field_dob_required`, `field_city_required`, `field_gender_required`, `relogin_days_interval`
  * Termos e LGPD: `terms_of_service`, `privacy_policy`
  * Fluxo de pré e pós-cadastro: `pre_signup_enabled`, `pre_signup_show_banner`, `pre_signup_show_promo`, `pre_signup_show_instagram`, `pre_signup_show_menu`, `pre_signup_show_google_review`, `post_signup_action`, `post_signup_title`, `post_signup_message`, `post_signup_url`, `post_signup_redirect_mode`, `post_signup_redirect_seconds`, `post_signup_show_instagram`, `post_signup_show_menu`, `post_signup_show_google_review`, `post_signup_promo_image_url`, `post_signup_promo_title`, `post_signup_promo_description`, `post_signup_promo_button_text`, `post_signup_promo_button_url`, `post_signup_promo_image_aspect_ratio`, `post_signup_banner_enabled`, `post_signup_banner_closable`.

### 2.3 Auditoria da Rota de Verificação de MAC (`/api/portal/check-mac`)
* **Problema Identificado**: A rota `/api/portal/check-mac/route.ts` atual utiliza o cliente anônimo `createServerClientInstance()` para fazer select nas tabelas `visitors` e `devices`. Com o RLS restrito, esta API retornará nulo.
* **Correção Necessária**: O plano de migração exige alterar a inicialização do Supabase na API `/api/portal/check-mac/route.ts` para utilizar `createAdminClient()` (que opera exclusivamente no servidor com privilégios administrativos).
* **Filtro de Resposta Rígido**: A resposta JSON enviada para o navegador deve conter apenas o nome do visitante para a saudação inicial e o status de recadastro:
  ```json
  {
    "found": true,
    "visitor": {
      "name": "João Silva"
    },
    "needsRelogin": false
  }
  ```
  *É proibido retornar e-mail, data de nascimento, telefone completo, ID de dispositivos ou MACs de terceiros na resposta.*

### 2.4 Auditoria das Demais Rotas Públicas
* Confirmamos que `/api/portal/campaigns`, `/api/portal/events` e `/api/portal/register` utilizam `createAdminClient()` com a `SUPABASE_SERVICE_ROLE_KEY` no servidor, executando as transações com segurança e sem expor consultas diretas das tabelas ao navegador.

---

## 3. Estratégia de Autenticação do Administrador no Novo Supabase

A tabela interna `auth.users` não deve ser modificada diretamente por manipulações SQL a fim de evitar corromper o estado do serviço GoTrue do Supabase.

### 3.1 Vínculo do Perfil de Administrador via Supabase Admin API
A configuração do atributo `role: "admin"` deve ser executada através da API Administrativa do SDK do Supabase, rodando unicamente em ambiente seguro de backend usando a `service_role`:

1. Crie o lojista admin na nova instância através do menu **Authentication > Users** do painel do Supabase.
2. Execute um script Node.js no backend para atribuir os metadados do aplicativo ao usuário:
   ```javascript
   import { createClient } from '@supabase/supabase-js';

   const supabaseAdmin = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY // Chave privada de administração
   );

   const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
     'UUID-DO-ADMIN-CRIADO',
     { app_metadata: { role: 'admin' } }
   );
   ```

> [!IMPORTANT]
> **Necessidade de Renovação do Token (JWT)**: Após a definição de `role = 'admin'` via Admin API, o usuário admin **deve obrigatoriamente fazer logout e login novamente** na interface administrativa para renovar a sessão. O payload JWT gerado no login é assinado e estático; a claim de permissão de administrador só passará a constar no JWT após a geração de um novo token no processo de sign-in.

---

## 4. Plano de Validação do Banco e RLS (Testes de Segurança)

Para confirmar a eficácia das restrições e o funcionamento correto das chaves, o seguinte roteiro de testes de segurança deve ser executado no novo ambiente:

1. **Testar Bloqueio Direto (Anon)**:
   * Chame `supabase.from('visitors').select('*')` usando o cliente `anon` no console ou script de testes.
   * *Resultado*: Erro `42501 (Permission Denied)`. Repita para todas as 10 tabelas operacionais.
2. **Testar Usuário Autenticado sem Claim Admin**:
   * Crie uma conta de teste normal no Auth, faça login e tente atualizar a tabela `store_settings` ou ler `visitors`.
   * *Resultado*: Erro `42501` ou retorno vazio, confirmando que a checagem da claim `role = 'admin'` barra usuários sem permissão.
3. **Testar Administrador com Claim no JWT**:
   * Faça login com a conta de admin (que possui a claim `role = 'admin'`).
   * *Resultado*: Acesso total liberado para carregar e atualizar dados do painel administrativamente.
4. **Testar Rota `/api/portal/settings`**:
   * Chamar o endpoint público sem login.
   * *Resultado*: Status 200 contendo apenas o JSON com os campos públicos Whitelistados. Confirmar que a chave `promo_coupon_code` e dados de cupons não constam na resposta.
5. **Testar Rota `/api/portal/check-mac`**:
   * Chamar o endpoint público informando o MAC.
   * *Resultado*: Status 200 contendo apenas `{ found: true, visitor: { name }, needsRelogin }`. Confirmar que dados sensíveis como e-mail ou telefone completo estão ocultos.
6. **Testar Registro, Eventos e Campanhas**:
   * Simular fluxo completo de cadastro do visitante e clique de campanha.
   * *Resultado*: Inserções normais e liberação do acesso, confirmando que a `service_role` ignora as restrições RLS no servidor.
7. **Varredura de Vazamento de Chaves**:
   * Inspecionar respostas HTTP das APIs e logs no console.
   * *Resultado*: Garantir que a `SUPABASE_SERVICE_ROLE_KEY` nunca seja enviada ou exibida.
