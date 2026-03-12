/**
 * Auth session handler — GET /api/auth/session
 * Reads the auth cookie, verifies the JWT, returns the current session/user.
 */

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface UserRow {
  id: string;
  full_name: string;
  role: string;
  payment_status: string;
  onboarding_completed: number;
  created_at: string;
}

/**
 * Minimal JWT verification using Web Crypto API.
 */
async function verifyJwt(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const data = `${headerB64}.${payloadB64}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode base64url signature
    const sigStr = atob(sigB64.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i);
    }

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(data)
    );

    if (!valid) return null;

    // Decode payload
    const payloadStr = atob(
      payloadB64.replace(/-/g, '+').replace(/_/g, '/')
    );
    const payload = JSON.parse(payloadStr) as Record<string, unknown>;

    // Check expiry
    if (payload.exp && typeof payload.exp === 'number') {
      if (Math.floor(Date.now() / 1000) > payload.exp) {
        return null; // expired
      }
    }

    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(';')) {
    const [name, ...rest] = pair.trim().split('=');
    if (name) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  }
  return cookies;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const cookieHeader = context.request.headers.get('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies['auth_token'];

    if (!token) {
      return Response.json({ session: null }, { status: 200 });
    }

    const payload = await verifyJwt(token, context.env.JWT_SECRET);
    if (!payload) {
      return Response.json({ session: null }, { status: 200 });
    }

    // Look up user from DB
    const userId = payload.sub as string;
    const user = await context.env.DB.prepare(
      `SELECT * FROM user_profiles WHERE id = ? LIMIT 1`
    )
      .bind(userId)
      .first<UserRow>();

    if (!user) {
      return Response.json({ session: null }, { status: 200 });
    }

    const authUser = {
      id: user.id,
      email: user.id, // MVP: id is used as email
      aud: 'authenticated',
      role: user.role,
      app_metadata: { role: user.role },
      user_metadata: { full_name: user.full_name },
      created_at: user.created_at,
    };

    const session = {
      user: authUser,
      access_token: token,
      expires_at: payload.exp,
    };

    return Response.json({ session });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
};
