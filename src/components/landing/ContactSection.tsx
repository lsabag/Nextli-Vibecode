import { useState, useId } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone } from 'lucide-react'
import type { SystemSettingsMap } from '@/types'

type Props = { settings: SystemSettingsMap }

export function ContactSection({ settings }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const formId = useId()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Future: send to Supabase / email service
    setSent(true)
  }

  return (
    <section id="contact" className="max-w-7xl mx-auto px-6 py-20" dir="rtl" aria-labelledby="contact-heading">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact info */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 id="contact-heading" className="text-4xl font-black text-white mb-6">בואו נדבר</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            יש שאלות? רוצים לדעת עוד לפני שנרשמים? אנחנו כאן.
          </p>

          <address className="space-y-4 not-italic">
            {settings.contact_email && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-blue-400" aria-hidden="true" />
                </div>
                <a href={`mailto:${settings.contact_email}`} className="text-gray-300 underline-offset-4 hover:underline hover:text-white transition-colors">
                  {settings.contact_email}
                </a>
              </div>
            )}
            {settings.contact_phone && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-blue-400" aria-hidden="true" />
                </div>
                <a href={`tel:${settings.contact_phone}`} className="text-gray-300 underline-offset-4 hover:underline hover:text-white transition-colors" dir="ltr">
                  {settings.contact_phone}
                </a>
              </div>
            )}
          </address>
        </motion.div>

        {/* Contact form */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 border border-white/10 rounded-2xl p-7"
        >
          {sent ? (
            <div className="text-center py-8" role="alert">
              <div className="text-4xl mb-4" aria-hidden="true">&#x2705;</div>
              <p className="text-white font-semibold">ההודעה נשלחה! נחזור אליך בקרוב.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" aria-label="טופס יצירת קשר">
              <div>
                <label htmlFor={`${formId}-name`} className="sr-only">שם מלא</label>
                <input
                  id={`${formId}-name`}
                  type="text"
                  placeholder="שם מלא"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
                  dir="rtl"
                />
              </div>
              <div>
                <label htmlFor={`${formId}-email`} className="sr-only">אימייל</label>
                <input
                  id={`${formId}-email`}
                  type="email"
                  placeholder="אימייל"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
                  dir="rtl"
                />
              </div>
              <div>
                <label htmlFor={`${formId}-message`} className="sr-only">הודעה</label>
                <textarea
                  id={`${formId}-message`}
                  placeholder="הודעה"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500/50 resize-none"
                  dir="rtl"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                שלח הודעה
              </button>
            </form>
          )}
        </motion.div>
      </div>

    </section>
  )
}
