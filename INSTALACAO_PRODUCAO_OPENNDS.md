# Guia de Instalação e Configuração em Produção Comercial: OpenWrt + openNDS (FAS Nível 3)

Este documento estabelece o padrão oficial de implantação do **`wifi-marketing-template`** em estabelecimentos comerciais e lojas físicas, utilizando comunicação segura **HTTPS**, autenticação **FAS Nível 3** e chave de criptografia compartilhada (**FAS Key**).

---

## 1. Requisitos de Hardware e Sistema em Produção

### ⚠️ Compatibilidade de Hardware no OpenWrt
Antes de adquirir equipamentos para clientes, é **obrigatório** consultar a revisão exata da placa e modelo na [Tabela de Hardware Oficial do OpenWrt (ToH)](https://openwrt.org/toh/start).
- **Proibido utilizar versões legadas/antigas:** Utilize estritamente versões mantidas do **OpenWrt (23.05 ou superior)**.
- **Modelos Homologados Recomendados:**
  - GL.iNet GL-AXT1000 / GL-MT300N-V2.
  - Roteadores empresariais com suporte OpenWrt 23.05+ e no mínimo 128MB de RAM e 32MB de memória Flash.

---

## 2. Arquitetura de Comunicação em Produção (FAS Nível 3)

Em produção comercial, o nível de segurança do openNDS **deve ser configurado como `fas_secure_enabled 3`**:

```
+------------------+     1. Redirecionamento HTTPS (FAS)      +----------------------------------+
|  Celular/Device  | ---------------------------------------> | Roteador OpenWrt + openNDS (FAS) |
+------------------+                                          +----------------------------------+
        |                                                                      ^
        | 2. Envia cadastro via HTTPS                                          | 3. Redireciona com Token Assinado
        v                                                                      |    HMAC-SHA256 (via faskey)
+------------------------------------------------------------------------------+--+
|                      Servidor Next.js (Vercel / VPS com HTTPS)                  |
|               https://wifi.sualoja.com.br/portal?tok=...                        |
|                                                                                 |
| - Valida MAC, IP e gera token assinado: generateFasLevel3Token(tok, FAS_KEY)   |
+---------------------------------------------------------------------------------+
```

---

## 3. Configuração do Roteador em Produção (`/etc/config/opennds`)

Edite o arquivo `/etc/config/opennds` no roteador do cliente:

```ini
config opennds
    option enabled '1'
    option fwd_max_connections '200'

    # Interface da rede Wi-Fi de convidados (isolada da rede administrativa)
    option gatewayinterface 'br-guest'

    # Nome do estabelecimento comercial exibido no portal
    option gatewayname 'Cafe_Bistro_Central'

    # Duração do acesso liberado (em minutos). Ex: 480 min = 8 horas
    option sessiontimeout '480'

    # -------------------------------------------------------------
    # FAS Nível 3 (Produção Comercial com HTTPS e FAS Key)
    # -------------------------------------------------------------
    option fasport '443'
    
    # Domínio público com suporte a HTTPS (Sem indicar https:// no valor)
    option fasremotefqdn 'wifi.sualoja.com.br'
    option fasremoteip '203.0.113.50' # IP público onde a aplicação responde
    option faspath '/portal'

    # Exige comunicação HTTPS e chave compartilhada HMAC-SHA256
    option fas_secure_enabled '3'

    # Chave Secreta Compartilhada (FAS Key) - Mínimo 32 caracteres aleatórios
    # IMPORTANTE: Esta mesma chave deve ser configurada no backend em OPENNDS_FAS_KEY
    option faskey 'c8f7d9a1e3b54206981273456789abcdef0123456789abcdef0123456789abcd'

    # -------------------------------------------------------------
    # Walled Garden (Domínios liberados sem autenticação)
    # -------------------------------------------------------------
    # Recomenda-se hospedar imagens e fontes no mesmo domínio para reduzir dependências
    list walledgarden_fqdn 'wifi.sualoja.com.br'
    list walledgarden_fqdn 'images.unsplash.com'
    list walledgarden_fqdn 'sua-instancia.supabase.co'
```

---

## 4. Configuração da Variável de Ambiente no Servidor Next.js

No arquivo `.env.local` (ou painel de variáveis de ambiente na Vercel/VPS):

```ini
# Chave Secreta Compartilhada com o Roteador OpenWrt (FAS Nível 3)
OPENNDS_FAS_KEY=c8f7d9a1e3b54206981273456789abcdef0123456789abcdef0123456789abcd
```

Quando a variável `OPENNDS_FAS_KEY` está presente no servidor, a função `generateFasLevel3Token` calcula automaticamente a assinatura HMAC-SHA256 exigida pelo openNDS antes de responder ou redirecionar o cliente para a porta do roteador.

---

## 5. Comandos Frequentes de Diagnóstico e Auditoria no Roteador

Execute via SSH no OpenWrt do cliente:

```bash
# 1. Verificar versão do openNDS
opennds --version

# 2. Consultar estatísticas da sessão e clientes autenticados
ndsctl status

# 3. Ler logs de auditoria e conexões em tempo real
logread -e opennds -f

# 4. Exibir as configurações aplicadas
uci show opennds

# 5. Verificar estado do firewall e regras de interceptação
nft list ruleset | grep opennds
```
