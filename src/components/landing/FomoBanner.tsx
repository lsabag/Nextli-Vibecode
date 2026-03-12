import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TicketPercent, X } from 'lucide-react'

export type FomoVariant =
  | 'gradient' | 'blue' | 'purple' | 'green'
  | 'amber' | 'red' | 'pink' | 'teal' | 'gray'

type Props = {
  text: string
  variant?: FomoVariant | string
  endTime?: string   // datetime-local string e.g. "2026-03-15T20:00"
  ctaText?: string
  ctaLink?: string
  preview?: boolean  // keeps banner visible, hides close button
}

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number }

type VariantStyle = { bg: string; text: string; timerBg: string; divider: string; btn: string }

export const FOMO_VARIANTS: Record<FomoVariant, VariantStyle> = {
  gradient: { bg: 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600', text: 'text-white', timerBg: 'bg-white/15', divider: 'divide-white/25', btn: 'bg-white text-blue-700 hover:bg-blue-50' },
  blue:     { bg: 'bg-blue-600',   text: 'text-white', timerBg: 'bg-white/15', divider: 'divide-white/25', btn: 'bg-white text-blue-700 hover:bg-blue-50' },
  purple:   { bg: 'bg-purple-600', text: 'text-white', timerBg: 'bg-white/15', divider: 'divide-white/25', btn: 'bg-white text-purple-700 hover:bg-purple-50' },
  green:    { bg: 'bg-green-600',  text: 'text-white', timerBg: 'bg-white/15', divider: 'divide-white/25', btn: 'bg-white text-green-700 hover:bg-green-50' },
  amber:    { bg: 'bg-amber-500',  text: 'text-black', timerBg: 'bg-black/10',  divider: 'divide-black/20',  btn: 'bg-black text-amber-300 hover:bg-gray-900' },
  red:      { bg: 'bg-red-600',    text: 'text-white', timerBg: 'bg-white/15', divider: 'divide-white/25', btn: 'bg-white text-red-700 hover:bg-red-50' },
  pink:     { bg: 'bg-pink-600',   text: 'text-white', timerBg: 'bg-white/15', divider: 'divide-white/25', btn: 'bg-white text-pink-700 hover:bg-pink-50' },
  teal:     { bg: 'bg-teal-600',   text: 'text-white', timerBg: 'bg-white/15', divider: 'divide-white/25', btn: 'bg-white text-teal-700 hover:bg-teal-50' },
  gray:     { bg: 'bg-gray-700',   text: 'text-white', timerBg: 'bg-white/15', divider: 'divide-white/25', btn: 'bg-white text-gray-700 hover:bg-gray-100' },
}

export const FOMO_VARIANT_LABELS: Record<FomoVariant, string> = {
  gradient: 'גרדיאנט', blue: 'כחול', purple: 'סגול', green: 'ירוק',
  amber: 'ענבר', red: 'אדום', pink: 'ורוד', teal: 'ים', gray: 'אפור',
}

function calcTimeLeft(endTime: string): TimeLeft | null {
  const diff = new Date(endTime).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

export function FomoBanner({ text, variant = 'gradient', endTime, ctaText, ctaLink, preview }: Props) {
  const [visible, setVisible] = useState(true)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(endTime ? calcTimeLeft(endTime) : null)

  useEffect(() => {
    if (!endTime) { setTimeLeft(null); return }
    setTimeLeft(calcTimeLeft(endTime))
    const id = setInterval(() => {
      const t = calcTimeLeft(endTime)
      setTimeLeft(t)
      if (!t) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [endTime])

  const style = FOMO_VARIANTS[variant as FomoVariant] ?? FOMO_VARIANTS.gradient
  const isExpired = Boolean(endTime && !timeLeft)

  if (!preview && (!visible || isExpired)) return null

  return (
    <AnimatePresence>
      {(preview || visible) && (
        <motion.div
          key="fomo"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={`w-full ${style.bg} py-2.5 px-4`}
        >
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <TicketPercent size={15} className={style.text} strokeWidth={2} />
            </div>

            <p className={`flex-1 text-sm font-medium ${style.text} text-right`}>{text}</p>

            {endTime && timeLeft && (
              <div className={`flex items-center gap-1 rounded-lg ${style.timerBg} px-3 py-1.5 tabular-nums shrink-0`} dir="rtl">
                {timeLeft.days > 0 && (
                  <span className={`flex items-baseline gap-0.5 ${style.text} text-sm font-semibold`}>
                    {timeLeft.days}<span className="opacity-60 text-xs font-normal">ימים</span>
                  </span>
                )}
                {timeLeft.days > 0 && <span className={`opacity-30 ${style.text}`}>·</span>}
                <span className={`flex items-baseline gap-0.5 ${style.text} text-sm font-semibold`}>
                  {String(timeLeft.hours).padStart(2, '0')}<span className="opacity-60 text-xs font-normal">שע׳</span>
                </span>
                <span className={`opacity-30 ${style.text}`}>·</span>
                <span className={`flex items-baseline gap-0.5 ${style.text} text-sm font-semibold`}>
                  {String(timeLeft.minutes).padStart(2, '0')}<span className="opacity-60 text-xs font-normal">דק׳</span>
                </span>
                <span className={`opacity-30 ${style.text}`}>·</span>
                <span className={`flex items-baseline gap-0.5 ${style.text} text-sm font-semibold`}>
                  {String(timeLeft.seconds).padStart(2, '0')}<span className="opacity-60 text-xs font-normal">שנ׳</span>
                </span>
              </div>
            )}

            {ctaText && ctaLink && (
              <a
                href={ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors ${style.btn}`}
              >
                {ctaText}
              </a>
            )}

            {!preview && (
              <button
                onClick={() => setVisible(false)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1"
                aria-label="סגור"
              >
                <X size={15} className={style.text} strokeWidth={2} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
