import { useState, useEffect, useCallback, useMemo } from 'react'
import { Menu } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getActiveCourses, getAllSessions, triggerAutoOpenSessions } from '@/lib/supabase/queries/workspace'
import { onCrossTabChange } from '@/lib/crossTabSync'
import { useAuth } from '@/hooks/useAuth'
import { useProgress } from '@/hooks/useProgress'
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation'
import { SEOHead } from '@/components/shared/SEOHead'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { SessionContent } from '@/components/workspace/SessionContent'
import { PromptLibrary } from '@/components/workspace/PromptLibrary'
import { PersonalNotes } from '@/components/workspace/PersonalNotes'
import { CourseOverview } from '@/components/workspace/CourseOverview'
import { AIMentor } from '@/components/workspace/AIMentor'
import { SearchModal } from '@/components/workspace/SearchModal'
import { PrepGate } from '@/components/workspace/PrepGate'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import type { Course, CourseSession } from '@/types'

type ActivePanel = 'content' | 'prompts' | 'notes'

export default function WorkspacePage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<CourseSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>('content')
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const progress = useProgress(user?.id)
  const { settings } = useSystemSettings()

  // Load courses on mount
  useEffect(() => {
    triggerAutoOpenSessions().catch(() => null)

    getActiveCourses().then(data => {
      setCourses(data)
      if (data.length > 0) {
        setSelectedCourseId(data[0].id)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Load sessions when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setSessions([])
      return
    }
    getAllSessions(selectedCourseId).then(data => {
      setSessions(data)
      setSelectedSessionId(null)
    }).catch(() => null)

    // Realtime for sessions
    const channel = supabase
      .channel(`workspace-sessions-${selectedCourseId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'course_sessions' },
        payload => {
          const updated = payload.new as CourseSession
          setSessions(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedCourseId])

  // Cross-tab sync: reload data when admin makes changes in another tab
  useEffect(() => {
    return onCrossTabChange((event) => {
      if (event.table === 'courses') {
        getActiveCourses().then(data => {
          setCourses(data)
          // If current course was deactivated, reset selection
          if (selectedCourseId && !data.find(c => c.id === selectedCourseId)) {
            setSelectedCourseId(data.length > 0 ? data[0].id : null)
          }
        }).catch(() => null)
      }
      if (event.table === 'course_sessions' && selectedCourseId) {
        getAllSessions(selectedCourseId).then(data => {
          setSessions(data)
        }).catch(() => null)
      }
    })
  }, [selectedCourseId])

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleSelectSession = useCallback((id: string) => {
    setSelectedSessionId(id)
    setSidebarOpen(false)
  }, [])

  const handleSearchNavigate = useCallback((sessionId: string | null, panel?: ActivePanel) => {
    if (sessionId) {
      setSelectedSessionId(sessionId)
      if (panel) setActivePanel(panel)
    }
  }, [])

  // Swipe navigation
  const openSessions = useMemo(() => sessions.filter(s => s.status === 'open'), [sessions])

  const goToNextSession = useCallback(() => {
    if (!selectedSessionId || openSessions.length < 2) return
    const idx = openSessions.findIndex(s => s.id === selectedSessionId)
    if (idx >= 0 && idx < openSessions.length - 1) setSelectedSessionId(openSessions[idx + 1].id)
  }, [selectedSessionId, openSessions])

  const goToPrevSession = useCallback(() => {
    if (!selectedSessionId || openSessions.length < 2) return
    const idx = openSessions.findIndex(s => s.id === selectedSessionId)
    if (idx > 0) setSelectedSessionId(openSessions[idx - 1].id)
  }, [selectedSessionId, openSessions])

  const swipeRef = useSwipeNavigation({
    onSwipeLeft: goToNextSession,
    onSwipeRight: goToPrevSession,
    enabled: !!selectedSessionId,
  })

  const selectedSession = sessions.find(s => s.id === selectedSessionId) ?? null
  const selectedCourse = courses.find(c => c.id === selectedCourseId) ?? null

  return (
    <div className="learn-zone min-h-screen flex" dir="rtl">
      <SEOHead title="סביבת למידה" noindex />

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 right-4 z-50 md:hidden bg-[#111118] border border-white/10 rounded-xl p-2.5 text-gray-400 hover:text-white transition-colors shadow-lg"
        aria-label="פתח תפריט"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-64 transition-transform duration-300 md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <WorkspaceSidebar
          courses={courses}
          selectedCourseId={selectedCourseId}
          onSelectCourse={setSelectedCourseId}
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={handleSelectSession}
          onShowOverview={() => { setSelectedSessionId(null); setSidebarOpen(false) }}
          activePanel={activePanel}
          onSelectPanel={setActivePanel}
          loading={loading}
          onOpenSearch={() => setSearchOpen(true)}
          userId={user?.id}
          progress={progress}
        />
      </div>

      <main
        className="flex-1 overflow-auto p-4 md:p-8 pt-16 md:pt-8"
        id="main-content"
        ref={swipeRef as React.RefObject<HTMLElement>}
      >
        {selectedCourseId ? (
          <>
            {!selectedSession && !loading && (
              <CourseOverview
                course={selectedCourse}
                sessions={sessions}
                onSelectSession={handleSelectSession}
                progress={progress}
              />
            )}

            {selectedSession && (
              <PrepGate courseId={selectedCourseId} sessionId={selectedSession.id}>
                {activePanel === 'content' && (
                  <SessionContent session={selectedSession} course={selectedCourse} userId={user?.id} progress={progress} />
                )}
                {activePanel === 'prompts' && (
                  <PromptLibrary sessionId={selectedSession.id} />
                )}
                {user && activePanel === 'notes' && (
                  <PersonalNotes userId={user.id} sessionId={selectedSession.id} />
                )}
              </PrepGate>
            )}
          </>
        ) : !loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            אין קורסים פעילים
          </div>
        ) : null}
      </main>

      {settings.ai_mentor_active === 'true' && <AIMentor />}

      <SearchModal
        userId={user?.id}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleSearchNavigate}
      />
    </div>
  )
}
