import { useEffect, useState } from 'react'
import {
  getAdminAdditionalCourses,
  upsertAdditionalCourse,
  deleteAdditionalCourse,
} from '@/lib/supabase/queries/admin'
import type { AdditionalCourse } from '@/types'
import { Plus, Trash2, Save, GripVertical } from 'lucide-react'

function blankCourse(order: number): Omit<AdditionalCourse, 'created_at'> {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    badge: 'בקרוב',
    rating: '5.0',
    display_order: order,
    is_active: true,
  }
}

export function AdditionalCoursesManager() {
  const [courses, setCourses] = useState<AdditionalCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setFetchError(null)
    getAdminAdditionalCourses()
      .then(data => { setCourses(data); setLoading(false) })
      .catch(err => { setFetchError(err?.message ?? 'שגיאה בטעינה'); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    const order = courses.length > 0 ? Math.max(...courses.map(c => c.display_order)) + 1 : 1
    const course = blankCourse(order)
    await upsertAdditionalCourse(course)
    setCourses(prev => [...prev, { ...course, created_at: new Date().toISOString() }])
  }

  function update(id: string, patch: Partial<AdditionalCourse>) {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  async function handleSave(course: AdditionalCourse) {
    setSaving(course.id)
    try {
      await upsertAdditionalCourse(course)
    } finally {
      setSaving(null)
    }
  }

  async function handleDelete(id: string) {
    await deleteAdditionalCourse(id)
    setCourses(prev => prev.filter(c => c.id !== id))
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors'

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">קורסים נוספים</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          הוסף קורס
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">טוען...</span>
        </div>
      ) : fetchError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center space-y-3">
          <p className="text-red-400 text-sm">{fetchError}</p>
          <button onClick={load} className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-4 py-2 rounded-lg transition-colors">
            נסה שוב
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
              <p className="text-gray-400 text-sm">אין קורסים — לחץ "הוסף קורס" כדי להתחיל</p>
            </div>
          )}
          {courses.map(course => (
            <div key={course.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <GripVertical size={16} className="text-gray-600 flex-shrink-0" />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={course.title}
                    onChange={e => update(course.id, { title: e.target.value })}
                    placeholder="שם הקורס"
                    className={inputCls}
                    dir="rtl"
                  />
                  <input
                    value={course.description}
                    onChange={e => update(course.id, { description: e.target.value })}
                    placeholder="תיאור קצר"
                    className={inputCls}
                    dir="rtl"
                  />
                  <input
                    value={course.badge}
                    onChange={e => update(course.id, { badge: e.target.value })}
                    placeholder="תווית (בקרוב, חדש...)"
                    className={inputCls}
                    dir="rtl"
                  />
                  <div className="flex gap-2">
                    <input
                      value={course.rating}
                      onChange={e => update(course.id, { rating: e.target.value })}
                      placeholder="דירוג (4.9)"
                      className={`${inputCls} w-28`}
                      dir="ltr"
                    />
                    <input
                      type="number"
                      value={course.display_order}
                      onChange={e => update(course.id, { display_order: Number(e.target.value) })}
                      placeholder="סדר"
                      className={`${inputCls} w-24`}
                    />
                    <label className="flex items-center gap-1.5 text-sm text-gray-400 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={course.is_active}
                        onChange={e => update(course.id, { is_active: e.target.checked })}
                        className="accent-blue-500"
                      />
                      פעיל
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleSave(course)}
                    disabled={saving === course.id}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Save size={12} />
                    {saving === course.id ? '...' : 'שמור'}
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="flex items-center gap-1 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    <Trash2 size={12} />
                    מחק
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
