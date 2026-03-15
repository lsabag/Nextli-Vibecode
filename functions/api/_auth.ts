/**
 * Shared authentication utilities for API handlers.
 * Verifies JWT from auth_token cookie and provides role-based access control.
 */

export interface AuthPayload {
  sub: string   // user ID
  role: string  // 'admin' | 'student' | etc.
  iat: number
  exp: number
}

/**
 * Parse cookies from the Cookie header string.
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  for (const pair of cookieHeader.split(';')) {
    const [name, ...rest] = pair.trim().split('=')
    if (name) {
      cookies[name.trim()] = rest.join('=').trim()
    }
  }
  return cookies
}

/**
 * Verify a JWT token using HS256 (HMAC-SHA256).
 * Returns the payload if valid, null otherwise.
 */
export async function verifyJwt(
  token: string,
  secret: string
): Promise<AuthPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, sigB64] = parts
    const data = `${headerB64}.${payloadB64}`

    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const sigStr = atob(sigB64.replace(/-/g, '+').replace(/_/g, '/'))
    const sigBytes = new Uint8Array(sigStr.length)
    for (let i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i)
    }

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data))
    if (!valid) return null

    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(payloadStr) as AuthPayload

    // Check expiry
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

/**
 * Extract and verify auth from a request's cookies.
 * Returns the auth payload if valid, null if unauthenticated.
 */
export async function getAuth(
  request: Request,
  jwtSecret: string
): Promise<AuthPayload | null> {
  const cookieHeader = request.headers.get('Cookie') || ''
  const cookies = parseCookies(cookieHeader)
  const token = cookies['auth_token']
  if (!token) return null
  return verifyJwt(token, jwtSecret)
}

/**
 * Require authentication — returns 401 Response if not authenticated.
 * Use: const auth = await requireAuth(request, secret); if (auth instanceof Response) return auth;
 */
export async function requireAuth(
  request: Request,
  jwtSecret: string
): Promise<AuthPayload | Response> {
  const auth = await getAuth(request, jwtSecret)
  if (!auth) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }
  return auth
}

/**
 * Require admin role — returns 401/403 Response if not admin.
 */
export async function requireAdmin(
  request: Request,
  jwtSecret: string
): Promise<AuthPayload | Response> {
  const result = await requireAuth(request, jwtSecret)
  if (result instanceof Response) return result
  if (result.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 })
  }
  return result
}

/**
 * Escape Telegram Markdown special characters to prevent injection.
 */
export function escapeTelegramMarkdown(text: string): string {
  return text.replace(/([*_`\[\]()~>#+\-=|{}.!\\])/g, '\\$1')
}
