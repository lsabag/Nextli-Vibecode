/**
 * Contact form handler — saves message to D1 and sends Telegram notification.
 * Includes rate limiting (3 messages per IP per hour) and honeypot spam protection.
 */

interface Env {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

const MAX_PER_HOUR = 3

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      name?: string
      email?: string
      message?: string
      website?: string // honeypot field — real users leave it empty
    }

    // Honeypot: if "website" field is filled, it's a bot
    if (body.website) {
      // Pretend success so bot thinks it worked
      return Response.json({ success: true })
    }

    const { name, email, message } = body

    if (!name || !email) {
      return Response.json({ error: 'שם ואימייל הם שדות חובה' }, { status: 400 })
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'כתובת אימייל לא תקינה' }, { status: 400 })
    }

    const db = context.env.DB
    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown'

    // Rate limiting: check messages from this IP in the last hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { results } = await db
      .prepare('SELECT COUNT(*) as cnt FROM contact_messages WHERE ip = ? AND created_at > ?')
      .bind(ip, hourAgo)
      .all()

    const count = (results[0] as { cnt: number })?.cnt ?? 0
    if (count >= MAX_PER_HOUR) {
      return Response.json({ error: 'שלחתם יותר מדי הודעות. נסו שוב מאוחר יותר.' }, { status: 429 })
    }

    const id = crypto.randomUUID()

    // Save to database (with IP for rate limiting)
    await db
      .prepare('INSERT INTO contact_messages (id, name, email, message, ip) VALUES (?, ?, ?, ?, ?)')
      .bind(id, name, email, message || '', ip)
      .run()

    // Send Telegram notification
    const botToken = context.env.TELEGRAM_BOT_TOKEN
    const chatId = context.env.TELEGRAM_CHAT_ID

    let telegramDebug: unknown = null

    if (botToken && chatId) {
      try {
        const text = [
          '📩 *הודעה חדשה מטופס יצירת קשר*',
          '',
          `*שם:* ${name}`,
          `*אימייל:* ${email}`,
          `*הודעה:* ${message || '(ללא הודעה)'}`,
        ].join('\n')

        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'Markdown',
          }),
        })
        telegramDebug = await tgRes.json()
      } catch (err) {
        telegramDebug = { error: err instanceof Error ? err.message : 'unknown error' }
      }
    } else {
      telegramDebug = { missing: !botToken ? 'TELEGRAM_BOT_TOKEN' : 'TELEGRAM_CHAT_ID' }
    }

    // DEBUG: temporarily return telegram result — remove after testing
    return Response.json({ success: true, _debug: telegramDebug })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
