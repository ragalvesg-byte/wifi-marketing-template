# Guia de Testes Locais e Laboratório: OpenWrt + openNDS (V1)

Este guia orienta o teste e validação do sistema **`wifi-marketing-template`** em ambiente local de laboratório (bancada de desenvolvimento), utilizando um roteador com **OpenWrt** e a extensão **openNDS**.

---

## 1. Requisitos do Equipamento de Testes

> ⚠️ **AVISO DE HARDWARE:** Não presuma compatibilidade genérica com qualquer modelo comercial. É **obrigatório** verificar se o modelo exato e a **revisão de hardware (Board Revision)** constam como suportados na [Tabela de Hardware Oficial do OpenWrt (ToH)](https://openwrt.org/toh/start).

- **Versão do OpenWrt:** Utilize uma versão atualmente suportada e mantida (ex: **OpenWrt 23.05** ou superior). Não utilize versões antigas (19.07, 21.02 ou 22.03).
- **Roteadores Recomendados para Laboratório:**
  - GL.iNet GL-MT300N-V2 (Mango) ou GL-AXT1000.
  - TP-Link Archer C6 (Revisão v2 ou v3 homologada).
- **Rede do Laboratório:**
  - Computador do Desenvolvedor rodando o Next.js (`npm run dev` na porta 3000) conectado na rede LAN.
  - Roteador OpenWrt com interface de visitantes isolada (ex: `192.168.2.1/24`, `br-guest`).

---

## 2. Configuração do openNDS em Modo Local (FAS Nível 1)

Em ambiente local de bancada, a integração utiliza a porta 80/3000 em HTTP e o modo FAS Nível 1 (`fas_secure_enabled 1`) para agilizar os testes sem necessidade de certificados SSL locais.

### Passo 1: Acesso SSH ao Roteador
```bash
ssh root@192.168.2.1
```

### Passo 2: Instalação e Checagem da Versão
```bash
opkg update
opkg install opennds
opennds --version
```

### Passo 3: Configuração em `/etc/config/opennds`

```ini
config opennds
    option enabled '1'
    option fwd_max_connections '100'

    # Interface sem fio da rede de convidados
    option gatewayinterface 'br-guest'

    # Identificador local do roteador
    option gatewayname 'Loja_Bancada_Testes'

    # Tempo do acesso liberado (em minutos)
    option sessiontimeout '480'

    # -------------------------------------------------------------
    # FAS em Modo de Desenvolvimento Local (HTTP)
    # -------------------------------------------------------------
    option fasport '3000'
    option fasremoteip '192.168.2.100'  # IP do seu PC na rede local
    option faspath '/portal'
    option fas_secure_enabled '1'

    # Walled Garden Local (Liberação pré-autenticação)
    list walledgarden_fqdn 'images.unsplash.com'
    list walledgarden_fqdn 'sua-instancia.supabase.co'
```

### Passo 4: Aplicar e Reiniciar
```bash
uci commit opennds
/etc/init.d/opennds restart
```

---

## 3. Comandos Úteis de Diagnóstico no Roteador (CLI)

Durante os testes locais, execute estes comandos no terminal SSH do OpenWrt para diagnosticar o status:

1. **Verificar status do openNDS e clientes conectados:**
   ```bash
   ndsctl status
   ```
2. **Consultar logs em tempo real:**
   ```bash
   logread -e opennds -f
   ```
3. **Exibir toda a configuração ativa:**
   ```bash
   uci show opennds
   ```
4. **Verificar se a interface de convidados e o firewall estão ativos:**
   ```bash
   ifconfig br-guest
   nft list ruleset | grep opennds   # (OpenWrt 22+) ou iptables -L -n -v
   ```

---

## 4. Roteiro de Validação do Portal no Celular de Testes

1. Conecte o celular na Wi-Fi de convidados da bancada.
2. O pop-up do portal deve carregar a URL:
   `http://192.168.2.100:3000/portal?tok=...&clientmac=...&clientip=...`
3. Preencha o cadastro e envie.
4. O Next.js redirecionará o celular para:
   `http://192.168.2.1:2050/opennds_auth/?tok=<tok>`
5. Verifique no terminal SSH do roteador executando `ndsctl status` se o MAC do celular mudou para o estado **"Authenticated"**.
