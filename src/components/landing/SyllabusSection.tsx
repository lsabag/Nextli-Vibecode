import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getPublicCourseSessions } from '@/lib/supabase/queries/landing'
import type { CourseSession } from '@/types'

const sessionIcons: Record<number, string> = { 1: '🎯', 2: '⚙️', 3: '🚀' }
const sessionBadges: Record<number, string> = {
  1: 'Kickoff',
  2: 'Deep Dive',
  3: 'Launch',
}

export function SyllabusSection() {
  const [sessions, setSessions] = useState<CourseSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicCourseSessions()
      .then(data => { setSessions(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section id="syllabus" className="max-w-7xl mx-auto px-6 py-20" dir="rtl" aria-labelledby="syllabus-heading">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 id="syllabus-heading" className="text-4xl font-black text-white mb-3">מסלול ה-המראה שלך</h2>
        <p className="text-gray-400">שלושה מפגשים אינטנסיביים — מאפס לפרודקשן</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/5 rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/8 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl" aria-hidden="true">{sessionIcons[session.session_number]}</span>
                <span className="bg-blue-600/30 text-blue-400 text-xs font-bold px-3 py-1 rounded-full">
                  {sessionBadges[session.session_number]}
                </span>
              </div>
              <div className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                מפגש {session.session_number}
              </div>
              <h3 className="text-white font-bold text-xl mb-3">{session.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{session.description}</p>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
