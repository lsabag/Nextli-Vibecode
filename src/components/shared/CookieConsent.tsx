import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie } from 'lucide-react'
import { loadAnalytics, disableAnalytics } from '@/lib/analytics'

const COOKIE_KEY = 'nextli-cookie-consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY)
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  function accept() {
    localStorage.setItem(COOKIE_KEY, 'accepted')
    setVisible(false)
    loadAnalytics()
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, 'declined')
    setVisible(false)
    disableAnalytics()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="region"
          aria-label="הסכמה לעוגיות"
          dir="rtl"
          className="fixed bottom-0 inset-x-0 z-[9998] p-4"
        >
          <div className="max-w-3xl mx-auto bg-[#14142a] border border-white/15 rounded-2xl shadow-2xl shadow-black/60 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Cookie size={20} className="text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-white text-sm font-medium mb-1">
                    האתר משתמש בעוגיות (cookies)
                  </p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    אנו משתמשים בעוגיות הכרחיות לפעולת האתר ועוגיות אנליטיקה לשיפור החוויה.
                    למידע נוסף ראו את{' '}
                    <Link to="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                      מדיניות הפרטיות
                    </Link>{' '}
                    שלנו.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={decline}
                  className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  דחייה
                </button>
                <button
                  onClick={accept}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  אישור
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
