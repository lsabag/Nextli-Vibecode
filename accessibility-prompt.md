# הנגשת אתר מלאה — WCAG 2.0 AA / תקן ישראלי 5568

אני צריך שתבצע הנגשה מלאה של האתר הזה. העבודה כוללת 6 שלבים — סקר, תיקון קוד, CSS בסיסי, הטמעת תוסף נגישות, דף הצהרת נגישות, ובדיקה סופית. אל תדלג על שלבים. בצע הכל.

דרישות טכניות: האתר חייב להשתמש ב-React, Tailwind CSS, framer-motion ו-lucide-react. אם חסרה ספרייה — התקן אותה.

**כלל ברזל: אחרי כל שלב, הרץ `npm run build` (או פקודת ה-build של הפרויקט) וודא שאין שגיאות קומפילציה. אם משהו נשבר — תקן לפני שממשיך לשלב הבא. אל תמשיך עם build שבור.**

**בדיקת תאימות: אחרי שלב 4 (הטמעת התוסף), הפעל כל פיצ'ר בנפרד וודא שהאתר לא נשבר. אחר כך הפעל כמה פיצ'רים ביחד (ניגודיות + צבעים הפוכים + גווני אפור) וודא שאין התנגשויות. בדוק שאלמנטים עם `position: fixed` (navbar, modals) עדיין במקום הנכון כשמפעילים פילטרים.**

---

## שלב 1 — סקר נגישות

עבור על **כל** קבצי הפרויקט. בדוק כל נושא מהרשימה למטה. בסוף הסקר הצג טבלה עם: קובץ, שורה, בעיה, חומרה (קריטי/בינוני/נמוך), תיקון נדרש.

### 1.1 HTML סמנטי
- כל דף חייב `<main>` אחד בלבד
- `<nav>` לניווט, `<header>` לכותרת, `<footer>` לתחתית
- `<button>` לפעולות, `<a>` לניווט — לא `<div onClick>`
- `<section>` ו-`<article>` במקום `<div>` גנריים כשיש משמעות סמנטית
- רשימות (`<ul>`, `<ol>`) לתוכן שהוא רשימה

### 1.2 כותרות
- כל דף חייב `<h1>` אחד בלבד
- דירוג כותרות ברצף — לא לדלג (h1 אז h3 בלי h2)
- כותרות צריכות לתאר את התוכן שמתחתיהן

### 1.3 תמונות ומדיה
- כל `<img>` חייב `alt` — תיאורי לתמונות משמעותיות, `alt=""` לדקורטיביות
- SVG אייקונים: `aria-hidden="true"` אם דקורטיביים, `role="img" aria-label="..."` אם משמעותיים
- וידאו — ודא שיש אפשרות כתוביות

### 1.4 טפסים
- כל `<input>`, `<select>`, `<textarea>` חייב `<label>` מקושר (עם `htmlFor`/`id`) או `aria-label`
- הודעות שגיאה מקושרות עם `aria-describedby`
- שדות חובה מסומנים עם `aria-required="true"` או `required`
- `autocomplete` מתאים בשדות אישיים (name, email, tel)

### 1.5 ניגודיות צבעים
- טקסט רגיל: יחס ניגודיות 4.5:1 לפחות
- טקסט גדול (18px+ או 14px bold): יחס 3:1 לפחות
- אלמנטים אינטראקטיביים ואייקונים: יחס 3:1 לפחות
- אל תשתמש בצבע בלבד להעברת מידע

### 1.6 ניווט מקלדת
- כל אלמנט אינטראקטיבי נגיש ב-Tab
- סדר Tab הגיוני (תואם סדר ויזואלי)
- focus visible ברור על כל אלמנט
- אין מלכודת מקלדת — אפשר תמיד לצאת עם Tab או Escape
- מודלים ודיאלוגים — focus trap פנימי, Escape לסגירה
- תפריטים נפתחים — חצים לניווט, Escape לסגירה

### 1.7 ARIA
- `aria-label` על אלמנטים בלי טקסט גלוי (כפתורי אייקון)
- `aria-expanded` על כפתורי toggle (תפריטים, accordions)
- `aria-current="page"` על קישור הדף הנוכחי בניווט
- `role="dialog" aria-modal="true" aria-label="..."` על מודלים
- `aria-live="polite"` על תוכן שמתעדכן דינמית (התראות, טוסטים)
- `aria-pressed` על toggle buttons
- לא לשים `role` מיותר על אלמנטים שכבר סמנטיים

### 1.8 שפה ו-RTL
- `<html lang="he" dir="rtl">` (או השפה המתאימה)
- אם יש תוכן בשפה אחרת: `lang="en"` על האלמנט הספציפי

### 1.9 Skip link
- קישור "דלג לתוכן" כאלמנט ראשון ב-body
- מוסתר ויזואלית, נגלה ב-focus
- מפנה ל-`<main id="main-content">`

### 1.10 מצבים דינמיים
- טעינה: `aria-busy="true"` או הודעת "טוען..."
- שגיאות: `role="alert"` או `aria-live="assertive"`
- הצלחה: `aria-live="polite"`
- תוכן שנטען בעצלתיים — נגיש לקוראי מסך

---

## שלב 2 — תיקון כל הבעיות

תקן את כל הבעיות שנמצאו בסקר. סדר עדיפויות:
1. **קריטי** — בעיות שחוסמות שימוש (אלמנטים לא נגישים במקלדת, טפסים בלי labels)
2. **בינוני** — בעיות שפוגעות בחוויה (ניגודיות, חוסר ARIA)
3. **נמוך** — שיפורים (סמנטיקה טובה יותר, סדר כותרות)

---

## שלב 3 — CSS נגישות בסיסי

ודא שהכללים הבאים קיימים ב-CSS הגלובלי של האתר. אם לא — הוסף אותם:

```css
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.skip-link {
  position: absolute;
  top: -100%;
  right: 0;
  z-index: 9999;
  background: #2563eb;
  color: #fff;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 0 0 0 0.5rem;
  transition: top 0.2s;
}
.skip-link:focus {
  top: 0;
}
```

---

## שלב 4 — הטמעת תוסף הנגישות

הטמע את תוסף הנגישות הבא. התוסף כולל 12 פיצ'רים: גודל טקסט, ניגודיות גבוהה, צבעים הפוכים, גווני אפור, הדגשת קישורים, הדגשת כותרות, פונט קריא, עצירת אנימציות, סמן מוגדל, ריווח טקסט, הסתרת תמונות, מדריך קריאה.

צור 3 קבצים בדיוק כמו שכתוב כאן:

### קובץ 1 — `src/hooks/useFocusTrap.ts`

```typescript
import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!active || !ref.current) return

    const container = ref.current
    const focusable = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null)

    const elements = focusable()
    if (elements.length > 0) {
      elements[0].focus()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const els = focusable()
      if (els.length === 0) return

      const first = els[0]
      const last = els[els.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active])

  return ref
}
```

### קובץ 2 — `src/components/AccessibilityWidget.tsx`

חשוב: שנה את `STORAGE_KEY` לשם ייחודי לאתר (למשל `'שם-האתר-a11y-prefs'`). שנה את `href="/accessibility"` לנתיב הנכון של דף הנגישות באתר. אם האתר LTR (לא עברית): שנה `dir="rtl"` ל-`dir="ltr"`, שנה `left-0` ל-`right-0`, שנה `rounded-r-xl` ל-`rounded-l-xl`, שנה `border-r` ל-`border-l`, שנה `x: '-100%'` ל-`x: '100%'`, ותרגם את כל הטקסטים בעברית לשפת האתר. התאם את ה-import path של useFocusTrap לפי מבנה הפרויקט.

```tsx
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, Contrast, Link2, RotateCcw, Palette, MousePointer, Space, PauseCircle, SunMoon, Heading, Type, ScanLine, ImageOff } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

function A11yIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden="true">
      <path fill="currentColor" d="M256 112a56 56 0 1156-56 56.06 56.06 0 01-56 56z" />
      <path fill="currentColor" d="M432 112.8l-.45.12-.42.13c-1 .28-2 .58-3 .89-18.61 5.46-108.93 30.92-172.56 30.92-59.13 0-141.28-22-167.56-29.47a73.79 73.79 0 00-8-2.58c-19-5-32 14.3-32 31.94 0 17.47 15.7 25.79 31.55 31.76v.28l95.22 29.74c9.73 3.73 12.33 7.54 13.6 10.84 4.13 10.59.83 31.56-.34 38.88l-5.8 45-32.19 176.19q-.15.72-.27 1.47l-.23 1.27c-2.32 16.15 9.54 31.82 32 31.82 19.6 0 28.25-13.53 32-31.94s28-157.57 42-157.57 42.84 157.57 42.84 157.57c3.75 18.41 12.4 31.94 32 31.94 22.52 0 34.38-15.74 32-31.94a57.17 57.17 0 00-.76-4.06L329 301.27l-5.79-45c-4.19-26.21-.82-34.87.32-36.9a1.09 1.09 0 00.08-.15c1.08-2 6-6.48 17.48-10.79l89.28-31.21a16.9 16.9 0 001.62-.52c16-6 32-14.3 32-31.93S451 107.81 432 112.8z" />
    </svg>
  )
}

const STORAGE_KEY = 'REPLACE-WITH-SITE-NAME-a11y-prefs'

type A11yPrefs = {
  fontSize: number
  highContrast: boolean
  invertColors: boolean
  highlightLinks: boolean
  highlightHeadings: boolean
  grayscale: boolean
  readableFont: boolean
  stopAnimations: boolean
  bigCursor: boolean
  textSpacing: boolean
  readingGuide: boolean
  hideImages: boolean
}

const DEFAULT_PREFS: A11yPrefs = {
  fontSize: 0,
  highContrast: false,
  invertColors: false,
  highlightLinks: false,
  highlightHeadings: false,
  grayscale: false,
  readableFont: false,
  stopAnimations: false,
  bigCursor: false,
  textSpacing: false,
  readingGuide: false,
  hideImages: false,
}

function loadPrefs(): A11yPrefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) }
  } catch { /* ignore */ }
  return { ...DEFAULT_PREFS }
}

function savePrefs(prefs: A11yPrefs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
}

function applyPrefs(prefs: A11yPrefs) {
  const root = document.documentElement

  const sizes = ['100%', '115%', '130%']
  root.style.fontSize = sizes[prefs.fontSize] ?? '100%'

  root.classList.toggle('a11y-high-contrast', prefs.highContrast)
  root.classList.toggle('a11y-invert-colors', prefs.invertColors)
  root.classList.toggle('a11y-highlight-links', prefs.highlightLinks)
  root.classList.toggle('a11y-highlight-headings', prefs.highlightHeadings)
  root.classList.toggle('a11y-grayscale', prefs.grayscale)
  root.classList.toggle('a11y-readable-font', prefs.readableFont)
  root.classList.toggle('a11y-stop-animations', prefs.stopAnimations)
  root.classList.toggle('a11y-big-cursor', prefs.bigCursor)
  root.classList.toggle('a11y-text-spacing', prefs.textSpacing)
  root.classList.toggle('a11y-reading-guide', prefs.readingGuide)
  root.classList.toggle('a11y-hide-images', prefs.hideImages)
}

const toggleBtnCls = (active: boolean) =>
  `flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-colors text-xs font-medium text-center ${
    active
      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
  }`

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<A11yPrefs>(loadPrefs)
  const [guideY, setGuideY] = useState(-100)

  useEffect(() => {
    applyPrefs(prefs)
    savePrefs(prefs)
  }, [prefs])

  useEffect(() => {
    if (!prefs.readingGuide) return
    function handleMouse(e: MouseEvent) { setGuideY(e.clientY) }
    document.addEventListener('mousemove', handleMouse)
    return () => document.removeEventListener('mousemove', handleMouse)
  }, [prefs.readingGuide])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const update = useCallback((patch: Partial<A11yPrefs>) => {
    setPrefs(p => ({ ...p, ...patch }))
  }, [])

  const reset = useCallback(() => {
    setPrefs({ ...DEFAULT_PREFS })
  }, [])

  const panelRef = useFocusTrap<HTMLDivElement>(open)

  const fontLabel = ['רגיל', 'גדול', 'גדול מאוד'][prefs.fontSize] ?? 'רגיל'

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="פתח תפריט נגישות"
        aria-expanded={open}
        className="fixed top-24 left-0 z-[9999] w-10 h-10 rounded-r-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all hover:w-11 focus-visible:ring-2 focus-visible:ring-white"
      >
        <A11yIcon size={22} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9998] bg-black/50"
              onClick={() => setOpen(false)}
            />

            <motion.div
              ref={panelRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              role="dialog"
              aria-label="הגדרות נגישות"
              aria-modal="true"
              dir="rtl"
              className="fixed top-0 left-0 z-[9999] h-full w-[320px] sm:w-[380px] bg-[#14142a] border-r border-white/15 shadow-2xl shadow-black/60 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                <h2 className="text-white font-bold text-sm flex items-center gap-2">
                  <A11yIcon size={18} className="text-blue-400" />
                  הגדרות נגישות
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="סגור תפריט נגישות"
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div>
                  <div className="text-xs text-gray-400 mb-2">גודל טקסט: {fontLabel}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => update({ fontSize: Math.max(0, prefs.fontSize - 1) })}
                      disabled={prefs.fontSize === 0}
                      aria-label="הקטן טקסט"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                    >
                      <ZoomOut size={14} /> הקטן
                    </button>
                    <button
                      onClick={() => update({ fontSize: Math.min(2, prefs.fontSize + 1) })}
                      disabled={prefs.fontSize === 2}
                      aria-label="הגדל טקסט"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                    >
                      <ZoomIn size={14} /> הגדל
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button onClick={() => update({ highContrast: !prefs.highContrast })} aria-pressed={prefs.highContrast} className={toggleBtnCls(prefs.highContrast)}>
                    <Contrast size={20} />
                    ניגודיות גבוהה
                  </button>

                  <button onClick={() => update({ invertColors: !prefs.invertColors })} aria-pressed={prefs.invertColors} className={toggleBtnCls(prefs.invertColors)}>
                    <SunMoon size={20} />
                    צבעים הפוכים
                  </button>

                  <button onClick={() => update({ grayscale: !prefs.grayscale })} aria-pressed={prefs.grayscale} className={toggleBtnCls(prefs.grayscale)}>
                    <Palette size={20} />
                    גווני אפור
                  </button>

                  <button onClick={() => update({ highlightLinks: !prefs.highlightLinks })} aria-pressed={prefs.highlightLinks} className={toggleBtnCls(prefs.highlightLinks)}>
                    <Link2 size={20} />
                    הדגשת קישורים
                  </button>

                  <button onClick={() => update({ highlightHeadings: !prefs.highlightHeadings })} aria-pressed={prefs.highlightHeadings} className={toggleBtnCls(prefs.highlightHeadings)}>
                    <Heading size={20} />
                    הדגשת כותרות
                  </button>

                  <button onClick={() => update({ readableFont: !prefs.readableFont })} aria-pressed={prefs.readableFont} className={toggleBtnCls(prefs.readableFont)}>
                    <Type size={20} />
                    פונט קריא
                  </button>

                  <button onClick={() => update({ stopAnimations: !prefs.stopAnimations })} aria-pressed={prefs.stopAnimations} className={toggleBtnCls(prefs.stopAnimations)}>
                    <PauseCircle size={20} />
                    עצירת אנימציות
                  </button>

                  <button onClick={() => update({ bigCursor: !prefs.bigCursor })} aria-pressed={prefs.bigCursor} className={toggleBtnCls(prefs.bigCursor)}>
                    <MousePointer size={20} />
                    סמן מוגדל
                  </button>

                  <button onClick={() => update({ textSpacing: !prefs.textSpacing })} aria-pressed={prefs.textSpacing} className={toggleBtnCls(prefs.textSpacing)}>
                    <Space size={20} />
                    ריווח טקסט
                  </button>

                  <button onClick={() => update({ hideImages: !prefs.hideImages })} aria-pressed={prefs.hideImages} className={toggleBtnCls(prefs.hideImages)}>
                    <ImageOff size={20} />
                    הסתרת תמונות
                  </button>

                  <button onClick={() => update({ readingGuide: !prefs.readingGuide })} aria-pressed={prefs.readingGuide} className={toggleBtnCls(prefs.readingGuide)}>
                    <ScanLine size={20} />
                    מדריך קריאה
                  </button>

                  <button onClick={reset} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-white/10 text-xs font-medium text-gray-400 hover:text-gray-300 hover:bg-white/10 transition-colors">
                    <RotateCcw size={20} />
                    איפוס הגדרות
                  </button>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-white/10 bg-white/3 shrink-0">
                <a
                  href="/accessibility"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  הצהרת נגישות מלאה
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {prefs.readingGuide && guideY > 0 && (
        <div
          className="fixed left-0 w-full h-2 bg-yellow-400/30 pointer-events-none z-[9998] border-y border-yellow-400/50"
          style={{ top: guideY - 4 }}
        />
      )}
    </>
  )
}
```

### קובץ 3 — CSS של פיצ'רי הנגישות

הוסף את הכללים הבאים לקובץ ה-CSS הגלובלי של האתר:

```css
/* ═══ Accessibility Widget Features ═══════════════════════════════════════ */

.a11y-high-contrast {
  --a11y-bg: #000 !important;
  --a11y-text: #fff !important;
  filter: contrast(1.3);
}
.a11y-high-contrast body {
  background: #000 !important;
  color: #fff !important;
}
.a11y-high-contrast .text-gray-400,
.a11y-high-contrast .text-gray-500 {
  color: #d1d5db !important;
}

.a11y-grayscale {
  filter: grayscale(1);
}
.a11y-grayscale.a11y-high-contrast {
  filter: grayscale(1) contrast(1.3);
}

.a11y-stop-animations *,
.a11y-stop-animations *::before,
.a11y-stop-animations *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}

.a11y-big-cursor,
.a11y-big-cursor * {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M5 2l20 14-9 2-5 10z' fill='%23000' stroke='%23fff' stroke-width='2'/%3E%3C/svg%3E") 4 2, auto !important;
}
.a11y-big-cursor a,
.a11y-big-cursor button,
.a11y-big-cursor [role="button"],
.a11y-big-cursor input,
.a11y-big-cursor textarea,
.a11y-big-cursor select {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M10 4v24h4l4-8h8z' fill='%23000' stroke='%23fff' stroke-width='2'/%3E%3C/svg%3E") 10 4, pointer !important;
}

.a11y-text-spacing {
  letter-spacing: 0.05em !important;
  word-spacing: 0.15em !important;
  line-height: 1.8 !important;
}
.a11y-text-spacing p,
.a11y-text-spacing li,
.a11y-text-spacing span,
.a11y-text-spacing div {
  letter-spacing: inherit !important;
  word-spacing: inherit !important;
  line-height: inherit !important;
}

.a11y-highlight-links a {
  outline: 2px solid #facc15 !important;
  outline-offset: 2px;
  text-decoration: underline !important;
}
.a11y-highlight-links a:focus {
  outline-width: 3px !important;
}

.a11y-invert-colors {
  filter: invert(1) hue-rotate(180deg);
}
.a11y-invert-colors img,
.a11y-invert-colors video,
.a11y-invert-colors svg:not([aria-hidden]) {
  filter: invert(1) hue-rotate(180deg);
}
.a11y-invert-colors.a11y-high-contrast {
  filter: invert(1) hue-rotate(180deg) contrast(1.3);
}
.a11y-invert-colors.a11y-grayscale {
  filter: invert(1) hue-rotate(180deg) grayscale(1);
}

.a11y-highlight-headings h1,
.a11y-highlight-headings h2,
.a11y-highlight-headings h3,
.a11y-highlight-headings h4,
.a11y-highlight-headings h5,
.a11y-highlight-headings h6 {
  outline: 2px solid #60a5fa !important;
  outline-offset: 3px;
  border-radius: 2px;
}

.a11y-readable-font,
.a11y-readable-font * {
  font-family: Arial, Helvetica, sans-serif !important;
}

.a11y-hide-images img,
.a11y-hide-images svg:not([aria-hidden]),
.a11y-hide-images video,
.a11y-hide-images picture {
  visibility: hidden !important;
}
```

### רינדור

הוסף `<AccessibilityWidget />` בקומפוננטת ה-layout הראשית של האתר, מחוץ ל-`<main>`, ברמה העליונה:

```tsx
import { AccessibilityWidget } from './components/AccessibilityWidget'

function App() {
  return (
    <>
      <main id="main-content">
        {/* תוכן האתר */}
      </main>
      <AccessibilityWidget />
    </>
  )
}
```

---

## שלב 5 — דף הצהרת נגישות

צור דף נגישות בנתיב `/accessibility` (או הנתיב שמוגדר ב-Widget). הדף חייב לכלול את כל הסעיפים הבאים — התאם את הפרטים לאתר:

1. **כותרת**: "הצהרת נגישות — [שם האתר]"
2. **פסקת פתיחה**: "[שם הארגון] רואה חשיבות רבה במתן שירות שוויוני לכלל האוכלוסייה ופועלת להנגשת האתר בהתאם לתקן הישראלי 5568 ולהנחיות WCAG 2.0 ברמה AA."
3. **אמצעי נגישות שהוטמעו באתר**:
   - תוסף נגישות עם 12 כלים: הגדלת טקסט, ניגודיות גבוהה, צבעים הפוכים, גווני אפור, הדגשת קישורים, הדגשת כותרות, פונט קריא, עצירת אנימציות, סמן מוגדל, ריווח טקסט, הסתרת תמונות, מדריך קריאה
   - קישור "דלג לתוכן" לניווט מהיר
   - ניווט מלא באמצעות מקלדת
   - תאימות לקוראי מסך (NVDA, JAWS, VoiceOver)
   - מבנה HTML סמנטי עם כותרות מדורגות
   - תמיכה ב-prefers-reduced-motion
   - כל ההגדרות נשמרות לביקור הבא
4. **דפדפנים נתמכים**: Chrome, Firefox, Safari, Edge (גרסאות אחרונות)
5. **מגבלות ידועות**: (רשום אם יש תוכן שעדיין לא נגיש, למשל מסמכי PDF ישנים, תוכן צד שלישי)
6. **דרכי פנייה לרכז נגישות**:
   - שם: [שם רכז הנגישות]
   - טלפון: [מספר טלפון]
   - דוא"ל: [כתובת מייל]
7. **תאריך עדכון ההצהרה**: [תאריך נוכחי]

הדף צריך להיות מעוצב בהתאם לעיצוב שאר האתר, עם HTML סמנטי ונגיש.

---

## שלב 6 — בדיקה סופית

אחרי שסיימת את כל השלבים, עבור על הצ'קליסט הבא וודא שהכל תקין:

- [ ] כל תמונה באתר יש לה alt מתאים
- [ ] כל טופס מתויג עם labels
- [ ] ניגודיות צבעים עוברת 4.5:1 בכל מקום
- [ ] ניתן לנווט בכל האתר עם מקלדת בלבד
- [ ] Skip link קיים ועובד
- [ ] `<html>` כולל `lang` ו-`dir` נכונים
- [ ] כל דף כולל `<main>` אחד
- [ ] כותרות מדורגות בכל דף (h1 אז h2 אז h3)
- [ ] כל כפתור אייקון כולל `aria-label`
- [ ] מודלים כוללים `role="dialog"` ו-focus trap
- [ ] תוסף הנגישות מופיע בכל דף
- [ ] כל 12 הפיצ'רים של התוסף עובדים
- [ ] ההגדרות נשמרות אחרי רענון דף
- [ ] הסיידבר רספונסיבי (מובייל, טאבלט, דסקטופ)
- [ ] Escape סוגר את סיידבר הנגישות
- [ ] Tab נלכד בתוך הסיידבר כשהוא פתוח
- [ ] דף הצהרת נגישות קיים ומלא
- [ ] הקישור מהתוסף לדף ההצהרה עובד

דווח לי על כל פריט — עבר/נכשל. תקן כל מה שנכשל.
