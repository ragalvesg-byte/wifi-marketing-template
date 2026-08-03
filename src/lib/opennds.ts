import { OpenNdsParams } from "@/types/database";
import crypto from "crypto";

// RegEx para validação estrita de Endereço MAC (AA:BB:CC:DD:EE:FF ou AA-BB-CC-DD-EE-FF)
const MAC_REGEX = /^([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})$/;

// RegEx para validação de IPv4
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export function isValidMac(mac?: string): boolean {
  if (!mac) return false;
  return MAC_REGEX.test(mac.trim());
}

export function isValidIp(ip?: string): boolean {
  if (!ip) return false;
  return IPV4_REGEX.test(ip.trim());
}

export function sanitizeToken(tok?: string): string | undefined {
  if (!tok) return undefined;
  const sanitized = tok.replace(/[^a-zA-Z0-9_-]/g, "");
  return sanitized.length >= 4 ? sanitized : undefined;
}

/**
 * Calcula a assinatura HMAC-SHA256 necessária para o openNDS FAS Nível 3 (fas_secure_enabled = 3).
 * A faskey é compartilhada estritamente entre o roteador e a aplicação backend no servidor.
 */
export function generateFasLevel3Token(tok: string, fasKey?: string): string {
  const secret = fasKey || process.env.OPENNDS_FAS_KEY;
  if (!secret) {
    return tok;
  }
  
  // Gera hash HMAC-SHA256 do token usando a faskey compartilhada
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(tok);
  return hmac.digest("hex");
}

/**
 * Normaliza e valida rigorosamente os parâmetros enviados pelo openNDS FAS na Query String.
 */
export function parseOpenNdsParams(searchParams: { [key: string]: string | string[] | undefined }): OpenNdsParams {
  const getSingle = (val: string | string[] | undefined): string | undefined => {
    if (Array.isArray(val)) return val[0];
    return val;
  };

  const rawTok = getSingle(searchParams.tok) || getSingle(searchParams.fas);
  const rawMac = getSingle(searchParams.clientmac) || getSingle(searchParams.mac);
  const rawIp = getSingle(searchParams.clientip) || getSingle(searchParams.ip);
  const gatewayname = getSingle(searchParams.gatewayname) || "Loja_WiFi";
  const rawGwAddress = getSingle(searchParams.gatewayaddress) || getSingle(searchParams.gw_address);
  const rawGwPort = getSingle(searchParams.gatewayport) || getSingle(searchParams.gw_port);
  const redir = getSingle(searchParams.redir);

  const tok = sanitizeToken(rawTok);
  const clientmac = isValidMac(rawMac) ? rawMac!.toLowerCase() : undefined;
  const clientip = isValidIp(rawIp) ? rawIp : undefined;
  
  // Valida e sanitiza o endereço e porta do gateway
  const gatewayaddress = isValidIp(rawGwAddress) ? rawGwAddress : (process.env.OPENNDS_DEFAULT_GATEWAY_IP || "192.168.1.1");
  const gatewayport = rawGwPort && /^\d+$/.test(rawGwPort) ? rawGwPort : (process.env.OPENNDS_DEFAULT_GATEWAY_PORT || "2050");

  return {
    tok,
    clientmac,
    clientip,
    gatewayname: gatewayname.slice(0, 100),
    gatewayaddress,
    gatewayport,
    redir,
  };
}

/**
 * Constrói a URL oficial de autorização e liberação do openNDS no roteador OpenWrt.
 * Suporta fas_secure_enabled 1, 2 e 3 (com assinatura HMAC via OPENNDS_FAS_KEY).
 */
export function buildOpenNdsAuthUrl(params: {
  gatewayaddress?: string;
  gatewayport?: string;
  tok?: string;
  redir?: string;
  fasKey?: string;
}): string {
  const gwIp = isValidIp(params.gatewayaddress)
    ? params.gatewayaddress
    : (process.env.OPENNDS_DEFAULT_GATEWAY_IP || "192.168.1.1");
  
  const gwPort = params.gatewayport && /^\d+$/.test(params.gatewayport)
    ? params.gatewayport
    : (process.env.OPENNDS_DEFAULT_GATEWAY_PORT || "2050");

  const rawTok = sanitizeToken(params.tok) || "simulated_token";
  
  // Se a FAS KEY estiver configurada, aplica assinatura HMAC-SHA256 para FAS Nível 3
  const signedTok = generateFasLevel3Token(rawTok, params.fasKey);

  let url = `http://${gwIp}:${gwPort}/opennds_auth/?tok=${encodeURIComponent(signedTok)}`;
  if (params.redir) {
    url += `&redir=${encodeURIComponent(params.redir)}`;
  }
  return url;
}
