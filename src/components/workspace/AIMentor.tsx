import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function AIMentor() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 left-14 z-[100]" dir="rtl">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-80 bg-[#1a1a24] border border-white/20 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-blue-600">
              <span className="text-white font-semibold text-sm">AI Mentor</span>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 h-64 flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-3">🤖</div>
              <p className="text-gray-400 text-sm">
                ה-AI Mentor יהיה זמין בקרוב.<br />
                עד אז — שאל בצ'אט של קלוד!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 transition-colors"
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </motion.button>
    </div>
  )
}
