import { useState, useId } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Link } from 'react-router-dom'
import { SEOHead } from '@/components/shared/SEOHead'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const formId = useId()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        setSuccessMsg('נשלח אימייל אישור! בדוק את תיבת הדואר שלך.')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-gray-500 mt-2 text-sm">
            {isSignUp ? 'צור חשבון חדש' : 'כניסה לחשבון קיים'}
          </h1>
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

        <form onSubmit={handleSubmit} className="space-y-4" aria-label={isSignUp ? 'טופס הרשמה' : 'טופס התחברות'} aria-describedby={error ? 'login-error' : undefined}>
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
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-600"
              dir="ltr"
            />
          </div>
          <div>
            <label htmlFor={`${formId}-password`} className="block text-sm font-medium text-gray-400 mb-1">סיסמה</label>
            <input
              id={`${formId}-password`}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              aria-invalid={!!error}
              placeholder="לפחות 6 תווים"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-600"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold transition-colors mt-2"
          >
            {loading ? 'אנא המתן...' : isSignUp ? 'צור חשבון' : 'כניסה'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {isSignUp ? 'כבר יש לך חשבון?' : 'אין לך חשבון?'}{' '}
          <button
            onClick={() => { setIsSignUp(v => !v); setError(null); setSuccessMsg(null) }}
            className="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? 'כניסה' : 'הרשמה'}
          </button>
        </p>
      </motion.div>
    </main>
  )
}
