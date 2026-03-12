/**
 * Setup password handler — POST /api/auth/setup-password
 * Allows setting a password for users who have TEMP_WILL_SET_LATER as their hash.
 * This is a one-time setup endpoint.
 */

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface SetupBody {
  email: string;
  password: string;
}

interface UserRow {
  id: string;
  password_hash: string | null;
}

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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as SetupBody;

    if (!body.email || !body.password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (body.password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = await context.env.DB.prepare(
      `SELECT id, password_hash FROM user_profiles WHERE email = ? LIMIT 1`
    )
      .bind(body.email)
      .first<UserRow>();

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow setup if password hasn't been set yet
    if (user.password_hash && user.password_hash !== 'TEMP_WILL_SET_LATER') {
      return Response.json({ error: 'Password already set. Use login instead.' }, { status: 400 });
    }

    // Hash and store
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashPassword(body.password, salt);

    await context.env.DB.prepare(
      `UPDATE user_profiles SET password_hash = ? WHERE id = ?`
    )
      .bind(hash, user.id)
      .run();

    return Response.json({ success: true, message: 'Password set successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
};
