import { useState, useEffect, useRef } from 'react'
import { getSessionFeedback, upsertSessionFeedback } from '@/lib/supabase/queries/workspace'
import { MessageSquare, Star } from 'lucide-react'

type Props = { userId: string; sessionId: string; config?: string }

function parseFeedbackConfig(content?: string): { q1: string; q2: string; showRating: boolean } {
  const defaults = { q1: 'מה למדתי במפגש הזה?', q2: 'מה חסר לי? מה לא הבנתי?', showRating: true }
  if (!content) return defaults
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object') {
      return {
        q1: parsed.q1 || defaults.q1,
        q2: parsed.q2 || defaults.q2,
        showRating: parsed.showRating !== false,
      }
    }
  } catch { /* not JSON */ }
  return defaults
}

export function FeedbackBlock({ userId, sessionId, config: configStr }: Props) {
  const feedbackConfig = parseFeedbackConfig(configStr)
  const [learned, setLearned] = useState('')
  const [missing, setMissing] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLearned('')
    setMissing('')
    setRating(null)
    getSessionFeedback(userId, sessionId).then(fb => {
      if (fb) {
        setLearned(fb.learned)
        setMissing(fb.missing)
        setRating(fb.rating)
      }
    })
  }, [userId, sessionId])

  function scheduleSave(l: string, m: string, r: number | null) {
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(async () => {
      await upsertSessionFeedback(userId, sessionId, l, m, r)
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 1500)
  }

  return (
    <div className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-xl p-6" dir="rtl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-purple-600/20 rounded-xl flex items-center justify-center">
          <MessageSquare size={18} className="text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm">פידבק על המפגש</h3>
          <p className="text-gray-500 text-xs">שתפו אותנו — מה הבנתם ומה חסר לכם</p>
        </div>
        <div className="text-xs">
          {saving && <span className="text-gray-400 animate-pulse">שומר...</span>}
          {saved && <span className="text-green-400">נשמר</span>}
        </div>
      </div>

      {/* Star rating */}
      {feedbackConfig.showRating && (
        <div className="flex items-center gap-1 mb-4">
          <span className="text-xs text-gray-500 ml-2">דירוג:</span>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => { setRating(n); scheduleSave(learned, missing, n) }}
              className="p-0.5 transition-colors"
              aria-label={`דרג ${n} מתוך 5`}
            >
              <Star
                size={20}
                className={n <= (rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
              />
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">{feedbackConfig.q1}</label>
          <textarea
            value={learned}
            onChange={e => { setLearned(e.target.value); scheduleSave(e.target.value, missing, rating) }}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-gray-200 resize-none outline-none focus:border-purple-500/50 placeholder-gray-600"
            rows={3}
            placeholder="ספרו בקצרה מה הנקודות העיקריות שלקחתם..."
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">{feedbackConfig.q2}</label>
          <textarea
            value={missing}
            onChange={e => { setMissing(e.target.value); scheduleSave(learned, e.target.value, rating) }}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-gray-200 resize-none outline-none focus:border-purple-500/50 placeholder-gray-600"
            rows={3}
            placeholder="אם יש משהו שעדיין לא ברור — כתבו כאן ונעזור..."
          />
        </div>
      </div>
    </div>
  )
}
