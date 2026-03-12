import { useEffect, useState } from 'react'
import { getAdminUsers, updateUserPaymentStatus, getWizardAnswersWithSteps } from '@/lib/supabase/queries/admin'
import { exportToCSV } from '@/utils/exportCSV'
import { Search, Download, Users, CreditCard, CheckCircle } from 'lucide-react'
import type { UserProfile } from '@/types'

type FilterStatus = 'all' | 'paid' | 'unpaid'
type SortBy = 'created_at' | 'full_name' | 'payment_status'

export function StudentInsights() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortBy>('created_at')

  function loadUsers() {
    setLoading(true)
    setFetchError(null)
    getAdminUsers()
      .then(data => { setUsers(data); setLoading(false) })
      .catch(err => {
        setFetchError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים')
        setLoading(false)
      })
  }

  useEffect(() => { loadUsers() }, [])

  async function togglePayment(user: UserProfile) {
    const next = user.payment_status === 'paid' ? 'unpaid' : 'paid'
    await updateUserPaymentStatus(user.id, next)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, payment_status: next } : u))
  }

  // Stats
  const totalStudents = users.filter(u => u.role !== 'admin').length
  const paidStudents = users.filter(u => u.role !== 'admin' && u.payment_status === 'paid').length
  const onboardedStudents = users.filter(u => u.role !== 'admin' && u.onboarding_completed).length

  // Filter & sort
  const filteredUsers = users
    .filter(u => {
      if (searchQuery && !u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filterStatus === 'paid' && u.payment_status !== 'paid') return false
      if (filterStatus === 'unpaid' && u.payment_status !== 'unpaid') return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'full_name') return (a.full_name || '').localeCompare(b.full_name || '', 'he')
      if (sortBy === 'payment_status') return a.payment_status.localeCompare(b.payment_status)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Registration by week
  const weeklyData = getWeeklyRegistrations(users)

  // CSV exports
  async function handleExportStudents() {
    const headers = ['שם מלא', 'תפקיד', 'אונבורדינג', 'תשלום', 'תאריך הצטרפות']
    const rows = users.map(u => [
      u.full_name || '—',
      u.role === 'admin' ? 'מנהל' : 'תלמיד',
      u.onboarding_completed ? 'הושלם' : 'ממתין',
      u.payment_status === 'paid' ? 'שילם' : 'לא שילם',
      new Date(u.created_at).toLocaleDateString('he-IL'),
    ])
    exportToCSV('students.csv', headers, rows)
  }

  async function handleExportOnboarding() {
    try {
      const { steps, answers } = await getWizardAnswersWithSteps()
      const headers = ['שם תלמיד', ...steps.map(s => s.question_text)]
      const userMap = new Map(users.map(u => [u.id, u.full_name || u.id]))
      const grouped = new Map<string, Map<string, string>>()

      for (const a of answers) {
        if (!grouped.has(a.user_id)) grouped.set(a.user_id, new Map())
        grouped.get(a.user_id)!.set(a.step_id, a.answer)
      }

      const rows: string[][] = []
      for (const [userId, answerMap] of grouped) {
        rows.push([
          userMap.get(userId) || userId,
          ...steps.map(s => answerMap.get(s.id) || ''),
        ])
      }
      exportToCSV('onboarding-answers.csv', headers, rows)
    } catch {
      // silently fail
    }
  }

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">תלמידים רשומים</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportStudents}
            className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            aria-label="ייצוא רשימת תלמידים ל-CSV"
          >
            <Download size={13} aria-hidden="true" />
            ייצוא תלמידים
          </button>
          <button
            onClick={handleExportOnboarding}
            className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            aria-label="ייצוא תשובות אונבורדינג ל-CSV"
          >
            <Download size={13} aria-hidden="true" />
            ייצוא אונבורדינג
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard icon={<Users size={20} />} label="סה״כ תלמידים" value={totalStudents} color="blue" />
        <StatsCard icon={<CreditCard size={20} />} label="שילמו" value={paidStudents} sub={totalStudents > 0 ? `${Math.round((paidStudents / totalStudents) * 100)}%` : '0%'} color="green" />
        <StatsCard icon={<CheckCircle size={20} />} label="השלימו אונבורדינג" value={onboardedStudents} sub={totalStudents > 0 ? `${Math.round((onboardedStudents / totalStudents) * 100)}%` : '0%'} color="purple" />
      </div>

      {/* Weekly registrations chart */}
      {weeklyData.length > 1 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">הרשמות לפי שבוע</h3>
          <div className="flex items-end gap-1 h-24" aria-label="גרף הרשמות שבועי" role="img">
            {weeklyData.map((week, i) => {
              const maxVal = Math.max(...weeklyData.map(w => w.count), 1)
              const height = (week.count / maxVal) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{week.count}</span>
                  <div
                    className="w-full rounded-t bg-blue-500/60 transition-all"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[9px] text-gray-600 truncate max-w-full">{week.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Payment distribution */}
      {totalStudents > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">התפלגות תשלום</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden flex">
              <div className="h-full bg-green-500 rounded-r-full transition-all" style={{ width: `${(paidStudents / totalStudents) * 100}%` }} />
              <div className="h-full bg-red-500/60 rounded-l-full transition-all" style={{ width: `${((totalStudents - paidStudents) / totalStudents) * 100}%` }} />
            </div>
            <div className="flex gap-4 text-xs shrink-0">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />שילמו ({paidStudents})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/60" />לא שילמו ({totalStudents - paidStudents})</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="חפש לפי שם..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pr-9 pl-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
            aria-label="חיפוש תלמידים"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as FilterStatus)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
          aria-label="סנן לפי סטטוס תשלום"
        >
          <option value="all">הכל</option>
          <option value="paid">שילמו</option>
          <option value="unpaid">לא שילמו</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortBy)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
          aria-label="מיון"
        >
          <option value="created_at">תאריך הצטרפות</option>
          <option value="full_name">שם</option>
          <option value="payment_status">סטטוס תשלום</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">טוען תלמידים...</span>
        </div>
      ) : fetchError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center space-y-3" role="alert">
          <p className="text-red-400 text-sm">{fetchError}</p>
          <button
            onClick={loadUsers}
            className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            נסה שוב
          </button>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10 overflow-x-auto">
          <table className="w-full min-w-[640px]" aria-label="טבלת תלמידים">
            <thead>
              <tr className="bg-blue-600/80">
                <th className="text-white px-4 py-3 text-right font-semibold text-sm" scope="col">שם מלא</th>
                <th className="text-white px-4 py-3 text-right font-semibold text-sm" scope="col">תפקיד</th>
                <th className="text-white px-4 py-3 text-right font-semibold text-sm" scope="col">אונבורדינג</th>
                <th className="text-white px-4 py-3 text-right font-semibold text-sm" scope="col">תשלום</th>
                <th className="text-white px-4 py-3 text-right font-semibold text-sm" scope="col">תאריך הצטרפות</th>
                <th className="text-white px-4 py-3 text-right font-semibold text-sm" scope="col">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-sm text-gray-200">{user.full_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-white/10 text-gray-400'
                    }`}>
                      {user.role === 'admin' ? 'מנהל' : 'תלמיד'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.onboarding_completed
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {user.onboarding_completed ? 'הושלם' : 'ממתין'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.payment_status === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {user.payment_status === 'paid' ? 'שילם' : 'לא שילם'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePayment(user)}
                      className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {user.payment_status === 'paid' ? 'בטל תשלום' : 'אשר תשלום'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                    {searchQuery ? 'לא נמצאו תוצאות' : 'אין תלמידים רשומים עדיין'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Helper components ───────────────────────────────────────────────────────

function StatsCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number; sub?: string
  color: 'blue' | 'green' | 'purple'
}) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    purple: 'bg-purple-500/10 text-purple-400',
  }
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-500 flex items-center gap-2">
        {label}
        {sub && <span className="text-xs text-gray-600">({sub})</span>}
      </div>
    </div>
  )
}

function getWeeklyRegistrations(users: UserProfile[]) {
  const weeks = new Map<string, number>()
  for (const user of users) {
    const d = new Date(user.created_at)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().split('T')[0]
    weeks.set(key, (weeks.get(key) || 0) + 1)
  }
  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([key, count]) => ({
      label: new Date(key).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
      count,
    }))
}
