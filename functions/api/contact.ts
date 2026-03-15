/**
 * Contact form handler — saves message to D1 and sends Telegram notification.
 * Includes rate limiting (2 messages per IP per hour) and honeypot spam protection.
 */

import { escapeTelegramMarkdown } from './_auth'

interface Env {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

const MAX_PER_HOUR = 2

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
    const ip = context.request.headers.get('CF-Connecting-IP')
    if (!ip) {
      return Response.json({ error: 'Unable to process request' }, { status: 400 })
    }

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

    if (botToken && chatId) {
      try {
        const safeName = escapeTelegramMarkdown(name)
        const safeEmail = escapeTelegramMarkdown(email)
        const safeMessage = escapeTelegramMarkdown(message || '(ללא הודעה)')
        const text = [
          '📩 *הודעה חדשה מטופס יצירת קשר*',
          '',
          `*שם:* ${safeName}`,
          `*אימייל:* ${safeEmail}`,
          `*הודעה:* ${safeMessage}`,
        ].join('\n')

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'Markdown',
          }),
        })
      } catch {
        // Telegram send failed — message is still saved in DB
      }
    }

    return Response.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
