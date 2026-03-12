/**
 * Auth login handler — POST /api/auth/login
 * Looks up user by email, verifies password with PBKDF2-SHA256.
 */

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  payment_status: string;
  onboarding_completed: number;
  password_hash: string | null;
  created_at: string;
}

// ── PBKDF2 password hashing ──────────────────────────────────────────────────

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(bits)));
  const saltB64 = btoa(String.fromCharCode(...salt));
  return `${saltB64}:${hashB64}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(':');
  if (!saltB64 || !hashB64) return false;
  const salt = new Uint8Array(atob(saltB64).split('').map(c => c.charCodeAt(0)));
  const result = await hashPassword(password, salt);
  return result === stored;
}

// ── JWT signing ──────────────────────────────────────────────────────────────

async function signJwt(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const enc = new TextEncoder();

  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${data}.${sigB64}`;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as LoginBody;

    if (!body.email || !body.password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await context.env.DB.prepare(
      `SELECT * FROM user_profiles WHERE email = ? LIMIT 1`
    )
      .bind(body.email)
      .first<UserRow>();

    if (!user) {
      return Response.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 });
    }

    // Verify password
    if (!user.password_hash || user.password_hash === 'TEMP_WILL_SET_LATER') {
      return Response.json({ error: 'יש להגדיר סיסמה קודם — /api/auth/setup-password' }, { status: 403 });
    }

    const valid = await verifyPassword(body.password, user.password_hash);
    if (!valid) {
      return Response.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 });
    }

    // Build JWT
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 60 * 60 * 24 * 7; // 7 days

    const token = await signJwt(
      { sub: user.id, role: user.role, iat: now, exp: expiresAt },
      context.env.JWT_SECRET
    );

    const authUser = {
      id: user.id,
      email: user.email,
      aud: 'authenticated',
      role: user.role,
      app_metadata: { role: user.role },
      user_metadata: { full_name: user.full_name },
      created_at: user.created_at,
    };

    const session = { user: authUser, access_token: token, expires_at: expiresAt };

    const cookie = [
      `auth_token=${token}`, 'HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', `Max-Age=${60 * 60 * 24 * 7}`,
    ].join('; ');

    return new Response(JSON.stringify({ user: authUser, session }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
};
