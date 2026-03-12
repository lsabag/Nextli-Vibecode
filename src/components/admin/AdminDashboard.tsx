import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Users, GraduationCap, BookOpen, FileText, Clock, UserPlus,
  TrendingUp, Eye,
} from 'lucide-react'

type Stats = {
  totalStudents: number
  totalAdmins: number
  paidStudents: number
  unpaidStudents: number
  totalCourses: number
  activeCourses: number
  draftCourses: number
  completedCourses: number
  totalSessions: number
  openSessions: number
  lockedSessions: number
  totalContent: number
  totalWaitlist: number
  pendingWaitlist: number
  recentWaitlist: { full_name: string; email: string; created_at: string }[]
  contentByType: Record<string, number>
  courseDetails: { id: string; title: string; status: string; sessionCount: number; contentCount: number }[]
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

const contentTypeLabels: Record<string, string> = {
  video: 'וידאו',
  code: 'קוד',
  text: 'טקסט',
  rich_text: 'טקסט עשיר',
  file: 'קובץ',
  prompt: 'פרומפט',
  feedback: 'משוב',
  prep: 'הכנה',
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

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
      ] = await Promise.all([
        supabase.from('user_profiles').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('course_sessions').select('*'),
        supabase.from('session_content').select('*'),
        supabase.from('waitlist').select('*'),
      ])

      const userList = (users ?? []) as Record<string, unknown>[]
      const courseList = (courses ?? []) as Record<string, unknown>[]
      const sessionList = (sessions ?? []) as Record<string, unknown>[]
      const contentList = (content ?? []) as Record<string, unknown>[]
      const waitlistList = (waitlist ?? []) as Record<string, unknown>[]

      const students = userList.filter(u => u.role === 'student')
      const admins = userList.filter(u => u.role === 'admin')

      // Content by type
      const contentByType: Record<string, number> = {}
      for (const c of contentList) {
        const t = c.content_type as string
        contentByType[t] = (contentByType[t] || 0) + 1
      }

      // Course details
      const courseDetails = courseList.map(c => {
        const courseSessions = sessionList.filter(s => s.course_id === c.id)
        const courseContent = contentList.filter(ct =>
          courseSessions.some(s => s.id === ct.session_id)
        )
        return {
          id: c.id as string,
          title: (c.title as string) || '(ללא כותרת)',
          status: c.status as string,
          sessionCount: courseSessions.length,
          contentCount: courseContent.length,
        }
      })

      // Recent waitlist (last 5)
      const sorted = [...waitlistList].sort((a, b) =>
        new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
      )
      const recentWaitlist = sorted.slice(0, 5).map(w => ({
        full_name: w.full_name as string,
        email: w.email as string,
        created_at: w.created_at as string,
      }))

      setStats({
        totalStudents: students.length,
        totalAdmins: admins.length,
        paidStudents: students.filter(s => s.payment_status === 'paid').length,
        unpaidStudents: students.filter(s => s.payment_status === 'unpaid').length,
        totalCourses: courseList.length,
        activeCourses: courseList.filter(c => c.status === 'active').length,
        draftCourses: courseList.filter(c => c.status === 'draft').length,
        completedCourses: courseList.filter(c => c.status === 'completed').length,
        totalSessions: sessionList.length,
        openSessions: sessionList.filter(s => s.status === 'open').length,
        lockedSessions: sessionList.filter(s => s.status === 'locked').length,
        totalContent: contentList.length,
        totalWaitlist: waitlistList.length,
        pendingWaitlist: waitlistList.filter(w => w.status === 'pending').length,
        recentWaitlist,
        contentByType,
        courseDetails,
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
          icon={BookOpen}
          label="מפגשים"
          value={stats.totalSessions}
          sub={stats.openSessions > 0 ? `${stats.openSessions} פתוחים` : undefined}
          color="bg-emerald-600"
        />
        <StatCard
          icon={UserPlus}
          label="רשימת המתנה"
          value={stats.totalWaitlist}
          sub={stats.pendingWaitlist > 0 ? `${stats.pendingWaitlist} ממתינים` : undefined}
          color="bg-amber-600"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={FileText}
          label="בלוקי תוכן"
          value={stats.totalContent}
          color="bg-cyan-600"
        />
        <StatCard
          icon={Eye}
          label="מפגשים פתוחים"
          value={stats.openSessions}
          sub={stats.lockedSessions > 0 ? `${stats.lockedSessions} נעולים` : undefined}
          color="bg-indigo-600"
        />
        <StatCard
          icon={TrendingUp}
          label="קורסים פעילים"
          value={stats.activeCourses}
          sub={stats.draftCourses > 0 ? `${stats.draftCourses} טיוטות` : undefined}
          color="bg-rose-600"
        />
        <StatCard
          icon={Clock}
          label="מנהלים"
          value={stats.totalAdmins}
          color="bg-slate-600"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Course breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">פירוט קורסים</h3>
          {stats.courseDetails.length === 0 ? (
            <p className="text-gray-500 text-sm">אין קורסים עדיין</p>
          ) : (
            <div className="space-y-3">
              {stats.courseDetails.map(c => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColors[c.status] || 'text-gray-400 bg-gray-500/10'}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                    <span className="text-sm text-white truncate">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                    <span>{c.sessionCount} מפגשים</span>
                    <span>{c.contentCount} בלוקים</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content by type */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">תוכן לפי סוג</h3>
          {Object.keys(stats.contentByType).length === 0 ? (
            <p className="text-gray-500 text-sm">אין תוכן עדיין</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(stats.contentByType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => {
                  const max = Math.max(...Object.values(stats.contentByType))
                  const pct = max > 0 ? (count / max) * 100 : 0
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">{contentTypeLabels[type] || type}</span>
                        <span className="text-xs text-white font-semibold">{count}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Recent waitlist */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:col-span-2">
          <h3 className="text-sm font-bold text-white mb-4">נרשמו לאחרונה לרשימת המתנה</h3>
          {stats.recentWaitlist.length === 0 ? (
            <p className="text-gray-500 text-sm">אין נרשמים עדיין</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-white/10">
                    <th className="text-right pb-2 font-medium">שם</th>
                    <th className="text-right pb-2 font-medium">אימייל</th>
                    <th className="text-right pb-2 font-medium">תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentWaitlist.map((w, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2.5 text-white">{w.full_name}</td>
                      <td className="py-2.5 text-gray-400" dir="ltr">{w.email}</td>
                      <td className="py-2.5 text-gray-500">{formatDate(w.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
