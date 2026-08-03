# Guia de Instalação do Zero (`INSTALL.md`)

Este documento descreve o procedimento passo a passo para criar e implantar uma nova instância individual do **`wifi-marketing-template`** para um novo estabelecimento comercial.

---

## 1. Clonagem e Inicialização do Repositório

```bash
# 1. Clonar o modelo reutilizável para o novo cliente
git clone https://github.com/seu-usuario/wifi-marketing-template.git wifi-marketing-nome-da-loja
cd wifi-marketing-nome-da-loja

# 2. Instalar dependências
npm install
```

---

## 2. Configuração do Banco de Dados no Supabase

1. Crie um novo projeto no [Supabase Console](https://supabase.com).
2. Acesse o **SQL Editor** do Supabase.
3. Cole e execute todo o conteúdo do arquivo [`supabase/schema.sql`](file:///c:/Users/USER/Desktop/wifi-markting/supabase/schema.sql).
4. No menu **Authentication > Users**, cadastre o e-mail e senha do lojista para acesso ao painel `/admin`.
5. Em **Project Settings > API**, obtenha as chaves do projeto.

---

## 3. Configuração das Variáveis de Ambiente (`.env.local`)

Crie o arquivo `.env.local` na raiz do projeto com as chaves obtidas:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://sua-instancia.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-privada

# Chave de segurança compartilhada com o roteador OpenWrt (FAS Nível 3)
OPENNDS_FAS_KEY=sua_chave_faskey_aleatoria_com_32_caracteres_minimo

# Configuração opcional do gateway padrão
OPENNDS_DEFAULT_GATEWAY_IP=192.168.1.1
OPENNDS_DEFAULT_GATEWAY_PORT=2050
```

---

## 4. Deploy da Aplicação (Vercel ou VPS)

### Opção A: Vercel (Recomendado)
```bash
npm install -g vercel
vercel --prod
```
- Adicione as variáveis de ambiente no painel da Vercel.
- Configure o domínio/subdomínio próprio com certificado SSL (ex: `https://wifi.sualoja.com.br`).

---

## 5. Configuração do Roteador OpenWrt + openNDS

1. Acesse o roteador do cliente via SSH:
   ```bash
   ssh root@192.168.1.1
   ```
2. Instale o openNDS e configure o arquivo `/etc/config/opennds` conforme detalhado no [INSTALACAO_PRODUCAO_OPENNDS.md](file:///c:/Users/USER/Desktop/wifi-markting/INSTALACAO_PRODUCAO_OPENNDS.md).
3. Reinicie o serviço:
   ```bash
   /etc/init.d/opennds restart
   ```

---

## 6. Teste de Entrega
1. Conecte-se à Wi-Fi da loja com um smartphone.
2. Complete o cadastro e verifique a liberação da internet e inserção no banco Supabase.
3. Faça login no `/admin` e entregue os dados de acesso ao lojista.
