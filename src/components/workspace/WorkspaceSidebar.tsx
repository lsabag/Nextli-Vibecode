import type { ReactNode } from 'react'
import { Lock, BookOpen, Zap, FileText, LogOut, LayoutDashboard, Calendar, Search, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { NotificationBell } from '@/components/workspace/NotificationBell'
import type { Course, CourseSession } from '@/types'
import type { useProgress } from '@/hooks/useProgress'

type ActivePanel = 'content' | 'prompts' | 'notes'

type Props = {
  courses: Course[]
  selectedCourseId: string | null
  onSelectCourse: (id: string) => void
  sessions: CourseSession[]
  selectedSessionId: string | null
  onSelectSession: (id: string) => void
  onShowOverview: () => void
  activePanel: ActivePanel
  onSelectPanel: (panel: ActivePanel) => void
  loading: boolean
  onOpenSearch: () => void
  userId: string | undefined
  progress: ReturnType<typeof useProgress>
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function WorkspaceSidebar({
  courses,
  selectedCourseId,
  onSelectCourse,
  sessions,
  selectedSessionId,
  onSelectSession,
  onShowOverview,
  activePanel,
  onSelectPanel,
  loading,
  onOpenSearch,
  userId,
  progress,
}: Props) {
  const panels: { id: ActivePanel; label: string; icon: ReactNode }[] = [
    { id: 'content', label: 'תוכן', icon: <BookOpen size={16} aria-hidden="true" /> },
    { id: 'prompts', label: 'פרומפטים', icon: <Zap size={16} aria-hidden="true" /> },
    { id: 'notes', label: 'הפנקס שלי', icon: <FileText size={16} aria-hidden="true" /> },
  ]

  const isOverview = selectedSessionId === null

  return (
    <aside
      className="w-64 bg-[#111118] border-l border-white/10 flex flex-col h-screen sticky top-0 overflow-y-auto no-scrollbar"
      dir="rtl"
      aria-label="סרגל צד - ניווט הקורס"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <span className="text-white font-black text-lg" aria-label="Nextli וייבקוד">
          Nextli: <span className="text-blue-400">וייבקוד</span>
        </span>
      </div>

      {/* Search button */}
      <div className="px-4 pt-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="חיפוש - Ctrl+K"
        >
          <Search size={14} aria-hidden="true" />
          <span className="text-xs flex-1 text-right">חיפוש...</span>
          <kbd className="text-[10px] bg-white/5 px-1 py-0.5 rounded border border-white/10" aria-hidden="true">⌘K</kbd>
        </button>
      </div>

      {/* Course selector */}
      {courses.length > 1 && (
        <div className="px-4 pt-3">
          <div className="relative">
            <select
              value={selectedCourseId ?? ''}
              onChange={e => onSelectCourse(e.target.value)}
              className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors pr-8"
              aria-label="בחר קורס"
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Overview button */}
      <div className="px-4 pt-3">
        <button
          onClick={onShowOverview}
          aria-current={isOverview ? 'page' : undefined}
          className={`w-full text-right px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
            isOverview
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-gray-400 hover:bg-white/5'
          }`}
        >
          <LayoutDashboard size={16} aria-hidden="true" />
          <span className="text-sm font-medium">סקירת הקורס</span>
        </button>
      </div>

      {/* Sessions */}
      <nav className="px-4 py-4 flex-1" aria-label="רשימת מפגשים">
        <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
          מפגשים
        </h2>
        {loading ? (
          <div className="space-y-2" aria-busy="true" aria-label="טוען מפגשים">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-4">אין מפגשים בקורס זה</p>
        ) : (
          <ul className="space-y-1" role="list">
            {sessions.map(session => {
              const isLocked = session.status === 'locked'
              const isSelected = session.id === selectedSessionId
              const isScheduled = isLocked && !!session.scheduled_at
              const sessionPercent = progress.getSessionProgress(session.id, 3)

              return (
                <li key={session.id}>
                  <button
                    onClick={() => !isLocked && onSelectSession(session.id)}
                    disabled={isLocked}
                    aria-current={isSelected ? 'true' : undefined}
                    aria-label={`מפגש ${session.session_number}: ${session.title.replace(/^מפגש \d+: /, '')}${isLocked ? ' - נעול' : ''}`}
                    className={`w-full text-right px-4 py-3 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-400'
                        : isLocked
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          מפגש {session.session_number}: {session.title.replace(/^מפגש \d+: /, '')}
                        </p>
                        {isScheduled && session.scheduled_at && (
                          <p className="text-blue-400/60 text-xs mt-0.5 flex items-center gap-1">
                            <Calendar size={10} aria-hidden="true" />
                            {formatShortDate(session.scheduled_at)}
                          </p>
                        )}
                      </div>
                      {isLocked && !isScheduled && <Lock size={14} className="flex-shrink-0 text-gray-600 mt-0.5" aria-hidden="true" />}
                      {isScheduled && <Calendar size={14} className="flex-shrink-0 text-blue-400/50 mt-0.5" aria-hidden="true" />}
                    </div>
                    {!isLocked && sessionPercent > 0 && (
                      <div className="mt-2">
                        <ProgressBar percent={sessionPercent} label={`התקדמות מפגש ${session.session_number}`} />
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </nav>

      {/* Panel Switcher */}
      <div className="px-4 py-4 border-t border-white/10">
        <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
          כלים
        </h2>
        <div className="space-y-1" role="group" aria-label="בחירת פאנל">
          {panels.map(panel => (
            <button
              key={panel.id}
              onClick={() => onSelectPanel(panel.id)}
              aria-pressed={activePanel === panel.id && !isOverview}
              className={`w-full text-right px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                activePanel === panel.id && !isOverview
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              {panel.icon}
              <span className="text-sm font-medium">{panel.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="px-4 py-2">
        <NotificationBell userId={userId} />
      </div>

      {/* Sign out */}
      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} aria-hidden="true" />
          <span className="text-sm font-medium">יציאה</span>
        </button>
      </div>
    </aside>
  )
}
