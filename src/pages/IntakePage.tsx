import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SEOHead } from '@/components/shared/SEOHead'
import { IntakeResult } from '@/components/intake/IntakeResult'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export type IntakeAnswers = {
  tech_level: string
  ai_experience: string
  goal: string
  english_level: string
  availability: string
}

type Question = {
  id: keyof IntakeAnswers
  title: string
  subtitle: string
  options: { value: string; label: string; description: string }[]
}

const questions: Question[] = [
  {
    id: 'tech_level',
    title: 'מה הניסיון שלך עם טכנולוגיה?',
    subtitle: 'זה יעזור לנו להתאים את הקצב והעומק',
    options: [
      { value: 'beginner', label: 'משתמש בסיסי', description: 'אימייל, וורד, אקסל — בלי רקע בפיתוח' },
      { value: 'familiar', label: 'מכיר קצת', description: 'בניתי אתר ב-Wix/WordPress או שיחקתי עם קוד' },
      { value: 'junior', label: 'מתכנת מתחיל', description: 'יודע HTML/CSS, קצת JavaScript' },
      { value: 'experienced', label: 'מפתח עם ניסיון', description: 'עובד עם React / frameworks' },
    ],
  },
  {
    id: 'ai_experience',
    title: 'מה הניסיון שלך עם AI?',
    subtitle: 'כלי AI הם הבסיס של הקורס',
    options: [
      { value: 'none', label: 'אין ניסיון', description: 'לא יודע/ת מה זה בדיוק' },
      { value: 'basic', label: 'שיחקתי קצת', description: 'ניסיתי ChatGPT או כלים דומים' },
      { value: 'regular', label: 'משתמש באופן קבוע', description: 'משתמש/ת ב-AI לעבודה או ללימודים' },
      { value: 'coding', label: 'כותב קוד עם AI', description: 'Copilot, Cursor, Claude Code — חלק מהשגרה' },
    ],
  },
  {
    id: 'goal',
    title: 'מה אתה רוצה לבנות?',
    subtitle: 'נתאים את הפרויקטים למטרות שלך',
    options: [
      { value: 'website', label: 'אתר לעסק', description: 'דף נחיתה, אתר תדמית, או בלוג' },
      { value: 'ecommerce', label: 'חנות / מערכת הזמנות', description: 'מכירה אונליין, ניהול לקוחות' },
      { value: 'app', label: 'אפליקציה / מוצר טכנולוגי', description: 'מוצר עם משתמשים, דאטה, ולוגיקה עסקית' },
      { value: 'explore', label: 'רוצה ללמוד', description: 'עדיין לא יודע/ת — רוצה לגלות את האפשרויות' },
    ],
  },
  {
    id: 'english_level',
    title: 'מה רמת האנגלית שלך?',
    subtitle: 'רוב כלי הפיתוח וה-AI עובדים באנגלית',
    options: [
      { value: 'basic', label: 'בסיסית', description: 'קשה לי לקרוא טקסטים באנגלית' },
      { value: 'moderate', label: 'בינונית', description: 'מבין/ה טקסט כתוב, פחות טכני' },
      { value: 'good', label: 'טובה', description: 'קורא/ת תיעוד טכני בלי בעיה' },
      { value: 'fluent', label: 'שוטפת', description: 'אנגלית שפת עבודה יומיומית' },
    ],
  },
  {
    id: 'availability',
    title: 'כמה זמן בשבוע אתה מוכן להשקיע?',
    subtitle: 'מעבר למפגשים החיים',
    options: [
      { value: 'low', label: '1-2 שעות', description: 'צפייה בחומר + תרגול בסיסי' },
      { value: 'medium', label: '3-5 שעות', description: 'תרגילים + פרויקט אישי' },
      { value: 'high', label: '5+ שעות', description: 'רוצה להתעמק ולבנות דברים אמיתיים' },
    ],
  },
]

export function computeLevel(answers: IntakeAnswers): 'beginner' | 'intermediate' | 'advanced' {
  let score = 0

  // Tech level: 0-3
  const techMap: Record<string, number> = { beginner: 0, familiar: 1, junior: 2, experienced: 3 }
  score += techMap[answers.tech_level] ?? 0

  // AI experience: 0-3
  const aiMap: Record<string, number> = { none: 0, basic: 1, regular: 2, coding: 3 }
  score += aiMap[answers.ai_experience] ?? 0

  // Goal: app pushes up, website/explore push down
  const goalMap: Record<string, number> = { website: 0, explore: 0, ecommerce: 1, app: 2 }
  score += goalMap[answers.goal] ?? 0

  // English: basic pulls down, fluent pushes up
  const engMap: Record<string, number> = { basic: -1, moderate: 0, good: 1, fluent: 1 }
  score += engMap[answers.english_level] ?? 0

  // Score range: -1 to 10
  if (score <= 2) return 'beginner'
  if (score <= 5) return 'intermediate'
  return 'advanced'
}

export default function IntakePage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Partial<IntakeAnswers>>({})
  const [done, setDone] = useState(false)

  const question = questions[currentIndex]
  const progress = ((currentIndex + (answers[question?.id] ? 1 : 0)) / questions.length) * 100

  function selectOption(value: string) {
    const updated = { ...answers, [question.id]: value }
    setAnswers(updated)

    // Auto-advance after short delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setDone(true)
      }
    }, 300)
  }

  function goBack() {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1)
  }

  if (done && answers.tech_level && answers.ai_experience && answers.goal && answers.english_level && answers.availability) {
    return <IntakeResult answers={answers as IntakeAnswers} onRestart={() => { setAnswers({}); setCurrentIndex(0); setDone(false) }} />
  }

  return (
    <main id="main-content" className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4" dir="rtl">
      <SEOHead title="שאלון התאמה" description="בואו נמצא את המסלול המתאים לך" />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white">
            Nextli: <span className="text-blue-400">וייבקוד</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">בואו נמצא את המסלול המתאים לך</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{Math.round(progress)}%</span>
            <span>שאלה {currentIndex + 1} מתוך {questions.length}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <motion.div
              className="h-1.5 rounded-full"
              style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-8"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <h2 className="text-2xl font-bold text-white mb-2">{question.title}</h2>
            <p className="text-gray-500 text-sm mb-6">{question.subtitle}</p>

            <div className="space-y-3">
              {question.options.map(opt => {
                const selected = answers[question.id] === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => selectOption(opt.value)}
                    className={`w-full text-right p-4 rounded-xl border transition-all duration-200 ${
                      selected
                        ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50'
                        : 'bg-white/3 border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="font-semibold text-white text-sm">{opt.label}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{opt.description}</div>
                  </button>
                )
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={goBack}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRight size={14} />
                הקודם
              </button>
              {answers[question.id] && currentIndex < questions.length - 1 && (
                <button
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  הבא
                  <ArrowLeft size={14} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}
