import { VisitorEventType } from '@/types/database';

export interface SendEventParams {
  visitor_id?: string | null;
  wifi_session_id?: string | null;
  campaign_id?: string | null;
  anonymous_session_id?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Retorna ou gera um ID de sessão anônima persistido na sessionStorage para rastrear a visita atual.
 */
export function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') return '';
  let anonId = sessionStorage.getItem('wifi_anon_session_id');
  if (!anonId) {
    anonId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'anon-' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('wifi_anon_session_id', anonId);
  }
  return anonId;
}

/**
 * Envia um evento de visitante para a API sem bloquear a experiência do usuário.
 */
export function sendVisitorEvent(
  event_type: VisitorEventType,
  params: SendEventParams = {}
): void {
  if (typeof window === 'undefined') return;

  // Evitar duplicidade de PORTAL_VIEWED na mesma sessão de navegação (previne re-renders do React)
  if (event_type === 'PORTAL_VIEWED') {
    const alreadyLogged = sessionStorage.getItem('wifi_portal_viewed_logged');
    if (alreadyLogged) {
      return;
    }
    sessionStorage.setItem('wifi_portal_viewed_logged', 'true');
  }

  const payload = {
    event_type,
    visitor_id: params.visitor_id || null,
    wifi_session_id: params.wifi_session_id || null,
    campaign_id: params.campaign_id || null,
    anonymous_session_id: params.anonymous_session_id || getAnonymousSessionId(),
    metadata: {
      ...(params.metadata || {}),
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      referrer: document.referrer || '',
    },
  };

  // Dispara a requisição em uma Promise assíncrona e captura erros de rede de forma silenciosa
  Promise.resolve().then(() => {
    fetch('/api/portal/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn('Erro ao enviar evento de visitante de forma assíncrona:', err);
    });
  });
}
