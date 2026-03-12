import { useState, useEffect, useCallback } from 'react'
import { getAllProgress, getProgressForSession, toggleContentProgress } from '@/lib/supabase/queries/workspace'
import type { ContentProgress } from '@/types'

export function useProgress(userId: string | undefined) {
  const [allProgress, setAllProgress] = useState<ContentProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    getAllProgress(userId)
      .then(data => { setAllProgress(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  const isCompleted = useCallback(
    (contentId: string) => allProgress.some(p => p.content_id === contentId && p.completed),
    [allProgress]
  )

  const getSessionProgress = useCallback(
    (sessionId: string, totalItems: number) => {
      if (totalItems === 0) return 0
      const completed = allProgress.filter(p => p.session_id === sessionId && p.completed).length
      return Math.round((completed / totalItems) * 100)
    },
    [allProgress]
  )

  const toggle = useCallback(
    async (contentId: string, sessionId: string) => {
      if (!userId) return
      const current = isCompleted(contentId)
      const next = !current

      // Optimistic update
      if (next) {
        setAllProgress(prev => [...prev, {
          id: `temp-${contentId}`,
          user_id: userId,
          content_id: contentId,
          session_id: sessionId,
          completed: true,
          completed_at: new Date().toISOString(),
        }])
      } else {
        setAllProgress(prev => prev.filter(p => p.content_id !== contentId))
      }

      await toggleContentProgress(userId, contentId, sessionId, next)
    },
    [userId, isCompleted]
  )

  return { allProgress, loading, isCompleted, getSessionProgress, toggle }
}

export function useSessionProgress(userId: string | undefined, sessionId: string) {
  const [progress, setProgress] = useState<ContentProgress[]>([])

  useEffect(() => {
    if (!userId || !sessionId) return
    getProgressForSession(userId, sessionId)
      .then(setProgress)
      .catch(() => {})
  }, [userId, sessionId])

  return progress
}
