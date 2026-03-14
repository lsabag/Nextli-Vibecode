/**
 * Stale contact messages alert — checks for messages matching configured
 * statuses older than N days and sends a Telegram notification.
 *
 * Settings are read from system_settings (alert_stale_days, alert_statuses,
 * alert_telegram_enabled). Defaults: 3 days, status "new", enabled.
 *
 * GET /api/cron/stale-alerts?key=SECRET
 */

interface Env {
  DB: D1Database
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
  CRON_SECRET?: string
}

const DEFAULTS = {
  alert_stale_days: '3',
  alert_statuses: 'new',
  alert_telegram_enabled: 'true',
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
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
    // Read alert settings from DB
    const settingsKeys = Object.keys(DEFAULTS)
    const placeholders = settingsKeys.map(() => '?').join(',')
    const { results: settingsRows } = await db
      .prepare(`SELECT key, value FROM system_settings WHERE key IN (${placeholders})`)
      .bind(...settingsKeys)
      .all<{ key: string; value: string }>()

    const settings: Record<string, string> = { ...DEFAULTS }
    for (const row of settingsRows ?? []) {
      settings[row.key] = row.value
    }

    const staleDays = Math.max(1, parseInt(settings.alert_stale_days, 10) || 3)
    const alertStatuses = settings.alert_statuses.split(',').map(s => s.trim()).filter(Boolean)
    const telegramEnabled = settings.alert_telegram_enabled === 'true'

    if (!telegramEnabled || alertStatuses.length === 0) {
      return Response.json({ skipped: true, reason: 'Alerts disabled or no statuses configured' })
    }

    // Check if we already sent an alert today
    const todayKey = new Date().toISOString().slice(0, 10)
    const lastAlert = await db
      .prepare("SELECT value FROM system_settings WHERE key = 'stale_alert_last_date'")
      .first<{ value: string }>()

    if (lastAlert?.value === todayKey) {
      return Response.json({ skipped: true, reason: 'Already sent today' })
    }

    // Find stale messages matching configured statuses
    const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000).toISOString()
    const statusPlaceholders = alertStatuses.map(() => '?').join(',')
    const { results } = await db
      .prepare(`SELECT name, email, message, created_at, status FROM contact_messages WHERE status IN (${statusPlaceholders}) AND created_at < ? ORDER BY created_at ASC`)
      .bind(...alertStatuses, cutoff)
      .all<{ name: string; email: string; message: string; created_at: string; status: string }>()

    if (!results || results.length === 0) {
      return Response.json({ stale: 0, sent: false })
    }

    // Build Telegram message
    const lines = [
      `⚠️ *${results.length} פניות ממתינות יותר מ-${staleDays} ימים*`,
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
