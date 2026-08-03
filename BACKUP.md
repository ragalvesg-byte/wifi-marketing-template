# Guia de Backup e Restauração de Banco de Dados (`BACKUP.md`)

Este documento estabelece o procedimento operacional para cópia de segurança (backup) e recuperação de desastres (restore) das instâncias do **`wifi-marketing-template`** hospedadas no **Supabase**.

---

## 💾 1. Backup Automático no Supabase (Point-in-Time Recovery)

O Supabase realiza backups diários automáticos de todos os bancos de dados PostgreSQL.
- Para acessar os backups automáticos:
  1. Acesse o **Supabase Dashboard > Project Settings > Database**.
  2. Role até a seção **Database Backups**.
  3. Selecione a data desejada e clique em **Download Backup** ou **Restore**.

---

## 🛠️ 2. Backup Manual via CLI Supabase / pg_dump

Para gerar um backup completo do banco de dados localmente via terminal:

```bash
# 1. Obter a string de conexão no Supabase (Project Settings > Database > Connection String)
# Exemplo de comando pg_dump:

pg_dump -h db.sua-instancia.supabase.co -U postgres -d postgres -F c -b -v -f backup_loja_$(date +%Y%m%d).dump
```

---

## 🔄 3. Restauração do Banco de Dados (Restore)

Para restaurar um backup em uma nova instância ou recuperar dados:

```bash
pg_restore -h db.sua-instancia.supabase.co -U postgres -d postgres -v backup_loja_20260803.dump
```

Após o restore, aplique o script [`supabase/schema.sql`](file:///c:/Users/USER/Desktop/wifi-markting/supabase/schema.sql) caso precise redefinir políticas de segurança RLS ou recriar índices.
