import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export const VISITOR_SESSION_COOKIE = 'wifi_visitor_session_token';

/**
 * Computes SHA-256 hash of a raw session token.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Creates an HttpOnly, Secure session cookie and saves SHA-256 hash in DB.
 */
export async function createVisitorSession(visitorId: string, macAddress: string = '00:00:00:00:00:00') {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase.from('wifi_sessions').insert({
        visitor_id: visitorId,
        mac_address: macAddress,
        session_token_hash: tokenHash,
        status: 'ACTIVE',
        started_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Erro ao registrar token de sessão no banco:', err);
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(VISITOR_SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return { rawToken, tokenHash };
}

/**
 * Validates HttpOnly visitor session cookie against stored SHA-256 token hash.
 */
export async function validateVisitorSession(): Promise<{ visitorId: string; tokenHash: string } | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(VISITOR_SESSION_COOKIE)?.value;

  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 32) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const supabase = createAdminClient();

  if (!supabase) {
    // Modo demonstração (sem supabase configurado)
    return { visitorId: 'demo-visitor', tokenHash };
  }

  try {
    const { data: session, error } = await supabase
      .from('wifi_sessions')
      .select('visitor_id, status')
      .eq('session_token_hash', tokenHash)
      .limit(1)
      .single();

    if (error || !session) {
      return null;
    }

    return { visitorId: session.visitor_id, tokenHash };
  } catch {
    return null;
  }
}
