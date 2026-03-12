import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getTeamMembers } from '@/lib/supabase/queries/landing'
import type { TeamMember } from '@/types'

export function TeamSection() {
  const [team, setTeam] = useState<TeamMember[]>([])

  useEffect(() => {
    getTeamMembers()
      .then(setTeam)
      .catch(() => {/* silently fallback to empty */})
  }, [])

  if (team.length === 0) return null

  return (
    <section id="team" className="max-w-7xl mx-auto px-6 py-20" dir="rtl" aria-labelledby="team-heading">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 id="team-heading" className="text-4xl font-black text-white mb-3">הנבחרת שלנו</h2>
        <p className="text-gray-400">אנשים שבנו מוצרים אמיתיים — ועכשיו מלמדים אתכם</p>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-8">
        {team.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center w-36"
          >
            {member.image_url ? (
              <img src={member.image_url} alt={member.name} className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4" />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">{member.initials}</span>
              </div>
            )}
            <h3 className="text-white font-semibold">{member.name}</h3>
            <p className="text-gray-400 text-sm">{member.role}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
