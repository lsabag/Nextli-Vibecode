import { useState, useRef, useEffect } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

interface Props {
  userId: string | undefined
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דק'`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `לפני ${hours} שע'`
  const days = Math.floor(hours / 24)
  return `לפני ${days} ימים`
}

export function NotificationBell({ userId }: Props) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center gap-3 w-full text-right px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 transition-colors"
        aria-label={`התראות${unreadCount > 0 ? ` - ${unreadCount} חדשות` : ''}`}
        aria-expanded={open}
      >
        <Bell size={16} aria-hidden="true" />
        <span className="text-sm font-medium">התראות</span>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-3 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-80 bg-[#111118] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          role="region"
          aria-label="רשימת התראות"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">התראות</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  aria-label="סמן הכל כנקרא"
                >
                  <Check size={12} />
                  סמן הכל
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="סגור התראות" className="text-gray-500 hover:text-white transition-colors p-0.5">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">
                אין התראות
              </div>
            ) : (
              <ul role="list">
                {notifications.map(notif => (
                  <li key={notif.id}>
                    <button
                      onClick={() => markRead(notif.id)}
                      className={`w-full text-right px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 ${
                        !notif.is_read ? 'bg-blue-600/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" aria-label="לא נקרא" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-gray-600 mt-1">{timeAgo(notif.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
