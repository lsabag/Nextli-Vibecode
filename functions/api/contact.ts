/**
 * Contact form handler — saves message to D1 and sends Telegram notification.
 */

interface Env {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { name, email, message } = (await context.request.json()) as {
      name?: string
      email?: string
      message?: string
    }

    if (!name || !email) {
      return Response.json({ error: 'שם ואימייל הם שדות חובה' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const db = context.env.DB

    // Save to database
    await db
      .prepare('INSERT INTO contact_messages (id, name, email, message) VALUES (?, ?, ?, ?)')
      .bind(id, name, email, message || '')
      .run()

    // Send Telegram notification
    const botToken = context.env.TELEGRAM_BOT_TOKEN
    const chatId = context.env.TELEGRAM_CHAT_ID

    if (botToken && chatId) {
      try {
        const text = [
          '📩 *הודעה חדשה מטופס יצירת קשר*',
          '',
          `*שם:* ${name}`,
          `*אימייל:* ${email}`,
          `*הודעה:* ${message || '(ללא הודעה)'}`,
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
