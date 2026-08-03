# Relatório de Auditoria Online e Segurança

Auditoria técnica realizada para validação e fechamento de segurança da versão de produção do **Wi-Fi Marketing**.

## 1. Segurança e Autenticação do Administrador
- **Rotas Protegidas:** Foi implementado e validado o bloqueio de sessão nas rotas `/admin/dashboard`, `/admin/contacts` e `/admin/settings`. Apenas usuários autenticados via Supabase Auth conseguem acessar; os demais são redirecionados para `/admin/login`.
- **API do Lojista:** O endpoint `/api/admin/settings` agora valida o token de autenticação via `supabase.auth.getUser()`, garantindo que um atacante não consiga modificar as configurações da loja sem estar logado no painel.
- **Vazamento de Chaves:** Inspecionamos todo o fluxo. As chaves de servidor (`SERVICE_ROLE_KEY` e `OPENNDS_FAS_KEY`) nunca são exportadas com prefixo `NEXT_PUBLIC_` e permanecem estritamente isoladas no backend. As mensagens de erro das APIs foram mascaradas com retornos genéricos 500 para evitar que stack traces vazem na rede.

## 2. Cadastro Seguro e Prevenção de Abusos
- **Backend Bypass via Service Role:** Corrigimos o bloqueio 500 do cadastro público. O endpoint de registro usa agora uma conexão de administrador exclusiva e isolada apenas do lado do servidor (`src/lib/supabase/admin.ts`), garantindo que a inserção ocorra com sucesso mesmo sem que o visitante tenha conta, e simultaneamente mantendo a política RLS (Row Level Security) 100% fechada contra acessos anônimos.
- **Rate Limiting:** Implementado um limitador in-memory na rota `/api/portal/register`. Se um mesmo endereço de IP enviar mais de 5 requisições de cadastro no intervalo de 1 minuto, a API responderá com o status `HTTP 429 - Too Many Requests`. Isso previne cadastros automatizados massivos e exaustão do banco de dados (DDoS/Spam).

## 3. Comportamento e Navegação
- **Visitantes Novos vs Recorrentes:** O portal detecta corretamente via Cookie (`wifi_visitor_device_token`) se um usuário já possui cadastro, pulando o formulário completo e exibindo apenas a tela "Bem-vindo de Volta", validado no design atual.
- **Parâmetros openNDS:** O sistema consegue processar a entrada com e sem os parâmetros. Quando não há conexão Supabase ativa ou tokens openNDS, o backend transita elegantemente para o "Modo Demonstração".

## 4. Próximos Passos
As correções listadas já foram "comitadas" e enviadas para a Vercel. Nenhuma funcionalidade nova foi adicionada, focando 100% na robustez e estabilidade.

O sistema está apto do ponto de vista de software. O teste em um Roteador OpenWrt Físico é o último passo real.
