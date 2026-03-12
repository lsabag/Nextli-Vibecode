import { motion } from 'framer-motion'

// Placeholder project cards — space reserved for student-built apps
const placeholderProjects = [
  { number: 1 },
  { number: 2 },
  { number: 3 },
]

export function StudentProjects() {
  return (
    <section id="projects" className="max-w-7xl mx-auto px-6 py-20" dir="rtl" aria-labelledby="projects-heading">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 id="projects-heading" className="text-4xl font-black text-white mb-3">הפרויקטים של התלמידים</h2>
        <p className="text-gray-400">הפרויקטים שנבנו בתוכנית — כל מפגש מסתיים בפרודקט אמיתי</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {placeholderProjects.map((project, i) => (
          <motion.div
            key={project.number}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-8 text-center hover:bg-white/8 transition-colors"
          >
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-400 text-xl" aria-hidden="true">📱</span>
            </div>
            <p className="text-gray-400 text-sm">
              המקום הזה שמור<br />
              לאפליקציה שאתה תבנה
            </p>
            <div className="mt-4 text-xs text-gray-400">
              פרויקט #{project.number}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
