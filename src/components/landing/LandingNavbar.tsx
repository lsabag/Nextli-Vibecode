import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogIn, Sparkles } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { AuthUser } from '@/lib/supabase/client'
import type { UserProfile, SystemSettingsMap } from '@/types'

type Props = {
  user: AuthUser | null
  profile: UserProfile | null
  settings: SystemSettingsMap
}

const defaultNavLinks = [
  { label: 'מסלול', href: '#syllabus' },
  { label: 'פרויקטים', href: '#projects' },
  { label: 'הצוות', href: '#team' },
  { label: 'יצירת קשר', href: '#contact' },
]

function parseJSON<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback
  try { return JSON.parse(json) } catch { return fallback }
}

function getPersonalAreaRoute(profile: UserProfile | null): string {
  if (profile?.role === 'admin') return '/admin'
  if (!profile?.onboarding_completed) return '/onboarding'
  return '/workspace'
}

export function LandingNavbar({ user, profile, settings }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const popupTrapRef = useFocusTrap<HTMLDivElement>(popupOpen)

  const isLoggedIn = !!user

  // Close popup on outside click
  useEffect(() => {
    if (!popupOpen) return
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [popupOpen])

  // Close popup on Escape
  useEffect(() => {
    if (!popupOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPopupOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [popupOpen])

  const navLinks = parseJSON(settings.navbar_links, defaultNavLinks)

  return (
    <>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/10"
        dir="rtl"
        aria-label="ניווט ראשי"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link to="/" aria-label="Nextli וייבקוד - דף הבית" className="text-white font-black text-xl tracking-tight">
            Nextli: <span className="text-blue-400">וייבקוד</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8" role="list">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                role="listitem"
                className="text-gray-400 hover:text-white text-sm transition-colors underline-offset-4 hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* CTA button */}
            <div className="relative" ref={popupRef}>
              {isLoggedIn ? (
                <Link
                  to={getPersonalAreaRoute(profile)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 md:px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  אזור אישי
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => setPopupOpen(v => !v)}
                    aria-expanded={popupOpen}
                    aria-haspopup="true"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 md:px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    אזור אישי
                  </button>

                  <AnimatePresence>
                    {popupOpen && (
                      <motion.div
                        ref={popupTrapRef}
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        role="menu"
                        aria-modal="true"
                        className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-[#14142a] shadow-2xl shadow-black/50 overflow-hidden z-50"
                      >
                        <Link
                          to="/login"
                          role="menuitem"
                          onClick={() => setPopupOpen(false)}
                          className="flex items-center gap-3 px-5 py-4 text-white hover:bg-white/5 transition-colors border-b border-white/10"
                        >
                          <LogIn size={18} className="text-blue-400 shrink-0" />
                          <span className="font-semibold text-sm">התחברות</span>
                        </Link>
                        <Link
                          to="/intake"
                          role="menuitem"
                          onClick={() => setPopupOpen(false)}
                          className="flex items-center gap-3 px-5 py-4 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          {settings.navbar_popup_icon ? (
                            <span className="text-lg shrink-0">{settings.navbar_popup_icon}</span>
                          ) : (
                            <Sparkles size={18} className="text-purple-400 shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-sm">{settings.navbar_popup_title || 'עדיין לא רשום?'}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{settings.navbar_popup_subtitle || 'בוא נמצא את המסלול שלך'}</div>
                          </div>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden text-gray-400 hover:text-white transition-colors p-1"
              aria-label={mobileOpen ? 'סגור תפריט' : 'פתח תפריט'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-white/10"
            >
              <div className="px-6 py-4 space-y-3">
                {navLinks.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-gray-300 hover:text-white text-sm transition-colors py-1"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  )
}
