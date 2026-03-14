import { useState, useEffect } from 'react'
import { getAdminPrepChecklist, upsertPrepItem, deletePrepItem, getItemLinks, type PrepLink } from '@/lib/supabase/queries/prep'
import { supabase } from '@/lib/supabase/client'
import { Plus, Trash2, ExternalLink, Save, ChevronDown, Eye, ArrowUp, ArrowDown, Copy, Pencil, CheckCircle, Circle, Rocket, ArrowRightLeft, GripVertical } from 'lucide-react'
import type { PrepChecklistItem, CourseSession } from '@/types'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Props = { courseId: string }
type LinkEntry = PrepLink

// ── Preview component ────────────────────────────────────────────────────────

function PrepPreview({ items }: { items: PrepChecklistItem[] }) {
  const activeItems = items.filter(i => i.is_active)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const requiredItems = activeItems.filter(i => i.is_required)
  const optionalItems = activeItems.filter(i => !i.is_required)
  const allRequiredDone = requiredItems.every(i => checked.has(i.id))
  const totalChecked = activeItems.filter(i => checked.has(i.id)).length

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  if (activeItems.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-gray-500 text-sm">אין פריטים פעילים להצגה</p>
      </div>
    )
  }

  return (
    <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 max-w-xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h3 className="text-xl font-black text-white mb-2">הכנה לקורס</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          כדי שנוכל להתחיל ישר לבנות במפגש הראשון, יש כמה דברים שחשוב לסדר מראש.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">{totalChecked} מתוך {activeItems.length} שלבים</span>
          {allRequiredDone && (
            <span className="text-xs text-green-400 font-semibold">כל שלבי החובה הושלמו!</span>
          )}
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-blue-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${(totalChecked / activeItems.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Required */}
      {requiredItems.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-bold text-white mb-2">שלבי חובה</h4>
          <div className="space-y-2">
            {requiredItems.map(item => (
              <PreviewItem key={item.id} item={item} checked={checked.has(item.id)} onToggle={toggle} />
            ))}
          </div>
        </div>
      )}

      {/* Optional */}
      {optionalItems.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-bold text-gray-500 mb-2">מומלץ (לא חובה)</h4>
          <div className="space-y-2">
            {optionalItems.map(item => (
              <PreviewItem key={item.id} item={item} checked={checked.has(item.id)} onToggle={toggle} />
            ))}
          </div>
        </div>
      )}

      {/* Button */}
      <button
        disabled={!allRequiredDone}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
          allRequiredDone
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/10'
        }`}
      >
        <Rocket size={16} />
        {allRequiredDone
          ? 'מוכנים! בואו נתחיל'
          : `השלימו את כל שלבי החובה (${requiredItems.filter(i => checked.has(i.id)).length}/${requiredItems.length})`
        }
      </button>
    </div>
  )
}

function PreviewItem({ item, checked, onToggle }: { item: PrepChecklistItem; checked: boolean; onToggle: (id: string) => void }) {
  return (
    <button
      onClick={() => onToggle(item.id)}
      className={`w-full text-right flex items-start gap-3 p-4 rounded-xl border transition-all ${
        checked
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-white/5 border-white/10 hover:bg-white/8'
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {checked ? <CheckCircle size={18} className="text-green-400" /> : <Circle size={18} className="text-gray-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-semibold text-xs ${checked ? 'text-green-300' : 'text-white'}`}>{item.title}</span>
          {item.is_required && (
            <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">חובה</span>
          )}
        </div>
        <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">{item.description}</p>
        {getItemLinks(item).map((link, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-[10px] text-blue-400 mt-1 mr-2">
            <ExternalLink size={10} />
            {link.label || link.url}
          </span>
        ))}
      </div>
    </button>
  )
}

// ── Sortable item row ─────────────────────────────────────────────────────────

function SortableItemRow({
  item,
  idx,
  totalInGroup,
  isRenaming,
  renameValue,
  onRenameStart,
  onRenameChange,
  onRenameSubmit,
  onRenamingId,
  onMoveItem,
  onDuplicate,
  onToggleActive,
  onStartEdit,
  onRemove,
}: {
  item: PrepChecklistItem
  idx: number
  totalInGroup: number
  isRenaming: boolean
  renameValue: string
  onRenameStart: (item: PrepChecklistItem) => void
  onRenameChange: (v: string) => void
  onRenameSubmit: (item: PrepChecklistItem, v: string) => void
  onRenamingId: (id: string | null) => void
  onMoveItem: (item: PrepChecklistItem, dir: 'up' | 'down') => void
  onDuplicate: (item: PrepChecklistItem) => void
  onToggleActive: (item: PrepChecklistItem) => void
  onStartEdit: (item: PrepChecklistItem) => void
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const isFirst = idx === 0
  const isLast = idx === totalInGroup - 1

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border p-3 transition-opacity ${
        item.is_active ? 'bg-white/3 border-white/10' : 'bg-white/2 border-white/5 opacity-50'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 touch-none"
          aria-label="גרור לשינוי סדר"
        >
          <GripVertical size={14} />
        </button>

        {/* Order number */}
        <span className="text-[10px] text-gray-600 font-mono w-4 text-center shrink-0">{idx + 1}</span>

        {/* Title / Rename */}
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <form
              className="flex items-center gap-2"
              onSubmit={e => { e.preventDefault(); onRenameSubmit(item, renameValue); onRenamingId(null) }}
            >
              <input
                autoFocus
                value={renameValue}
                onChange={e => onRenameChange(e.target.value)}
                onBlur={() => { onRenameSubmit(item, renameValue); onRenamingId(null) }}
                className="flex-1 bg-white/5 border border-blue-500/50 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
              />
            </form>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-sm font-medium text-white cursor-pointer hover:text-blue-400 transition-colors"
                onDoubleClick={() => onRenameStart(item)}
                title="לחיצה כפולה לשינוי שם"
              >
                {item.title}
              </span>
              {item.is_required && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">חובה</span>
              )}
              {!item.is_active && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-500">מוסתר</span>
              )}
            </div>
          )}
          {!isRenaming && (
            <>
              <p className="text-gray-500 text-xs mt-0.5 truncate">{item.description}</p>
              {getItemLinks(item).map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-400 mt-0.5 mr-2">
                  <ExternalLink size={10} /> {link.label || 'קישור'}
                </a>
              ))}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onMoveItem(item, 'up')}
            disabled={isFirst}
            aria-label="העבר למעלה"
            title="למעלה"
            className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={() => onMoveItem(item, 'down')}
            disabled={isLast}
            aria-label="העבר למטה"
            title="למטה"
            className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDown size={13} />
          </button>
          <button
            onClick={() => onDuplicate(item)}
            aria-label={`שכפל ${item.title}`}
            title="שכפל"
            className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => onToggleActive(item)}
            className="text-xs px-2 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {item.is_active ? 'הסתר' : 'הצג'}
          </button>
          <button
            onClick={() => onStartEdit(item)}
            className="text-xs px-2 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ערוך
          </button>
          <button
            onClick={() => onRemove(item.id)}
            aria-label={`מחק ${item.title}`}
            title="מחק"
            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Drag overlay (ghost) ──────────────────────────────────────────────────────

function DragOverlayItem({ item }: { item: PrepChecklistItem }) {
  return (
    <div className="rounded-xl border border-blue-500/40 bg-[#12121a] p-3 shadow-xl shadow-blue-500/10 opacity-90">
      <div className="flex items-center gap-3">
        <GripVertical size={14} className="text-blue-400" />
        <span className="text-sm font-medium text-white">{item.title}</span>
        {item.is_required && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">חובה</span>
        )}
      </div>
    </div>
  )
}

// ── Droppable group wrapper ───────────────────────────────────────────────────

function DroppableGroup({ groupKey, children }: { groupKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `group-${groupKey}` })
  return (
    <div
      ref={setNodeRef}
      className={`border-t border-white/5 px-5 py-3 space-y-2 min-h-[48px] transition-colors ${
        isOver ? 'bg-blue-500/5' : ''
      }`}
    >
      {children}
    </div>
  )
}

// ── Main manager ─────────────────────────────────────────────────────────────

type GroupKey = string // session_id or '__general__'

export function PrepManager({ courseId }: Props) {
  const [items, setItems] = useState<PrepChecklistItem[]>([])
  const [sessions, setSessions] = useState<CourseSession[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', links: [] as LinkEntry[], is_required: true, session_id: '', _groupKey: '' as GroupKey })
  const [showPreview, setShowPreview] = useState(false)
  const [previewGroup, setPreviewGroup] = useState<GroupKey | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<GroupKey>>(new Set())
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({})
  const [renamingGroupKey, setRenamingGroupKey] = useState<GroupKey | null>(null)
  const [groupRenameValue, setGroupRenameValue] = useState('')
  const [reassigningGroupKey, setReassigningGroupKey] = useState<GroupKey | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function load() {
    setLoading(true)
    Promise.all([
      getAdminPrepChecklist(courseId),
      supabase.from('course_sessions').select('*').eq('course_id', courseId).order('session_number', { ascending: true }),
      supabase.from('system_settings').select('key, value').like('key', `prep_label__${courseId}__%`),
    ]).then(([prepData, sessRes, labelsRes]) => {
      setItems(prepData)
      const sess = (sessRes.data ?? []) as CourseSession[]
      setSessions(sess)
      const labels: Record<string, string> = {}
      for (const row of (labelsRes.data ?? []) as { key: string; value: string }[]) {
        const groupKey = row.key.replace(`prep_label__${courseId}__`, '')
        labels[groupKey] = row.value
      }
      setCustomLabels(labels)
      const groupKeys = new Set<GroupKey>()
      for (const item of prepData) {
        groupKeys.add(item.session_id ?? '__general__')
      }
      // Also expand all session groups by default
      for (const s of sess) groupKeys.add(s.id)
      groupKeys.add('__general__')
      setExpandedGroups(groupKeys)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  async function saveGroupLabel(groupKey: GroupKey, label: string) {
    const trimmed = label.trim()
    if (!trimmed) return
    const settingKey = `prep_label__${courseId}__${groupKey}`
    await supabase.from('system_settings').upsert({ key: settingKey, value: trimmed })
    setCustomLabels(prev => ({ ...prev, [groupKey]: trimmed }))
  }

  useEffect(() => { load() }, [courseId])

  function toggleGroup(key: GroupKey) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  function startEdit(item: PrepChecklistItem) {
    setEditId(item.id)
    setForm({
      title: item.title,
      description: item.description,
      links: getItemLinks(item),
      is_required: item.is_required,
      session_id: item.session_id ?? '',
      _groupKey: item.session_id ?? '__general__',
    })
  }

  function startNew(groupKey: GroupKey) {
    setEditId('new')
    setForm({ title: '', description: '', links: [], is_required: false, session_id: groupKey === '__general__' ? '' : groupKey, _groupKey: groupKey })
  }

  function cancel() {
    setEditId(null)
  }

  async function save() {
    const validLinks = form.links.filter(l => l.url.trim())
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim(),
      link_url: validLinks[0]?.url.trim() || null,
      link_label: validLinks[0]?.label.trim() || null,
      links: validLinks.length > 0 ? JSON.stringify(validLinks.map(l => ({ url: l.url.trim(), label: l.label.trim() }))) : null,
      is_required: form.is_required,
      is_active: true,
      course_id: courseId,
      session_id: form.session_id || null,
    }

    if (editId === 'new') {
      payload.id = `prep-${Date.now()}`
      payload.display_order = items.length
    } else {
      payload.id = editId
    }

    await upsertPrepItem(payload as Partial<PrepChecklistItem> & { id: string })
    setEditId(null)
    load()
  }

  async function remove(id: string) {
    await deletePrepItem(id)
    load()
  }

  async function toggleActive(item: PrepChecklistItem) {
    await upsertPrepItem({ id: item.id, is_active: !item.is_active })
    load()
  }

  async function duplicate(item: PrepChecklistItem) {
    await upsertPrepItem({
      id: `prep-${Date.now()}`,
      course_id: courseId,
      session_id: item.session_id,
      title: `${item.title} (עותק)`,
      description: item.description,
      link_url: item.link_url,
      link_label: item.link_label,
      is_required: item.is_required,
      is_active: item.is_active,
      display_order: item.display_order + 1,
    } as Partial<PrepChecklistItem> & { id: string })
    load()
  }

  async function moveItem(item: PrepChecklistItem, direction: 'up' | 'down') {
    const groupItems = items
      .filter(i => i.session_id === item.session_id)
      .sort((a, b) => a.display_order - b.display_order)
    const idx = groupItems.findIndex(i => i.id === item.id)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= groupItems.length) return
    const other = groupItems[swapIdx]
    await Promise.all([
      upsertPrepItem({ id: item.id, display_order: other.display_order } as Partial<PrepChecklistItem> & { id: string }),
      upsertPrepItem({ id: other.id, display_order: item.display_order } as Partial<PrepChecklistItem> & { id: string }),
    ])
    load()
  }

  async function renameItem(item: PrepChecklistItem, newTitle: string) {
    if (!newTitle.trim() || newTitle === item.title) return
    await upsertPrepItem({ id: item.id, title: newTitle.trim() } as Partial<PrepChecklistItem> & { id: string })
    load()
  }

  async function duplicateGroup(groupKey: GroupKey) {
    const groupItems = items.filter(i => (i.session_id ?? '__general__') === groupKey)
    if (groupItems.length === 0) return
    const now = Date.now()
    await Promise.all(
      groupItems.map((item, idx) =>
        upsertPrepItem({
          id: `prep-${now}-${idx}`,
          course_id: courseId,
          session_id: item.session_id,
          title: `${item.title} (עותק)`,
          description: item.description,
          link_url: item.link_url,
          link_label: item.link_label,
          is_required: item.is_required,
          is_active: item.is_active,
          display_order: item.display_order + groupItems.length,
        } as Partial<PrepChecklistItem> & { id: string })
      )
    )
    load()
  }

  async function reassignGroup(groupKey: GroupKey, newSessionId: string) {
    const groupItems = items.filter(i => (i.session_id ?? '__general__') === groupKey)
    const targetSessionId = newSessionId === '' ? null : newSessionId
    await Promise.all(
      groupItems.map(item =>
        upsertPrepItem({ id: item.id, session_id: targetSessionId } as Partial<PrepChecklistItem> & { id: string })
      )
    )
    setReassigningGroupKey(null)
    load()
  }

  // ── Drag & drop handlers ────────────────────────────────────────────────────

  function getGroupKeyForItem(itemId: string): GroupKey {
    const item = items.find(i => i.id === itemId)
    return item ? (item.session_id ?? '__general__') : '__general__'
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeItemId = active.id as string
    const overId = over.id as string

    // Determine target group
    let targetGroupKey: GroupKey
    if (overId.startsWith('group-')) {
      // Dropped on the droppable group container
      targetGroupKey = overId.replace('group-', '')
    } else {
      // Dropped on another item — find that item's group
      targetGroupKey = getGroupKeyForItem(overId)
    }

    const sourceGroupKey = getGroupKeyForItem(activeItemId)
    const targetSessionId = targetGroupKey === '__general__' ? null : targetGroupKey

    if (sourceGroupKey === targetGroupKey) {
      // Reorder within same group
      const groupItems = items
        .filter(i => (i.session_id ?? '__general__') === sourceGroupKey)
        .sort((a, b) => a.display_order - b.display_order)

      const oldIndex = groupItems.findIndex(i => i.id === activeItemId)
      let newIndex = groupItems.findIndex(i => i.id === overId)
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return

      const reordered = arrayMove(groupItems, oldIndex, newIndex)
      // Persist new display_order for all items in the group
      await Promise.all(
        reordered.map((item, idx) =>
          upsertPrepItem({ id: item.id, display_order: idx } as Partial<PrepChecklistItem> & { id: string })
        )
      )
      load()
    } else {
      // Move to different group
      const targetGroupItems = items
        .filter(i => (i.session_id ?? '__general__') === targetGroupKey)
        .sort((a, b) => a.display_order - b.display_order)

      // Find insert index: if dropped on an item, insert at that position; otherwise append
      let insertIdx = targetGroupItems.length
      if (!overId.startsWith('group-')) {
        const overIdx = targetGroupItems.findIndex(i => i.id === overId)
        if (overIdx >= 0) insertIdx = overIdx
      }

      // Update moved item
      await upsertPrepItem({
        id: activeItemId,
        session_id: targetSessionId,
        display_order: insertIdx,
      } as Partial<PrepChecklistItem> & { id: string })

      // Re-order remaining items in target group to make room
      const updatedTargetItems = targetGroupItems.filter(i => i.id !== activeItemId)
      updatedTargetItems.splice(insertIdx, 0, items.find(i => i.id === activeItemId)!)
      await Promise.all(
        updatedTargetItems.map((item, idx) => {
          if (item.id === activeItemId) return Promise.resolve()
          return upsertPrepItem({ id: item.id, display_order: idx > insertIdx ? idx : idx } as Partial<PrepChecklistItem> & { id: string })
        })
      )

      load()
    }
  }

  // ── Build groups ────────────────────────────────────────────────────────────

  const groups: { key: GroupKey; label: string; items: PrepChecklistItem[] }[] = []

  for (const s of sessions) {
    const sessionItems = items.filter(i => i.session_id === s.id)
    const defaultLabel = `הכנה למפגש ${s.session_number}: ${s.title}`
    groups.push({
      key: s.id,
      label: customLabels[s.id] || defaultLabel,
      items: sessionItems,
    })
  }

  // General group — always shown
  const generalItems = items.filter(i => !i.session_id)
  groups.push({
    key: '__general__',
    label: customLabels['__general__'] || 'הכנה כללית (ללא מפגש)',
    items: generalItems,
  })

  const activeItem = activeId ? items.find(i => i.id === activeId) : null

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">רשימת הכנה לקורס</h3>
          <p className="text-sm text-gray-500">פריטים שהתלמידים צריכים להשלים לפני כל מפגש</p>
        </div>
      </div>

      {/* Preview */}
      {showPreview && previewGroup && !loading && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">כך התלמידים רואים את רשימת ההכנה:</p>
            <button onClick={() => { setShowPreview(false); setPreviewGroup(null) }} className="text-xs text-gray-400 hover:text-white transition-colors">
              סגור תצוגה מקדימה
            </button>
          </div>
          <PrepPreview items={groups.find(g => g.key === previewGroup)?.items ?? []} />
        </div>
      )}

      {/* Edit form */}
      {editId && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">כותרת</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500/50"
              placeholder="למשל: פתיחת חשבון ב-Lovable"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">תיאור</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500/50 resize-none"
              placeholder="הסבר קצר על מה צריך לעשות"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">קישורים (אופציונלי)</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, links: [...f.links, { url: '', label: '' }] }))}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center gap-1"
              >
                <Plus size={10} /> הוסף קישור
              </button>
            </div>
            {form.links.length === 0 && (
              <p className="text-xs text-gray-600 py-2">אין קישורים. לחצו "הוסף קישור" כדי להוסיף.</p>
            )}
            <div className="space-y-2">
              {form.links.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={link.url}
                    onChange={e => {
                      const next = [...form.links]
                      next[idx] = { ...next[idx], url: e.target.value }
                      setForm(f => ({ ...f, links: next }))
                    }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50"
                    placeholder="https://..."
                    dir="ltr"
                  />
                  <input
                    value={link.label}
                    onChange={e => {
                      const next = [...form.links]
                      next[idx] = { ...next[idx], label: e.target.value }
                      setForm(f => ({ ...f, links: next }))
                    }}
                    className="w-40 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50"
                    placeholder="טקסט הקישור"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, links: f.links.filter((_, i) => i !== idx) }))}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    aria-label="הסר קישור"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_required}
              onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-300">שלב חובה</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={!form.title.trim()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Save size={14} />
              שמור
            </button>
            <button
              onClick={cancel}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Grouped items with DnD */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-gray-500 mb-4">אין מפגשים בקורס. הוסף מפגשים כדי ליצור רשימות הכנה.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-3">
            {groups.map(group => {
              const isExpanded = expandedGroups.has(group.key)
              const activeCount = group.items.filter(i => i.is_active).length
              const hasItems = group.items.length > 0
              const sortedItems = [...group.items].sort((a, b) => a.display_order - b.display_order)

              return (
                <div key={group.key} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  {/* Group header */}
                  <div className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors">
                    <button onClick={() => toggleGroup(group.key)} className="shrink-0">
                      <ChevronDown
                        size={16}
                        className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleGroup(group.key)}>
                      {renamingGroupKey === group.key ? (
                        <form
                          className="flex items-center gap-2"
                          onClick={e => e.stopPropagation()}
                          onSubmit={e => { e.preventDefault(); saveGroupLabel(group.key, groupRenameValue); setRenamingGroupKey(null) }}
                        >
                          <input
                            autoFocus
                            value={groupRenameValue}
                            onChange={e => setGroupRenameValue(e.target.value)}
                            onBlur={() => { saveGroupLabel(group.key, groupRenameValue); setRenamingGroupKey(null) }}
                            onKeyDown={e => { if (e.key === 'Escape') setRenamingGroupKey(null) }}
                            className="flex-1 bg-white/5 border border-blue-500/50 rounded-lg px-3 py-1.5 text-sm font-bold text-white outline-none"
                          />
                        </form>
                      ) : (
                        <>
                          <span className="text-sm font-bold text-white">{group.label}</span>
                          {hasItems ? (
                            <span className="text-xs text-gray-500 mr-2">
                              ({activeCount} פעילים{group.items.length !== activeCount ? `, ${group.items.length - activeCount} מוסתרים` : ''})
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600 mr-2">(ריק)</span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Rename group */}
                      <button
                        onClick={() => { setRenamingGroupKey(group.key); setGroupRenameValue(group.label) }}
                        aria-label="שנה שם קבוצה"
                        className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      {/* Reassign group to different session */}
                      {hasItems && reassigningGroupKey === group.key ? (
                        <select
                          autoFocus
                          value={group.key === '__general__' ? '' : group.key}
                          onChange={e => reassignGroup(group.key, e.target.value)}
                          onBlur={() => setReassigningGroupKey(null)}
                          onClick={e => e.stopPropagation()}
                          className="bg-[#12121a] border border-blue-500/50 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        >
                          <option value="">כללי (ללא מפגש)</option>
                          {sessions.map(s => (
                            <option key={s.id} value={s.id}>מפגש {s.session_number}: {s.title}</option>
                          ))}
                        </select>
                      ) : hasItems ? (
                        <button
                          onClick={() => setReassigningGroupKey(group.key)}
                          aria-label="שייך למפגש אחר"
                          title="שייך למפגש אחר"
                          className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <ArrowRightLeft size={13} />
                        </button>
                      ) : null}
                      {/* Duplicate group */}
                      {hasItems && (
                        <button
                          onClick={() => duplicateGroup(group.key)}
                          aria-label="שכפל רשימה"
                          title="שכפל רשימה עם כל השלבים"
                          className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                      {hasItems && (
                        <button
                          onClick={() => { setPreviewGroup(group.key); setShowPreview(v => previewGroup === group.key ? !v : true) }}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Eye size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => startNew(group.key)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Group items — droppable + sortable */}
                  {isExpanded && (
                    <SortableContext items={sortedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      <DroppableGroup groupKey={group.key}>
                        {sortedItems.length === 0 ? (
                          <p className="text-center text-gray-600 text-xs py-3">גררו לכאן פריטים או לחצו + להוספה</p>
                        ) : (
                          sortedItems.map((item, idx) => (
                            <SortableItemRow
                              key={item.id}
                              item={item}
                              idx={idx}
                              totalInGroup={sortedItems.length}
                              isRenaming={renamingId === item.id}
                              renameValue={renameValue}
                              onRenameStart={it => { setRenamingId(it.id); setRenameValue(it.title) }}
                              onRenameChange={setRenameValue}
                              onRenameSubmit={renameItem}
                              onRenamingId={setRenamingId}
                              onMoveItem={moveItem}
                              onDuplicate={duplicate}
                              onToggleActive={toggleActive}
                              onStartEdit={startEdit}
                              onRemove={remove}
                            />
                          ))
                        )}
                      </DroppableGroup>
                    </SortableContext>
                  )}
                </div>
              )
            })}
          </div>

          <DragOverlay>
            {activeItem ? <DragOverlayItem item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
