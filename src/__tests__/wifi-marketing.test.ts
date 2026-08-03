import { describe, it, expect } from 'vitest';
import { parseOpenNdsParams, buildOpenNdsAuthUrl, isValidMac, isValidIp, sanitizeToken, generateFasLevel3Token } from '../lib/opennds';
import { cleanPhoneNumber, formatPhoneNumber } from '../lib/utils';
import { MOCK_STORE_SETTINGS, MOCK_VISITORS } from '../lib/supabase/mock-data';

describe('Auditoria de Testes — System Wifi Marketing Template', () => {
  it('Deve limpar e formatar corretamente números de WhatsApp', () => {
    const rawInput = '(11) 98765-4321';
    const cleaned = cleanPhoneNumber(rawInput);
    expect(cleaned).toBe('11987654321');

    const formatted = formatPhoneNumber('11987654321');
    expect(formatted).toBe('(11) 98765-4321');
  });

  it('Deve validar rigorosamente o formato de Endereço MAC', () => {
    expect(isValidMac('aa:bb:cc:dd:ee:ff')).toBe(true);
    expect(isValidMac('AA-BB-CC-DD-EE-FF')).toBe(true);
    expect(isValidMac('invalid_mac')).toBe(false);
    expect(isValidMac('123.456.789')).toBe(false);
    expect(isValidMac(undefined)).toBe(false);
  });

  it('Deve validar rigorosamente o formato de IP do Gateway', () => {
    expect(isValidIp('192.168.1.1')).toBe(true);
    expect(isValidIp('10.0.0.254')).toBe(true);
    expect(isValidIp('999.999.999.999')).toBe(false);
    expect(isValidIp('localhost')).toBe(false);
  });

  it('Deve sanitizar tokens openNDS e evitar injeção', () => {
    expect(sanitizeToken('tok_valid123')).toBe('tok_valid123');
    expect(sanitizeToken('tok<script>alert(1)</script>')).toBe('tokscriptalert1script');
    expect(sanitizeToken('a')).toBe(undefined);
  });

  it('Deve gerar token assinado HMAC-SHA256 para openNDS FAS Nível 3', () => {
    const rawToken = 'tok_demo_123';
    const secretKey = 'minha_chave_faskey_super_segura';
    const signedToken = generateFasLevel3Token(rawToken, secretKey);

    expect(signedToken).not.toBe(rawToken);
    expect(signedToken.length).toBe(64); // SHA-256 em Hex tem 64 caracteres
  });

  it('Deve construir a URL oficial de autorização openNDS para o roteador', () => {
    const authUrl = buildOpenNdsAuthUrl({
      gatewayaddress: '192.168.1.1',
      gatewayport: '2050',
      tok: 'tok_abc123',
    });

    expect(authUrl).toBe('http://192.168.1.1:2050/opennds_auth/?tok=tok_abc123');
  });

  it('Deve parsear parâmetros enviados pela Query String do openNDS FAS', () => {
    const query = {
      tok: 'token_teste_123',
      clientmac: 'AA:BB:CC:DD:EE:FF',
      clientip: '192.168.1.105',
      gatewayname: 'Bistro_Wifi',
      gatewayaddress: '192.168.1.1',
      gatewayport: '2050',
    };

    const parsed = parseOpenNdsParams(query);
    expect(parsed.tok).toBe('token_teste_123');
    expect(parsed.clientmac).toBe('aa:bb:cc:dd:ee:ff');
    expect(parsed.clientip).toBe('192.168.1.105');
    expect(parsed.gatewayname).toBe('Bistro_Wifi');
  });

  it('Deve identificar se o visitante precisa recadastrar com base no intervalo da loja', () => {
    const reloginIntervalDays = MOCK_STORE_SETTINGS.relogin_days_interval;
    expect(reloginIntervalDays).toBe(7);

    const recentVisit = new Date(Date.now() - 3600000 * 24 * 2);
    const daysDiffRecent = (Date.now() - recentVisit.getTime()) / (1000 * 3600 * 24);
    expect(daysDiffRecent < reloginIntervalDays).toBe(true);

    const oldVisit = new Date(Date.now() - 3600000 * 24 * 10);
    const daysDiffOld = (Date.now() - oldVisit.getTime()) / (1000 * 3600 * 24);
    expect(daysDiffOld > reloginIntervalDays).toBe(true);
  });

  it('Deve conter dados mockados consistentes para o modo demonstração', () => {
    expect(MOCK_VISITORS.length).toBeGreaterThan(0);
    const firstVisitor = MOCK_VISITORS[0];
    expect(firstVisitor.terms_accepted).toBe(true);
    expect(firstVisitor.phone).toBeDefined();
  });
});
