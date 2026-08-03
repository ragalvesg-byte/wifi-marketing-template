# Guia Completo de Configurações do Sistema (`CONFIGURACAO.md`)

Este documento detalha todas as opções de personalização e parâmetros de configuração disponíveis para o lojista e administrador no **`wifi-marketing-template`**.

---

## 🎨 1. Personalização Visual & Marca da Loja

- **Nome do Estabelecimento:** Exibido no topo do portal cativo, e-mails e relatórios.
- **Logotipo:** URL da imagem do logo da loja (exibido em destaque circular/quadrado com cantos arredondados).
- **Cor Primária:** Define a cor temática dos botões de ação (`Liberar Wi-Fi Agora`, `Conectar`), ícones e destaques visuais.
- **Imagem de Fundo (Background):** Imagem de alta resolução exibida ao fundo da tela do portal cativo.

---

## 🎨 2. Temas Pré-configurados por Segmento (`preset_theme`)

O sistema inclui 8 presets visuais acionáveis em 1-clique pelo painel `/admin/settings`:
1. `BURGER`: Hamburgueria (Vermelho vibrante, rústico urbano).
2. `PIZZA`: Pizzaria (Laranja e vermelho italiano).
3. `SUSHI`: Sushi Bar (Minimalista escuro e tom salmão).
4. `CAFE`: Cafeteria & Bistrô (Tons amadeirados de café).
5. `RESTAURANT`: Restaurante Fino (Esmeralda e azul marinho elegante).
6. `GYM`: Academia & Fitness (Amarelo neon e alto contraste).
7. `CLINIC`: Clínica & Saúde (Azul suave saúde).
8. `HOTEL`: Hotel & Pousada (Índigo hotelaria).

---

## 📝 3. Captura Dinâmica de Leads (Formulário Personalizável)

- **Campos Padrão Obrigatórios (Fixos):**
  - **Nome:** Nome completo do visitante.
  - **WhatsApp / Celular:** Telefone móvel com DDD (formatado e limpo).
- **Campos Opcionais/Ativáveis pelo Lojista:**
  - **E-mail:** Ativado (`field_email_enabled`) e Obrigatório (`field_email_required`).
  - **Data de Nascimento:** Ativado (`field_dob_enabled`) e Obrigatório (`field_dob_required`).
  - **Cidade:** Ativado (`field_city_enabled`) e Obrigatório (`field_city_required`).
  - **Gênero:** Ativado (`field_gender_enabled`) e Obrigatório (`field_gender_required`).

---

## 🎬 4. Mídia e Destaques da Landing Page

- **Mídia em Destaque:** Suporte a Imagem ou Vídeo curto promocional (reproduzido em `muted autoplay loop playsinline` no celular).
- **Título e Descrição da Oferta:** Exibe no portal o prato do dia, combo ou promoção ativa.
- **Links Sociais:** Instagram, Facebook e Cardápio Digital.
- **Avaliação do Google Meu Negócio:** Link direto para avaliação com exibição pré ou pós-conexão.

---

## ⏱️ 5. Regras de Recadastro e Sessão

- **Intervalo de Re-cadastro (`relogin_days_interval`):**
  - Define quantos dias após o cadastro o sistema exigirá o preenchimento novamente.
  - Opções disponíveis: **7**, **15**, **30** ou **90** dias.
  - Dentro do prazo de validade, o cliente é reconhecido automaticamente via Cookie Seguro + Endereço MAC.
