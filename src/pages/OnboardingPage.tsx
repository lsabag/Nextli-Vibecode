import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { SEOHead } from '@/components/shared/SEOHead'
import { getWizardSteps, upsertWizardAnswer } from '@/lib/supabase/queries/wizard'
import { updateUserProfile } from '@/lib/supabase/queries/users'
import { useAuth } from '@/hooks/useAuth'
import { WizardForm } from '@/components/wizard/WizardForm'
import type { WizardStep } from '@/types'

export default function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [steps, setSteps] = useState<WizardStep[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!user) return
    getWizardSteps()
      .then(data => { setSteps(data); setLoading(false) })
      .catch(err => {
        setFetchError(err?.message ?? 'שגיאה בטעינת השאלות')
        setLoading(false)
      })
  }, [user?.id])

  async function handleAnswer(stepId: string, answer: string) {
    if (!user) return
    setSaving(true)
    await upsertWizardAnswer(user.id, stepId, answer)

    if (currentIndex < steps.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      await updateUserProfile(user.id, { onboarding_completed: true })
      setCompleted(true)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <main id="main-content" className="min-h-screen bg-[#0a0a0f] flex items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (fetchError) {
    return (
      <main id="main-content" className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4" dir="rtl">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400 font-semibold mb-2">שגיאה בטעינת השאלות</p>
          <p className="text-gray-500 text-sm mb-4">{fetchError}</p>
          <button
            onClick={() => { setFetchError(null); setLoading(true); getWizardSteps().then(d => { setSteps(d); setLoading(false) }).catch(e => { setFetchError(e?.message ?? 'שגיאה'); setLoading(false) }) }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
          >נסה שוב</button>
        </div>
      </main>
    )
  }

  if (steps.length === 0) {
    return (
      <main id="main-content" className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4" dir="rtl">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-white font-semibold mb-2">השאלון עוד לא הוגדר</p>
          <p className="text-gray-500 text-sm mb-6">המנהל טרם הוסיף שאלות לשאלון הקבלה</p>
          <button
            onClick={() => { updateUserProfile(user!.id, { onboarding_completed: true }).then(() => navigate('/workspace')) }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            המשך לאזור הלמידה
          </button>
        </div>
      </main>
    )
  }

  if (completed) {
    return (
      <main id="main-content" className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4" dir="rtl">
        <SEOHead title="תודה!" noindex />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)' }} />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md text-center"
        >
          <div className="rounded-2xl p-10" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-2xl font-black text-white mb-2">תודה שמילאת!</h1>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              קיבלנו את התשובות שלך. אנחנו שמחים שהצטרפת!<br />
              עכשיו בואו נתחיל ללמוד.
            </p>
            <button
              onClick={() => navigate('/workspace')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-600/20"
            >
              לאזור הלמידה
              <ArrowLeft size={16} />
            </button>
          </div>
        </motion.div>
      </main>
    )
  }

  const currentStep = steps[currentIndex]
  const progress = ((currentIndex + 1) / steps.length) * 100

  return (
    <main id="main-content" className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4" dir="rtl">
      <SEOHead title="שאלון הכרות" noindex />
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-2xl font-black text-white">
            Nextli: <span className="text-blue-400">וייבקוד</span>
          </span>
          <p className="text-gray-500 mt-1 text-sm">בואו נכיר אותך</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{Math.round(progress)}%</span>
            <span>שאלה {currentIndex + 1} מתוך {steps.length}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <motion.div
              className="h-1.5 rounded-full"
              style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          {currentStep && (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-8"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <WizardForm step={currentStep} onAnswer={handleAnswer} saving={saving} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
