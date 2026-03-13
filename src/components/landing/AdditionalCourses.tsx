import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getAdditionalCourses } from '@/lib/supabase/queries/landing'
import type { AdditionalCourse, SystemSettingsMap } from '@/types'

type Props = { settings: SystemSettingsMap }

export function AdditionalCourses({ settings }: Props) {
  const [courses, setCourses] = useState<AdditionalCourse[]>([])

  useEffect(() => {
    getAdditionalCourses()
      .then(setCourses)
      .catch(() => {/* silently fallback to empty */})
  }, [])

  if (courses.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-6 py-20" dir="rtl" aria-labelledby="additional-courses-heading">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-14"
      >
        <h2 id="additional-courses-heading" className="text-4xl font-black text-white mb-2">{settings.courses_heading || 'קורסים נוספים'}</h2>
        <p className="text-gray-400">{settings.courses_subheading || 'המשך הדרך — עוד כלים, עוד מוצרים'}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/40 transition-colors"
          >
            <div className="w-full h-32 bg-white/5 rounded-xl mb-5 flex items-center justify-center">
              <span className="text-4xl" aria-hidden="true">🎓</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-400 text-sm">★ {course.rating}</span>
              <span className="bg-purple-600/30 text-purple-400 text-xs px-2 py-0.5 rounded-full">
                {course.badge}
              </span>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{course.title}</h3>
            <p className="text-gray-400 text-sm">{course.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
