import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPromptLibraryPreview, getSystemSettings } from '@/lib/supabase/queries/landing'
import type { PromptLibraryItem } from '@/types'

// ── Showcase text defaults (editable from admin) ────────────────────────────
const SHOWCASE_DEFAULTS: Record<string, string> = {
  terminal_heading: 'ספריית הפרומפטים של Nextli',
  terminal_subtitle: 'פרומפטים מקצועיים מוכנים לשימוש — בחרו, התאימו, וצרו',
  terminal_result_line1: 'מוכן לשימוש! הדביקו את הפרומפט הזה ב-Claude, ChatGPT, או כל כלי AI.',
  terminal_result_line2: 'החליפו את ה-[placeholders] בתוכן האמיתי שלכם.',
  terminal_generating: 'AI מייצר...',
  beforeafter_heading: 'ההבדל בין פרומפט טוב לבינוני',
  beforeafter_subtitle: 'בקורס נלמד לכתוב פרומפטים שנותנים תוצאות מדויקות בפעם הראשונה',
  beforeafter_bad_result: 'תוצאה: לא מה שרצית. חוזרים שוב ושוב.',
  beforeafter_good_result: 'תוצאה מדויקת בפעם הראשונה.',
  beforeafter_cta: 'את זה תלמדו בקורס',
  cards_heading: 'ספריית הפרומפטים של Nextli',
  cards_subtitle: 'לחצו על קלף כדי לראות את הפרומפט המלא',
  cards_flip_hint: 'לחצו להצגת הפרומפט',
  chat_heading: 'העוזר שמלמד אותך לשאול נכון',
  chat_subtitle: 'במקום לנחש — תקבלו פרומפטים מנוסחים שעובדים מהפעם הראשונה',
  chat_bot_name: 'Nextli AI Helper',
  chat_status: 'מחובר',
}

type ShowcaseTexts = Record<string, string>
type VariantVisibility = Record<number, boolean>
type BeforeAfterItem = { before: string; after: string; label: string }
type ChatScenario = { userMsg: string; aiSuggestion: string; aiExplain: string; result: string }

const VARIANT_KEYS = ['terminal', 'beforeafter', 'cards', 'chat'] as const

// ── Demo data defaults ────────────────────────────────────────────────────
const DEFAULT_DEMO_PROMPTS: Pick<PromptLibraryItem, 'id' | 'title' | 'content' | 'category'>[] = [
  { id: 'd1', title: 'בניית Landing Page', category: 'פיתוח', content: 'בנה לי דף נחיתה מודרני עם סקשן Hero, גריד פיצ׳רים, המלצות לקוחות ו-CTA — השתמש ב-React, Tailwind CSS ו-Framer Motion לאנימציות. העיצוב צריך להיות RTL עם תמיכה מלאה בעברית.' },
  { id: 'd2', title: 'דיבאג קוד', category: 'דיבאג', content: 'קיבלתי את השגיאה הזו: [הדבק שגיאה]. הנה הקוד שלי: [הדבק קוד]. עזור לי למצוא את הבאג, לתקן אותו, ולהסביר מה השתבש כדי שאלמד מזה.' },
  { id: 'd3', title: 'עיצוב רספונסיבי', category: 'עיצוב', content: 'הפוך את הקומפוננטה הזו לרספונסיבית מלאה בעיצוב RTL: mobile-first עם עמודה אחת, טאבלט עם 2 עמודות, ודסקטופ עם 3 עמודות. הוסף מעברים חלקים בין הגדלים.' },
  { id: 'd4', title: 'אופטימיזציית ביצועים', category: 'ביצועים', content: 'נתח את קומפוננטת ה-React הזו לבעיות ביצועים. הוסף memoization במקומות הנדרשים, מטב רנדורים מיותרים, ויישם lazy loading לאלמנטים כבדים.' },
  { id: 'd5', title: 'כתיבת טסטים', category: 'בדיקות', content: 'כתוב טסטים מקיפים לפונקציה הזו באמצעות Vitest. כסה מקרי קצה, טיפול בשגיאות, וודא כיסוי מלא של כל הענפים.' },
]

const DEFAULT_BEFORE_AFTER: BeforeAfterItem[] = [
  { before: '"תעשה לי אתר יפה"', after: 'בנה לי דף נחיתה מודרני עם סקשן Hero, גריד פיצ׳רים, המלצות לקוחות ו-CTA — השתמש ב-React, Tailwind CSS ו-Framer Motion לאנימציות. העיצוב צריך להיות RTL עם תמיכה מלאה בעברית.', label: 'פרומפט מעורפל vs. מקצועי' },
  { before: '"תתקן לי את הבאג"', after: 'קיבלתי את השגיאה הזו: [הדבק שגיאה]. הנה הקוד שלי: [הדבק קוד]. עזור לי למצוא את הבאג, לתקן אותו, ולהסביר מה השתבש כדי שאלמד מזה.', label: 'בקשת דיבאג גנרית vs. ממוקדת' },
  { before: '"תעשה רספונסיבי"', after: 'הפוך את הקומפוננטה הזו לרספונסיבית מלאה בעיצוב RTL: mobile-first עם עמודה אחת, טאבלט עם 2 עמודות, ודסקטופ עם 3 עמודות. הוסף מעברים חלקים בין הגדלים.', label: 'הנחיה כללית vs. מדויקת' },
]

const DEFAULT_CHAT_SCENARIOS: ChatScenario[] = [
  { userMsg: 'אני רוצה לבנות דף נחיתה לסטארטאפ שלי', aiSuggestion: 'בנה לי דף נחיתה מודרני עם סקשן Hero, גריד פיצ׳רים, המלצות לקוחות ו-CTA — השתמש ב-React, Tailwind CSS ו-Framer Motion לאנימציות. העיצוב צריך להיות RTL עם תמיכה מלאה בעברית.', aiExplain: 'הנה פרומפט מוכן שיתן לך בדיוק את מה שאתה צריך:', result: 'דף נחיתה RTL עם אנימציות, רספונסיבי, מוכן לפרודקשן' },
  { userMsg: 'יש לי באג ואני לא מוצא אותו...', aiSuggestion: 'קיבלתי את השגיאה הזו: [הדבק שגיאה]. הנה הקוד שלי: [הדבק קוד]. עזור לי למצוא את הבאג, לתקן אותו, ולהסביר מה השתבש כדי שאלמד מזה.', aiExplain: 'השתמש בפרומפט הזה — הוא ממוקד ומבקש גם הסבר:', result: 'באג מתוקן + הסבר ללמידה' },
  { userMsg: 'איך הופכים קומפוננטה לרספונסיבית?', aiSuggestion: 'הפוך את הקומפוננטה הזו לרספונסיבית מלאה בעיצוב RTL: mobile-first עם עמודה אחת, טאבלט עם 2 עמודות, ודסקטופ עם 3 עמודות. הוסף מעברים חלקים בין הגדלים.', aiExplain: 'הנה פרומפט שמפרט בדיוק את הגריד שאתה רוצה:', result: 'קומפוננטה רספונסיבית RTL מ-mobile עד desktop' },
]

type ShowcaseConfig = {
  texts: ShowcaseTexts
  visibility: VariantVisibility
  demoPrompts: Pick<PromptLibraryItem, 'id' | 'title' | 'content' | 'category'>[]
  beforeAfter: BeforeAfterItem[]
  chatScenarios: ChatScenario[]
}

function useShowcaseConfig(): ShowcaseConfig {
  const [texts, setTexts] = useState<ShowcaseTexts>(SHOWCASE_DEFAULTS)
  const [visibility, setVisibility] = useState<VariantVisibility>({ 0: true, 1: true, 2: true, 3: true })
  const [demoPrompts, setDemoPrompts] = useState(DEFAULT_DEMO_PROMPTS)
  const [beforeAfter, setBeforeAfter] = useState(DEFAULT_BEFORE_AFTER)
  const [chatScenarios, setChatScenarios] = useState(DEFAULT_CHAT_SCENARIOS)

  useEffect(() => {
    getSystemSettings().then(settings => {
      const merged = { ...SHOWCASE_DEFAULTS }
      for (const key of Object.keys(SHOWCASE_DEFAULTS)) {
        const stored = settings['prompt_showcase_' + key]
        if (stored) merged[key] = stored
      }
      setTexts(merged)

      const vis: VariantVisibility = {}
      VARIANT_KEYS.forEach((v, i) => {
        const stored = settings['prompt_showcase_visible_' + v]
        vis[i] = stored === undefined ? true : stored === 'true'
      })
      setVisibility(vis)

      // Load content JSON
      try {
        const dp = settings['prompt_showcase_demo_prompts']
        if (dp) {
          const parsed = JSON.parse(dp) as { title: string; category: string; content: string }[]
          setDemoPrompts(parsed.map((p, i) => ({ id: `d${i + 1}`, ...p })))
        }
      } catch { /* use defaults */ }
      try {
        const ba = settings['prompt_showcase_before_after']
        if (ba) setBeforeAfter(JSON.parse(ba))
      } catch { /* use defaults */ }
      try {
        const cs = settings['prompt_showcase_chat_scenarios']
        if (cs) setChatScenarios(JSON.parse(cs))
      } catch { /* use defaults */ }
    }).catch(() => {})
  }, [])

  return { texts, visibility, demoPrompts, beforeAfter, chatScenarios }
}

// ── Variant selector (dev only) ─────────────────────────────────────────────
const VARIANT_NAMES = ['Terminal', 'Before/After', 'Cards', 'Chat'] as const
type Variant = 0 | 1 | 2 | 3

export function PromptHelperPreview() {
  const [prompts, setPrompts] = useState<Pick<PromptLibraryItem, 'id' | 'title' | 'content' | 'category'>[]>([])
  const [loading, setLoading] = useState(true)
  const [variant, setVariant] = useState<Variant | null>(null)
  const { texts, visibility, demoPrompts, beforeAfter, chatScenarios } = useShowcaseConfig()

  // Visible variant indices
  const visibleVariants = ([0, 1, 2, 3] as Variant[]).filter(i => visibility[i])

  // Auto-select first visible variant on load
  useEffect(() => {
    if (variant === null && visibleVariants.length > 0) {
      setVariant(visibleVariants[0])
    } else if (variant !== null && !visibility[variant] && visibleVariants.length > 0) {
      setVariant(visibleVariants[0])
    }
  }, [visibility, variant, visibleVariants])

  useEffect(() => {
    getPromptLibraryPreview()
      .then(data => {
        setPrompts(data.length >= 4 ? data : demoPrompts)
        setLoading(false)
      })
      .catch(() => { setPrompts(demoPrompts); setLoading(false) })
  }, [demoPrompts])

  if (loading) return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
      </div>
    </section>
  )

  // If all variants are disabled, hide the entire section
  if (visibleVariants.length === 0) return null

  const activeVariant = variant ?? visibleVariants[0]

  return (
    <section className="max-w-7xl mx-auto px-6 py-20" dir="rtl" aria-labelledby="prompts-heading">
      {/* Variant switcher — only show if more than 1 variant is active */}
      {visibleVariants.length > 1 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {visibleVariants.map(i => (
            <button
              key={i}
              onClick={() => setVariant(i)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeVariant === i
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {VARIANT_NAMES[i]}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeVariant}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeVariant === 0 && <TerminalVariant prompts={prompts} texts={texts} />}
          {activeVariant === 1 && <BeforeAfterVariant prompts={prompts} texts={texts} beforeAfter={beforeAfter} />}
          {activeVariant === 2 && <CardsVariant prompts={prompts} texts={texts} />}
          {activeVariant === 3 && <ChatVariant prompts={prompts} texts={texts} chatScenarios={chatScenarios} />}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

type VariantProps = {
  prompts: Pick<PromptLibraryItem, 'id' | 'title' | 'content' | 'category'>[]
  texts: ShowcaseTexts
  beforeAfter?: BeforeAfterItem[]
  chatScenarios?: ChatScenario[]
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT 1: Terminal / IDE Simulation
// ─────────────────────────────────────────────────────────────────────────────
function TerminalVariant({ prompts, texts }: VariantProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [showResult, setShowResult] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null)

  const prompt = prompts[activeIdx]

  useEffect(() => {
    setTypedText('')
    setShowResult(false)
    let i = 0
    const text = prompt.content
    intervalRef.current = setInterval(() => {
      i++
      setTypedText(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(intervalRef.current!)
        setTimeout(() => setShowResult(true), 400)
      }
    }, 18)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [activeIdx, prompt.content])

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
        <h2 id="prompts-heading" className="text-4xl font-black text-white mb-3">{texts.terminal_heading}</h2>
        <p className="text-gray-400 max-w-lg mx-auto">{texts.terminal_subtitle}</p>
      </motion.div>

      {/* Prompt tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 justify-center flex-wrap">
        {prompts.map((p, i) => (
          <button key={p.id} onClick={() => setActiveIdx(i)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
              activeIdx === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >{p.title}</button>
        ))}
      </div>

      {/* Terminal window */}
      <div className="bg-[#0d0d14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-3xl mx-auto">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[10px] text-gray-500 font-mono mr-3">nextli-prompt-helper</span>
          <span className="text-[10px] text-gray-600 font-mono mr-auto" dir="ltr">~/{prompt.category}</span>
        </div>

        {/* Terminal body */}
        <div className="p-5 font-mono text-sm min-h-[200px]" dir="ltr">
          {/* Prompt line */}
          <div className="flex items-start gap-2 mb-4">
            <span className="text-green-400 shrink-0 select-none">&gt;</span>
            <span className="text-gray-200 leading-relaxed">
              {typedText}
              {typedText.length < prompt.content.length && (
                <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />
              )}
            </span>
          </div>

          {/* Result */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-white/5 pt-4 mt-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs">{texts.terminal_generating}</span>
                </div>
                <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3 text-green-300/80 text-xs leading-relaxed">
                  <span className="text-green-400">// </span>
                  {texts.terminal_result_line1}
                  <br /><span className="text-green-400">// </span>
                  {texts.terminal_result_line2}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT 2: Before / After
// ─────────────────────────────────────────────────────────────────────────────
function BeforeAfterVariant({ texts, beforeAfter = DEFAULT_BEFORE_AFTER }: VariantProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
        <h2 id="prompts-heading" className="text-4xl font-black text-white mb-3">{texts.beforeafter_heading}</h2>
        <p className="text-gray-400 max-w-lg mx-auto">{texts.beforeafter_subtitle}</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {beforeAfter.map((item, i) => (
          <button key={i} onClick={() => setActiveIdx(i)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
              activeIdx === i ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >{item.label}</button>
        ))}
      </div>

      {/* Before / After cards */}
      <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {/* Before */}
        <motion.div
          key={`before-${activeIdx}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-red-500/5 border border-red-500/15 rounded-2xl p-6 relative"
        >
          <div className="absolute -top-3 right-4 bg-red-500/20 text-red-400 text-[10px] font-bold px-3 py-1 rounded-full border border-red-500/20">
            BEFORE
          </div>
          <div className="mt-2">
            <p className="text-red-300/60 text-sm font-mono leading-relaxed" dir="ltr">
              {beforeAfter[activeIdx].before}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-red-400/60 text-[10px]">{texts.beforeafter_bad_result}</span>
          </div>
        </motion.div>

        {/* After */}
        <motion.div
          key={`after-${activeIdx}`}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-green-500/5 border border-green-500/15 rounded-2xl p-6 relative"
        >
          <div className="absolute -top-3 right-4 bg-green-500/20 text-green-400 text-[10px] font-bold px-3 py-1 rounded-full border border-green-500/20">
            AFTER
          </div>
          <div className="mt-2">
            <p className="text-green-300/80 text-sm font-mono leading-relaxed" dir="ltr">
              {beforeAfter[activeIdx].after}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400/80 text-[10px]">{texts.beforeafter_good_result}</span>
          </div>
        </motion.div>
      </div>

      {/* Arrow between */}
      <div className="flex justify-center my-6">
        <div className="bg-gradient-to-l from-blue-500 to-purple-500 text-white text-xs font-bold px-5 py-2 rounded-full shadow-lg shadow-blue-500/20">
          {texts.beforeafter_cta}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT 3: Interactive Cards with flip
// ─────────────────────────────────────────────────────────────────────────────
function CardsVariant({ prompts, texts }: VariantProps) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)

  function toggleFlip(id: string) {
    setFlipped(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleCopy(e: React.MouseEvent, content: string, id: string) {
    e.stopPropagation()
    await navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const COLORS = [
    { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20', tag: 'bg-blue-500/20 text-blue-400', glow: 'shadow-blue-500/10' },
    { bg: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-500/20', tag: 'bg-purple-500/20 text-purple-400', glow: 'shadow-purple-500/10' },
    { bg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/20', tag: 'bg-emerald-500/20 text-emerald-400', glow: 'shadow-emerald-500/10' },
    { bg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/20', tag: 'bg-amber-500/20 text-amber-400', glow: 'shadow-amber-500/10' },
    { bg: 'from-rose-500/10 to-rose-600/5', border: 'border-rose-500/20', tag: 'bg-rose-500/20 text-rose-400', glow: 'shadow-rose-500/10' },
  ]

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
        <h2 id="prompts-heading" className="text-4xl font-black text-white mb-3">{texts.cards_heading}</h2>
        <p className="text-gray-400 max-w-lg mx-auto">{texts.cards_subtitle}</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {prompts.slice(0, 5).map((p, i) => {
          const color = COLORS[i % COLORS.length]
          const isFlipped = flipped.has(p.id)

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onClick={() => toggleFlip(p.id)}
              className="cursor-pointer [perspective:1000px]"
            >
              <div className={`relative w-full h-48 transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                {/* Front */}
                <div className={`absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br ${color.bg} border ${color.border} rounded-2xl p-5 flex flex-col justify-between shadow-lg ${color.glow}`}>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color.tag}`}>
                      {p.category}
                    </span>
                    <h3 className="text-white font-bold text-lg mt-3">{p.title}</h3>
                  </div>
                  <p className="text-gray-500 text-[10px]">{texts.cards_flip_hint}</p>
                </div>

                {/* Back */}
                <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#0d0d14] border ${color.border} rounded-2xl p-5 flex flex-col justify-between`}>
                  <p className="text-gray-300 text-xs font-mono leading-relaxed line-clamp-5" dir="ltr">
                    {p.content}
                  </p>
                  <button
                    onClick={(e) => handleCopy(e, p.content, p.id)}
                    className="self-start text-[10px] text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1 rounded-lg transition-all mt-2"
                  >
                    {copied === p.id ? 'הועתק!' : 'העתק'}
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT 4: Chat-style UI
// ─────────────────────────────────────────────────────────────────────────────
function ChatVariant({ texts, chatScenarios = DEFAULT_CHAT_SCENARIOS }: VariantProps) {
  const [activeChat, setActiveChat] = useState(0)
  const [step, setStep] = useState(0) // 0=user msg, 1=ai thinking, 2=ai suggestion, 3=result
  useEffect(() => {
    setStep(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setStep(1), 600))
    timers.push(setTimeout(() => setStep(2), 1800))
    timers.push(setTimeout(() => setStep(3), 3200))
    return () => timers.forEach(clearTimeout)
  }, [activeChat])

  const chat = chatScenarios[activeChat]

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
        <h2 id="prompts-heading" className="text-4xl font-black text-white mb-3">{texts.chat_heading}</h2>
        <p className="text-gray-400 max-w-lg mx-auto">{texts.chat_subtitle}</p>
      </motion.div>

      {/* Scenario tabs */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {chatScenarios.map((s, i) => (
          <button key={i} onClick={() => setActiveChat(i)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
              activeChat === i ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >{s.userMsg.slice(0, 25)}...</button>
        ))}
      </div>

      {/* Chat window */}
      <div className="bg-[#0d0d14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white/5 border-b border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">N</div>
          <div>
            <p className="text-white text-sm font-medium">{texts.chat_bot_name}</p>
            <p className="text-green-400 text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {texts.chat_status}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="p-5 space-y-4 min-h-[280px]">
          {/* User message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white/10 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%]">
              <p className="text-white text-sm">{chat.userMsg}</p>
            </div>
          </motion.div>

          {/* AI thinking */}
          {step >= 1 && step < 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* AI suggestion */}
          {step >= 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                <p className="text-blue-300 text-xs mb-2">{chat.aiExplain}</p>
                <div className="bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 font-mono text-xs text-gray-300 leading-relaxed" dir="ltr">
                  {chat.aiSuggestion}
                </div>
              </div>
            </motion.div>
          )}

          {/* Result badge */}
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center"
            >
              <div className="bg-gradient-to-l from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full px-5 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-medium">{chat.result}</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
