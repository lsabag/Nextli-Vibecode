/**
 * Change password handler — POST /api/auth/change-password
 * Requires valid auth cookie + current password + new password.
 * The JWT must match the user whose password is being changed.
 */

import { getAuth } from '../_auth'

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface ChangeBody {
  currentPassword: string;
  newPassword: string;
}

interface UserRow {
  id: string;
  email: string;
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

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(':');
  if (!saltB64 || !hashB64) return false;
  const salt = new Uint8Array(atob(saltB64).split('').map(c => c.charCodeAt(0)));
  const result = await hashPassword(password, salt);
  return result === stored;
}

const MIN_PASSWORD_LENGTH = 8;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Require authentication via cookie
    const auth = await getAuth(context.request, context.env.JWT_SECRET);
    if (!auth) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = (await context.request.json()) as ChangeBody;

    if (!body.currentPassword || !body.newPassword) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (body.newPassword.length < MIN_PASSWORD_LENGTH) {
      return Response.json({ error: `הסיסמה החדשה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים` }, { status: 400 });
    }

    if (!/[a-zA-Z]/.test(body.newPassword) || !/[0-9]/.test(body.newPassword)) {
      return Response.json({ error: 'הסיסמה חייבת להכיל לפחות אות אחת ומספר אחד' }, { status: 400 });
    }

    // Look up user by JWT sub (not by user-supplied email)
    const user = await context.env.DB.prepare(
      `SELECT id, email, password_hash FROM user_profiles WHERE id = ? LIMIT 1`
    )
      .bind(auth.sub)
      .first<UserRow>();

    if (!user || !user.password_hash || user.password_hash === 'TEMP_WILL_SET_LATER') {
      // Generic error — don't reveal whether user exists
      return Response.json({ error: 'הפרטים שגויים' }, { status: 401 });
    }

    const valid = await verifyPassword(body.currentPassword, user.password_hash);
    if (!valid) {
      // Same generic error
      return Response.json({ error: 'הפרטים שגויים' }, { status: 401 });
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashPassword(body.newPassword, salt);

    await context.env.DB.prepare(
      `UPDATE user_profiles SET password_hash = ? WHERE id = ?`
    )
      .bind(hash, user.id)
      .run();

    return Response.json({ success: true, message: 'הסיסמה שונתה בהצלחה' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
};
