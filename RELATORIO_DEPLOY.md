# Relatório de Implantação e Testes (Deploy Oficial)

Este relatório documenta a execução da implantação comercial do **Wi-Fi Marketing Pro**.

## ✅ 1. Repositório de Código (GitHub)
- **Status:** CONCLUÍDO
- **Repositório:** `wifi-marketing-template`
- **Owner:** `ragalvesg-byte`
- **URL Pública:** [https://github.com/ragalvesg-byte/wifi-marketing-template](https://github.com/ragalvesg-byte/wifi-marketing-template)
- Todo o código fonte, arquivos de configuração e documentação comercial foram enviados (branch `main`).

## ✅ 2. Banco de Dados e Autenticação (Supabase)
- **Status:** CONCLUÍDO
- **URL do Projeto:** `https://vjwehthlyldrpvdnjpca.supabase.co`
- **Migrações:** O esquema completo (`store_settings`, `visitors`, `devices`, `wifi_sessions`) foi aplicado com sucesso.
- **Políticas RLS:** Ativadas e configuradas para segurança da LGPD.
- **Usuário Administrador Criado:**
  - **Login:** *(credenciais gerenciadas exclusivamente pelo painel Supabase Authentication)*
  - **Senha:** *(redefinida — gerenciada pelo painel Supabase)*

## ✅ 3. Variáveis de Ambiente
- **Status:** CONCLUÍDO
- As chaves de API (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENNDS_FAS_KEY`) foram configuradas de forma segura e não expõem as permissões de `SERVICE_ROLE` ao cliente.

## ⏳ 4. Deploy em Nuvem (Vercel)
- **Status:** PENDENTE (Ação Manual Requerida)
- *Motivo:* A Vercel CLI requer autenticação via navegador, o que não pode ser feito de forma automatizada no terminal atual.
- **Próximo Passo (Ação do Lojista):**
  1. Acesse [https://vercel.com/new](https://vercel.com/new).
  2. Importe o repositório `ragalvesg-byte/wifi-marketing-template`.
  3. Em **Environment Variables**, cole o conteúdo gerado no arquivo `.env.local` (Chaves do Supabase e openNDS).
  4. Clique em **Deploy**.

## ⏳ 5. Testes no Ambiente Publicado
*(Estes testes devem ser repetidos pelo operador assim que a URL da Vercel for gerada)*

- [ ] Login do administrador (`/admin/login`).
- [ ] Alteração de configurações visuais e campos dinâmicos no painel.
- [ ] Acesso à Landing Page gerada.
- [ ] Verificação da aplicação do Tema Pré-configurado.
- [ ] Cadastro de um Visitante Teste pelo formulário.
- [ ] Leitura do Visitante no Dashboard do Administrador.
- [ ] Exportação CSV de contatos na aba Histórico.
- [ ] Teste de visitante recorrente (recarregar página do portal e verificar 1-clique).

## ⚠️ 6. Dependências Físicas e Hardware
- **Importante:** O produto **NÃO** deve ser declarado pronto para venda até que os testes de integração física descritos em `TESTE_ROTEADOR.md` e `INSTALACAO_PRODUCAO_OPENNDS.md` sejam realizados.
- **Funcionalidades Dependentes do Hardware (OpenWrt):**
  - Geração do token criptografado pelo roteador.
  - Interceptação automática de rede (Portal Cativo do celular abrir sozinho).
  - Assinatura HMAC-SHA256 (FAS Nível 3) de ponta-a-ponta.
  - Liberação efetiva da conexão de internet pelo firewall local.
