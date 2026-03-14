import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Save, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Eye } from 'lucide-react'

type OptionItem = { value: string; label: string; description: string }

type IntakeQuestion = {
  id: string
  field_key: string
  title: string
  subtitle: string
  options: string // JSON string
  display_order: number
  is_active: boolean
}

export function IntakeManager() {
  const [questions, setQuestions] = useState<IntakeQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('intake_questions').select('*').order('display_order', { ascending: true })
      .then(({ data }: { data: IntakeQuestion[] | null }) => {
        setQuestions(data ?? [])
        setLoading(false)
      })
  }, [])

  function parseOptions(json: string): OptionItem[] {
    try { return JSON.parse(json) } catch { return [] }
  }

  async function saveQuestion(q: IntakeQuestion) {
    setSaving(q.id)
    await supabase.from('intake_questions').upsert({
      id: q.id,
      field_key: q.field_key,
      title: q.title,
      subtitle: q.subtitle,
      options: q.options,
      display_order: q.display_order,
      is_active: q.is_active,
    })
    setSaving(null)
  }

  function updateQuestion(id: string, patch: Partial<IntakeQuestion>) {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q))
  }

  function updateOption(questionId: string, optIndex: number, patch: Partial<OptionItem>) {
    const q = questions.find(q => q.id === questionId)
    if (!q) return
    const opts = parseOptions(q.options)
    opts[optIndex] = { ...opts[optIndex], ...patch }
    updateQuestion(questionId, { options: JSON.stringify(opts) })
  }

  function addOption(questionId: string) {
    const q = questions.find(q => q.id === questionId)
    if (!q) return
    const opts = parseOptions(q.options)
    opts.push({ value: `option_${opts.length}`, label: 'תשובה חדשה', description: '' })
    updateQuestion(questionId, { options: JSON.stringify(opts) })
  }

  function removeOption(questionId: string, optIndex: number) {
    const q = questions.find(q => q.id === questionId)
    if (!q) return
    const opts = parseOptions(q.options)
    opts.splice(optIndex, 1)
    updateQuestion(questionId, { options: JSON.stringify(opts) })
  }

  async function addQuestion() {
    const newQ: IntakeQuestion = {
      id: `iq-${Date.now()}`,
      field_key: `field_${Date.now()}`,
      title: 'שאלה חדשה',
      subtitle: '',
      options: JSON.stringify([
        { value: 'option_0', label: 'תשובה 1', description: '' },
        { value: 'option_1', label: 'תשובה 2', description: '' },
      ]),
      display_order: questions.length,
      is_active: true,
    }
    await supabase.from('intake_questions').insert(newQ)
    setQuestions(prev => [...prev, newQ])
    setExpandedId(newQ.id)
  }

  async function deleteQuestion(id: string) {
    await supabase.from('intake_questions').delete().eq('id', id)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  async function moveQuestion(index: number, dir: -1 | 1) {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= questions.length) return
    const updated = [...questions]
    const [moved] = updated.splice(index, 1)
    updated.splice(newIndex, 0, moved)
    const reordered = updated.map((q, i) => ({ ...q, display_order: i }))
    setQuestions(reordered)
    for (const q of reordered) {
      await supabase.from('intake_questions').update({ display_order: q.display_order }).eq('id', q.id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">שאלות טופס ההרשמה</h2>
          <p className="text-xs text-gray-500 mt-1">עריכת השאלות שמופיעות בטופס ההתאמה לנרשמים חדשים</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/intake"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 bg-white/5 border border-white/10 px-3 py-2 rounded-lg transition-colors"
          >
            <Eye size={13} />
            תצוגה מקדימה
          </a>
          <button
            onClick={addQuestion}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus size={14} />
            שאלה חדשה
          </button>
        </div>
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-gray-500 text-sm">אין שאלות עדיין. לחצו &quot;שאלה חדשה&quot; כדי להתחיל.</p>
        </div>
      )}

      {questions.map((q, idx) => {
        const opts = parseOptions(q.options)
        const isExpanded = expandedId === q.id

        return (
          <div
            key={q.id}
            className={`bg-white/5 border rounded-xl transition-colors ${
              q.is_active ? 'border-white/10' : 'border-white/5 opacity-60'
            }`}
          >
            {/* Header row */}
            <div className="flex items-center gap-3 p-4">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} className="text-gray-600 hover:text-gray-400 disabled:opacity-20 transition-colors" title="הזז למעלה">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} className="text-gray-600 hover:text-gray-400 disabled:opacity-20 transition-colors" title="הזז למטה">
                  <ChevronDown size={14} />
                </button>
              </div>
              <GripVertical size={14} className="text-gray-600" />
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="text-right w-full"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-mono bg-white/5 px-1.5 py-0.5 rounded">{q.field_key}</span>
                    <span className="text-sm font-semibold text-white truncate">{q.title}</span>
                    <span className="text-xs text-gray-500">{opts.length} תשובות</span>
                  </div>
                </button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">{q.is_active ? 'פעיל' : 'מושבת'}</span>
                <input
                  type="checkbox"
                  checked={q.is_active}
                  onChange={e => {
                    updateQuestion(q.id, { is_active: e.target.checked })
                    supabase.from('intake_questions').update({ is_active: e.target.checked }).eq('id', q.id)
                  }}
                  className="w-4 h-4 rounded accent-blue-500"
                />
              </label>
              <button
                onClick={() => deleteQuestion(q.id)}
                className="text-gray-600 hover:text-red-400 transition-colors p-1"
                title="מחק שאלה"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Expanded editor */}
            {isExpanded && (
              <div className="border-t border-white/10 p-4 space-y-4">
                {/* Question texts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">כותרת השאלה</label>
                    <input
                      type="text"
                      value={q.title}
                      onChange={e => updateQuestion(q.id, { title: e.target.value })}
                      className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">תיאור משני</label>
                    <input
                      type="text"
                      value={q.subtitle}
                      onChange={e => updateQuestion(q.id, { subtitle: e.target.value })}
                      className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">מזהה שדה (field_key)</label>
                  <input
                    type="text"
                    value={q.field_key}
                    onChange={e => updateQuestion(q.id, { field_key: e.target.value })}
                    className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-400 font-mono outline-none focus:border-blue-500/50"
                    dir="ltr"
                  />
                </div>

                {/* Options */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-400">תשובות</label>
                    <button
                      onClick={() => addOption(q.id)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} />
                      הוסף תשובה
                    </button>
                  </div>
                  <div className="space-y-2">
                    {opts.map((opt, oi) => (
                      <div key={oi} className="flex items-start gap-2 bg-white/3 border border-white/5 rounded-lg p-3">
                        <span className="text-xs text-gray-600 font-mono mt-2 flex-shrink-0">{opt.value}</span>
                        <div className="flex-1 space-y-1.5">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={e => updateOption(q.id, oi, { label: e.target.value })}
                            className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500/50"
                            placeholder="תווית"
                          />
                          <input
                            type="text"
                            value={opt.description}
                            onChange={e => updateOption(q.id, oi, { description: e.target.value })}
                            className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400 outline-none focus:border-blue-500/50"
                            placeholder="תיאור (אופציונלי)"
                          />
                        </div>
                        <button
                          onClick={() => removeOption(q.id, oi)}
                          className="text-gray-600 hover:text-red-400 transition-colors mt-2"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => saveQuestion(q)}
                    disabled={saving === q.id}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Save size={13} />
                    {saving === q.id ? 'שומר...' : 'שמור שאלה'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
