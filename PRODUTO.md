# Documento de Apresentação Comercial do Produto: `Wi-Fi Marketing Pro` (`PRODUTO.md`)

Este documento apresenta a visão geral comercial, proposta de valor, arquitetura técnica e estratégia de crescimento da plataforma **Wi-Fi Marketing Pro** (`wifi-marketing-template`), estruturado para investidores, parceiros comerciais e clientes finais.

---

## 🎯 1. Qual Problema o Sistema Resolve

Milhares de estabelecimentos físicos oferecem Wi-Fi gratuito aos seus clientes todos os dias, mas **perdem 100% da oportunidade de capturar dados relevantes**, entender a frequência dos visitantes ou construir um canal direto de relacionamento.

### Os 3 Grandes Problemas do Varejo Físico:
1. **Rede Wi-Fi sem Retorno Financeiro:** A senha do Wi-Fi é repassada em papéis ou balcões sem gerar nenhum registro ou cadastro para a loja.
2. **Desconhecimento do Perfil e Frequência do Cliente:** O comerciante não sabe quem é o cliente que frequenta a loja 5 vezes no mês versus quem é um visitante de primeira viagem.
3. **Falta de Base de Contatos para Marketing:** Dificuldade para construir uma lista de contatos em conformidade com a LGPD para enviar ofertas, novidades e cupons de fidelização.

### A Solução:
O **Wi-Fi Marketing Pro** transforma a rede Wi-Fi do estabelecimento em um **portal cativo inteligente de captura de leads**, capaz de reconhecer visitantes frequentes, coletar dados com aceite da LGPD, promover ofertas da loja e fornecer relatórios em tempo real para o lojista.

---

## 🏪 2. Para Quais Tipos de Empresas Ele Serve

O sistema foi desenhado com **presets visuais e captura dinâmica de leads** para atender a diversos segmentos do varejo e serviços físicos:

- 🍔 **Hamburguerias, Lanchonetes & Fast Food**
- 🍕 **Pizzarias & Resto-bars**
- 🍣 **Sushi Bars & Culinária Oriental**
- ☕ **Cafeterias, Padarias & Bistrôs**
- 🍽️ **Restaurantes Tradicionais & A la Carte**
- 🏋️ **Academias, Box de Crossfit & Centros Esportivos**
- 🏥 **Clínicas Médicas, Odontológicas & Estética**
- 🏨 **Hotéis, Pousadas & Hostels**

---

## ⭐️ 3. Diferenciais em Relação aos Concorrentes

| Funcionalidade / Característica | Concorrentes Tradicionais | Wi-Fi Marketing Pro |
| :--- | :--- | :--- |
| **Arquitetura de Instalação** | Multi-tenant pesado e lento em nuvem compartilhada | **Single-Tenant Isolado** (Cada loja possui seu banco e repositório próprio) |
| **Custos de Licenciamento** | Mensalidades caras por ponto de acesso | **Baixo Custo Operacional** (Uso de Supabase e Vercel com tier gratuito generoso) |
| **Reconhecimento de Aparelhos** | Baseado apenas em MAC (falha em iOS/Android com MAC Privado) | **Identificação Dupla** (Cookie HTTP-Only seguro + Endereço MAC) |
| **Segurança openNDS** | Redirecionamento simples sem criptografia | **FAS Nível 3 com Assinatura HMAC-SHA256** (Chave secreta compartilhada) |
| **Personalização Dinâmica** | Temas genéricos rígidos | **8 Presets Visuais em 1-Clique** + Mídia em destaque + Links Sociais |
| **Captura Dinâmica de Leads** | Formulário fixo igual para todos os clientes | **Formulário Dinâmico** (Nome/Whats obrigatórios + campos opcionais configuráveis) |

---

## 📱 4. Fluxo Completo do Visitante

```
+-----------------------------------------------------------------------+
| 1. Visitante conecta ao Wi-Fi Aberto do Estabelecimento               |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| 2. Roteador OpenWrt + openNDS intercepta e abre o Portal Cativo       |
|    (Carrega logomarca, cor da marca, mídia e promoção do dia)        |
+-----------------------------------------------------------------------+
                                   |
                  +----------------+----------------+
                  |                                 |
                  v                                 v
        [ Novo Visitante ]                [ Cliente Recorrente ]
                  |                                 |
                  v                                 v
+-----------------------------------+  +-----------------------------------+
| 3a. Preenche Formulário Dinâmico |  | 3b. Reconhecido pelo Cookie + MAC |
|    (Nome, Whats + Campos Opcionais|  |     (Mensagem de Boas-Vindas)    |
|     e Aceite de Termos LGPD)      |  |     Botão "Conectar em 1-Clique"  |
+-----------------------------------+  +-----------------------------------+
                  \                                 /
                   \                               /
                    v                             v
+-----------------------------------------------------------------------+
| 4. O Servidor grava a sessão e envia o Token HMAC assinado            |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| 5. O navegador chama http://<gateway_ip>:2050/opennds_auth/?tok=...   |
|    O openNDS abre o firewall e libera o tráfego de internet           |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| 6. Tela pós-conexão exibe Cupom de Desconto com cópia em 1-clique    |
|    e opção de Avaliação no Google Meu Negócio                         |
+-----------------------------------------------------------------------+
```

---

## 💼 5. Fluxo do Lojista (Painel Administrativo `/admin`)

1. **Acesso Protegido:** O proprietário da loja realiza login seguro com e-mail e senha no painel administrativo `/admin/login`.
2. **Dashboard de Métricas em Tempo Real:** Visualização imediata do total de clientes cadastrados, acessos de hoje, novos clientes vs. recorrentes e gráficos de horários de pico.
3. **Gestão de Contatos & Exportação:** Busca instantânea por Nome ou WhatsApp, histórico detalhado de visitas do cliente e botão de exportação dos dados para CSV/Excel.
4. **Personalização e Ajuste de Ofertas:** Em `/admin/settings`, o lojista pode alterar a cor primária, logotipo, imagem/vídeo da landing page, cupom de desconto ativo, ativar/desativar campos do formulário e selecionar um dos 8 temas pré-configurados.

---

## 🏗️ 6. Arquitetura do Sistema

A arquitetura foi projetada em camadas desacopladas, utilizando o padrão de **Drivers Plugáveis (`RouterAdapter`)**:

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

## 🛠️ 7. Tecnologias Utilizadas

- **Front-end & Back-end:** Next.js 16 (App Router) + TypeScript + React 19.
- **Estilização:** Tailwind CSS v4 + Lucide React + Glassmorphism.
- **Banco de Dados & Autenticação:** Supabase PostgreSQL + Auth + Row Level Security (RLS).
- **Driver de Roteador:** openNDS v9 (FAS Level 3 com assinatura HMAC-SHA256 via Node.js `crypto`).
- **Gráficos & Visualização:** Recharts.
- **Testes Automatizados:** Vitest.

---

## 🚀 8. Processo de Instalação (Nova Loja)

1. **Clonagem do Template Base:** Clonar o repositório base `wifi-marketing-template` criando uma cópia isolada `wifi-marketing-nome-da-loja`.
2. **Provisionamento do Banco Supabase:** Criar um projeto Supabase para a loja e executar o script [`supabase/schema.sql`](file:///c:/Users/USER/Desktop/wifi-markting/supabase/schema.sql).
3. **Deploy em Nuvem:** Fazer o deploy do Next.js na Vercel/VPS e configurar o subdomínio HTTPS (ex: `https://wifi.sualoja.com.br`).
4. **Configuração do Roteador:** Instalar OpenWrt 23.05+ no roteador do cliente e aplicar o arquivo de configuração `/etc/config/opennds` detalhado em [`INSTALACAO_PRODUCAO_OPENNDS.md`](file:///c:/Users/USER/Desktop/wifi-markting/INSTALACAO_PRODUCAO_OPENNDS.md).

---

## 🔄 9. Processo de Atualização

Por utilizar instâncias isoladas no GitHub para cada loja:
- Atualizações de código base podem ser enviadas via `git pull upstream main` para os repositórios dos clientes.
- Alterações de banco de dados são aplicadas via scripts SQL de migração executados pelo painel do Supabase.

---

## 💾 10. Processo de Backup

- **Backups Automáticos:** O Supabase realiza backups diários automáticos com retenção Point-in-Time Recovery.
- **Backups Manuais:** O lojista pode exportar sua base de contatos em CSV a qualquer momento pelo painel `/admin/contacts`. O administrador do sistema pode gerar backups completos `.dump` usando a ferramenta `pg_dump`.

---

## ⚠️ 11. Limitações da Versão Atual (MVP Fase 1)

- **Instalação Single-Tenant:** O painel administrativo gerencia uma loja por banco de dados.
- **Equipamento Suportado:** Primeira integração homologada exclusivamente para roteadores com **OpenWrt + openNDS**.
- **Envio de Mensagens Automáticas:** Não realiza envios automáticos massivos de WhatsApp na Fase 1 (foco total na captura e liberação estável do Wi-Fi).

---

## 🛣️ 12. Roadmap de Evolução Futura

- **Fase 2:** Automação de WhatsApp (envio automático de mensagem de boas-vindas) e campanhas automáticas de aniversário.
- **Fase 3:** Programa de Fidelidade com acúmulo de pontos a cada conexão Wi-Fi.
- **Fase 4:** Novos drivers de roteadores (**MikroTik RouterOS**, **Ubiquiti UniFi**, **TP-Link Omada**).
- **Fase 5:** Painel Central Multi-lojas para redes de franquias e integração via Webhooks com CRMs externos.
