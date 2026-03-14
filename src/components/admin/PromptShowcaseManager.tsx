import { useEffect, useState } from 'react'
import { getAdminSystemSettings, updateSystemSetting } from '@/lib/supabase/queries/admin'
import { Save, RotateCcw, ChevronDown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { useAdminDirty } from '@/hooks/useAdminDirty'

// ── Default texts per variant ────────────────────────────────────────────────

const DEFAULTS: Record<string, string> = {
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

const VARIANT_LABELS: Record<string, string> = {
  terminal: 'Terminal — סימולציית טרמינל',
  beforeafter: 'Before/After — לפני ואחרי',
  cards: 'Cards — קלפים אינטראקטיביים',
  chat: 'Chat — ממשק צ׳אט',
}

const FIELD_LABELS: Record<string, string> = {
  terminal_heading: 'כותרת ראשית',
  terminal_subtitle: 'כותרת משנה',
  terminal_result_line1: 'שורת תוצאה 1',
  terminal_result_line2: 'שורת תוצאה 2',
  terminal_generating: 'טקסט "מייצר..."',
  beforeafter_heading: 'כותרת ראשית',
  beforeafter_subtitle: 'כותרת משנה',
  beforeafter_bad_result: 'טקסט תוצאה שלילית',
  beforeafter_good_result: 'טקסט תוצאה חיובית',
  beforeafter_cta: 'טקסט CTA',
  cards_heading: 'כותרת ראשית',
  cards_subtitle: 'כותרת משנה',
  cards_flip_hint: 'טקסט רמז ללחיצה',
  chat_heading: 'כותרת ראשית',
  chat_subtitle: 'כותרת משנה',
  chat_bot_name: 'שם הבוט',
  chat_status: 'סטטוס בוט',
}

const PREFIX = 'prompt_showcase_'
const VARIANTS = ['terminal', 'beforeafter', 'cards', 'chat'] as const
const VISIBILITY_PREFIX = 'prompt_showcase_visible_'

function getVariantKeys(variant: string): string[] {
  return Object.keys(DEFAULTS).filter(k => k.startsWith(variant + '_'))
}

// ── Default content data ────────────────────────────────────────────────────

type DemoPrompt = { title: string; category: string; content: string }
type BeforeAfterItem = { before: string; after: string; label: string }
type ChatScenario = { userMsg: string; aiSuggestion: string; aiExplain: string; result: string }

const DEFAULT_DEMO_PROMPTS: DemoPrompt[] = [
  { title: 'בניית Landing Page', category: 'פיתוח', content: 'בנה לי דף נחיתה מודרני עם סקשן Hero, גריד פיצ׳רים, המלצות לקוחות ו-CTA — השתמש ב-React, Tailwind CSS ו-Framer Motion לאנימציות. העיצוב צריך להיות RTL עם תמיכה מלאה בעברית.' },
  { title: 'דיבאג קוד', category: 'דיבאג', content: 'קיבלתי את השגיאה הזו: [הדבק שגיאה]. הנה הקוד שלי: [הדבק קוד]. עזור לי למצוא את הבאג, לתקן אותו, ולהסביר מה השתבש כדי שאלמד מזה.' },
  { title: 'עיצוב רספונסיבי', category: 'עיצוב', content: 'הפוך את הקומפוננטה הזו לרספונסיבית מלאה בעיצוב RTL: mobile-first עם עמודה אחת, טאבלט עם 2 עמודות, ודסקטופ עם 3 עמודות. הוסף מעברים חלקים בין הגדלים.' },
  { title: 'אופטימיזציית ביצועים', category: 'ביצועים', content: 'נתח את קומפוננטת ה-React הזו לבעיות ביצועים. הוסף memoization במקומות הנדרשים, מטב רנדורים מיותרים, ויישם lazy loading לאלמנטים כבדים.' },
  { title: 'כתיבת טסטים', category: 'בדיקות', content: 'כתוב טסטים מקיפים לפונקציה הזו באמצעות Vitest. כסה מקרי קצה, טיפול בשגיאות, וודא כיסוי מלא של כל הענפים.' },
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

// ── Shared input component ──────────────────────────────────────────────────

function Field({ label, value, onChange, dir = 'rtl' }: { label: string; value: string; onChange: (v: string) => void; dir?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-gray-400 block">{label}</label>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
        dir={dir}
      />
    </div>
  )
}

function TextAreaField({ label, value, onChange, dir = 'rtl' }: { label: string; value: string; onChange: (v: string) => void; dir?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-gray-400 block">{label}</label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)} rows={2}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors resize-none"
        dir={dir}
      />
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function PromptShowcaseManager() {
  const [values, setValues] = useState<Record<string, string>>({ ...DEFAULTS })
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    terminal: true, beforeafter: true, cards: true, chat: true,
  })
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  // Content state
  const [demoPrompts, setDemoPrompts] = useState<DemoPrompt[]>(DEFAULT_DEMO_PROMPTS)
  const [beforeAfter, setBeforeAfter] = useState<BeforeAfterItem[]>(DEFAULT_BEFORE_AFTER)
  const [chatScenarios, setChatScenarios] = useState<ChatScenario[]>(DEFAULT_CHAT_SCENARIOS)
  const [contentDirty, setContentDirty] = useState<Set<string>>(new Set())

  useEffect(() => {
    getAdminSystemSettings().then(settings => {
      const merged = { ...DEFAULTS }
      for (const key of Object.keys(DEFAULTS)) {
        const stored = settings[PREFIX + key]
        if (stored !== undefined) merged[key] = stored
      }
      setValues(merged)

      const vis: Record<string, boolean> = {}
      for (const v of VARIANTS) {
        const stored = settings[VISIBILITY_PREFIX + v]
        vis[v] = stored === undefined ? true : stored === 'true'
      }
      setVisibility(vis)

      // Load content JSON
      try {
        const dp = settings[PREFIX + 'demo_prompts']
        if (dp) setDemoPrompts(JSON.parse(dp))
      } catch { /* use defaults */ }
      try {
        const ba = settings[PREFIX + 'before_after']
        if (ba) setBeforeAfter(JSON.parse(ba))
      } catch { /* use defaults */ }
      try {
        const cs = settings[PREFIX + 'chat_scenarios']
        if (cs) setChatScenarios(JSON.parse(cs))
      } catch { /* use defaults */ }

      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function handleChange(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }))
    setDirty(prev => new Set(prev).add(key))
  }

  async function handleSave(key: string) {
    setSaving(key)
    await updateSystemSetting(PREFIX + key, values[key])
    setDirty(prev => { const n = new Set(prev); n.delete(key); return n })
    setSaving(null)
  }

  async function handleSaveAll() {
    setSaving('__all__')
    for (const key of dirty) {
      await updateSystemSetting(PREFIX + key, values[key])
    }
    for (const cKey of contentDirty) {
      if (cKey === 'demo_prompts') await updateSystemSetting(PREFIX + 'demo_prompts', JSON.stringify(demoPrompts))
      if (cKey === 'before_after') await updateSystemSetting(PREFIX + 'before_after', JSON.stringify(beforeAfter))
      if (cKey === 'chat_scenarios') await updateSystemSetting(PREFIX + 'chat_scenarios', JSON.stringify(chatScenarios))
    }
    setDirty(new Set())
    setContentDirty(new Set())
    setSaving(null)
  }

  function handleReset(key: string) {
    setValues(prev => ({ ...prev, [key]: DEFAULTS[key] }))
    setDirty(prev => new Set(prev).add(key))
  }

  async function toggleVisibility(v: string) {
    const newVal = !visibility[v]
    setVisibility(prev => ({ ...prev, [v]: newVal }))
    await updateSystemSetting(VISIBILITY_PREFIX + v, String(newVal))
  }

  function toggleSection(v: string) {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(v)) next.delete(v); else next.add(v)
      return next
    })
  }

  async function saveContent(key: string) {
    setSaving(key)
    if (key === 'demo_prompts') await updateSystemSetting(PREFIX + 'demo_prompts', JSON.stringify(demoPrompts))
    if (key === 'before_after') await updateSystemSetting(PREFIX + 'before_after', JSON.stringify(beforeAfter))
    if (key === 'chat_scenarios') await updateSystemSetting(PREFIX + 'chat_scenarios', JSON.stringify(chatScenarios))
    setContentDirty(prev => { const n = new Set(prev); n.delete(key); return n })
    setSaving(null)
  }

  function resetContent(key: string) {
    if (key === 'demo_prompts') setDemoPrompts([...DEFAULT_DEMO_PROMPTS])
    if (key === 'before_after') setBeforeAfter([...DEFAULT_BEFORE_AFTER])
    if (key === 'chat_scenarios') setChatScenarios([...DEFAULT_CHAT_SCENARIOS])
    setContentDirty(prev => new Set(prev).add(key))
  }

  function markContentDirty(key: string) {
    setContentDirty(prev => new Set(prev).add(key))
  }

  const totalDirty = dirty.size + contentDirty.size
  useAdminDirty('prompt-showcase', totalDirty > 0)
  const [hiddenOpen, setHiddenOpen] = useState(false)

  const visibleVariants = VARIANTS.filter(v => visibility[v])
  const hiddenVariants = VARIANTS.filter(v => !visibility[v])

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}</div>
  }

  function renderVariant(variant: typeof VARIANTS[number]) {
    const contentDirtyKey =
      variant === 'terminal' && contentDirty.has('demo_prompts') ? 'demo_prompts'
      : variant === 'beforeafter' && contentDirty.has('before_after') ? 'before_after'
      : variant === 'chat' && contentDirty.has('chat_scenarios') ? 'chat_scenarios'
      : undefined

    return (
      <VariantSection
        key={variant}
        variant={variant}
        values={values} dirty={dirty} saving={saving} visibility={visibility}
        isOpen={openSections.has(variant)}
        onToggle={() => toggleSection(variant)}
        onToggleVisibility={() => toggleVisibility(variant)}
        onChange={handleChange} onReset={handleReset} onSave={handleSave}
        contentDirtyKey={contentDirtyKey}
      >
        {variant === 'terminal' && (
          <ContentSubSection
            title="דוגמאות פרומפטים"
            description="הפרומפטים שמוצגים בטאבים — משותפים גם לתצוגת Cards"
            isDirty={contentDirty.has('demo_prompts')}
            isSaving={saving === 'demo_prompts'}
            onSave={() => saveContent('demo_prompts')}
            onReset={() => resetContent('demo_prompts')}
          >
            {demoPrompts.map((p, i) => (
              <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-medium">פרומפט {i + 1}</span>
                  {demoPrompts.length > 1 && (
                    <button onClick={() => { setDemoPrompts(prev => prev.filter((_, j) => j !== i)); markContentDirty('demo_prompts') }}
                      className="text-red-400/60 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors" title="מחק"><Trash2 size={12} /></button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="כותרת" value={p.title} onChange={v => { const n = [...demoPrompts]; n[i] = { ...n[i], title: v }; setDemoPrompts(n); markContentDirty('demo_prompts') }} />
                  <Field label="קטגוריה" value={p.category} onChange={v => { const n = [...demoPrompts]; n[i] = { ...n[i], category: v }; setDemoPrompts(n); markContentDirty('demo_prompts') }} />
                </div>
                <TextAreaField label="תוכן הפרומפט" value={p.content} onChange={v => { const n = [...demoPrompts]; n[i] = { ...n[i], content: v }; setDemoPrompts(n); markContentDirty('demo_prompts') }} />
              </div>
            ))}
            <button onClick={() => { setDemoPrompts(prev => [...prev, { title: '', category: '', content: '' }]); markContentDirty('demo_prompts') }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors w-full justify-center">
              <Plus size={12} /> הוסף פרומפט
            </button>
          </ContentSubSection>
        )}

        {variant === 'beforeafter' && (
          <ContentSubSection
            title="תרחישי לפני/אחרי"
            description="ההשוואות בין פרומפט מעורפל לפרומפט מקצועי"
            isDirty={contentDirty.has('before_after')}
            isSaving={saving === 'before_after'}
            onSave={() => saveContent('before_after')}
            onReset={() => resetContent('before_after')}
          >
            {beforeAfter.map((item, i) => (
              <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-medium">תרחיש {i + 1}</span>
                  {beforeAfter.length > 1 && (
                    <button onClick={() => { setBeforeAfter(prev => prev.filter((_, j) => j !== i)); markContentDirty('before_after') }}
                      className="text-red-400/60 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors" title="מחק"><Trash2 size={12} /></button>
                  )}
                </div>
                <Field label="שם הטאב" value={item.label} onChange={v => { const n = [...beforeAfter]; n[i] = { ...n[i], label: v }; setBeforeAfter(n); markContentDirty('before_after') }} />
                <Field label="לפני (פרומפט מעורפל)" value={item.before} onChange={v => { const n = [...beforeAfter]; n[i] = { ...n[i], before: v }; setBeforeAfter(n); markContentDirty('before_after') }} />
                <TextAreaField label="אחרי (פרומפט מקצועי)" value={item.after} onChange={v => { const n = [...beforeAfter]; n[i] = { ...n[i], after: v }; setBeforeAfter(n); markContentDirty('before_after') }} />
              </div>
            ))}
            <button onClick={() => { setBeforeAfter(prev => [...prev, { before: '', after: '', label: '' }]); markContentDirty('before_after') }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors w-full justify-center">
              <Plus size={12} /> הוסף תרחיש
            </button>
          </ContentSubSection>
        )}

        {variant === 'cards' && (
          <p className="text-[11px] text-gray-500 bg-white/3 border border-white/5 rounded-lg px-3 py-2">
            הקלפים משתמשים באותן דוגמאות פרומפטים של Terminal — ניתן לערוך אותן בסקשן Terminal.
          </p>
        )}

        {variant === 'chat' && (
          <ContentSubSection
            title="תרחישי צ׳אט"
            description="ההודעות שמוצגות בסימולציית הצ׳אט עם הבוט"
            isDirty={contentDirty.has('chat_scenarios')}
            isSaving={saving === 'chat_scenarios'}
            onSave={() => saveContent('chat_scenarios')}
            onReset={() => resetContent('chat_scenarios')}
          >
            {chatScenarios.map((s, i) => (
              <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-medium">תרחיש {i + 1}</span>
                  {chatScenarios.length > 1 && (
                    <button onClick={() => { setChatScenarios(prev => prev.filter((_, j) => j !== i)); markContentDirty('chat_scenarios') }}
                      className="text-red-400/60 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors" title="מחק"><Trash2 size={12} /></button>
                  )}
                </div>
                <Field label="הודעת המשתמש" value={s.userMsg} onChange={v => { const n = [...chatScenarios]; n[i] = { ...n[i], userMsg: v }; setChatScenarios(n); markContentDirty('chat_scenarios') }} />
                <Field label="הסבר הבוט" value={s.aiExplain} onChange={v => { const n = [...chatScenarios]; n[i] = { ...n[i], aiExplain: v }; setChatScenarios(n); markContentDirty('chat_scenarios') }} />
                <TextAreaField label="הפרומפט המומלץ" value={s.aiSuggestion} onChange={v => { const n = [...chatScenarios]; n[i] = { ...n[i], aiSuggestion: v }; setChatScenarios(n); markContentDirty('chat_scenarios') }} />
                <Field label="תוצאה (badge)" value={s.result} onChange={v => { const n = [...chatScenarios]; n[i] = { ...n[i], result: v }; setChatScenarios(n); markContentDirty('chat_scenarios') }} />
              </div>
            ))}
            <button onClick={() => { setChatScenarios(prev => [...prev, { userMsg: '', aiSuggestion: '', aiExplain: '', result: '' }]); markContentDirty('chat_scenarios') }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors w-full justify-center">
              <Plus size={12} /> הוסף תרחיש
            </button>
          </ContentSubSection>
        )}
      </VariantSection>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">עריכת הטקסטים והתוכן בסקשן ״ספריית הפרומפטים״</p>
        {totalDirty > 0 && (
          <button onClick={handleSaveAll} disabled={saving !== null}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-medium transition-colors">
            <Save size={12} />
            {saving === '__all__' ? 'שומר...' : `שמור הכל (${totalDirty})`}
          </button>
        )}
      </div>

      {/* Visible variants */}
      {visibleVariants.map(renderVariant)}

      {/* Hidden variants */}
      {hiddenVariants.length > 0 && (
        <div className="border border-white/5 rounded-xl overflow-hidden">
          <button onClick={() => setHiddenOpen(!hiddenOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-white/5 transition-colors">
            <EyeOff size={14} className="text-gray-600 shrink-0" />
            <span className="flex-1 text-sm font-medium text-gray-500">טאבים מוסתרים ({hiddenVariants.length})</span>
            <ChevronDown size={14} className={`text-gray-600 transition-transform duration-200 ${hiddenOpen ? 'rotate-180' : ''}`} />
          </button>
          {hiddenOpen && (
            <div className="px-3 pb-3 space-y-3">
              {hiddenVariants.map(renderVariant)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Variant section wrapper ─────────────────────────────────────────────────

function VariantSection({ variant, values, dirty, saving, visibility, isOpen, contentDirtyKey, onToggle, onToggleVisibility, onChange, onReset, onSave, children }: {
  variant: string
  values: Record<string, string>
  dirty: Set<string>
  saving: string | null
  visibility: Record<string, boolean>
  isOpen: boolean
  contentDirtyKey?: string
  onToggle: () => void
  onToggleVisibility: () => void
  onChange: (key: string, value: string) => void
  onReset: (key: string) => void
  onSave: (key: string) => void
  children?: React.ReactNode
}) {
  const keys = getVariantKeys(variant)
  const hasTextChanges = keys.some(k => dirty.has(k))

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={(e) => { e.stopPropagation(); onToggleVisibility() }}
          className={`shrink-0 p-1.5 rounded-lg transition-colors ${visibility[variant] ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'text-gray-600 bg-white/5 hover:bg-white/10'}`}
          title={visibility[variant] ? 'מוצג בדף הנחיתה — לחץ לכיבוי' : 'מוסתר מדף הנחיתה — לחץ להפעלה'}>
          {visibility[variant] ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button onClick={onToggle} className="flex-1 flex items-center gap-3 text-right hover:bg-white/5 rounded-lg px-2 py-1 transition-colors">
          <span className={`flex-1 text-sm font-semibold ${visibility[variant] ? 'text-white' : 'text-gray-500 line-through'}`}>{VARIANT_LABELS[variant]}</span>
          {(hasTextChanges || contentDirtyKey) && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">שינויים</span>}
          <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
          {/* Text fields */}
          <div className="space-y-3">
            <p className="text-[11px] text-gray-500 font-medium">טקסטים</p>
            {keys.map(key => (
              <div key={key} className="space-y-1">
                <label className="text-[11px] text-gray-400 block">{FIELD_LABELS[key] ?? key}</label>
                <div className="flex items-center gap-2">
                  <input type="text" value={values[key]} onChange={e => onChange(key, e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors" dir="rtl" />
                  {values[key] !== DEFAULTS[key] && (
                    <button onClick={() => onReset(key)} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0" title="חזור לברירת מחדל">
                      <RotateCcw size={12} />
                    </button>
                  )}
                  {dirty.has(key) && (
                    <button onClick={() => onSave(key)} disabled={saving !== null}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-[11px] font-medium transition-colors shrink-0">
                      <Save size={10} />{saving === key ? '...' : 'שמור'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Content (children) */}
          {children}
        </div>
      )}
    </div>
  )
}

// ── Content sub-section ─────────────────────────────────────────────────────

function ContentSubSection({ title, description, isDirty, isSaving, onSave, onReset, children }: {
  title: string; description: string; isDirty: boolean; isSaving: boolean
  onSave: () => void; onReset: () => void; children: React.ReactNode
}) {
  return (
    <div className="border-t border-white/5 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-400 font-medium">{title}</p>
          <p className="text-[10px] text-gray-600">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="חזור לברירת מחדל">
            <RotateCcw size={12} />
          </button>
          {isDirty && (
            <button onClick={onSave} disabled={isSaving}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-[11px] font-medium transition-colors">
              <Save size={10} />{isSaving ? '...' : 'שמור'}
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
