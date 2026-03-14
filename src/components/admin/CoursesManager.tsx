import { lazy, Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getAdminCourses,
  upsertCourse,
  deleteCourse,
  updateCourseStatus,
} from '@/lib/supabase/queries/admin'
import type { Course, CourseStatus } from '@/types'
import { Plus, Trash2, Save, ChevronLeft, BookOpen, Pencil } from 'lucide-react'

const SessionsManager = lazy(() => import('./SessionsManager').then(m => ({ default: m.SessionsManager })))

const statusLabels: Record<CourseStatus, string> = {
  draft: 'טיוטה',
  active: 'פעיל',
  completed: 'הסתיים',
}

const statusColors: Record<CourseStatus, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  active: 'bg-green-500/20 text-green-400',
  completed: 'bg-blue-500/20 text-blue-400',
}

function newCourse(order: number): Omit<Course, 'created_at'> {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    status: 'draft',
    display_order: order,
  }
}

export function CoursesManager() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [editingCourse, setEditingCourse] = useState<Omit<Course, 'created_at'> | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedCourseId = searchParams.get('course')
  const setSelectedCourseId = useCallback((id: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (id) { next.set('course', id) } else { next.delete('course'); next.delete('session') }
      return next
    })
  }, [setSearchParams])

  function loadCourses() {
    setLoading(true)
    setFetchError(null)
    getAdminCourses()
      .then(data => { setCourses(data); setLoading(false) })
      .catch(err => { setFetchError(err?.message ?? 'שגיאה בטעינה'); setLoading(false) })
  }

  useEffect(() => { loadCourses() }, [])

  async function handleSave() {
    if (!editingCourse || !editingCourse.title.trim()) return
    setSaving(true)
    try {
      await upsertCourse(editingCourse)
      setEditingCourse(null)
      loadCourses()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteCourse(id)
    setCourses(prev => prev.filter(c => c.id !== id))
    if (selectedCourseId === id) setSelectedCourseId(null)
  }

  async function handleStatusChange(course: Course, status: CourseStatus) {
    await updateCourseStatus(course.id, status)
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status } : c))
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId)

  // If a course is selected, show its sessions manager
  if (selectedCourse) {
    return (
      <div dir="rtl">
        <button
          onClick={() => setSelectedCourseId(null)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ChevronLeft size={16} className="rotate-180" />
          חזרה לרשימת הקורסים
        </button>

        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={24} className="text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">{selectedCourse.title}</h2>
            <p className="text-sm text-gray-500">{selectedCourse.description}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mr-auto ${statusColors[selectedCourse.status]}`}>
            {statusLabels[selectedCourse.status]}
          </span>
        </div>

        <Suspense fallback={<div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
          <SessionsManager course={selectedCourse} />
        </Suspense>
      </div>
    )
  }

  const inputCls = 'w-full bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors'

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">ניהול קורסים</h2>
          <p className="text-sm text-gray-500">צור וערוך קורסים, ונהל את המפגשים בתוך כל קורס.</p>
        </div>
        <button
          onClick={() => setEditingCourse(newCourse(courses.length))}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          קורס חדש
        </button>
      </div>

      {/* Edit/Create form */}
      {editingCourse && (
        <div className="bg-white/5 border border-white/20 rounded-2xl p-5 mb-6 space-y-3">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
            {courses.some(c => c.id === editingCourse.id) ? 'עריכת קורס' : 'קורס חדש'}
          </p>
          <input
            type="text"
            value={editingCourse.title}
            onChange={e => setEditingCourse(prev => prev ? { ...prev, title: e.target.value } : prev)}
            placeholder="שם הקורס"
            className={inputCls}
            aria-describedby={!editingCourse.title.trim() ? 'course-title-error' : undefined}
            aria-invalid={!editingCourse.title.trim() || undefined}
          />
          {!editingCourse.title.trim() && (
            <p id="course-title-error" className="text-red-400 text-xs">שם הקורס הוא שדה חובה</p>
          )}
          <textarea
            value={editingCourse.description}
            onChange={e => setEditingCourse(prev => prev ? { ...prev, description: e.target.value } : prev)}
            placeholder="תיאור הקורס"
            rows={2}
            className={`${inputCls} resize-none`}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">סדר הצגה:</span>
            <input
              type="number"
              value={editingCourse.display_order}
              onChange={e => setEditingCourse(prev => prev ? { ...prev, display_order: Number(e.target.value) } : prev)}
              className="bg-[#0a0a0f] border border-white/20 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-blue-500 w-20"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !editingCourse.title.trim()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Save size={14} />
              {saving ? 'שומר...' : 'שמור'}
            </button>
            <button
              onClick={() => setEditingCourse(null)}
              className="text-sm text-gray-500 hover:text-gray-300 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Courses list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : fetchError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm mb-2">{fetchError}</p>
          <button onClick={loadCourses} className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-4 py-2 rounded-lg transition-colors">
            נסה שוב
          </button>
        </div>
      ) : courses.length === 0 && !editingCourse ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <BookOpen size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-1">אין קורסים עדיין</p>
          <p className="text-gray-600 text-sm">לחץ "קורס חדש" כדי להתחיל</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => (
            <div
              key={course.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-blue-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-white font-bold">{course.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[course.status]}`}>
                      {statusLabels[course.status]}
                    </span>
                  </div>
                  {course.description && (
                    <p className="text-gray-500 text-sm line-clamp-1">{course.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={course.status}
                    onChange={e => handleStatusChange(course, e.target.value as CourseStatus)}
                    className="bg-[#0a0a0f] border border-white/20 text-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                  >
                    <option value="draft">טיוטה</option>
                    <option value="active">פעיל</option>
                    <option value="completed">הסתיים</option>
                  </select>
                  <button
                    onClick={() => setEditingCourse({
                      id: course.id,
                      title: course.title,
                      description: course.description,
                      status: course.status,
                      display_order: course.display_order,
                    })}
                    className="text-gray-500 hover:text-blue-400 transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-xl"
                    aria-label="ערוך קורס"
                    title="ערוך"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setSelectedCourseId(course.id)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    נהל מפגשים
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-2"
                    aria-label="מחק קורס"
                    title="מחק"
                  >
                    <Trash2 size={14} />
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
