import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getAdminCourseSessions,
  upsertCourseSession,
  deleteCourseSession,
  updateCourseSessionStatus,
  updateCourseSessionSchedule,
  updateRevealIndex,
  getAdminSessionContent,
  upsertSessionContent,
  deleteSessionContent,
} from '@/lib/supabase/queries/admin'
import type { Course, CourseSession, SessionContent, ContentType, PrepChecklistItem } from '@/types'
import {
  Lock, Unlock, ChevronDown, ChevronUp, Plus, Trash2, Save,
  FileText, Code, Video, Copy, File, Eye, EyeOff,
  Zap, ArrowDown, ArrowUp, MessageSquare, ClipboardList, ExternalLink,
} from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
import { PromptsManager } from './PromptsManager'
import { ContentPreviewModal } from './ContentPreviewModal'
import { getAdminPrepChecklist } from '@/lib/supabase/queries/prep'
import DateTimePicker from '@/components/ui/DateTimePicker'

const contentTypeLabels: Record<ContentType, string> = {
  text:       'טקסט פשוט',
  rich_text:  'טקסט עשיר',
  code:       'קוד',
  video:      'וידאו',
  file:       'קובץ',
  prompt:     'פרומפט',
  feedback:   'פידבק',
  prep:       'הכנה למפגש',
}

const contentTypeIcons: Record<ContentType, React.ElementType> = {
  text:      FileText,
  rich_text: FileText,
  code:      Code,
  video:     Video,
  file:      File,
  prompt:    Zap,
  feedback:  MessageSquare,
  prep:      ClipboardList,
}

function toEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}

type EditingContent = Omit<SessionContent, 'created_at'>

function newContent(sessionId: string, order: number): EditingContent {
  return {
    id: crypto.randomUUID(),
    session_id: sessionId,
    content_type: 'rich_text',
    title: '',
    content: '',
    language: null,
    display_order: order,
    is_locked: false,
    file_url: null,
  }
}

function newSession(courseId: string, order: number): Omit<CourseSession, 'created_at'> {
  return {
    id: crypto.randomUUID(),
    course_id: courseId,
    session_number: order,
    title: '',
    description: '',
    status: 'locked',
    reveal_index: 0,
    scheduled_at: null,
  }
}

// ── Prompt Editor (Hebrew + English) ─────────────────────────────────────────

function parsePromptContent(content: string): { he: string; en: string } {
  if (!content) return { he: '', en: '' }
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && ('he' in parsed || 'en' in parsed)) {
      return { he: parsed.he || '', en: parsed.en || '' }
    }
  } catch { /* not JSON — legacy plain text */ }
  // Legacy: plain text treated as English
  return { he: '', en: content }
}

function PromptEditor({ content, onChange, inputCls }: { content: string; onChange: (c: string) => void; inputCls: string }) {
  const { he, en } = parsePromptContent(content)

  function update(field: 'he' | 'en', value: string) {
    const updated = field === 'he' ? { he: value, en } : { he, en: value }
    // If both empty, store empty string; otherwise JSON
    if (!updated.he && !updated.en) {
      onChange('')
    } else {
      onChange(JSON.stringify(updated))
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1 font-medium" dir="rtl">פרומפט בעברית</label>
          <textarea value={he}
            onChange={e => update('he', e.target.value)}
            placeholder="תוכן הפרומפט בעברית..."
            rows={4}
            className={`${inputCls} resize-none font-mono text-right`} dir="rtl" />
        </div>
        <div dir="ltr" style={{ unicodeBidi: 'isolate' }}>
          <label className="block text-xs text-gray-400 mb-1 font-medium">English Prompt</label>
          <textarea value={en}
            onChange={e => update('en', e.target.value)}
            placeholder="Prompt content in English..."
            rows={4}
            className={`${inputCls} resize-none font-mono text-left`}
            dir="ltr"
            style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left' }} />
        </div>
      </div>
      <p className="text-xs text-gray-600">
        אפשר למלא שדה אחד או שניהם. אם שניהם מלאים — התלמיד יראה אותם זה לצד זה עם כפתור העתקה לכל אחד.
      </p>
    </div>
  )
}

// ── Content Block Editor ─────────────────────────────────────────────────────

function ContentBlockEditor({ item, onChange, onSave, onCancel, saving, courseId }: {
  item: EditingContent
  onChange: (item: EditingContent) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  courseId: string
}) {
  const inputCls = 'w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors'

  return (
    <div className="mt-3 bg-white/5 border border-white/20 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={item.content_type}
          onChange={e => {
            const ct = e.target.value as ContentType
            onChange({
              ...item,
              content_type: ct,
              language: ct === 'code' ? (item.language ?? 'typescript') : null,
              content: ct === 'rich_text' ? '<p></p>' : item.content_type === 'rich_text' ? '' : item.content,
            })
          }}
          className="bg-[#0a0a0f] border border-white/20 text-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500"
        >
          <option value="rich_text">טקסט עשיר (WYSIWYG)</option>
          <option value="text">טקסט פשוט</option>
          <option value="code">קוד</option>
          <option value="video">וידאו (YouTube/Vimeo)</option>
          <option value="file">קובץ להורדה</option>
          <option value="prompt">פרומפט (העתקה בלחיצה)</option>
          <option value="feedback">פידבק (מילוי ע"י תלמיד)</option>
          <option value="prep">הכנה למפגש (צ'קליסט)</option>
        </select>

        {item.content_type === 'code' && (
          <input type="text" value={item.language ?? ''}
            onChange={e => onChange({ ...item, language: e.target.value || null })}
            placeholder="שפה (typescript, python...)"
            className="bg-[#0a0a0f] border border-white/20 text-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500 flex-1"
            dir="ltr" />
        )}

        <label className="flex items-center gap-1.5 text-xs text-gray-400 mr-auto">
          <input type="checkbox" checked={item.is_locked}
            onChange={e => onChange({ ...item, is_locked: e.target.checked })}
            className="accent-yellow-400" />
          נעול לתלמידים
        </label>
      </div>

      <input type="text" value={item.title}
        onChange={e => onChange({ ...item, title: e.target.value })}
        placeholder="כותרת הבלוק"
        className={inputCls} dir="rtl" />

      {item.content_type === 'rich_text' ? (
        <RichTextEditor
          content={item.content}
          onChange={html => onChange({ ...item, content: html })}
        />
      ) : item.content_type === 'video' ? (
        <div className="space-y-2">
          <input type="url" value={item.content}
            onChange={e => onChange({ ...item, content: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=... או https://vimeo.com/..."
            className={`${inputCls} font-mono`} dir="ltr" />
          {item.content && (
            <div className="aspect-video rounded-lg overflow-hidden border border-white/10">
              <iframe src={toEmbedUrl(item.content)} className="w-full h-full" allowFullScreen title="preview" />
            </div>
          )}
        </div>
      ) : item.content_type === 'file' ? (
        <div className="space-y-2">
          <textarea value={item.content}
            onChange={e => onChange({ ...item, content: e.target.value })}
            placeholder="תיאור הקובץ..." rows={2}
            className={`${inputCls} resize-none`} dir="rtl" />
          <input type="url" value={item.file_url ?? ''}
            onChange={e => onChange({ ...item, file_url: e.target.value || null })}
            placeholder="URL לקובץ (Google Drive, Dropbox...)"
            className={`${inputCls} font-mono`} dir="ltr" />
          <p className="text-xs text-gray-600" dir="rtl">
            לינקים מ-Google Drive ו-Dropbox יומרו אוטומטית להורדה ישירה. ודא שההרשאות פתוחות ("כל מי שיש לו את הלינק").
          </p>
        </div>
      ) : item.content_type === 'prompt' ? (
        <PromptEditor content={item.content} onChange={content => onChange({ ...item, content })} inputCls={inputCls} />
      ) : item.content_type === 'feedback' ? (
        <p className="text-xs text-gray-500 bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
          בלוק פידבק — התלמיד יוכל לכתוב מה למד ומה חסר לו. הנתונים יופיעו בלשונית "הערות תלמידים".
        </p>
      ) : item.content_type === 'prep' ? (
        <PrepBlockSummary courseId={courseId} sessionId={item.session_id} />
      ) : (
        <textarea value={item.content}
          onChange={e => onChange({ ...item, content: e.target.value })}
          placeholder={item.content_type === 'code' ? 'קוד...' : 'טקסט...'}
          rows={5}
          className={`${inputCls} resize-none ${item.content_type === 'code' ? 'font-mono' : ''}`}
          dir={item.content_type === 'code' ? 'ltr' : 'rtl'} />
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">סדר הצגה:</span>
        <input type="number" value={item.display_order}
          onChange={e => onChange({ ...item, display_order: Number(e.target.value) })}
          className="bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-blue-500 w-20" />
      </div>

      <div className="flex gap-2">
        <button onClick={onSave}
          disabled={saving || !item.title.trim()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
          <Save size={12} />
          {saving ? 'שומר...' : 'שמור בלוק'}
        </button>
        <button onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          ביטול
        </button>
      </div>
    </div>
  )
}

// ── Session Editor ───────────────────────────────────────────────────────────

function PrepBlockSummary({ courseId, sessionId }: { courseId: string; sessionId: string }) {
  const [items, setItems] = useState<PrepChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [, setSearchParams] = useSearchParams()

  useEffect(() => {
    getAdminPrepChecklist(courseId).then(all => {
      setItems(all.filter(i => i.session_id === sessionId))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [courseId, sessionId])

  const required = items.filter(i => i.is_required && i.is_active)
  const optional = items.filter(i => !i.is_required && i.is_active)
  const inactive = items.filter(i => !i.is_active)

  return (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 space-y-2">
      {loading ? (
        <div className="h-8 bg-white/5 rounded animate-pulse" />
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-500">אין פריטי הכנה משויכים למפגש זה.</p>
      ) : (
        <>
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <span className="text-blue-400 font-semibold">{items.length} פריטי הכנה</span>
            {required.length > 0 && (
              <span className="text-red-400/80 bg-red-500/10 px-1.5 py-0.5 rounded">{required.length} חובה</span>
            )}
            {optional.length > 0 && (
              <span className="text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">{optional.length} אופציונלי</span>
            )}
            {inactive.length > 0 && (
              <span className="text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">{inactive.length} מוסתרים</span>
            )}
          </div>
          <div className="space-y-1">
            {items.filter(i => i.is_active).slice(0, 4).map(item => (
              <div key={item.id} className="flex items-center gap-2 text-xs text-gray-400">
                <ClipboardList size={10} className="text-blue-400/50 shrink-0" />
                <span className="truncate">{item.title}</span>
                {item.is_required && <span className="text-[9px] text-red-400 shrink-0">חובה</span>}
              </div>
            ))}
            {items.filter(i => i.is_active).length > 4 && (
              <p className="text-[10px] text-gray-600">+{items.filter(i => i.is_active).length - 4} נוספים...</p>
            )}
          </div>
        </>
      )}
      <button
        onClick={() => setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('sub', 'prep'); next.delete('course'); next.delete('session'); return next })}
        className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
      >
        <ExternalLink size={10} />
        ערוך ברשימת ההכנה
      </button>
    </div>
  )
}

function SessionEditor({ session, courseStatus, onSessionUpdate }: {
  session: CourseSession
  courseStatus: Course['status']
  onSessionUpdate: (updated: CourseSession) => void
}) {
  const [title, setTitle] = useState(session.title)
  const [description, setDescription] = useState(session.description)
  const [scheduledAt, setScheduledAt] = useState(session.scheduled_at ?? '')
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [contentItems, setContentItems] = useState<SessionContent[]>([])
  const [loadingContent, setLoadingContent] = useState(true)
  const [editingItem, setEditingItem] = useState<EditingContent | null>(null)
  const [savingContent, setSavingContent] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'prompts'>('content')

  useEffect(() => {
    getAdminSessionContent(session.id)
      .then(data => { setContentItems(data); setLoadingContent(false) })
      .catch(() => setLoadingContent(false))
  }, [session.id])

  async function handleSaveInfo() {
    setSavingInfo(true)
    try {
      await upsertCourseSession({ ...session, title, description })
      onSessionUpdate({ ...session, title, description })
    } finally {
      setSavingInfo(false)
    }
  }

  async function handleSaveSchedule() {
    setSavingSchedule(true)
    try {
      const iso = scheduledAt ? new Date(scheduledAt).toISOString() : null
      await updateCourseSessionSchedule(session.id, iso)
      onSessionUpdate({ ...session, scheduled_at: iso })
    } finally {
      setSavingSchedule(false)
    }
  }

  function handleAddContent() {
    const order = contentItems.length > 0
      ? Math.max(...contentItems.map(c => c.display_order)) + 1
      : 0
    setEditingItem(newContent(session.id, order))
  }

  function handleDuplicate(item: SessionContent) {
    const order = Math.max(...contentItems.map(c => c.display_order)) + 1
    setEditingItem({ ...item, id: crypto.randomUUID(), display_order: order })
  }

  async function handleSaveContent() {
    if (!editingItem) return
    setSavingContent(true)
    try {
      await upsertSessionContent(editingItem)
      setContentItems(prev => {
        const existing = prev.findIndex(c => c.id === editingItem.id)
        const updated = { ...editingItem, created_at: new Date().toISOString() } as SessionContent
        if (existing >= 0) {
          const next = [...prev]; next[existing] = updated; return next
        }
        return [...prev, updated].sort((a, b) => a.display_order - b.display_order)
      })
      setEditingItem(null)
    } finally {
      setSavingContent(false)
    }
  }

  async function handleToggleLock(item: SessionContent) {
    const updated = { ...item, is_locked: !item.is_locked }
    await upsertSessionContent(updated)
    setContentItems(prev => prev.map(c => c.id === item.id ? updated : c))
  }

  async function handleDeleteContent(id: string) {
    await deleteSessionContent(id)
    setContentItems(prev => prev.filter(c => c.id !== id))
  }

  async function handleMoveContent(item: SessionContent, direction: 'up' | 'down') {
    const sorted = [...contentItems].sort((a, b) => a.display_order - b.display_order)
    const idx = sorted.findIndex(c => c.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const orderA = sorted[idx].display_order
    const orderB = sorted[swapIdx].display_order
    const updatedA = { ...sorted[idx], display_order: orderB }
    const updatedB = { ...sorted[swapIdx], display_order: orderA }

    await Promise.all([upsertSessionContent(updatedA), upsertSessionContent(updatedB)])
    setContentItems(prev =>
      prev.map(c => c.id === updatedA.id ? { ...c, display_order: orderB } : c.id === updatedB.id ? { ...c, display_order: orderA } : c)
        .sort((a, b) => a.display_order - b.display_order)
    )
  }

  // Reveal controls
  async function handleRevealNext() {
    const newIndex = session.reveal_index + 1
    await updateRevealIndex(session.id, newIndex)
    onSessionUpdate({ ...session, reveal_index: newIndex })
  }

  async function handleRevealAll() {
    const maxIndex = contentItems.length
    await updateRevealIndex(session.id, maxIndex)
    onSessionUpdate({ ...session, reveal_index: maxIndex })
  }

  async function handleResetReveal() {
    await updateRevealIndex(session.id, 0)
    onSessionUpdate({ ...session, reveal_index: 0 })
  }

  const infoChanged = title !== session.title || description !== session.description
  const scheduleChanged = (scheduledAt || '') !== (session.scheduled_at ?? '')
  const inputCls = 'w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors'

  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-5">
      {/* Session info */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">פרטי המפגש</p>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          className={inputCls} dir="rtl" placeholder="כותרת המפגש"
          aria-describedby={!title.trim() ? 'session-title-error' : undefined}
          aria-invalid={!title.trim() || undefined} />
        {!title.trim() && (
          <p id="session-title-error" className="text-red-400 text-xs">כותרת המפגש היא שדה חובה</p>
        )}
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          rows={2} className={`${inputCls} resize-none`} dir="rtl" placeholder="תיאור המפגש" />
        {/* Scheduled date */}
        <div>
          <p className="text-xs text-gray-500 mb-2 font-semibold">מועד מתוכנן</p>
          <DateTimePicker value={scheduledAt} onChange={setScheduledAt} />
        </div>

        {(infoChanged || scheduleChanged) && (
          <button onClick={async () => { await handleSaveInfo(); if (scheduleChanged) await handleSaveSchedule() }} disabled={savingInfo || savingSchedule}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
            <Save size={12} />
            {savingInfo || savingSchedule ? 'שומר...' : 'שמור פרטים'}
          </button>
        )}
      </div>

      {/* Reveal controls */}
      {courseStatus === 'active' && session.status === 'open' && (
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide">חשיפת תוכן בשידור חי</p>
            <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded">
              {session.reveal_index} / {contentItems.length} בלוקים חשופים
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRevealNext}
              disabled={session.reveal_index >= contentItems.length}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Eye size={12} />
              חשוף הבא
            </button>
            <button
              onClick={handleRevealAll}
              disabled={session.reveal_index >= contentItems.length}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              חשוף הכל
            </button>
            <button
              onClick={handleResetReveal}
              disabled={session.reveal_index === 0}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-red-500/20 disabled:opacity-40 text-gray-400 hover:text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              אפס חשיפה
            </button>
          </div>
        </div>
      )}

      {/* Tabs: Content / Prompts */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 text-center py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'content' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          תוכן המפגש
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex-1 text-center py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'prompts' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          ספריית פרומפטים
        </button>
      </div>

      {activeTab === 'prompts' ? (
        <PromptsManager sessionId={session.id} />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">בלוקי תוכן</p>
            <button onClick={handleAddContent}
              className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-2.5 py-1.5 rounded-lg transition-colors">
              <Plus size={12} />
              הוסף בלוק
            </button>
          </div>

          {loadingContent ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {contentItems.map((item, idx) => {
                const Icon = contentTypeIcons[item.content_type]
                const isRevealed = idx < session.reveal_index || courseStatus === 'completed'
                return (
                  <div key={item.id}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                      item.is_locked
                        ? 'bg-white/3 border-white/5 opacity-60'
                        : isRevealed
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-white/5 border-white/10'
                    }`}>
                    <span className="text-[10px] text-gray-600 font-mono w-5 text-center">{idx + 1}</span>
                    <Icon size={13} className="text-gray-500 flex-shrink-0" />
                    <span className="text-xs text-gray-500 bg-white/10 px-1.5 py-0.5 rounded flex-shrink-0">
                      {contentTypeLabels[item.content_type]}
                    </span>
                    <span className="text-sm text-gray-300 flex-1 truncate">{item.title || '(ללא כותרת)'}</span>
                    {isRevealed && <Eye size={11} className="text-green-500 flex-shrink-0" />}
                    {item.is_locked && <Lock size={11} className="text-gray-600 flex-shrink-0" />}

                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => handleMoveContent(item, 'up')} disabled={idx === 0}
                        className="text-gray-600 hover:text-gray-300 disabled:opacity-30 p-0.5" title="הזז למעלה">
                        <ArrowUp size={12} />
                      </button>
                      <button onClick={() => handleMoveContent(item, 'down')} disabled={idx === contentItems.length - 1}
                        className="text-gray-600 hover:text-gray-300 disabled:opacity-30 p-0.5" title="הזז למטה">
                        <ArrowDown size={12} />
                      </button>
                    </div>

                    <button onClick={() => handleToggleLock(item)}
                      className={`text-xs px-2 py-1 rounded transition-colors flex-shrink-0 ${
                        item.is_locked
                          ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-400/10'
                          : 'text-gray-500 hover:text-gray-300 bg-white/5'
                      }`} aria-label={item.is_locked ? 'פתח בלוק' : 'נעל בלוק'}>
                      {item.is_locked ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button onClick={() => handleDuplicate(item)}
                      className="text-gray-500 hover:text-blue-400 transition-colors px-1" aria-label="שכפל בלוק">
                      <Copy size={12} />
                    </button>
                    <button onClick={() => setEditingItem({ ...item })}
                      className="text-xs text-gray-500 hover:text-blue-400 transition-colors px-2 py-1">
                      ערוך
                    </button>
                    <button onClick={() => handleDeleteContent(item.id)}
                      aria-label="מחק בלוק"
                      className="text-gray-600 hover:text-red-400 transition-colors p-1">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
              {contentItems.length === 0 && !editingItem && (
                <p className="text-gray-600 text-xs text-center py-3">אין תוכן — לחץ "הוסף בלוק"</p>
              )}
            </div>
          )}

          {editingItem && (
            <ContentBlockEditor
              item={editingItem}
              onChange={setEditingItem}
              onSave={handleSaveContent}
              onCancel={() => setEditingItem(null)}
              saving={savingContent}
              courseId={session.course_id}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Sessions Manager (main export) ───────────────────────────────────────────

export function SessionsManager({ course }: { course: Course }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sessions, setSessions] = useState<CourseSession[]>([])
  const [loading, setLoading] = useState(true)
  const [previewSession, setPreviewSession] = useState<CourseSession | null>(null)

  const expandedId = searchParams.get('session')
  const setExpandedId = useCallback((id: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (id) next.set('session', id); else next.delete('session')
      return next
    })
  }, [setSearchParams])

  function loadSessions() {
    setLoading(true)
    getAdminCourseSessions(course.id)
      .then(data => { setSessions(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadSessions() }, [course.id])

  async function handleAddSession() {
    const order = sessions.length > 0 ? Math.max(...sessions.map(s => s.session_number)) + 1 : 1
    const session = newSession(course.id, order)
    await upsertCourseSession(session)
    loadSessions()
  }

  async function toggleStatus(session: CourseSession) {
    const next = session.status === 'open' ? 'locked' : 'open'
    await updateCourseSessionStatus(session.id, next)
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: next } : s))
  }

  async function handleDelete(id: string) {
    await deleteCourseSession(id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">
          {sessions.length > 0 ? `${sessions.length} מפגשים` : 'אין מפגשים עדיין'}
        </p>
        <button
          onClick={handleAddSession}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
        >
          <Plus size={14} />
          מפגש חדש
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const isExpanded = expandedId === session.id
            return (
              <div key={session.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{['🎯', '⚙️', '🚀', '📚', '🔥'][session.session_number - 1] ?? '📚'}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-gray-500 font-semibold">מפגש {session.session_number}</span>
                      {session.reveal_index > 0 && (
                        <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
                          חשופים: {session.reveal_index}
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-bold">{session.title || '(ללא כותרת)'}</h3>
                    {session.description && (
                      <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{session.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setPreviewSession(session)}
                      className="p-2 text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                      title="תצוגה מקדימה">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => toggleStatus(session)}
                      className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                        session.status === 'open'
                          ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                          : 'bg-white/10 text-gray-400 hover:bg-white/15'
                      }`}>
                      {session.status === 'open'
                        ? <><Unlock size={13} /> המפגש פתוח</>
                        : <><Lock size={13} /> המפגש סגור</>
                      }
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : session.id)}
                      className="p-2 text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                      aria-label={isExpanded ? 'סגור מפגש' : 'ערוך מפגש'}
                      aria-expanded={isExpanded}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => handleDelete(session.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors p-2"
                      aria-label="מחק מפגש">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <SessionEditor
                    session={session}
                    courseStatus={course.status}
                    onSessionUpdate={updated => setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {previewSession && (
        <ContentPreviewModal session={previewSession} onClose={() => setPreviewSession(null)} />
      )}
    </div>
  )
}
