import { useState, useEffect, useRef } from 'react'
import { getStudentNote, upsertStudentNote } from '@/lib/supabase/queries/workspace'

type Props = { userId: string; sessionId: string }

export function PersonalNotes({ userId, sessionId }: Props) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setContent('')
    getStudentNote(userId, sessionId).then(note => {
      setContent(note?.content ?? '')
    })
  }, [userId, sessionId])

  function handleChange(value: string) {
    setContent(value)
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(async () => {
      await upsertStudentNote(userId, sessionId, value)
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 1500)
  }

  async function handleExport() {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `הערות-מפגש.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black text-white">הפנקס שלי</h2>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-gray-400 animate-pulse" role="status" aria-live="polite">שומר...</span>}
          {saved && <span className="text-xs text-green-400" role="status" aria-live="polite">נשמר</span>}
          <button
            onClick={handleExport}
            className="text-xs border border-white/20 hover:border-white/40 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-all"
          >
            ייצא כטקסט
          </button>
        </div>
      </div>
      <label htmlFor="personal-notes" className="sr-only">הערות אישיות</label>
      <textarea
        id="personal-notes"
        value={content}
        onChange={e => handleChange(e.target.value)}
        className="flex-1 min-h-[400px] bg-[#111118] border border-white/10 rounded-xl p-4 text-gray-100 text-sm resize-none outline-none focus:border-blue-500/50 transition-colors placeholder-gray-600"
        placeholder="כתוב כאן את ההערות שלך... הן נשמרות אוטומטית"
        dir="rtl"
      />
    </div>
  )
}
