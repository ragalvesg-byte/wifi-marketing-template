# 06_cutover_and_rollback.md - Plano de Virada e Contingência (Rollback) Expandido

Este plano descreve o fluxo de transição (Cutover) do sistema Wi-Fi Marketing para a nova infraestrutura isolada e as ações de rollback detalhadas por entidade caso ocorra qualquer imprevisto durante o processo.

---

## 1. Estratégia de Virada (Cutover)

O processo de virada deve ser feito preferencialmente em horários de menor tráfego (ex: madrugada de segunda ou terça-feira) para minimizar o impacto em clientes conectados fisicamente nos estabelecimentos.

```
[Backup Inicial] ──> [Manutenção / Bloqueio] ──> [Exportação / Importação] ──> [Validação] ──> [Virada Env / DNS] ──> [Observação]
```

### Checklist do Passo a Passo de Cutover:

1. **Backup Inicial**:
   * Executar dump manual de dados e backup dos 3 arquivos do bucket `portal-media`.
2. **Ativação da Tela de Manutenção (Bloqueio de Escritas)**:
   * Para evitar inconsistências e perda de novos cadastros de visitantes, ative temporariamente uma tela de manutenção no portal.
   * Alternativa sem deploy: Alterar a RLS da tabela `public.visitors` na origem (compartilhada) para negar temporariamente inserções da API, ou bloquear acesso público de escrita nas APIs (Next.js `/api/portal/register` retornando status 503).
3. **Exportação Final**:
   * Executar o dump final das 10 tabelas e dos arquivos de mídias (conforme planos `04` e `05`).
4. **Criação do Schema e Carga no Destino**:
   * Executar scripts `01_schema_real.sql`, `02_rls_policies.sql` e `03_indexes.sql` no novo Supabase dedicados.
   * Importar dados na ordem exata de dependências chaves.
   * Criar bucket e fazer upload dos arquivos de mídias.
5. **Atualização de URLs no Banco Novo**:
   * Executar a query SQL de alteração de URLs públicas nos metadados de mídias.
6. **Validação do Ambiente Isolado**:
   * Executar testes e checar conexões internas.
7. **Virada de Chaves (Deploy)**:
   * Alterar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` nas configurações de Environment Variables da Vercel.
   * Iniciar Redeploy da branch `main` para compilar o portal estático apontando ao novo banco.
8. **Validação do Portal em Produção**:
   * Testar fluxos de cadastro e dashboard admin no link oficial do ambiente de produção.
9. **Desativação do Modo de Manutenção**:
   * Liberar o acesso normal de usuários ao captive portal.
10. **Observação**:
    * Monitoramento em tempo real dos logs no painel do Supabase e Vercel por 48 horas.

---

## 2. Plano de Contingência (Rollback) Expandido por Entidade

Se for identificada qualquer inconsistência não resolvida em até 1 hora de downtime durante a virada (ex: falhas de autenticação administrativa, problemas no redirecionamento do Captive Portal, erros de chaves estrangeiras), a operação deve ser abortada imediatamente.

### 2.1 Reversão das Credenciais e Redeploy
1. No painel da Vercel, reverter as variáveis de ambiente com os dados do projeto Supabase compartilhado original (`vjwehthlyldrpvdnjpca`).
2. Acionar o rebuild na Vercel para propagar os endpoints antigos. O sistema voltará a operar imediatamente sobre o banco original.

### 2.2 Sincronização de Transição (Dados Criados Durante a Migração/Testes)
Caso o novo banco tenha ficado aberto por algum intervalo de tempo e novos registros tenham sido gerados na nova instância dedicando:

* **Visitantes (`visitors`)**:
  * *Ação*: Buscar novos cadastros criados após o horário de corte:
    ```sql
    SELECT * FROM public.visitors WHERE created_at > '[HORÁRIO_CORTE_MIGRACAO]';
    ```
  * *Restauração*: Inserir no banco compartilhado de origem usando os mesmos IDs.
* **Dispositivos (`devices`)**:
  * *Ação*: Buscar novos dispositivos vinculados aos novos visitantes ou novos MACs capturados:
    ```sql
    SELECT * FROM public.devices WHERE created_at > '[HORÁRIO_CORTE_MIGRACAO]';
    ```
  * *Restauração*: Inserir no banco de origem.
* **Sessões (`wifi_sessions`)**:
  * *Ação*: Extrair conexões ativas iniciadas no banco novo:
    ```sql
    SELECT * FROM public.wifi_sessions WHERE created_at > '[HORÁRIO_CORTE_MIGRACAO]';
    ```
  * *Restauração*: Inserir na origem para manter histórico de conexão.
* **Eventos de Visitantes (`visitor_events`)**:
  * *Ação*: Coletar todos os cliques em campanhas e aberturas gravadas:
    ```sql
    SELECT * FROM public.visitor_events WHERE created_at > '[HORÁRIO_CORTE_MIGRACAO]';
    ```
  * *Restauração*: Inserir no banco compartilhado.
* **Campanhas e Configurações (`campaigns`, `store_settings`)**:
  * *Ação*: Se houver edições de campanha ou alterações visuais durante os testes na nova instância, exportar o estado correspondente e sincronizar de volta com o banco compartilhado.
* **Arquivos do Storage**:
  * *Ação*: Caso imagens tenham sido salvas no novo bucket `portal-media` durante a janela, baixar esses arquivos locais e fazer o upload de volta para o bucket compartilhado original.
