import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, Users, ArrowLeft, RotateCcw, CheckCircle2, Sparkles, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { computeLevel, type IntakeAnswers } from '@/pages/IntakePage'
import { supabase } from '@/lib/supabase/client'
import type { Course, CourseSession } from '@/types'

type TrackInfo = {
  title: string
  subtitle: string
  description: string
  highlights: string[]
}

const TRACKS: Record<string, TrackInfo> = {
  beginner: {
    title: 'וייבקוד למתחילים',
    subtitle: 'מאפס לאתר ראשון',
    description: 'קורס מקיף שמתחיל מהבסיס — מה זה פרומפט, איך עובד AI, ואיך בונים אתר שלם בלי ניסיון קודם בתכנות.',
    highlights: ['הסבר מקיף על AI ופרומפטים', 'פרויקט מונחה צעד אחר צעד', 'תמיכה צמודה ותרגול מעשי', 'מתאים ללא רקע טכני'],
  },
  intermediate: {
    title: 'וייבקוד — פיתוח עם AI',
    subtitle: 'מרמה בסיסית לפרויקט מלא',
    description: 'קורס אינטנסיבי לבניית אתרים ואפליקציות מלאות. נניח שיש לך מושג בסיסי ונתמקד ביישום מעשי.',
    highlights: ['בניית אתרים ואפליקציות מלאות', 'React, Tailwind, Supabase', 'פרויקט אישי מותאם', 'קצב מהיר עם בסיס טוב'],
  },
  advanced: {
    title: 'וייבקוד למנוסים',
    subtitle: 'AI-First Development',
    description: 'מסלול למפתחים עם ניסיון שרוצים לשלב AI בתהליך הפיתוח שלהם. ארכיטקטורה, best practices, ופרויקטים מתקדמים.',
    highlights: ['ארכיטקטורה ותכנון מערכות', 'Claude API ו-AI Agents', 'Deploy, CI/CD, ואופטימיזציה', 'פרויקט SaaS מקצה לקצה'],
  },
}

const LEVEL_COLORS: Record<string, { badge: string; border: string; glow: string }> = {
  beginner: { badge: 'bg-green-500/20 text-green-400', border: 'border-green-500/30', glow: 'rgba(34,197,94,0.1)' },
  intermediate: { badge: 'bg-blue-500/20 text-blue-400', border: 'border-blue-500/30', glow: 'rgba(59,130,246,0.1)' },
  advanced: { badge: 'bg-purple-500/20 text-purple-400', border: 'border-purple-500/30', glow: 'rgba(168,85,247,0.1)' },
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'מתחיל',
  intermediate: 'בינוני',
  advanced: 'מנוסה',
}

type Props = {
  answers: IntakeAnswers
  onRestart: () => void
}

export function IntakeResult({ answers, onRestart }: Props) {
  const navigate = useNavigate()
  const level = computeLevel(answers)
  const track = TRACKS[level]
  const colors = LEVEL_COLORS[level]

  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<CourseSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [syllabusOpen, setSyllabusOpen] = useState<string | null>(null)
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'done'>('idle')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('courses').select('*').order('display_order', { ascending: true }),
      supabase.from('course_sessions').select('*').order('session_number', { ascending: true }),
    ]).then(([coursesRes, sessionsRes]) => {
      const allCourses = coursesRes.data ?? []
      setCourses(allCourses)
      setSessions(sessionsRes.data ?? [])

      // Pre-select the first active course
      const active = allCourses.filter(c => c.status === 'active')
      if (active.length > 0) setSelectedCourseId(active[0].id)

      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const activeCourses = courses.filter(c => c.status === 'active')
  const draftCourses = courses.filter(c => c.status === 'draft')
  const hasAnyCourse = activeCourses.length > 0

  const selectedCourse = courses.find(c => c.id === selectedCourseId)
  const isSelectedActive = selectedCourse?.status === 'active'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setFormState('submitting')

    await supabase.from('waitlist').insert({
      id: crypto.randomUUID(),
      full_name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      recommended_level: level,
      answers: JSON.stringify(answers),
      status: isSelectedActive ? 'signup' : 'waiting',
      course_id: selectedCourseId,
      created_at: new Date().toISOString(),
    })

    setFormState('done')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-12" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-2xl font-black text-white">
            Nextli: <span className="text-blue-400">וייבקוד</span>
          </span>
        </div>

        {/* Recommendation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`rounded-2xl border ${colors.border} p-8 mb-6`}
          style={{ background: `linear-gradient(135deg, ${colors.glow} 0%, rgba(255,255,255,0.03) 100%)` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={20} className="text-yellow-400" />
            <span className="text-gray-400 text-sm font-medium">המסלול המומלץ עבורך</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
              {LEVEL_LABELS[level]}
            </span>
          </div>

          <h1 className="text-2xl font-black text-white mb-2">{track.title}</h1>
          <p className="text-blue-400 font-semibold text-sm mb-4">{track.subtitle}</p>
          <p className="text-gray-300 leading-relaxed mb-6">{track.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {track.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">{h}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Available Courses */}
        {!loading && (activeCourses.length > 0 || draftCourses.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6"
          >
            <h2 className="text-lg font-bold text-white mb-3">
              {activeCourses.length + draftCourses.length > 1 ? 'בחר קורס' : 'הקורס הזמין'}
            </h2>

            <div className="space-y-3">
              {/* Active courses first, then drafts */}
              {[...activeCourses, ...draftCourses].map(course => {
                const isActive = course.status === 'active'
                const isSelected = selectedCourseId === course.id
                const courseSessions = sessions.filter(s => s.course_id === course.id)
                const showSyllabus = syllabusOpen === course.id

                return (
                  <div key={course.id}>
                    <button
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`w-full text-right p-5 rounded-xl border transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/40'
                          : 'bg-white/3 border-white/10 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-white font-bold">{course.title}</h3>
                            {isActive ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                                פתוח להרשמה
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                                בקרוב
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{course.description}</p>
                          {courseSessions.length > 0 && (
                            <span className="text-xs text-gray-500 mt-1 inline-block">{courseSessions.length} מפגשים</span>
                          )}
                        </div>
                        {/* Radio indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                          isSelected ? 'border-blue-500 bg-blue-500' : 'border-white/20'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    </button>

                    {/* Syllabus toggle */}
                    {isSelected && courseSessions.length > 0 && (
                      <div className="mt-1 mr-2">
                        <button
                          onClick={() => setSyllabusOpen(showSyllabus ? null : course.id)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
                        >
                          {showSyllabus ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {showSyllabus ? 'הסתר סילבוס' : 'הצג סילבוס'}
                        </button>
                        {showSyllabus && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-white/3 border border-white/8 rounded-lg p-3 mt-1 space-y-2"
                          >
                            {courseSessions.map(s => (
                              <div key={s.id} className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  s.status === 'open' ? 'bg-green-400' : 'bg-gray-600'
                                }`} />
                                <span className="text-xs text-gray-300">
                                  מפגש {s.session_number}: {s.title}
                                </span>
                                {s.status === 'locked' && (
                                  <span className="text-[10px] text-gray-600">(נעול)</span>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Signup / Waitlist Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-8"
        >
          {formState === 'done' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {isSelectedActive ? 'נרשמת בהצלחה!' : 'נרשמת לרשימת ההמתנה!'}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {isSelectedActive
                  ? 'ניצור איתך קשר בקרוב עם כל הפרטים להתחלה'
                  : `הקורס "${selectedCourse?.title}" כרגע בתהליכי בנייה. נעדכן אותך ברגע שנפתח!`
                }
              </p>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 mx-auto text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                חזרה לדף הראשי
                <ArrowLeft size={14} />
              </button>
            </div>
          ) : (
            <>
              {/* Status banner */}
              {selectedCourse && (
                <div className={`flex items-center gap-2 mb-6 p-3 rounded-xl ${
                  isSelectedActive
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-amber-500/10 border border-amber-500/20'
                }`}>
                  {isSelectedActive ? (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400 text-sm font-medium">
                        {selectedCourse.title} — פתוח להרשמה
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock size={14} className="text-amber-400" />
                      <span className="text-amber-400 text-sm font-medium">
                        {selectedCourse.title} — בתהליכי בנייה, השאר פרטים ונעדכן אותך
                      </span>
                    </>
                  )}
                </div>
              )}

              {loading ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" aria-label="טופס הרשמה לקורס">
                  <div>
                    <label htmlFor="intake-name" className="text-sm text-gray-400 block mb-1.5">שם מלא *</label>
                    <input
                      id="intake-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
                      placeholder="ישראל ישראלי"
                    />
                  </div>
                  <div>
                    <label htmlFor="intake-email" className="text-sm text-gray-400 block mb-1.5">אימייל *</label>
                    <input
                      id="intake-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
                      placeholder="name@email.com"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label htmlFor="intake-phone" className="text-sm text-gray-400 block mb-1.5">טלפון <span className="text-gray-600">(אופציונלי)</span></label>
                    <input
                      id="intake-phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
                      placeholder="050-1234567"
                      dir="ltr"
                    />
                  </div>

                  {/* Info chips */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-2.5 py-1.5 rounded-lg">
                      <Star size={12} /> המלצה: {track.title}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-2.5 py-1.5 rounded-lg">
                      <Users size={12} /> רמה: {LEVEL_LABELS[level]}
                    </div>
                    {selectedCourse && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-2.5 py-1.5 rounded-lg">
                        <BookOpen size={12} /> נבחר: {selectedCourse.title}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={formState === 'submitting' || !name.trim() || !email.trim() || !selectedCourseId}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-4 rounded-xl font-semibold transition-colors mt-2"
                  >
                    {formState === 'submitting'
                      ? 'שולח...'
                      : isSelectedActive ? 'הרשמה לקורס' : 'הצטרף לרשימת ההמתנה'
                    }
                  </button>
                </form>
              )}
            </>
          )}
        </motion.div>

        {/* Restart */}
        <div className="text-center mt-6">
          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 mx-auto text-sm text-gray-600 hover:text-gray-400 transition-colors"
          >
            <RotateCcw size={13} />
            מלא שאלון מחדש
          </button>
        </div>
      </div>
    </div>
  )
}
