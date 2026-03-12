import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SEOHead } from '@/components/shared/SEOHead'
import { getPrepChecklist, getItemLinks } from '@/lib/supabase/queries/prep'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle, Circle, ExternalLink, ArrowLeft, Rocket } from 'lucide-react'
import type { PrepChecklistItem } from '@/types'

const STORAGE_KEY = 'nextli-prep-progress'

function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function saveProgress(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export default function PreparationPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<PrepChecklistItem[]>([])
  const [checked, setChecked] = useState<Set<string>>(loadProgress)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId) { setLoading(false); return }
    getPrepChecklist(courseId)
      .then(data => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [courseId])

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      saveProgress(next)
      return next
    })
  }

  const requiredItems = items.filter(i => i.is_required)
  const optionalItems = items.filter(i => !i.is_required)
  const allRequiredDone = requiredItems.every(i => checked.has(i.id))
  const totalChecked = items.filter(i => checked.has(i.id)).length

  function handleContinue() {
    if (user) {
      navigate('/workspace')
    } else {
      navigate('/login')
    }
  }

  function renderItem(item: PrepChecklistItem) {
    const isDone = checked.has(item.id)
    return (
      <motion.button
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => toggle(item.id)}
        className={`w-full text-right flex items-start gap-4 p-5 rounded-2xl border transition-all ${
          isDone
            ? 'bg-green-500/5 border-green-500/20'
            : 'bg-white/5 border-white/10 hover:bg-white/8'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {isDone ? (
            <CheckCircle size={22} className="text-green-400" />
          ) : (
            <Circle size={22} className="text-gray-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${isDone ? 'text-green-300' : 'text-white'}`}>
              {item.title}
            </span>
            {item.is_required && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                חובה
              </span>
            )}
          </div>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed">{item.description}</p>
          {getItemLinks(item).map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 mr-2 transition-colors"
            >
              <ExternalLink size={12} />
              {link.label || link.url}
            </a>
          ))}
        </div>
      </motion.button>
    )
  }

  return (
    <main id="main-content" className="min-h-screen bg-[#0a0a0f] text-white" dir="rtl">
      <SEOHead title="הכנה לקורס" description="רשימת הכנה לפני הקורס — ודאו שאתם מוכנים" />

      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mb-8 transition-colors">
          <ArrowLeft size={14} className="rotate-180" />
          חזרה לדף הבית
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl font-black mb-3">הכנה לקורס</h1>
          <p className="text-gray-400 leading-relaxed">
            כדי שנוכל להתחיל ישר לבנות במפגש הראשון, יש כמה דברים שחשוב לסדר מראש.
            סמנו V על כל שלב שסיימתם.
          </p>
        </div>

        {/* Progress bar */}
        {!loading && items.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{totalChecked} מתוך {items.length} שלבים</span>
              {allRequiredDone && (
                <span className="text-xs text-green-400 font-semibold">כל שלבי החובה הושלמו!</span>
              )}
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-blue-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(totalChecked / items.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-gray-400">רשימת ההכנה עוד לא הוגדרה.</p>
          </div>
        ) : (
          <>
            {/* Required items */}
            {requiredItems.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-bold text-white mb-3">שלבי חובה</h2>
                <div className="space-y-3">
                  {requiredItems.map(renderItem)}
                </div>
              </div>
            )}

            {/* Optional items */}
            {optionalItems.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 mb-3">מומלץ (לא חובה)</h2>
                <div className="space-y-3">
                  {optionalItems.map(renderItem)}
                </div>
              </div>
            )}

            {/* Continue button */}
            <div className="mt-10">
              <button
                onClick={handleContinue}
                disabled={!allRequiredDone}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all ${
                  allRequiredDone
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/10'
                }`}
              >
                <Rocket size={18} />
                {allRequiredDone
                  ? 'מוכנים! בואו נתחיל'
                  : `השלימו את כל שלבי החובה (${requiredItems.filter(i => checked.has(i.id)).length}/${requiredItems.length})`
                }
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
