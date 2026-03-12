/**
 * Auth logout handler — POST /api/auth/logout
 * Clears the auth cookie.
 */

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async () => {
  // Clear the auth cookie by setting it to empty with immediate expiry
  const cookie = [
    'auth_token=',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=0',
  ].join('; ');

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
};
