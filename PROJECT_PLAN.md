# Documento de Arquitetura e Plano de Execução: `wifi-marketing-template` (Fase 1 MVP Comercial)

Este documento descreve a arquitetura técnica, modelo de dados expandido e o plano de execução para fortalecer a **Fase 1** do sistema, tornando-o um MVP comercial completo e pronto para ser vendido a estabelecimentos de diversos segmentos.

---

## 1. Arquitetura Modular & Abstração de Roteadores (`IRouterDriver`)

Para garantir que a adição futura de outros roteadores (**MikroTik**, **UniFi**, **Omada**) não altere o código principal da aplicação ou do painel, criamos um padrão de drivers plugáveis (`RouterAdapter`).

```
                              +---------------------------------------+
                              |         Next.js App Router            |
                              |   (/portal, /admin, /api/portal/*)    |
                              +---------------------------------------+
                                                  |
                                                  v
                              +---------------------------------------+
                              |       Router Driver Factory           |
                              |     getRouterDriver('opennds')        |
                              +---------------------------------------+
                                                  |
                        +-------------------------+-------------------------+
                        |                                                   |
                        v                                                   v
           +--------------------------+                         +--------------------------+
           |  OpenNdsDriver (OpenWrt) |                         |  Future Drivers          |
           |  - FAS Level 1, 2, 3      |                         |  (MikroTik, UniFi, etc)  |
           |  - HMAC-SHA256 Token      |                         |  (Fase 4 no Roadmap)     |
           +--------------------------+                         +--------------------------+
```

### Interface do Driver (`src/lib/routers/types.ts`):
```typescript
export interface IRouterDriver {
  name: string;
  parseParams(searchParams: Record<string, string | string[] | undefined>): OpenNdsParams;
  buildAuthUrl(params: { gatewayaddress?: string; gatewayport?: string; tok?: string; redir?: string }): string;
}
```

---

## 2. Modelagem de Banco de Dados Expandida (Supabase PostgreSQL)

### Alterações na Tabela `store_settings`:
- `landing_media_type`: `'IMAGE' | 'VIDEO'` (padrão `'IMAGE'`)
- `landing_media_url`: `TEXT` (URL da imagem ou vídeo de destaque)
- `featured_promo_title`: `TEXT` (Título da promoção do dia)
- `featured_promo_description`: `TEXT` (Descrição da promoção do dia)
- `instagram_url`: `TEXT` (Link do perfil do Instagram)
- `facebook_url`: `TEXT` (Link da página do Facebook)
- `menu_url`: `TEXT` (Link do Cardápio Digital)
- `google_review_url`: `TEXT` (Link direto para avaliação de 5 estrelas no Google)
- `google_review_timing`: `'PRE_CONNECT' | 'POST_CONNECT' | 'BOTH'`
- `preset_theme`: `'CUSTOM' | 'BURGER' | 'PIZZA' | 'SUSHI' | 'CAFE' | 'RESTAURANT' | 'GYM' | 'CLINIC' | 'HOTEL'`
- **Campos Dinâmicos de Captura de Leads:**
  - `field_email_enabled`: `BOOLEAN` (Padrão: `false`)
  - `field_dob_enabled`: `BOOLEAN` (Padrão: `false`)
  - `field_city_enabled`: `BOOLEAN` (Padrão: `false`)
  - `field_gender_enabled`: `BOOLEAN` (Padrão: `false`)
  - `field_email_required`: `BOOLEAN` (Padrão: `false`)
  - `field_dob_required`: `BOOLEAN` (Padrão: `false`)
  - `field_city_required`: `BOOLEAN` (Padrão: `false`)
  - `field_gender_required`: `BOOLEAN` (Padrão: `false`)

### Alterações na Tabela `visitors`:
- `city`: `VARCHAR(100)`
- `gender`: `VARCHAR(20)`

---

## 3. Sistema de Temas Pré-configurados por Segmento (`src/lib/themes/presets.ts`)

O sistema oferecerá 8 *presets* visuais prontos:
1. **Hamburgueria:** Cores quentes (âmbar/vermelho), fundo escuro rústico urbano.
2. **Pizzaria:** Vermelho e verde clássicos italianos, ambiente familiar.
3. **Sushi / Culinária Japonesa:** Minimalista, tons preto e salmão.
4. **Cafeteria & Bistrô:** Tons de café e amadeirados aconchegantes.
5. **Restaurante:** Design refinado, dourado e azul marinho.
6. **Academia & Fitness:** Preto, amarelo/neon de alta energia.
7. **Clínica & Saúde:** Azul/Verde suave, estética higiênica e confiável.
8. **Hotel & Pousada:** Estética premium, recepção e boas-vindas.

---

## 4. Fluxo Visual da Landing Page & Captura de Leads (`/portal`)

1. **Etapa 1 — Landing Page da Loja:**
   - Exibe a mídia em destaque (imagem/vídeo).
   - Promoção do dia / prato em destaque.
   - Botões diretos para Instagram, Cardápio Digital e Avaliação no Google.
   - Botão **"Conectar ao Wi-Fi Grátis"**.
2. **Etapa 2 — Captura Personalizada de Leads:**
   - Formulário renderizado dinamicamente de acordo com as preferências ativadas pelo lojista (Nome + WhatsApp obrigatórios; E-mail, Nascimento, Cidade e Gênero opcionais ou obrigatórios).
3. **Etapa 3 — Tela de Sucesso & Redirecionamento openNDS:**
   - Badge de confirmação, Cupom de Desconto com cópia em 1-clique, Botão de Avaliação no Google e redirecionamento de liberação da internet no roteador.

---

## 5. Plano de Implementação

1. **Atualização do Banco de Dados SQL:**
   - Atualizar `supabase/schema.sql` e migrações com os novos campos e temas.
2. **Implementação da Arquitetura do Driver de Roteador:**
   - Criar `src/lib/routers/types.ts` e `src/lib/routers/opennds.ts`.
3. **Módulo de Temas Presets:**
   - Criar `src/lib/themes/presets.ts`.
4. **Atualização do Portal Cativo (`/portal`):**
   - Atualizar a interface do portal para renderizar a Landing Page, os temas escolhidos e o formulário dinâmico de leads.
5. **Atualização do Painel de Configurações (`/admin/settings`):**
   - Adicionar seletores de temas, campos de mídia, links sociais, links de avaliação Google e seletores de campos de formulário.
6. **Atualização do Dashboard (`/admin/dashboard`):**
   - Exibir contadores de conexões ativas no momento, gráfico de origem dos acessos e botão de exportação CSV.
7. **Testes Automatizados:**
   - Atualizar suíte de testes unitários para cobrir temas, captura dinâmica e drivers de roteadores.
