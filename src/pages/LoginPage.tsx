import { useState, useId } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Link } from 'react-router-dom'
import { SEOHead } from '@/components/shared/SEOHead'
import { trackEvent } from '@/lib/analytics'

type Mode = 'login' | 'signup' | 'setup' | 'change'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const formId = useId()

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setSuccessMsg(null)
    setNewPassword('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      if (mode === 'setup') {
        const res = await fetch('/api/auth/setup-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json() as { error?: string }
        if (!res.ok) throw new Error(data.error || 'שגיאה')
        setSuccessMsg('סיסמה הוגדרה בהצלחה! כעת תוכל להתחבר.')
        setMode('login')
      } else if (mode === 'change') {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ currentPassword: password, newPassword }),
        })
        const data = await res.json() as { error?: string }
        if (!res.ok) throw new Error(data.error || 'שגיאה')
        setSuccessMsg('הסיסמה שונתה בהצלחה!')
        setPassword('')
        setNewPassword('')
      } else if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        setSuccessMsg('החשבון נוצר בהצלחה!')
        trackEvent('sign_up', { method: 'email' })
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          // If server says password not set, switch to setup mode
          if (signInError.message?.includes('setup-password') || signInError.message?.includes('להגדיר סיסמה')) {
            setMode('setup')
            setError('יש להגדיר סיסמה קודם. הזן סיסמה חדשה.')
          } else {
            throw signInError
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות')
    } finally {
      setLoading(false)
    }
  }

  const titles: Record<Mode, string> = {
    login: 'כניסה לחשבון קיים',
    signup: 'צור חשבון חדש',
    setup: 'הגדרת סיסמה ראשונית',
    change: 'שינוי סיסמה',
  }

  const buttonLabels: Record<Mode, string> = {
    login: 'כניסה',
    signup: 'צור חשבון',
    setup: 'הגדר סיסמה',
    change: 'שנה סיסמה',
  }

  return (
    <main id="main-content" className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4" dir="rtl">
      <SEOHead title="התחברות" description="התחבר או צור חשבון חדש בפלטפורמת Nextli וייבקוד" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" aria-label="חזרה לדף הבית" className="text-2xl font-black text-white">
            Nextli: <span className="text-blue-400">וייבקוד</span>
          </Link>
          <h1 className="text-gray-500 mt-2 text-sm">{titles[mode]}</h1>
        </div>

        {error && (
          <div id="login-error" role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div role="status" className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 mb-5 text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" aria-label={titles[mode]} aria-describedby={error ? 'login-error' : undefined}>
          <div>
            <label htmlFor={`${formId}-email`} className="block text-sm font-medium text-gray-400 mb-1">אימייל</label>
            <input
              id={`${formId}-email`}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-600"
              dir="ltr"
            />
          </div>
          <div>
            <label htmlFor={`${formId}-password`} className="block text-sm font-medium text-gray-400 mb-1">
              {mode === 'change' ? 'סיסמה נוכחית' : 'סיסמה'}
            </label>
            <input
              id={`${formId}-password`}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signup' || mode === 'setup' ? 'new-password' : 'current-password'}
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
              placeholder="לפחות 6 תווים"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-600"
              dir="ltr"
            />
          </div>

          {mode === 'change' && (
            <div>
              <label htmlFor={`${formId}-new-password`} className="block text-sm font-medium text-gray-400 mb-1">סיסמה חדשה</label>
              <input
                id={`${formId}-new-password`}
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                aria-describedby={error ? 'login-error' : undefined}
                placeholder="לפחות 6 תווים"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-600"
                dir="ltr"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold transition-colors mt-2"
          >
            {loading ? 'אנא המתן...' : buttonLabels[mode]}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-6 space-y-2">
          {mode === 'login' && (
            <>
              <p>
                אין לך חשבון?{' '}
                <button onClick={() => switchMode('signup')} className="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline">הרשמה</button>
              </p>
              <p>
                <button onClick={() => switchMode('setup')} className="text-gray-500 hover:text-gray-400 text-xs underline-offset-4 hover:underline">הגדרת סיסמה ראשונית</button>
                {' | '}
                <button onClick={() => switchMode('change')} className="text-gray-500 hover:text-gray-400 text-xs underline-offset-4 hover:underline">שינוי סיסמה</button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p>
              כבר יש לך חשבון?{' '}
              <button onClick={() => switchMode('login')} className="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline">כניסה</button>
            </p>
          )}
          {(mode === 'setup' || mode === 'change') && (
            <p>
              <button onClick={() => switchMode('login')} className="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline">חזרה לכניסה</button>
            </p>
          )}
        </div>
      </motion.div>
    </main>
  )
}
