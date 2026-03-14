import { useState, useRef } from 'react'
import { GripVertical, ChevronUp, ChevronDown, Eye, EyeOff, RotateCcw, Save, Pencil, Check, X } from 'lucide-react'
import { useAdminDirty } from '@/hooks/useAdminDirty'

export type NavOrderItem = {
  id: string
  label: string
  hidden?: boolean
  children?: { id: string; label: string; hidden?: boolean }[]
}

type Props = {
  items: NavOrderItem[]
  onChange: (items: NavOrderItem[]) => void
  onSave: (items: NavOrderItem[]) => Promise<void>
  onReset: () => void
  dirty: boolean
}

export function NavOrderManager({ items, onChange, onSave, onReset, dirty }: Props) {
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)
  const childDragParent = useRef<string | null>(null)
  const childDragItem = useRef<number | null>(null)
  const childDragOver = useRef<number | null>(null)

  useAdminDirty('nav-order', dirty)

  async function handleSave() {
    setSaving(true)
    await onSave(items)
    setSaving(false)
  }

  // ── Parent drag ────────────────────────────────────────
  function handleDragStart(idx: number) {
    dragItem.current = idx
  }

  function handleDragEnter(idx: number) {
    dragOverItem.current = idx
  }

  function handleDrop() {
    if (dragItem.current === null || dragOverItem.current === null) return
    const newItems = [...items]
    const dragged = newItems.splice(dragItem.current, 1)[0]
    newItems.splice(dragOverItem.current, 0, dragged)
    dragItem.current = null
    dragOverItem.current = null
    onChange(newItems)
  }

  // ── Child drag ─────────────────────────────────────────
  function handleChildDragStart(parentId: string, idx: number) {
    childDragParent.current = parentId
    childDragItem.current = idx
  }

  function handleChildDragEnter(idx: number) {
    childDragOver.current = idx
  }

  function handleChildDrop(parentId: string) {
    if (childDragParent.current !== parentId || childDragItem.current === null || childDragOver.current === null) return
    const newItems = items.map(item => {
      if (item.id !== parentId || !item.children) return item
      const children = [...item.children]
      const dragged = children.splice(childDragItem.current!, 1)[0]
      children.splice(childDragOver.current!, 0, dragged)
      return { ...item, children }
    })
    childDragParent.current = null
    childDragItem.current = null
    childDragOver.current = null
    onChange(newItems)
  }

  // ── Move helpers ───────────────────────────────────────
  function moveParent(idx: number, dir: -1 | 1) {
    const target = idx + dir
    if (target < 0 || target >= items.length) return
    const newItems = [...items]
    ;[newItems[idx], newItems[target]] = [newItems[target], newItems[idx]]
    onChange(newItems)
  }

  function moveChild(parentId: string, idx: number, dir: -1 | 1) {
    const newItems = items.map(item => {
      if (item.id !== parentId || !item.children) return item
      const target = idx + dir
      if (target < 0 || target >= item.children.length) return item
      const children = [...item.children]
      ;[children[idx], children[target]] = [children[target], children[idx]]
      return { ...item, children }
    })
    onChange(newItems)
  }

  function toggleHidden(id: string, parentId?: string) {
    const newItems = items.map(item => {
      if (parentId) {
        if (item.id !== parentId || !item.children) return item
        return {
          ...item,
          children: item.children.map(c => c.id === id ? { ...c, hidden: !c.hidden } : c),
        }
      }
      if (item.id === id) return { ...item, hidden: !item.hidden }
      return item
    })
    onChange(newItems)
  }

  function startEdit(id: string, currentLabel: string) {
    setEditingId(id)
    setEditValue(currentLabel)
  }

  function saveEdit(id: string, parentId?: string) {
    if (!editValue.trim()) { setEditingId(null); return }
    const newItems = items.map(item => {
      if (parentId) {
        if (item.id !== parentId || !item.children) return item
        return {
          ...item,
          children: item.children.map(c => c.id === id ? { ...c, label: editValue.trim() } : c),
        }
      }
      if (item.id === id) return { ...item, label: editValue.trim() }
      return item
    })
    onChange(newItems)
    setEditingId(null)
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">סידור תפריט ניהול</h2>
          <p className="text-xs text-gray-500 mt-1">גררו כדי לשנות סדר, לחצו על העין להסתיר, או על העיפרון לשנות שם</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <button onClick={onReset} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-gray-400 px-3 py-2 rounded-xl text-sm transition-colors" title="אפס לברירת מחדל">
              <RotateCcw size={14} />
              אפס
            </button>
          )}
          <button onClick={handleSave} disabled={!dirty || saving}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Save size={14} />
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {items.map((item, idx) => (
          <div key={item.id}>
            {/* Parent item */}
            <div
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDrop}
              onDragOver={e => e.preventDefault()}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
                item.hidden ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-white/5 border-white/10'
              } hover:border-white/20 cursor-grab active:cursor-grabbing`}
            >
              <GripVertical size={14} className="text-gray-600 shrink-0" />

              {editingId === item.id ? (
                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditingId(null) }}
                    className="flex-1 bg-[#0a0a0f] border border-blue-500/50 rounded-lg px-2 py-1 text-sm text-white outline-none"
                    autoFocus
                    dir="rtl"
                  />
                  <button onClick={() => saveEdit(item.id)} className="text-green-400 hover:text-green-300" title="שמור"><Check size={14} /></button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-400" title="בטל"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-white font-medium">{item.label}</span>
                  <span className="text-[10px] text-gray-600 font-mono">{item.id}</span>
                </>
              )}

              {editingId !== item.id && (
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(item.id, item.label)} className="text-gray-600 hover:text-gray-400 p-0.5" title="שנה שם">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => toggleHidden(item.id)} className="text-gray-600 hover:text-gray-400 p-0.5" title={item.hidden ? 'הצג' : 'הסתר'}>
                    {item.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  <button onClick={() => moveParent(idx, -1)} disabled={idx === 0} className="text-gray-600 hover:text-gray-400 disabled:opacity-30 p-0.5" title="הזז למעלה">
                    <ChevronUp size={12} />
                  </button>
                  <button onClick={() => moveParent(idx, 1)} disabled={idx === items.length - 1} className="text-gray-600 hover:text-gray-400 disabled:opacity-30 p-0.5" title="הזז למטה">
                    <ChevronDown size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Children */}
            {item.children && item.children.length > 0 && (
              <div className="mr-6 mt-1 mb-2 space-y-0.5">
                {item.children.map((child, cIdx) => (
                  <div
                    key={child.id}
                    draggable
                    onDragStart={() => handleChildDragStart(item.id, cIdx)}
                    onDragEnter={() => handleChildDragEnter(cIdx)}
                    onDragEnd={() => handleChildDrop(item.id)}
                    onDragOver={e => e.preventDefault()}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      child.hidden ? 'bg-white/[0.01] border-white/5 opacity-50' : 'bg-white/[0.03] border-white/5'
                    } hover:border-white/15 cursor-grab active:cursor-grabbing`}
                  >
                    <GripVertical size={12} className="text-gray-700 shrink-0" />

                    {editingId === child.id ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(child.id, item.id); if (e.key === 'Escape') setEditingId(null) }}
                          className="flex-1 bg-[#0a0a0f] border border-blue-500/50 rounded-lg px-2 py-1 text-xs text-white outline-none"
                          autoFocus
                          dir="rtl"
                        />
                        <button onClick={() => saveEdit(child.id, item.id)} className="text-green-400 hover:text-green-300"><Check size={12} /></button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-400"><X size={12} /></button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-xs text-gray-300">{child.label}</span>
                        <span className="text-[10px] text-gray-700 font-mono">{child.id}</span>
                      </>
                    )}

                    {editingId !== child.id && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(child.id, child.label)} className="text-gray-700 hover:text-gray-500 p-0.5" title="שנה שם">
                          <Pencil size={10} />
                        </button>
                        <button onClick={() => toggleHidden(child.id, item.id)} className="text-gray-700 hover:text-gray-500 p-0.5" title={child.hidden ? 'הצג' : 'הסתר'}>
                          {child.hidden ? <EyeOff size={10} /> : <Eye size={10} />}
                        </button>
                        <button onClick={() => moveChild(item.id, cIdx, -1)} disabled={cIdx === 0} className="text-gray-700 hover:text-gray-500 disabled:opacity-30 p-0.5" title="הזז למעלה">
                          <ChevronUp size={10} />
                        </button>
                        <button onClick={() => moveChild(item.id, cIdx, 1)} disabled={cIdx === (item.children?.length ?? 0) - 1} className="text-gray-700 hover:text-gray-500 disabled:opacity-30 p-0.5" title="הזז למטה">
                          <ChevronDown size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
