/**
 * Auth login handler — POST /api/auth/login
 * MVP: looks up user by email in user_profiles. No password hashing yet.
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
  full_name: string;
  role: string;
  payment_status: string;
  onboarding_completed: number;
  created_at: string;
}

/**
 * Minimal JWT implementation for Cloudflare Workers (no external deps).
 * Uses HMAC-SHA256 via Web Crypto API.
 */
async function signJwt(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };

  const enc = new TextEncoder();

  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${data}.${sigB64}`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as LoginBody;

    if (!body.email) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Look up user by email (email is stored as the id in user_profiles for Supabase compat,
    // or we look in a separate column). For MVP, we search by id = email.
    // In production, add an email column or use a proper auth table.
    const user = await context.env.DB.prepare(
      `SELECT * FROM user_profiles WHERE id = ? LIMIT 1`
    )
      .bind(body.email)
      .first<UserRow>();

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // MVP: skip password verification (in production, compare bcrypt hash)
    // If password_hash exists on the row, you'd verify here.

    // Build JWT
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 60 * 60 * 24 * 7; // 7 days

    const token = await signJwt(
      {
        sub: user.id,
        role: user.role,
        iat: now,
        exp: expiresAt,
      },
      context.env.JWT_SECRET
    );

    // Build auth-compatible user object
    const authUser = {
      id: user.id,
      email: body.email,
      aud: 'authenticated',
      role: user.role,
      app_metadata: { role: user.role },
      user_metadata: { full_name: user.full_name },
      created_at: user.created_at,
    };

    const session = {
      user: authUser,
      access_token: token,
      expires_at: expiresAt,
    };

    // Set httpOnly cookie
    const cookie = [
      `auth_token=${token}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Path=/',
      `Max-Age=${60 * 60 * 24 * 7}`,
    ].join('; ');

    return new Response(JSON.stringify({ user: authUser, session }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
};
