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

const SETTINGS_KEYS = [
  'alert_new_enabled', 'alert_new_days',
  'alert_in_progress_enabled', 'alert_in_progress_days',
  'alert_telegram_enabled',
]

interface AlertRule { enabled: boolean; days: number; status: string; label: string }

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
    const placeholders = SETTINGS_KEYS.map(() => '?').join(',')
    const { results: settingsRows } = await db
      .prepare(`SELECT key, value FROM system_settings WHERE key IN (${placeholders})`)
      .bind(...SETTINGS_KEYS)
      .all<{ key: string; value: string }>()

    const s: Record<string, string> = {}
    for (const row of settingsRows ?? []) {
      s[row.key] = row.value
    }

    const telegramEnabled = s.alert_telegram_enabled !== 'false'
    const rules: AlertRule[] = [
      { status: 'new', label: 'חדש', enabled: s.alert_new_enabled !== 'false', days: Math.max(1, parseInt(s.alert_new_days, 10) || 3) },
      { status: 'in_progress', label: 'בטיפול', enabled: s.alert_in_progress_enabled === 'true', days: Math.max(1, parseInt(s.alert_in_progress_days, 10) || 5) },
    ]

    const activeRules = rules.filter(r => r.enabled)
    if (!telegramEnabled || activeRules.length === 0) {
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

    // Find stale messages per rule (each status has its own day threshold)
    type MsgRow = { name: string; email: string; message: string; created_at: string; status: string }
    const allStale: { msg: MsgRow; rule: AlertRule; age: number }[] = []

    for (const rule of activeRules) {
      const cutoff = new Date(Date.now() - rule.days * 24 * 60 * 60 * 1000).toISOString()
      const { results } = await db
        .prepare("SELECT name, email, message, created_at, status FROM contact_messages WHERE status = ? AND created_at < ? ORDER BY created_at ASC")
        .bind(rule.status, cutoff)
        .all<MsgRow>()

      for (const msg of results ?? []) {
        const age = Math.floor((Date.now() - new Date(msg.created_at).getTime()) / (1000 * 60 * 60 * 24))
        allStale.push({ msg, rule, age })
      }
    }

    if (allStale.length === 0) {
      return Response.json({ stale: 0, sent: false })
    }

    // Build Telegram message — grouped by status
    const lines: string[] = [`⚠️ *${allStale.length} פניות דורשות תשומת לב*`, '']

    for (const rule of activeRules) {
      const items = allStale.filter(s => s.rule.status === rule.status)
      if (items.length === 0) continue

      lines.push(`📌 *${rule.label}* (${items.length} — יותר מ-${rule.days} ימים):`)
      for (const { msg, age } of items.slice(0, 5)) {
        const preview = msg.message.length > 50 ? msg.message.slice(0, 50) + '…' : msg.message
        lines.push(`  • *${msg.name}* (${msg.email}) — ${age} ימים`)
        if (preview) lines.push(`    _${preview}_`)
      }
      if (items.length > 5) {
        lines.push(`  ...ועוד ${items.length - 5}`)
      }
      lines.push('')
    }

    lines.push('🔗 היכנס למערכת הניהול לטפל בפניות')

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

    return Response.json({ stale: allStale.length, sent: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
