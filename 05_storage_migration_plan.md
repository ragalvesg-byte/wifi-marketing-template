# 05_storage_migration_plan.md - Plano de Migração do Storage Bucket

Este documento detalha o inventário de arquivos atual do bucket `portal-media` da instância compartilhada, o comparativo técnico de estratégias de migração em massa e o procedimento exato usando os comandos da CLI do Supabase.

---

## 1. Inventário de Arquivos do Bucket `portal-media`

A tabela abaixo exibe os metadados dos 3 objetos reais encontrados no bucket de storage da instância de origem:

| ID/Caminho do Arquivo | Tipo de Mídia | Tamanho (Bytes) | URL Utilizada no Banco de Dados | Tabela/ID da Referência |
| :--- | :--- | :--- | :--- | :--- |
| `campaigns/5c0cb555-7474-4c98-8acc-1982e015fb9f.png` | `image/png` | 114.071 | `https://vjwehthlyldrpvdnjpca.supabase.co/storage/v1/object/public/portal-media/campaigns/5c0cb555-7474-4c98-8acc-1982e015fb9f.png` | `campaigns` (ID: `db9395b6-20ce-47dc-87d2-82f73af6faf4` em `media_url`) |
| `promos/aa246964-f7cd-4d41-bbd2-44d886e5ac32.png` | `image/png` | 285.682 | `https://vjwehthlyldrpvdnjpca.supabase.co/storage/v1/object/public/portal-media/promos/aa246964-f7cd-4d41-bbd2-44d886e5ac32.png` | `store_settings` (ID: `370aa55a-b4ce-4051-9ae9-acd85c9cc92c` em `post_signup_promo_image_url`) |
| `promos/9471f204-3aef-4908-bc5c-494a175b57a0.png` | `image/png` | 114.071 | Nenhuma referência ativa encontrada no banco. *(Arquivo órfão / Lixo)* | - |

* **Total de Arquivos**: 3
* **Tamanho Total Acumulado**: 513.824 Bytes (~513,8 KB)

---

## 2. Comparativo de Métodos de Migração do Storage

| Método | Segurança / Facilidade | Eficiência com Alto Volume | Complexidade de Setup | Adequação ao Cenário Atual (MVP) |
| :--- | :--- | :--- | :--- | :--- |
| **Supabase CLI (`storage cp`)** | **Alta**: Autenticação nativa baseada no login do desenvolvedor local. Sem exposição de chaves S3. | **Baixa**: Executa downloads sequenciais/paralelos locais simples através da API de Storage. | **Nula**: CLI já instalada e configurada no projeto. | **Ideal (Escolha Recomendada)**: Perfeito para o volume atual de 3 arquivos (513 KB). Executável em menos de 1 minuto. |
| **Cliente S3 Compatível (ex: Rclone/MinIO)** | **Média**: Exige a geração de Access/Secret Keys S3 de leitura na origem e escrita no destino. | **Alta**: Transferência direta via streaming entre os buckets sem passar por download local, otimizando cache. | **Média**: Requer instalação de ferramentas extras (Rclone) e configuração de tokens S3. | **Inadequado**: Desnecessário devido ao baixo volume atual de mídias. |
| **Script Node.js Oficial (`@supabase/supabase-js`)** | **Média**: Utiliza service_role e client SDK no backend para baixar em buffers e subir. | **Média**: Sobrecarga de memória do Node em downloads concorrentes pesados se não houver paginação rígida. | **Alta**: Exige codificação de scripts de parsing de caminhos e manipulação de fluxos. | **Inadequado**: Escrever código personalizado para 3 arquivos gera overhead operacional inútil. |

---

## 3. Processo de Migração via Supabase CLI (Nativo)

### Passo 3.1 - Login e Vínculo com Projeto de Origem
Autentique-se no Supabase CLI:
```bash
npx supabase login
```

Vincule o ambiente local à referência do projeto compartilhado original:
```bash
npx supabase link --project-ref vjwehthlyldrpvdnjpca
```

### Passo 3.2 - Download de Arquivos (Origem)
Baixe os arquivos recursivamente do bucket remoto `portal-media` para uma pasta de backup temporária local:
```bash
npx supabase storage cp --experimental -r --linked ss:///portal-media ./backup-portal-media
```
*A flag `--experimental` habilita recursos avançados de cópia recursiva direta do bucket.*

### Passo 3.3 - Vínculo e Upload no Projeto Dedicado (Destino)
1. Crie o bucket `portal-media` no painel do novo projeto dedicando como público (Public).
2. Mude o vínculo do projeto na CLI para o ID do novo projeto dedicado (`[NOVO_PROJECT_ID]`):
   ```bash
   npx supabase link --project-ref [NOVO_PROJECT_ID]
   ```
3. Faça o upload dos arquivos da pasta temporária local para a raiz do bucket remoto do novo projeto:
   ```bash
   npx supabase storage cp --experimental -r ./backup-portal-media ss:///portal-media --linked
   ```

---

## 4. Script SQL de Atualização de URLs no Banco

Após a carga de dados, execute a query no SQL Editor do novo projeto dedicando para atualizar o domínio dos recursos multimídia:

```sql
UPDATE public.store_settings
SET 
  logo_url = REPLACE(logo_url, 'vjwehthlyldrpvdnjpca', '[NOVO_PROJECT_ID]'),
  background_url = REPLACE(background_url, 'vjwehthlyldrpvdnjpca', '[NOVO_PROJECT_ID]'),
  promo_image_url = REPLACE(promo_image_url, 'vjwehthlyldrpvdnjpca', '[NOVO_PROJECT_ID]'),
  landing_media_url = REPLACE(landing_media_url, 'vjwehthlyldrpvdnjpca', '[NOVO_PROJECT_ID]'),
  post_signup_promo_image_url = REPLACE(post_signup_promo_image_url, 'vjwehthlyldrpvdnjpca', '[NOVO_PROJECT_ID]')
WHERE logo_url LIKE '%vjwehthlyldrpvdnjpca%'
   OR background_url LIKE '%vjwehthlyldrpvdnjpca%'
   OR promo_image_url LIKE '%vjwehthlyldrpvdnjpca%'
   OR landing_media_url LIKE '%vjwehthlyldrpvdnjpca%'
   OR post_signup_promo_image_url LIKE '%vjwehthlyldrpvdnjpca%';

UPDATE public.campaigns
SET media_url = REPLACE(media_url, 'vjwehthlyldrpvdnjpca', '[NOVO_PROJECT_ID]')
WHERE media_url LIKE '%vjwehthlyldrpvdnjpca%';
```
