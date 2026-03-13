import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Star, MessageSquare, Users, ChevronDown, ChevronUp } from 'lucide-react'

type Feedback = {
  id: string
  user_id: string
  session_id: string
  learned: string
  missing: string
  rating: number | null
  updated_at: string
}

type SessionInfo = {
  id: string
  title: string
  session_number: number
  course_id: string
}

type UserInfo = {
  id: string
  full_name: string
}

type SessionGroup = {
  session: SessionInfo
  feedbacks: (Feedback & { userName: string })[]
  avgRating: number | null
}

export function FeedbackViewer() {
  const [groups, setGroups] = useState<SessionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('session_feedback').select('*').order('updated_at', { ascending: false }),
      supabase.from('course_sessions').select('*').order('session_number', { ascending: true }),
      supabase.from('user_profiles').select('*'),
    ]).then(([fbRes, sessionsRes, usersRes]) => {
      const feedbacks = (fbRes.data ?? []) as Feedback[]
      const sessions = (sessionsRes.data ?? []) as SessionInfo[]
      const users = (usersRes.data ?? []) as UserInfo[]

      const userMap = new Map(users.map(u => [u.id, u.full_name || 'ללא שם']))

      // Group feedbacks by session
      const sessionMap = new Map<string, (Feedback & { userName: string })[]>()
      for (const fb of feedbacks) {
        if (!fb.learned && !fb.missing && fb.rating == null) continue // skip empty
        const list = sessionMap.get(fb.session_id) ?? []
        list.push({ ...fb, userName: userMap.get(fb.user_id) ?? fb.user_id.slice(0, 8) })
        sessionMap.set(fb.session_id, list)
      }

      const result: SessionGroup[] = []
      for (const session of sessions) {
        const fbs = sessionMap.get(session.id)
        if (!fbs || fbs.length === 0) continue
        const ratings = fbs.map(f => f.rating).filter((r): r is number => r != null)
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
        result.push({ session, feedbacks: fbs, avgRating })
      }

      setGroups(result)
      if (result.length > 0) setExpandedSession(result[0].session.id)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div dir="rtl" className="text-center py-16">
        <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={24} className="text-purple-400" />
        </div>
        <h3 className="text-white font-bold mb-1">אין פידבקים עדיין</h3>
        <p className="text-gray-500 text-sm">פידבקים יופיעו כאן אחרי שתלמידים ישלחו חוות דעת על מפגשים</p>
      </div>
    )
  }

  // Overall stats
  const totalFeedbacks = groups.reduce((s, g) => s + g.feedbacks.length, 0)
  const allRatings = groups.flatMap(g => g.feedbacks.map(f => f.rating).filter((r): r is number => r != null))
  const overallAvg = allRatings.length > 0 ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : null

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">פידבק תלמידים</h2>
          <p className="text-xs text-gray-500 mt-1">חוות דעת ודירוגים שנשלחו על מפגשים</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalFeedbacks}</div>
          <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
            <MessageSquare size={12} />
            פידבקים
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{groups.length}</div>
          <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
            <Users size={12} />
            מפגשים עם פידבק
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-bold text-white">{overallAvg ? overallAvg.toFixed(1) : '—'}</span>
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
          </div>
          <div className="text-xs text-gray-500 mt-1">ממוצע כללי</div>
        </div>
      </div>

      {/* Session groups */}
      {groups.map(g => {
        const isExpanded = expandedSession === g.session.id
        return (
          <div key={g.session.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {/* Session header */}
            <button
              onClick={() => setExpandedSession(isExpanded ? null : g.session.id)}
              className="w-full flex items-center gap-3 p-4 text-right hover:bg-white/3 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">מפגש {g.session.session_number}: {g.session.title}</span>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{g.feedbacks.length} פידבקים</span>
                </div>
              </div>
              {g.avgRating != null && (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-white">{g.avgRating.toFixed(1)}</span>
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                </div>
              )}
              {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </button>

            {/* Feedbacks list */}
            {isExpanded && (
              <div className="border-t border-white/10">
                {g.feedbacks.map(fb => (
                  <div key={fb.id} className="p-4 border-b border-white/5 last:border-b-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-300">{fb.userName}</span>
                      {fb.rating != null && (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star
                              key={n}
                              size={12}
                              className={n <= fb.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}
                            />
                          ))}
                        </div>
                      )}
                      <span className="text-[10px] text-gray-600 mr-auto">
                        {new Date(fb.updated_at).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                    {fb.learned && (
                      <div className="mb-1.5">
                        <span className="text-[10px] text-gray-500 font-medium">מה למדתי:</span>
                        <p className="text-sm text-gray-300 mt-0.5">{fb.learned}</p>
                      </div>
                    )}
                    {fb.missing && (
                      <div>
                        <span className="text-[10px] text-gray-500 font-medium">מה חסר:</span>
                        <p className="text-sm text-gray-300 mt-0.5">{fb.missing}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
