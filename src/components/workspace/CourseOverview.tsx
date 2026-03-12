import { useState, useEffect } from 'react'
import { Calendar, Lock, Clock, ChevronLeft } from 'lucide-react'
import { ProgressBar } from '@/components/shared/ProgressBar'
import type { Course, CourseSession } from '@/types'
import type { useProgress } from '@/hooks/useProgress'

function formatScheduledDate(iso: string): string {
  return new Date(iso).toLocaleString('he-IL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Countdown({ targetIso }: { targetIso: string }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(targetIso).getTime() - Date.now()
      if (diff <= 0) { setLabel('בקרוב...'); return }
      const days = Math.floor(diff / 86_400_000)
      const hours = Math.floor((diff % 86_400_000) / 3_600_000)
      const mins = Math.floor((diff % 3_600_000) / 60_000)
      const parts: string[] = []
      if (days > 0) parts.push(`${days} ימים`)
      if (hours > 0) parts.push(`${hours} שעות`)
      if (days === 0) parts.push(`${mins} דקות`)
      setLabel(parts.join(', '))
    }
    update()
    const timer = setInterval(update, 30_000)
    return () => clearInterval(timer)
  }, [targetIso])

  return <span>{label}</span>
}

interface Props {
  course: Course | null
  sessions: CourseSession[]
  onSelectSession: (id: string) => void
  progress: ReturnType<typeof useProgress>
}

export function CourseOverview({ course, sessions, onSelectSession, progress }: Props) {
  const openCount = sessions.filter(s => s.status === 'open').length

  // Overall progress
  const totalCompleted = progress.allProgress.filter(p => p.completed).length
  const totalEstimated = sessions.filter(s => s.status === 'open').length * 3 // estimate
  const overallPercent = totalEstimated > 0 ? Math.min(100, Math.round((totalCompleted / totalEstimated) * 100)) : 0

  return (
    <div className="max-w-2xl mx-auto py-6 md:py-10 space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">{course?.title || 'הקורס שלי'}</h1>
        {course?.description && <p className="text-gray-400 text-sm mb-2">{course.description}</p>}
        <p className="text-gray-500 text-sm mb-4">
          {openCount > 0
            ? `${openCount} מפגש${openCount > 1 ? 'ים' : ''} פתוח${openCount > 1 ? 'ים' : ''} כרגע`
            : 'ממתין לפתיחת המפגש הראשון'}
        </p>
        {overallPercent > 0 && (
          <div className="flex items-center gap-3 max-w-sm">
            <div className="flex-1">
              <ProgressBar percent={overallPercent} size="md" label="התקדמות כוללת בקורס" />
            </div>
            <span className="text-sm text-gray-400 font-medium">{overallPercent}%</span>
          </div>
        )}
      </div>

      {/* Sessions list */}
      <div className="space-y-3" role="list">
        {sessions.map(session => {
          const isOpen = session.status === 'open'
          const isScheduled = session.status === 'locked' && !!session.scheduled_at
          const sessionPercent = progress.getSessionProgress(session.id, 3)

          return (
            <div
              key={session.id}
              role="listitem"
              onClick={() => isOpen && onSelectSession(session.id)}
              onKeyDown={e => { if (isOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelectSession(session.id) } }}
              tabIndex={isOpen ? 0 : undefined}
              className={`rounded-2xl p-5 border transition-all ${
                isOpen
                  ? 'bg-blue-600/10 border-blue-500/30 hover:border-blue-500/60 cursor-pointer'
                  : 'bg-white/3 border-white/8'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs text-gray-600 font-medium">מפגש {session.session_number}</span>
                    {isOpen && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">
                        פתוח
                      </span>
                    )}
                    {isScheduled && (
                      <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Clock size={10} aria-hidden="true" />
                        מתוזמן
                      </span>
                    )}
                    {!isOpen && !isScheduled && (
                      <span className="text-xs bg-white/8 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock size={10} aria-hidden="true" />
                        נעול
                      </span>
                    )}
                  </div>

                  <h3 className={`font-bold text-base leading-snug ${isOpen ? 'text-white' : 'text-gray-500'}`}>
                    {session.title}
                  </h3>

                  {session.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{session.description}</p>
                  )}

                  {isScheduled && session.scheduled_at && (
                    <p className="text-blue-400/80 text-xs mt-2.5 flex items-center gap-1.5">
                      <Calendar size={12} aria-hidden="true" />
                      {formatScheduledDate(session.scheduled_at)}
                      <span className="text-gray-600 mx-0.5" aria-hidden="true">&middot;</span>
                      עוד <Countdown targetIso={session.scheduled_at} />
                    </p>
                  )}

                  {isOpen && sessionPercent > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 max-w-[200px]">
                        <ProgressBar percent={sessionPercent} label={`התקדמות מפגש ${session.session_number}`} />
                      </div>
                      <span className="text-xs text-gray-500">{sessionPercent}%</span>
                    </div>
                  )}
                </div>

                {isOpen && (
                  <ChevronLeft size={20} className="text-blue-400 flex-shrink-0 mt-1" aria-hidden="true" />
                )}
              </div>
            </div>
          )
        })}

        {sessions.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p>הקורס עדיין לא נפתח</p>
          </div>
        )}
      </div>
    </div>
  )
}
