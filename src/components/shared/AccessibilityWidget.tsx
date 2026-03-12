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

const STORAGE_KEY = 'nextli-a11y-prefs'

type A11yPrefs = {
  fontSize: number // 0 = normal, 1 = large, 2 = xlarge
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

  // Font size
  const sizes = ['100%', '115%', '130%']
  root.style.fontSize = sizes[prefs.fontSize] ?? '100%'

  // Toggle CSS classes
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

  // Reading guide follows mouse
  useEffect(() => {
    if (!prefs.readingGuide) return
    function handleMouse(e: MouseEvent) { setGuideY(e.clientY) }
    document.addEventListener('mousemove', handleMouse)
    return () => document.removeEventListener('mousemove', handleMouse)
  }, [prefs.readingGuide])

  // Close on Escape
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
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="פתח תפריט נגישות"
        aria-expanded={open}
        className="fixed top-24 left-0 z-[9999] w-10 h-10 rounded-r-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all hover:w-11 focus-visible:ring-2 focus-visible:ring-white"
      >
        <A11yIcon size={22} />
      </button>

      {/* Backdrop + Sidebar */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9998] bg-black/50"
              onClick={() => setOpen(false)}
            />

            {/* Sidebar */}
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
              {/* Header */}
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

              {/* Content */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Font size */}
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

                {/* Feature grid */}
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

              {/* Footer */}
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

      {/* Reading guide line */}
      {prefs.readingGuide && guideY > 0 && (
        <div
          className="fixed left-0 w-full h-2 bg-yellow-400/30 pointer-events-none z-[9998] border-y border-yellow-400/50"
          style={{ top: guideY - 4 }}
        />
      )}
    </>
  )
}
