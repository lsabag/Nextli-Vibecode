import { useState } from 'react'
import { ChevronDown, Globe, Users, Megaphone } from 'lucide-react'
import { AdditionalCoursesManager } from './AdditionalCoursesManager'
import { TeamManager } from './TeamManager'
import { FomoBannerManager } from './FomoBannerManager'

type Section = {
  id: string
  label: string
  icon: React.ReactNode
  component: React.ReactNode
}

const sections: Section[] = [
  { id: 'courses', label: 'קורסים בדף הראשי', icon: <Globe size={16} />, component: <AdditionalCoursesManager /> },
  { id: 'team', label: 'הנבחרת שלנו', icon: <Users size={16} />, component: <TeamManager /> },
  { id: 'fomo', label: 'באנר FOMO', icon: <Megaphone size={16} />, component: <FomoBannerManager /> },
]

export function LandingManager() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['courses']))

  function toggle(id: string) {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div dir="rtl">
      <h2 className="text-xl font-bold text-white mb-6">ניהול דף הבית</h2>
      <div className="space-y-3">
        {sections.map(section => {
          const isOpen = openSections.has(section.id)
          return (
            <div key={section.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-right hover:bg-white/5 transition-colors"
              >
                <span className="text-blue-400">{section.icon}</span>
                <span className="flex-1 text-sm font-semibold text-white">{section.label}</span>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4">
                  {section.component}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
