import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getPublicCourseSessions } from '@/lib/supabase/queries/landing'
import type { CourseSession, SystemSettingsMap } from '@/types'

const defaultBadges: Record<string, { icon: string; badge: string }> = {
  '1': { icon: '🎯', badge: 'Kickoff' },
  '2': { icon: '⚙️', badge: 'Deep Dive' },
  '3': { icon: '🚀', badge: 'Launch' },
}

export default function SyllabusPage() {
  const [sessions, setSessions] = useState<CourseSession[]>([])
  const [settings, setSettings] = useState<SystemSettingsMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getPublicCourseSessions(),
      supabase.from('system_settings').select('*'),
    ]).then(([sessionsData, { data: settingsData }]) => {
      const hasPublicField = sessionsData.some(s => s.public_visible !== undefined)
      const visible = hasPublicField ? sessionsData.filter(s => s.public_visible) : sessionsData
      setSessions(visible)
      const map: SystemSettingsMap = {}
      for (const row of (settingsData ?? []) as Array<{ key: string; value: string }>) {
        map[row.key] = row.value
      }
      setSettings(map)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const badges = settings.syllabus_badges
    ? (() => { try { return JSON.parse(settings.syllabus_badges) } catch { return defaultBadges } })()
    : defaultBadges

  return (
    <div className="min-h-screen bg-[#0a0a0f]" id="main-content">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between" dir="rtl">
          <Link to="/" className="text-white font-bold text-lg">Nextli: וייבקוד</Link>
          <Link
            to="/intake"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors"
          >
            הצטרף עכשיו
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16" dir="rtl">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowRight size={14} />
          חזרה לעמוד הראשי
        </Link>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-black text-white mb-3">
            {settings.syllabus_heading || 'מסלול ההמראה שלך'}
          </h1>
          <p className="text-gray-400 text-lg">
            {settings.syllabus_subheading || 'שלושה מפגשים אינטנסיביים — מאפס לפרודקשן'}
          </p>
        </motion.div>

        {/* Sessions */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-12">הסילבוס יפורסם בקרוב</p>
        ) : (
          <div className="space-y-6">
            {sessions.map((session, i) => {
              const b = badges[String(session.session_number)] || defaultBadges[String(session.session_number)]
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex items-start gap-5">
                    <div className="text-4xl shrink-0 mt-1" aria-hidden="true">{b?.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                          מפגש {session.session_number}
                        </span>
                        <span className="bg-blue-600/30 text-blue-400 text-xs font-bold px-3 py-0.5 rounded-full">
                          {b?.badge}
                        </span>
                      </div>
                      <h2 className="text-white font-bold text-xl mb-3">{session.title}</h2>
                      <p className="text-gray-400 leading-relaxed">
                        {session.public_description || session.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16"
          >
            <Link
              to="/intake"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg text-white transition-transform hover:scale-[1.04]"
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                boxShadow: '0 0 40px rgba(37,99,235,0.35)',
              }}
            >
              הצטרף עכשיו
            </Link>
            <p className="text-gray-500 text-sm mt-3">אין צורך בניסיון קודם בקוד</p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
