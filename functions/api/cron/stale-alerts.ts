/**
 * Stale contact messages alert — checks for messages in "new" status
 * older than 3 days and sends a Telegram notification.
 *
 * Call this endpoint periodically (e.g., daily via cron-job.org or CF Worker cron).
 * It stores the last alert timestamp in system_settings to avoid duplicate alerts.
 *
 * GET /api/cron/stale-alerts?key=SECRET
 */

interface Env {
  DB: D1Database
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
  CRON_SECRET?: string
}

const STALE_DAYS = 3

export const onRequestGet: PagesFunction<Env> = async (context) => {
  // Simple auth — require a secret key to prevent abuse
  const url = new URL(context.request.url)
  const key = url.searchParams.get('key')
  if (context.env.CRON_SECRET && key !== context.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = context.env.DB
  const botToken = context.env.TELEGRAM_BOT_TOKEN
  const chatId = context.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    return Response.json({ error: 'Telegram not configured' }, { status: 500 })
  }

  try {
    // Check if we already sent an alert today
    const todayKey = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const lastAlert = await db
      .prepare("SELECT value FROM system_settings WHERE key = 'stale_alert_last_date'")
      .first<{ value: string }>()

    if (lastAlert?.value === todayKey) {
      return Response.json({ skipped: true, reason: 'Already sent today' })
    }

    // Find stale messages (status = 'new' and older than STALE_DAYS)
    const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { results } = await db
      .prepare("SELECT name, email, message, created_at FROM contact_messages WHERE status = 'new' AND created_at < ? ORDER BY created_at ASC")
      .bind(cutoff)
      .all<{ name: string; email: string; message: string; created_at: string }>()

    if (!results || results.length === 0) {
      return Response.json({ stale: 0, sent: false })
    }

    // Build Telegram message
    const lines = [
      `⚠️ *${results.length} פניות ממתינות יותר מ-${STALE_DAYS} ימים*`,
      '',
    ]

    for (const msg of results.slice(0, 10)) {
      const age = Math.floor((Date.now() - new Date(msg.created_at).getTime()) / (1000 * 60 * 60 * 24))
      const preview = msg.message.length > 60 ? msg.message.slice(0, 60) + '…' : msg.message
      lines.push(`• *${msg.name}* (${msg.email}) — ${age} ימים`)
      if (preview) lines.push(`  _${preview}_`)
    }

    if (results.length > 10) {
      lines.push(`\n...ועוד ${results.length - 10} פניות`)
    }

    lines.push('\n🔗 היכנס למערכת הניהול לטפל בפניות')

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n'),
        parse_mode: 'Markdown',
      }),
    })

    // Save last alert date
    await db
      .prepare("INSERT INTO system_settings (key, value) VALUES ('stale_alert_last_date', ?) ON CONFLICT(key) DO UPDATE SET value = ?")
      .bind(todayKey, todayKey)
      .run()

    return Response.json({ stale: results.length, sent: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
