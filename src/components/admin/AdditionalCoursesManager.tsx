import { useEffect, useState } from 'react'
import {
  getAdminAdditionalCourses,
  upsertAdditionalCourse,
  deleteAdditionalCourse,
} from '@/lib/supabase/queries/admin'
import type { AdditionalCourse } from '@/types'
import { Plus, Trash2, Save, GripVertical, Link2, ZoomIn, ZoomOut, Crosshair } from 'lucide-react'

const BADGE_COLORS: { id: string; label: string; cls: string }[] = [
  { id: 'purple', label: 'סגול',  cls: 'bg-purple-600' },
  { id: 'blue',   label: 'כחול',  cls: 'bg-blue-600' },
  { id: 'green',  label: 'ירוק',  cls: 'bg-green-600' },
  { id: 'amber',  label: 'ענבר',  cls: 'bg-amber-500' },
  { id: 'red',    label: 'אדום',  cls: 'bg-red-600' },
  { id: 'pink',   label: 'ורוד',  cls: 'bg-pink-600' },
  { id: 'teal',   label: 'ים',    cls: 'bg-teal-600' },
  { id: 'gray',   label: 'אפור',  cls: 'bg-gray-600' },
]

function blankCourse(order: number): Omit<AdditionalCourse, 'created_at'> {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    badge: 'בקרוב',
    badge_color: 'purple',
    rating: '5.0',
    show_rating: true,
    image_url: null,
    image_crop_x: 50,
    image_crop_y: 50,
    image_zoom: 100,
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
              <div className="flex items-start gap-3">
                <GripVertical size={16} className="text-gray-600 flex-shrink-0 mt-3" />
                <div className="flex-1 space-y-3">
                  {/* Row 1: Title + Description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  </div>

                  {/* Row 2: Badge + Badge color */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      value={course.badge}
                      onChange={e => update(course.id, { badge: e.target.value })}
                      placeholder="תווית (בקרוב, חדש...)"
                      className={`${inputCls} w-40`}
                      dir="rtl"
                    />
                    <span className="text-[10px] text-gray-500 shrink-0">צבע:</span>
                    {BADGE_COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => update(course.id, { badge_color: c.id })}
                        title={c.label}
                        className={`w-5 h-5 rounded-md ${c.cls} transition-all duration-150 ${
                          (course.badge_color || 'purple') === c.id
                            ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0a0a0f] scale-110'
                            : 'opacity-40 hover:opacity-70'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Row 3: Rating + Order + Toggles */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      value={course.rating}
                      onChange={e => update(course.id, { rating: e.target.value })}
                      placeholder="דירוג (4.9)"
                      className={`${inputCls} w-24`}
                      dir="ltr"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={course.show_rating !== false}
                        onChange={e => update(course.id, { show_rating: e.target.checked })}
                        className="accent-blue-500 w-3 h-3"
                      />
                      הצג כוכבים
                    </label>
                    <span className="text-[10px] text-gray-500 shrink-0">סדר:</span>
                    <input
                      type="number"
                      value={course.display_order}
                      onChange={e => update(course.id, { display_order: Number(e.target.value) })}
                      placeholder="סדר"
                      className={`${inputCls} w-20`}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={course.is_active}
                        onChange={e => update(course.id, { is_active: e.target.checked })}
                        className="accent-blue-500 w-3 h-3"
                      />
                      פעיל
                    </label>
                  </div>

                  {/* Row 4: Image URL */}
                  <div className="flex items-center gap-2">
                    <Link2 size={12} className="text-gray-600 shrink-0" />
                    <input
                      type="text"
                      value={course.image_url ?? ''}
                      onChange={e => update(course.id, { image_url: e.target.value || null })}
                      placeholder="URL לתמונה (הדבק לינק חיצוני)"
                      className={`${inputCls} text-xs`}
                      dir="ltr"
                    />
                    <a
                      href="https://imgur.com/upload"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-400 hover:text-blue-300 shrink-0 whitespace-nowrap transition-colors"
                    >
                      העלה ל-Imgur
                    </a>
                  </div>

                  {/* Image preview with crop & zoom */}
                  {course.image_url && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Crosshair size={10} className="text-gray-500 shrink-0" />
                        <span className="text-[10px] text-gray-500">לחץ על התמונה לבחירת מוקד החיתוך</span>
                      </div>
                      <div
                        className="relative w-full h-32 bg-white/5 rounded-lg overflow-hidden cursor-crosshair group"
                        onClick={e => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
                          const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
                          update(course.id, { image_crop_x: x, image_crop_y: y })
                        }}
                      >
                        <img
                          src={course.image_url}
                          alt={course.title || 'preview'}
                          className="w-full h-full object-cover"
                          style={{
                            objectPosition: `${course.image_crop_x ?? 50}% ${course.image_crop_y ?? 50}%`,
                            transform: `scale(${(course.image_zoom ?? 100) / 100})`,
                            transformOrigin: `${course.image_crop_x ?? 50}% ${course.image_crop_y ?? 50}%`,
                          }}
                          draggable={false}
                        />
                        {/* Focal point indicator */}
                        <div
                          className="absolute w-4 h-4 border-2 border-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_0_6px_rgba(96,165,250,0.5)] opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ left: `${course.image_crop_x ?? 50}%`, top: `${course.image_crop_y ?? 50}%` }}
                        />
                        <div
                          className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_0_4px_rgba(96,165,250,0.6)]"
                          style={{ left: `${course.image_crop_x ?? 50}%`, top: `${course.image_crop_y ?? 50}%` }}
                        />
                      </div>
                      {/* Zoom slider */}
                      <div className="flex items-center gap-2">
                        <ZoomOut size={12} className="text-gray-500 shrink-0" />
                        <input
                          type="range"
                          min={100}
                          max={250}
                          step={5}
                          value={course.image_zoom ?? 100}
                          onChange={e => update(course.id, { image_zoom: Number(e.target.value) })}
                          className="flex-1 h-1 accent-blue-500 cursor-pointer"
                        />
                        <ZoomIn size={12} className="text-gray-500 shrink-0" />
                        <span className="text-[10px] text-gray-500 w-8 text-center font-mono">{course.image_zoom ?? 100}%</span>
                        {(course.image_crop_x !== 50 || course.image_crop_y !== 50 || (course.image_zoom ?? 100) !== 100) && (
                          <button
                            onClick={() => update(course.id, { image_crop_x: 50, image_crop_y: 50, image_zoom: 100 })}
                            className="text-[10px] text-gray-500 hover:text-white px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            איפוס
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
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
