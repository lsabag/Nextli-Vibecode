import { Link } from 'react-router-dom'
import type { SystemSettingsMap } from '@/types'

type Props = { settings: SystemSettingsMap }

export function LandingFooter({ settings }: Props) {
  return (
    <footer className="bg-[#050508] border-t border-white/10 py-8 px-6" dir="rtl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-gray-400 text-xs">
          &copy; {new Date().getFullYear()} {settings.footer_text || 'Nextli וייבקוד. כל הזכויות שמורות.'}
        </div>
        <nav aria-label="קישורים משפטיים" className="flex items-center gap-4 flex-wrap justify-center">
          <Link to="/privacy" className="text-gray-400 hover:text-gray-300 text-xs transition-colors">
            מדיניות פרטיות
          </Link>
          <Link to="/terms" className="text-gray-400 hover:text-gray-300 text-xs transition-colors">
            תנאי שימוש
          </Link>
          <Link to="/accessibility" className="text-gray-400 hover:text-gray-300 text-xs transition-colors">
            הצהרת נגישות
          </Link>
        </nav>
      </div>
    </footer>
  )
}
