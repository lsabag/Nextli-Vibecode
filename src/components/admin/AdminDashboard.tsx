import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import {
  Users, GraduationCap, BookOpen, UserPlus, Star,
  MessageSquare, Calendar, Mail, AlertCircle, CheckCircle2,
} from 'lucide-react'

type Stats = {
  totalStudents: number
  paidStudents: number
  totalCourses: number
  activeCourses: number
  totalSessions: number
  openSessions: number
  totalWaitlist: number
  pendingWaitlist: number
  totalFeedback: number
  avgRating: number | null
  totalContactMessages: number
  unreadContactMessages: number
  courseDetails: {
    id: string
    title: string
    status: string
    sessionCount: number
    openSessionCount: number
    contentCount: number
    revealedCount: number
  }[]
  upcomingSessions: {
    courseTitle: string
    sessionTitle: string
    sessionNumber: number
    scheduledAt: string
    status: string
  }[]
  recentWaitlist: { full_name: string; email: string; created_at: string; status: string }[]
  recentFeedback: { session_title: string; rating: number | null; learned: string; updated_at: string }[]
  recentContactMessages: { full_name: string; email: string; message: string; created_at: string }[]
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType
  label: string
  value: number | string
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <span className="text-sm text-gray-400 font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return dateStr }
}

function timeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'עכשיו'
    if (diffMins < 60) return `לפני ${diffMins} דקות`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `לפני ${diffHours} שעות`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `לפני ${diffDays} ימים`
    return formatDate(dateStr)
  } catch { return dateStr }
}

function daysUntil(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'עבר'
    if (diffDays === 0) return 'היום'
    if (diffDays === 1) return 'מחר'
    return `בעוד ${diffDays} ימים`
  } catch { return '' }
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setSearchParams] = useSearchParams()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      const [
        { data: users },
        { data: courses },
        { data: sessions },
        { data: content },
        { data: waitlist },
        { data: feedback },
        { data: contactMessages },
      ] = await Promise.all([
        supabase.from('user_profiles').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('course_sessions').select('*'),
        supabase.from('session_content').select('*'),
        supabase.from('waitlist').select('*'),
        supabase.from('session_feedback').select('*'),
        supabase.from('contact_messages').select('*'),
      ])

      const userList = (users ?? []) as Record<string, unknown>[]
      const courseList = (courses ?? []) as Record<string, unknown>[]
      const sessionList = (sessions ?? []) as Record<string, unknown>[]
      const contentList = (content ?? []) as Record<string, unknown>[]
      const waitlistList = (waitlist ?? []) as Record<string, unknown>[]
      const feedbackList = (feedback ?? []) as Record<string, unknown>[]
      const contactList = (contactMessages ?? []) as Record<string, unknown>[]

      const students = userList.filter(u => u.role === 'student')

      // Course details with readiness info
      const courseDetails = courseList.map(c => {
        const courseSessions = sessionList.filter(s => s.course_id === c.id)
        const courseContent = contentList.filter(ct =>
          courseSessions.some(s => s.id === ct.session_id)
        )
        const openSessionCount = courseSessions.filter(s => s.status === 'open').length
        const revealedCount = courseSessions.filter(s => (s.reveal_index as number) > 0).length
        return {
          id: c.id as string,
          title: (c.title as string) || '(ללא כותרת)',
          status: c.status as string,
          sessionCount: courseSessions.length,
          openSessionCount,
          contentCount: courseContent.length,
          revealedCount,
        }
      })

      // Upcoming scheduled sessions
      const now = new Date()
      const sessionToCourse = new Map(
        sessionList.map(s => [s.id as string, courseList.find(c => c.id === s.course_id)])
      )
      const upcomingSessions = sessionList
        .filter(s => s.scheduled_at && new Date(s.scheduled_at as string) >= now)
        .sort((a, b) => new Date(a.scheduled_at as string).getTime() - new Date(b.scheduled_at as string).getTime())
        .slice(0, 5)
        .map(s => {
          const course = sessionToCourse.get(s.id as string)
          return {
            courseTitle: (course?.title as string) || '',
            sessionTitle: (s.title as string) || '(ללא כותרת)',
            sessionNumber: s.session_number as number,
            scheduledAt: s.scheduled_at as string,
            status: s.status as string,
          }
        })

      // Recent waitlist
      const sortedWaitlist = [...waitlistList].sort((a, b) =>
        new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
      )
      const recentWaitlist = sortedWaitlist.slice(0, 5).map(w => ({
        full_name: w.full_name as string,
        email: w.email as string,
        created_at: w.created_at as string,
        status: w.status as string,
      }))

      // Feedback stats
      const ratings = feedbackList
        .map(f => f.rating as number | null)
        .filter((r): r is number => r !== null && r > 0)
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null

      // Recent feedback
      const sortedFeedback = [...feedbackList].sort((a, b) =>
        new Date(b.updated_at as string).getTime() - new Date(a.updated_at as string).getTime()
      )
      const recentFeedback = sortedFeedback.slice(0, 5).map(f => {
        const session = sessionList.find(s => s.id === f.session_id)
        return {
          session_title: (session?.title as string) || '(מפגש)',
          rating: f.rating as number | null,
          learned: (f.learned as string) || '',
          updated_at: f.updated_at as string,
        }
      })

      // Contact messages
      const sortedContact = [...contactList].sort((a, b) =>
        new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
      )
      const recentContactMessages = sortedContact.slice(0, 5).map(m => ({
        full_name: m.full_name as string || m.name as string || '',
        email: m.email as string || '',
        message: m.message as string || '',
        created_at: m.created_at as string,
      }))

      setStats({
        totalStudents: students.length,
        paidStudents: students.filter(s => s.payment_status === 'paid').length,
        totalCourses: courseList.length,
        activeCourses: courseList.filter(c => c.status === 'active').length,
        totalSessions: sessionList.length,
        openSessions: sessionList.filter(s => s.status === 'open').length,
        totalWaitlist: waitlistList.length,
        pendingWaitlist: waitlistList.filter(w => w.status === 'pending').length,
        totalFeedback: feedbackList.length,
        avgRating,
        totalContactMessages: contactList.length,
        unreadContactMessages: contactList.filter(m => !(m.is_read as boolean)).length,
        courseDetails,
        upcomingSessions,
        recentWaitlist,
        recentFeedback,
        recentContactMessages,
      })
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div dir="rtl">
        <h2 className="text-xl font-bold text-white mb-6">דשבורד</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const statusLabels: Record<string, string> = {
    draft: 'טיוטה',
    active: 'פעיל',
    completed: 'הושלם',
  }
  const statusColors: Record<string, string> = {
    draft: 'text-gray-400 bg-gray-500/10',
    active: 'text-green-400 bg-green-500/10',
    completed: 'text-blue-400 bg-blue-500/10',
  }

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">דשבורד</h2>
          <p className="text-sm text-gray-500">סקירה כללית של המערכת</p>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="תלמידים"
          value={stats.totalStudents}
          sub={stats.paidStudents > 0 ? `${stats.paidStudents} שילמו` : undefined}
          color="bg-blue-600"
        />
        <StatCard
          icon={GraduationCap}
          label="קורסים"
          value={stats.totalCourses}
          sub={stats.activeCourses > 0 ? `${stats.activeCourses} פעילים` : undefined}
          color="bg-purple-600"
        />
        <StatCard
          icon={UserPlus}
          label="רשימת המתנה"
          value={stats.totalWaitlist}
          sub={stats.pendingWaitlist > 0 ? `${stats.pendingWaitlist} ממתינים` : undefined}
          color="bg-amber-600"
        />
        <StatCard
          icon={Star}
          label="פידבקים"
          value={stats.totalFeedback}
          sub={stats.avgRating ? `דירוג ממוצע: ${stats.avgRating} ⭐` : undefined}
          color="bg-rose-600"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={BookOpen}
          label="מפגשים"
          value={stats.totalSessions}
          sub={`${stats.openSessions} פתוחים`}
          color="bg-emerald-600"
        />
        <StatCard
          icon={Mail}
          label="פניות"
          value={stats.totalContactMessages}
          sub={stats.unreadContactMessages > 0 ? `${stats.unreadContactMessages} לא נקראו` : 'הכל נקרא'}
          color="bg-cyan-600"
        />
        <StatCard
          icon={Calendar}
          label="מפגשים מתוכננים"
          value={stats.upcomingSessions.length}
          sub={stats.upcomingSessions.length > 0 ? `הבא: ${daysUntil(stats.upcomingSessions[0].scheduledAt)}` : 'אין מתוכננים'}
          color="bg-indigo-600"
        />
        <StatCard
          icon={MessageSquare}
          label="דירוג ממוצע"
          value={stats.avgRating ? `${stats.avgRating}` : '—'}
          sub={stats.totalFeedback > 0 ? `מתוך ${stats.totalFeedback} פידבקים` : 'אין פידבקים עדיין'}
          color="bg-orange-600"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Course breakdown with readiness */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">מצב קורסים</h3>
          {stats.courseDetails.length === 0 ? (
            <p className="text-gray-500 text-sm">אין קורסים עדיין</p>
          ) : (
            <div className="space-y-3">
              {stats.courseDetails.map(c => (
                <div key={c.id} className="bg-white/[0.03] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColors[c.status] || 'text-gray-400 bg-gray-500/10'}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                    <span className="text-sm text-white font-medium truncate">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen size={10} />
                      {c.sessionCount} מפגשים
                    </span>
                    <span className="flex items-center gap-1">
                      {c.openSessionCount > 0
                        ? <><CheckCircle2 size={10} className="text-green-500" /> {c.openSessionCount} פתוחים</>
                        : <><AlertCircle size={10} className="text-gray-600" /> סגורים</>
                      }
                    </span>
                    <span>{c.contentCount} בלוקים</span>
                    {c.revealedCount > 0 && (
                      <span className="text-blue-400">{c.revealedCount} חשפו תוכן</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming sessions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">מפגשים קרובים</h3>
          {stats.upcomingSessions.length === 0 ? (
            <div className="text-center py-6">
              <Calendar size={24} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">אין מפגשים מתוכננים</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.upcomingSessions.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-3">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-400">{s.sessionNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{s.sessionTitle}</p>
                    <p className="text-[10px] text-gray-500">{s.courseTitle}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-xs text-indigo-400 font-medium">{daysUntil(s.scheduledAt)}</p>
                    <p className="text-[10px] text-gray-600">{formatDateTime(s.scheduledAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent waitlist */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">נרשמו לאחרונה</h3>
          {stats.recentWaitlist.length === 0 ? (
            <p className="text-gray-500 text-sm">אין נרשמים עדיין</p>
          ) : (
            <div className="space-y-2">
              {stats.recentWaitlist.map((w, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-3">
                  <div className="w-8 h-8 bg-amber-600/20 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-amber-400">{w.full_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{w.full_name}</p>
                    <p className="text-[10px] text-gray-500" dir="ltr">{w.email}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      w.status === 'pending' ? 'text-amber-400 bg-amber-500/10' : 'text-green-400 bg-green-500/10'
                    }`}>
                      {w.status === 'pending' ? 'ממתין' : 'אושר'}
                    </span>
                    <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(w.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent feedback */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">פידבקים אחרונים</h3>
          {stats.recentFeedback.length === 0 ? (
            <div className="text-center py-6">
              <MessageSquare size={24} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">אין פידבקים עדיין</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentFeedback.map((f, i) => (
                <div key={i} className="bg-white/[0.03] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{f.session_title}</span>
                    <div className="flex items-center gap-1">
                      {f.rating ? (
                        <span className="text-xs text-amber-400 flex items-center gap-0.5">
                          {f.rating}<Star size={10} className="fill-amber-400" />
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-600">ללא דירוג</span>
                      )}
                    </div>
                  </div>
                  {f.learned && (
                    <p className="text-xs text-gray-300 line-clamp-2">{f.learned}</p>
                  )}
                  <p className="text-[10px] text-gray-600 mt-1">{timeAgo(f.updated_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent contact messages */}
        {stats.recentContactMessages.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">פניות אחרונות</h3>
              <button
                onClick={() => setSearchParams({ tab: 'students', sub: 'contact-messages' })}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                כל הפניות &larr;
              </button>
            </div>
            <div className="space-y-2">
              {stats.recentContactMessages.map((m, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/[0.03] rounded-lg p-3">
                  <div className="w-8 h-8 bg-cyan-600/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Mail size={14} className="text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm text-white font-medium">{m.full_name}</span>
                      <span className="text-[10px] text-gray-500" dir="ltr">{m.email}</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{m.message}</p>
                  </div>
                  <span className="text-[10px] text-gray-600 shrink-0">{timeAgo(m.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
