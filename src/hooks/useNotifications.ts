import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/supabase/queries/workspace'
import type { Notification } from '@/types'

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    getNotifications(userId)
      .then(data => { setNotifications(data); setLoading(false) })
      .catch(() => setLoading(false))

    // Listen for new notifications in real-time
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        payload => {
          const newNotif = payload.new as Notification
          if (!newNotif.user_id || newNotif.user_id === userId) {
            setNotifications(prev => [newNotif, ...prev])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await markNotificationRead(id)
  }, [])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await markAllNotificationsRead(userId)
  }, [userId])

  return { notifications, loading, unreadCount, markRead, markAllRead }
}
