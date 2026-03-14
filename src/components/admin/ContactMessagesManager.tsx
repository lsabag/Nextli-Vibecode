import { useEffect, useState } from 'react'
import {
  Mail, Search, Filter, Archive, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, MessageSquare, User, StickyNote, Trash2,
  ExternalLink, X, AlertTriangle, Settings, Bell, Send,
} from 'lucide-react'
import type { ContactMessage, WaitlistEntry, UserProfile } from '@/types'
import { getAdminContactMessages, updateContactMessage, deleteContactMessage } from '@/lib/supabase/queries/admin'
import { supabase } from '@/lib/supabase/client'

type StatusFilter = 'all' | ContactMessage['status']

const STATUS_CONFIG: Record<ContactMessage['status'], { label: string; icon: React.ElementType; color: string; bg: string }> = {
  new:         { label: 'חדש',    icon: AlertCircle,  color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  in_progress: { label: 'בטיפול', icon: Clock,        color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  resolved:    { label: 'טופל',   icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10' },
  archived:    { label: 'ארכיון', icon: Archive,       color: 'text-gray-400',   bg: 'bg-gray-500/10' },
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
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return dateStr }
}

interface AlertRule {
  enabled: boolean
  days: number
}

interface AlertSettings {
  new: AlertRule
  in_progress: AlertRule
  telegramEnabled: boolean
}

const DEFAULT_SETTINGS: AlertSettings = {
  new: { enabled: true, days: 3 },
  in_progress: { enabled: false, days: 5 },
  telegramEnabled: true,
}

function daysOld(dateStr: string): number {
  try {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  } catch { return 0 }
}

export function ContactMessagesManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('new')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [students, setStudents] = useState<UserProfile[]>([])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(DEFAULT_SETTINGS)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    load()
    loadAlertSettings()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [msgs, { data: wl }, { data: st }] = await Promise.all([
        getAdminContactMessages(),
        supabase.from('waitlist').select('*'),
        supabase.from('user_profiles').select('*'),
      ])
      // Normalize messages — DB rows may lack new columns if migration hasn't run
      const normalized = msgs.map(m => ({
        ...m,
        status: m.status || 'new',
        handler_notes: m.handler_notes ?? '',
        handled_by: m.handled_by ?? null,
        handled_at: m.handled_at ?? null,
        is_read: typeof m.is_read === 'number' ? !!m.is_read : (m.is_read ?? false),
      })) as ContactMessage[]
      setMessages(normalized)
      setWaitlist((wl ?? []) as WaitlistEntry[])
      setStudents((st ?? []) as UserProfile[])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function loadAlertSettings() {
    try {
      const keys = ['alert_new_enabled', 'alert_new_days', 'alert_in_progress_enabled', 'alert_in_progress_days', 'alert_telegram_enabled']
      const { data } = await supabase.from('system_settings').select('*')
      const rows = (data ?? []) as Array<{ key: string; value: string }>
      const map: Record<string, string> = {}
      for (const r of rows) {
        if (keys.includes(r.key)) map[r.key] = r.value
      }
      setAlertSettings({
        new: {
          enabled: map.alert_new_enabled !== 'false',
          days: parseInt(map.alert_new_days, 10) || DEFAULT_SETTINGS.new.days,
        },
        in_progress: {
          enabled: map.alert_in_progress_enabled === 'true',
          days: parseInt(map.alert_in_progress_days, 10) || DEFAULT_SETTINGS.in_progress.days,
        },
        telegramEnabled: map.alert_telegram_enabled !== 'false',
      })
    } catch {
      // use defaults
    }
  }

  async function saveAlertSettings(updated: AlertSettings) {
    setSavingSettings(true)
    try {
      const entries = [
        { key: 'alert_new_enabled', value: String(updated.new.enabled) },
        { key: 'alert_new_days', value: String(updated.new.days) },
        { key: 'alert_in_progress_enabled', value: String(updated.in_progress.enabled) },
        { key: 'alert_in_progress_days', value: String(updated.in_progress.days) },
        { key: 'alert_telegram_enabled', value: String(updated.telegramEnabled) },
      ]
      for (const { key, value } of entries) {
        await supabase.from('system_settings').upsert({ key, value })
      }
      setAlertSettings(updated)
    } catch {
      // silent
    } finally {
      setSavingSettings(false)
    }
  }

  // Cross-reference: find if email exists in waitlist or students
  function getLeadStatus(email: string): { inWaitlist: boolean; isStudent: boolean; waitlistEntry?: WaitlistEntry } {
    const wlEntry = waitlist.find(w => w.email.toLowerCase() === email.toLowerCase())
    // Students don't have email in user_profiles directly, but we can check waitlist status
    const isStudent = students.some(s => s.payment_status === 'paid') && !!wlEntry
    return { inWaitlist: !!wlEntry, isStudent, waitlistEntry: wlEntry }
  }

  async function handleStatusChange(id: string, status: ContactMessage['status']) {
    setSaving(true)
    try {
      const updates: Parameters<typeof updateContactMessage>[1] = { status }
      if (status === 'resolved' || status === 'archived') {
        updates.handled_at = new Date().toISOString()
      }
      if (status !== 'new') {
        updates.is_read = true
      }
      await updateContactMessage(id, updates)
      setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } as ContactMessage : m))
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveNotes(id: string) {
    setSaving(true)
    try {
      await updateContactMessage(id, { handler_notes: notesValue })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, handler_notes: notesValue } : m))
      setEditingNotes(null)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkRead(id: string) {
    await updateContactMessage(id, { is_read: true })
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))
  }

  async function handleDelete(id: string) {
    setSaving(true)
    try {
      await deleteContactMessage(id)
      setMessages(prev => prev.filter(m => m.id !== id))
      setConfirmDelete(null)
      if (expandedId === id) setExpandedId(null)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const filtered = messages.filter(m => {
    if (filter === 'all') {
      if (m.status === 'archived') return false // "הכל" excludes archived
    } else if (m.status !== filter) {
      return false
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.message.toLowerCase().includes(q)
    }
    return true
  })

  const counts = {
    all: messages.filter(m => m.status !== 'archived').length,
    new: messages.filter(m => m.status === 'new').length,
    in_progress: messages.filter(m => m.status === 'in_progress').length,
    resolved: messages.filter(m => m.status === 'resolved').length,
    archived: messages.filter(m => m.status === 'archived').length,
  }

  function isStale(m: ContactMessage): boolean {
    const rule = alertSettings[m.status as 'new' | 'in_progress']
    return !!rule?.enabled && daysOld(m.created_at) >= rule.days
  }

  const staleNewCount = alertSettings.new.enabled
    ? messages.filter(m => m.status === 'new' && daysOld(m.created_at) >= alertSettings.new.days).length : 0
  const staleInProgressCount = alertSettings.in_progress.enabled
    ? messages.filter(m => m.status === 'in_progress' && daysOld(m.created_at) >= alertSettings.in_progress.days).length : 0

  if (loading) {
    return (
      <div dir="rtl">
        <h2 className="text-xl font-bold text-white mb-6">מעקב פניות ולידים</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">מעקב פניות ולידים</h2>
          <p className="text-xs text-gray-500">ניהול פניות, מעקב סטטוס, וצפייה אם הפכו ללקוחות</p>
        </div>
        <button
          onClick={() => setShowSettings(v => !v)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            showSettings
              ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
              : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
          }`}
        >
          <Settings size={13} />
          הגדרות התראות
        </button>
      </div>

      {/* Alert settings panel */}
      {showSettings && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={14} className="text-blue-400" />
            <span className="text-sm font-medium text-white">הגדרות התראות</span>
          </div>

          {/* Alert rules — one per status */}
          {(['new', 'in_progress'] as const).map(status => {
            const cfg = STATUS_CONFIG[status]
            const rule = alertSettings[status]
            return (
              <div key={status} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${rule.enabled ? 'bg-white/[0.03] border-white/10' : 'bg-white/[0.01] border-white/5 opacity-60'}`}>
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => setAlertSettings(s => ({ ...s, [status]: { ...s[status], enabled: !rule.enabled } }))}
                  className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30"
                />
                <cfg.icon size={14} className={cfg.color} />
                <span className={`text-xs font-medium ${cfg.color} min-w-[50px]`}>{cfg.label}</span>
                <span className="text-xs text-gray-400">—</span>
                <span className="text-xs text-gray-400">התרע אחרי</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={rule.days}
                  disabled={!rule.enabled}
                  onChange={e => setAlertSettings(s => ({ ...s, [status]: { ...s[status], days: Math.max(1, parseInt(e.target.value, 10) || 1) } }))}
                  className="w-14 bg-[#0a0a0f] border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center outline-none focus:border-blue-500/50 disabled:opacity-40"
                />
                <span className="text-xs text-gray-400">ימים</span>
              </div>
            )
          })}

          {/* Telegram toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={alertSettings.telegramEnabled}
                onChange={() => setAlertSettings(s => ({ ...s, telegramEnabled: !s.telegramEnabled }))}
                className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30"
              />
              <Send size={12} className="text-gray-400" />
              <span className="text-xs text-gray-300">שלח התראה בטלגרם</span>
            </label>
          </div>

          {/* Save */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => saveAlertSettings(alertSettings)}
              disabled={savingSettings}
              className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg font-medium"
            >
              {savingSettings ? 'שומר...' : 'שמור הגדרות'}
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="text-xs text-gray-500 hover:text-gray-400 px-3 py-1.5"
            >
              סגור
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, אימייל, הודעה..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pr-8 pl-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={12} className="text-gray-600" />
          {(['all', 'new', 'in_progress', 'resolved', 'archived'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                filter === s
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
              }`}
            >
              {s === 'all' ? 'הכל' : STATUS_CONFIG[s].label}
              <span className="mr-1 text-[10px] opacity-60">({counts[s]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stale alerts — separate for each status */}
      {staleNewCount > 0 && (
        <div className="flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-blue-400 shrink-0" />
          <p className="text-xs text-blue-300">
            <span className="font-bold">{staleNewCount} {staleNewCount === 1 ? 'פנייה חדשה' : 'פניות חדשות'}</span>
            {' '}ממתינות יותר מ-{alertSettings.new.days} ימים ללא טיפול
          </p>
        </div>
      )}
      {staleInProgressCount > 0 && (
        <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <Clock size={16} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            <span className="font-bold">{staleInProgressCount} {staleInProgressCount === 1 ? 'פנייה בטיפול' : 'פניות בטיפול'}</span>
            {' '}כבר יותר מ-{alertSettings.in_progress.days} ימים
          </p>
        </div>
      )}

      {/* Messages list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Mail size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {search ? 'לא נמצאו פניות התואמות לחיפוש' : filter === 'all' ? 'אין פניות עדיין' : 'אין פניות בסטטוס הזה'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(msg => {
            const isExpanded = expandedId === msg.id
            const lead = getLeadStatus(msg.email)
            const cfg = STATUS_CONFIG[msg.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.new
            const StatusIcon = cfg.icon

            return (
              <div
                key={msg.id}
                className={`bg-white/5 border rounded-xl transition-colors ${
                  !msg.is_read ? 'border-blue-500/30 bg-blue-500/[0.03]' : 'border-white/10'
                }`}
              >
                {/* Header row */}
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : msg.id)
                    if (!msg.is_read) handleMarkRead(msg.id)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-right"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <StatusIcon size={14} className={cfg.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm text-white font-medium">{msg.name}</span>
                      {!msg.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                      )}
                      {lead.inWaitlist && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                          ברשימת המתנה
                        </span>
                      )}
                      {lead.isStudent && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                          לקוח
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{msg.message || '(ללא הודעה)'}</p>
                  </div>

                  <div className="text-left shrink-0 flex items-center gap-2">
                    {isStale(msg) && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                        <AlertTriangle size={10} />
                        {daysOld(msg.created_at)} ימים
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-gray-600">{timeAgo(msg.created_at)}</span>
                    {isExpanded ? <ChevronUp size={14} className="text-gray-600" /> : <ChevronDown size={14} className="text-gray-600" />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
                    {/* Contact info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <User size={12} className="text-gray-600" />
                        <span className="text-gray-400">שם:</span>
                        <span className="text-white">{msg.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Mail size={12} className="text-gray-600" />
                        <span className="text-gray-400">אימייל:</span>
                        <a href={`mailto:${msg.email}`} className="text-blue-400 hover:text-blue-300" dir="ltr">{msg.email}</a>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock size={12} className="text-gray-600" />
                        <span className="text-gray-400">נשלח:</span>
                        <span className="text-white">{formatDate(msg.created_at)}</span>
                      </div>
                      {msg.handled_at && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle2 size={12} className="text-gray-600" />
                          <span className="text-gray-400">טופל:</span>
                          <span className="text-white">{formatDate(msg.handled_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Full message */}
                    {msg.message && (
                      <div className="bg-white/[0.03] rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <MessageSquare size={12} className="text-gray-600" />
                          <span className="text-xs text-gray-400 font-medium">הודעה</span>
                        </div>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    )}

                    {/* Lead cross-reference */}
                    {lead.inWaitlist && lead.waitlistEntry && (
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <ExternalLink size={12} className="text-amber-400" />
                          <span className="text-xs text-amber-400 font-medium">צלב מידע — רשימת המתנה</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">שם:</span>{' '}
                            <span className="text-white">{lead.waitlistEntry.full_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">סטטוס:</span>{' '}
                            <span className="text-white">{lead.waitlistEntry.status === 'pending' ? 'ממתין' : lead.waitlistEntry.status}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">רמה מומלצת:</span>{' '}
                            <span className="text-white">{lead.waitlistEntry.recommended_level}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">נרשם:</span>{' '}
                            <span className="text-white">{formatDate(lead.waitlistEntry.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Handler notes */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <StickyNote size={12} className="text-gray-600" />
                        <span className="text-xs text-gray-400 font-medium">הערות טיפול</span>
                      </div>
                      {editingNotes === msg.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={notesValue}
                            onChange={e => setNotesValue(e.target.value)}
                            rows={3}
                            className="w-full bg-[#0a0a0f] border border-blue-500/50 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
                            placeholder="רשום הערות על הטיפול בפנייה..."
                            dir="rtl"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveNotes(msg.id)}
                              disabled={saving}
                              className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg font-medium"
                            >
                              {saving ? 'שומר...' : 'שמור'}
                            </button>
                            <button
                              onClick={() => setEditingNotes(null)}
                              className="text-xs text-gray-500 hover:text-gray-400 px-3 py-1.5"
                            >
                              ביטול
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingNotes(msg.id); setNotesValue(msg.handler_notes || '') }}
                          className="w-full text-right bg-white/[0.03] border border-white/5 hover:border-white/15 rounded-lg p-3 text-sm transition-colors"
                        >
                          {msg.handler_notes ? (
                            <p className="text-gray-300 whitespace-pre-wrap">{msg.handler_notes}</p>
                          ) : (
                            <p className="text-gray-600 italic">לחץ להוספת הערות...</p>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
                      {msg.status !== 'in_progress' && msg.status !== 'resolved' && msg.status !== 'archived' && (
                        <button
                          onClick={() => handleStatusChange(msg.id, 'in_progress')}
                          disabled={saving}
                          className="flex items-center gap-1.5 text-xs bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <Clock size={12} />
                          סמן בטיפול
                        </button>
                      )}
                      {msg.status !== 'resolved' && (
                        <button
                          onClick={() => handleStatusChange(msg.id, 'resolved')}
                          disabled={saving}
                          className="flex items-center gap-1.5 text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <CheckCircle2 size={12} />
                          סמן כטופל
                        </button>
                      )}
                      {msg.status !== 'archived' && (
                        <button
                          onClick={() => handleStatusChange(msg.id, 'archived')}
                          disabled={saving}
                          className="flex items-center gap-1.5 text-xs bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <Archive size={12} />
                          העבר לארכיון
                        </button>
                      )}
                      {msg.status !== 'new' && (
                        <button
                          onClick={() => handleStatusChange(msg.id, 'new')}
                          disabled={saving}
                          className="flex items-center gap-1.5 text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <AlertCircle size={12} />
                          החזר לחדש
                        </button>
                      )}

                      <div className="flex-1" />

                      {confirmDelete === msg.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400">בטוח?</span>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            disabled={saving}
                            className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-lg disabled:opacity-40"
                          >
                            מחק
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs text-gray-500 hover:text-gray-400"
                          >
                            ביטול
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(msg.id)}
                          className="text-gray-600 hover:text-red-400 p-1 transition-colors"
                          title="מחק פנייה"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
