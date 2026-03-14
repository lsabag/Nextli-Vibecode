/**
 * Cloudflare Pages middleware — injects dynamic OG meta tags from D1.
 * WhatsApp / Facebook crawlers don't execute JS, so we must rewrite the
 * static index.html on the edge before it reaches the crawler.
 */

interface Env {
  DB: D1Database;
}

const OG_KEYS = ['og_title', 'og_description', 'og_image', 'og_url'] as const

export const onRequest: PagesFunction<Env> = async (context) => {
  const response = await context.next()

  // Only rewrite HTML responses (the SPA shell)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  // Skip API routes
  const url = new URL(context.request.url)
  if (url.pathname.startsWith('/api/')) return response

  // Read OG settings from D1
  let ogMap: Record<string, string> = {}
  try {
    const placeholders = OG_KEYS.map(() => '?').join(',')
    const result = await context.env.DB
      .prepare(`SELECT key, value FROM system_settings WHERE key IN (${placeholders})`)
      .bind(...OG_KEYS)
      .all<{ key: string; value: string }>()

    for (const row of result.results ?? []) {
      ogMap[row.key] = row.value
    }
  } catch {
    // DB unavailable — serve original HTML
    return response
  }

  // If no OG settings configured, skip rewriting
  if (Object.keys(ogMap).length === 0) return response

  let html = await response.text()

  if (ogMap.og_title) {
    html = html.replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${escapeAttr(ogMap.og_title)}"`
    )
    html = html.replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${escapeAttr(ogMap.og_title)}"`
    )
    html = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${escapeHtml(ogMap.og_title)}</title>`
    )
  }

  if (ogMap.og_description) {
    html = html.replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${escapeAttr(ogMap.og_description)}"`
    )
    html = html.replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${escapeAttr(ogMap.og_description)}"`
    )
    html = html.replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${escapeAttr(ogMap.og_description)}"`
    )
  }

  if (ogMap.og_image) {
    html = html.replace(
      /<meta property="og:image" content="[^"]*"/,
      `<meta property="og:image" content="${escapeAttr(ogMap.og_image)}"`
    )
  }

  if (ogMap.og_url) {
    html = html.replace(
      /<meta property="og:url" content="[^"]*"/,
      `<meta property="og:url" content="${escapeAttr(ogMap.og_url)}"`
    )
  }

  return new Response(html, {
    status: response.status,
    headers: response.headers,
  })
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
