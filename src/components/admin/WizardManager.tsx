import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getAdminWizardSteps, upsertWizardStep, deleteWizardStep, getWizardAnswersWithSteps } from '@/lib/supabase/queries/admin'
import { WizardStepField } from '@/components/wizard/WizardStepField'
import type { WizardStep, WizardAnswer, FieldType } from '@/types'
import { Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react'

function newStep(order: number): Omit<WizardStep, 'created_at'> {
  return {
    id: crypto.randomUUID(),
    question_text: '',
    field_type: 'text',
    options: null,
    step_order: order,
    is_active: true,
  }
}

// ── Preview component ────────────────────────────────────────────────────────

function WizardPreview({ steps }: { steps: WizardStep[] }) {
  const activeSteps = steps.filter(s => s.is_active)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [previewAnswer, setPreviewAnswer] = useState('')

  // Reset when steps change
  useEffect(() => {
    setCurrentIndex(0)
    setPreviewAnswer('')
  }, [steps.length])

  if (activeSteps.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-gray-500 text-sm">אין שאלות פעילות להצגה</p>
      </div>
    )
  }

  const step = activeSteps[Math.min(currentIndex, activeSteps.length - 1)]
  const progress = ((currentIndex + 1) / activeSteps.length) * 100

  return (
    <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 max-w-xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="text-lg font-black text-white">
          Nextli: <span className="text-blue-400">וייבקוד</span>
        </span>
        <p className="text-gray-500 mt-1 text-xs">בואו נכיר אותך</p>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{Math.round(progress)}%</span>
          <span>שאלה {currentIndex + 1} מתוך {activeSteps.length}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-400"
            style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl p-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <h3 className="text-lg font-bold text-white mb-4">{step.question_text}</h3>
          <WizardStepField step={step} value={previewAnswer} onChange={setPreviewAnswer} />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => { setCurrentIndex(i => Math.max(0, i - 1)); setPreviewAnswer('') }}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={16} />
          הקודם
        </button>
        <span className="text-xs text-gray-600">{currentIndex + 1} / {activeSteps.length}</span>
        <button
          onClick={() => { setCurrentIndex(i => Math.min(activeSteps.length - 1, i + 1)); setPreviewAnswer('') }}
          disabled={currentIndex >= activeSteps.length - 1}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          הבא
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Distribution component ──────────────────────────────────────────────────

function WizardDistribution({ steps, answers }: { steps: WizardStep[]; answers: WizardAnswer[] }) {
  const activeSteps = steps.filter(s => s.is_active)

  if (answers.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-gray-500 text-sm">אין תשובות עדיין</p>
      </div>
    )
  }

  // Group answers by step
  const answersByStep = new Map<string, string[]>()
  for (const a of answers) {
    const list = answersByStep.get(a.step_id) ?? []
    list.push(a.answer)
    answersByStep.set(a.step_id, list)
  }

  // Count unique users
  const uniqueUsers = new Set(answers.map(a => a.user_id)).size

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-white">התפלגות תשובות</h3>
        <span className="text-xs text-gray-500">{uniqueUsers} תלמידים ענו</span>
      </div>

      {activeSteps.map(step => {
        const stepAnswers = answersByStep.get(step.id) ?? []
        if (stepAnswers.length === 0) return null

        // For select questions, show distribution bars
        if (step.field_type === 'select' && step.options) {
          const counts = new Map<string, number>()
          for (const a of stepAnswers) counts.set(a, (counts.get(a) ?? 0) + 1)
          const maxCount = Math.max(...counts.values(), 1)

          return (
            <div key={step.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm font-semibold text-white mb-3">{step.question_text}</p>
              <div className="space-y-2">
                {(step.options as string[]).map(opt => {
                  const count = counts.get(opt) ?? 0
                  const pct = stepAnswers.length > 0 ? Math.round((count / stepAnswers.length) * 100) : 0
                  return (
                    <div key={opt}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-300">{opt}</span>
                        <span className="text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-gray-600 mt-2">{stepAnswers.length} תשובות</p>
            </div>
          )
        }

        // For text/textarea questions, show recent answers
        return (
          <div key={step.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-3">{step.question_text}</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {stepAnswers.slice(0, 20).map((a, i) => (
                <div key={i} className="text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2">{a}</div>
              ))}
              {stepAnswers.length > 20 && (
                <p className="text-[10px] text-gray-600 text-center">+{stepAnswers.length - 20} תשובות נוספות</p>
              )}
            </div>
            <p className="text-[10px] text-gray-600 mt-2">{stepAnswers.length} תשובות</p>
          </div>
        )
      })}
    </div>
  )
}

// ── Main manager ─────────────────────────────────────────────────────────────

export function WizardManager() {
  const [steps, setSteps] = useState<WizardStep[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showDistribution, setShowDistribution] = useState(false)
  const [answers, setAnswers] = useState<WizardAnswer[]>([])
  const [loadingAnswers, setLoadingAnswers] = useState(false)

  function loadSteps() {
    setLoading(true)
    setFetchError(null)
    getAdminWizardSteps()
      .then(data => { setSteps(data); setLoading(false) })
      .catch(err => { setFetchError(err?.message ?? 'שגיאה בטעינה'); setLoading(false) })
  }

  useEffect(() => { loadSteps() }, [])

  async function handleAdd() {
    const order = steps.length > 0 ? Math.max(...steps.map(s => s.step_order)) + 1 : 1
    const step = newStep(order)
    await upsertWizardStep(step)
    setSteps(prev => [...prev, { ...step, created_at: new Date().toISOString() }])
  }

  async function handleSave(step: WizardStep) {
    setSaving(true)
    await upsertWizardStep(step)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await deleteWizardStep(id)
    setSteps(prev => prev.filter(s => s.id !== id))
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const newSteps = [...steps]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newSteps.length) return

    const orderA = newSteps[index].step_order
    const orderB = newSteps[swapIndex].step_order

    const updatedA = { ...newSteps[index], step_order: orderB }
    const updatedB = { ...newSteps[swapIndex], step_order: orderA }

    newSteps[index] = updatedA
    newSteps[swapIndex] = updatedB
    newSteps.sort((a, b) => a.step_order - b.step_order)
    setSteps(newSteps)

    await upsertWizardStep(updatedB)
    await upsertWizardStep(updatedA)
  }

  function updateStep(id: string, updates: Partial<WizardStep>) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">ניהול שאלון קבלה</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !showDistribution
              setShowDistribution(next)
              if (next && answers.length === 0) {
                setLoadingAnswers(true)
                getWizardAnswersWithSteps()
                  .then(({ answers: a }) => { setAnswers(a); setLoadingAnswers(false) })
                  .catch(() => setLoadingAnswers(false))
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              showDistribution
                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 size={16} />
            {showDistribution ? 'סגור התפלגות' : 'התפלגות תשובות'}
          </button>
          <button
            onClick={() => setShowPreview(v => !v)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              showPreview
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? 'סגור תצוגה מקדימה' : 'תצוגה מקדימה'}
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            הוסף שאלה
          </button>
        </div>
      </div>

      {/* Distribution */}
      {showDistribution && (
        <div className="mb-8">
          {loadingAnswers ? (
            <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
          ) : (
            <WizardDistribution steps={steps} answers={answers} />
          )}
        </div>
      )}

      {/* Preview */}
      {showPreview && !loading && (
        <div className="mb-8">
          <p className="text-xs text-gray-500 mb-3 text-center">כך התלמידים רואים את השאלון:</p>
          <WizardPreview steps={steps} />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : fetchError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 font-semibold mb-1">שגיאה בטעינת השלבים</p>
          <p className="text-gray-500 text-sm mb-4 font-mono">{fetchError}</p>
          <button onClick={loadSteps} className="bg-white/10 hover:bg-white/15 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors">נסה שוב</button>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
              <p className="text-gray-400 text-sm">אין שלבים עדיין — לחץ "הוסף שאלה" כדי להתחיל</p>
            </div>
          )}
          {steps.map((step, i) => (
            <div
              key={step.id}
              className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
              <div className="flex items-start gap-4">
                {/* Order controls */}
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => handleMove(i, 'up')}
                    disabled={i === 0}
                    className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <span className="text-xs text-gray-500 text-center">{step.step_order}</span>
                  <button
                    onClick={() => handleMove(i, 'down')}
                    disabled={i === steps.length - 1}
                    className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={step.question_text}
                    onChange={e => updateStep(step.id, { question_text: e.target.value })}
                    onBlur={() => handleSave(step)}
                    placeholder="טקסט השאלה..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
                    dir="rtl"
                  />

                  <div className="flex items-center gap-3">
                    <select
                      value={step.field_type}
                      onChange={e => {
                        const ft = e.target.value as FieldType
                        const updated = { ...step, field_type: ft, options: ft === 'select' ? [] : null }
                        updateStep(step.id, updated)
                        handleSave({ ...step, ...updated })
                      }}
                      className="bg-white/5 border border-white/10 text-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="text" className="bg-gray-900">טקסט קצר</option>
                      <option value="textarea" className="bg-gray-900">טקסט ארוך</option>
                      <option value="select" className="bg-gray-900">בחירה מרשימה</option>
                    </select>

                    <label className="flex items-center gap-2 text-sm text-gray-400">
                      <input
                        type="checkbox"
                        checked={step.is_active}
                        onChange={e => {
                          const updated = { ...step, is_active: e.target.checked }
                          updateStep(step.id, { is_active: e.target.checked })
                          handleSave(updated)
                        }}
                      />
                      פעיל
                    </label>
                  </div>

                  {step.field_type === 'select' && (
                    <textarea
                      value={(step.options as string[] | null)?.join('\n') ?? ''}
                      onChange={e => {
                        const opts = e.target.value.split('\n').filter(Boolean)
                        updateStep(step.id, { options: opts })
                      }}
                      onBlur={() => handleSave(step)}
                      placeholder="אפשרות אחת בכל שורה..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 resize-none transition-colors"
                      dir="rtl"
                    />
                  )}
                </div>

                <button
                  onClick={() => handleDelete(step.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {saving && (
        <p className="text-sm text-gray-500 mt-4 text-center animate-pulse">שומר שינויים...</p>
      )}
    </div>
  )
}
