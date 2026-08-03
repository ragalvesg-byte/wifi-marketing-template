# Roadmap de Evolução do Produto: `wifi-marketing-template`

Este documento define o planejamento estratégico e a evolução do sistema em fases. A **Fase 1 (MVP Comercial)** foi fortalecida para entregar uma solução completa e pronta para venda e instalação em estabelecimentos comerciais de diversos segmentos.

---

## 📌 Fase 1: MVP Comercial Completo (Pronto para Venda & Instalação)

> **Foco:** Captura inteligente de leads, experiência visual marcante da marca da loja, liberação segura de Wi-Fi e gestão estratégica para o lojista.

### 🎨 1. Landing Page do Portal & Experiência do Visitante
- **Mídia em Destaque:** Suporte a exibição de imagem promocional ou vídeo curto de apresentação da loja antes do formulário.
- **Destaques da Loja:** Exibição da promoção do dia, prato/produto em destaque ou cupom de desconto.
- **Botões de Ação Rápida:** Links diretos para Instagram, Facebook, Cardápio Digital e Avaliação no Google Meu Negócio.
- **Timing da Avaliação do Google:** Opção de exibir o botão de avaliação **antes** (na landing) ou **depois** da liberação da internet (na tela de sucesso).
- **Sistema de Captura Dinâmica de Leads (Formulário Personalizável por Segmento):**
  - Campos padrão obrigatórios: **Nome** e **WhatsApp**.
  - Campos opcionais ativáveis pelo lojista: **E-mail**, **Data de Nascimento**, **Cidade**, **Gênero**.

### 🎨 2. Temas Prontos por Segmento Comercial
Predefinições visuais (*presets* de cores, fundos e textos) personalizáveis para 8 segmentos:
1. 🍔 **Hamburgueria** (Dark mode, tons ambar/vermelho, rústico urbano)
2. 🍕 **Pizzaria** (Cores quentes, tradicional italiano)
3. 🍣 **Sushi / Culinária Japonesa** (Design clean, minimalista escuro)
4. ☕ **Cafeteria & Bistrô** (Tons amadeirados, acolhedor)
5. 🍽️ **Restaurante** (Elegante, sofisticado)
6. 🏋️ **Academia & Fitness** (Vibrante, alto contraste, energia)
7. 🏥 **Clínica & Saúde** (Azul/Verde suave, higiênico, sensação de cuidado)
8. 🏨 **Hotel & Pousada** (Premium, recepção acolhedora)

### 🔌 3. Arquitetura Pluggable de Roteadores (`RouterAdapter`)
- Interface abstraída de driver de roteador (`RouterAdapter`), permitindo que a integração atual (**openNDS/OpenWrt**) e futuras integrações (**MikroTik**, **UniFi**, **Omada**) sigam a mesma API interna sem alterar o código principal da aplicação.

### 📊 4. Painel Administrativo do Lojista (`/admin`)
- **Indicadores em Tempo Real:**
  - Total de Clientes Cadastrados.
  - Visitantes Conectados no Momento (via status do gateway).
  - Visitantes Novos vs. Recorrentes.
  - Total de Sessões Liberadas.
- **Relatórios de Movimento:**
  - Gráficos de Horários de Maior Movimento.
  - Gráficos de Dias da Semana de Maior Movimento.
  - Dispositivos / Origem dos Acessos (User Agent / Sistema Operacional).
- **Exportação de Dados:** Exportação completa de contatos em formato CSV e Excel (UTF-8).
- **Configurações Expandidas da Loja:**
  - Nome, logotipo, cores da marca e imagem/vídeo da landing page.
  - Mensagem de boas-vindas e mensagem pós-conexão.
  - Cupom de desconto e regra de recadastro (7, 15, 30 ou 90 dias).
  - Links sociais (Instagram, Facebook, Cardápio, Google Review).
  - Seleção dos campos de cadastro ativados.

---

## 🚀 Fase 2: Automação & Engajamento Pós-Conexão (Futuro)

- [ ] **Integração Nativa com WhatsApp API:** Disparo automático de mensagem de boas-vindas ou cupom pós-acesso via API WhatsApp.
- [ ] **Campanhas de Aniversário:** Notificações e cupons automáticos para aniversariantes.
- [ ] **Régua de E-mail Marketing / Automação:** Disparo automático de ofertas por e-mail.

---

## 🎁 Fase 3: Fidelidade & Retenção (Futuro)

- [ ] **Programa de Pontos no Wi-Fi:** Retenção com pontuação a cada visita conectada.
- [ ] **Alerta de Clientes Ausentes (Win-Back):** Notificação para clientes que não retornam há mais de 30 dias.
- [ ] **Vouchers Digitais com Validação no Caixa:** QR Codes únicos de desconto.

---

## 📶 Fase 4: Drivers Adicionais de Roteadores (Futuro)

- [ ] Driver para **MikroTik RouterOS** (Hotspot Servlet).
- [ ] Driver para **Ubiquiti UniFi Controller** (External Portal API).
- [ ] Driver para **TP-Link Omada SDN**.

---

## 🏢 Fase 5: Gestão Multi-loja & Redes (Futuro)

- [ ] Painel Central de Franquias (Multi-tenant opcional).
- [ ] Relatórios de Cohort e integração via Webhooks com CRMs externos.
