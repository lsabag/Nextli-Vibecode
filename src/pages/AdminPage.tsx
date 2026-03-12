import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { SEOHead } from '@/components/shared/SEOHead'
import {
  LayoutDashboard, Users, GraduationCap, Home, Settings, Menu,
  ChevronDown, ClipboardCheck,
} from 'lucide-react'

const StudentInsights = lazy(() => import('@/components/admin/StudentInsights').then(m => ({ default: m.StudentInsights })))
const WizardManager = lazy(() => import('@/components/admin/WizardManager').then(m => ({ default: m.WizardManager })))
const CoursesManager = lazy(() => import('@/components/admin/CoursesManager').then(m => ({ default: m.CoursesManager })))
const SettingsManager = lazy(() => import('@/components/admin/SettingsManager').then(m => ({ default: m.SettingsManager })))
const SystemHealthCheck = lazy(() => import('@/components/admin/SystemHealthCheck').then(m => ({ default: m.SystemHealthCheck })))
const LandingManager = lazy(() => import('@/components/admin/LandingManager').then(m => ({ default: m.LandingManager })))
const WaitlistManager = lazy(() => import('@/components/admin/WaitlistManager').then(m => ({ default: m.WaitlistManager })))
const PrepManager = lazy(() => import('@/components/admin/PrepManager').then(m => ({ default: m.PrepManager })))
const NotesViewer = lazy(() => import('@/components/admin/NotesViewer').then(m => ({ default: m.NotesViewer })))
const PromptShowcaseManager = lazy(() => import('@/components/admin/PromptShowcaseManager').then(m => ({ default: m.PromptShowcaseManager })))
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))

// ── Navigation structure ─────────────────────────────────────────────────────

type NavItem = {
  id: string
  label: string
  icon: React.ReactNode
  children?: { id: string; label: string }[]
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'דשבורד',
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: 'health',
    label: 'לבדוק',
    icon: <ClipboardCheck size={18} />,
  },
  {
    id: 'students',
    label: 'תלמידים',
    icon: <Users size={18} />,
    children: [
      { id: 'waitlist', label: 'רשימת המתנה' },
      { id: 'insights', label: 'תלמידים רשומים' },
      { id: 'wizard', label: 'שאלון קבלה' },
      { id: 'notes', label: 'הערות תלמידים' },
    ],
  },
  {
    id: 'courses',
    label: 'קורסים',
    icon: <GraduationCap size={18} />,
    children: [
      { id: 'manage', label: 'ניהול קורסים' },
      { id: 'prep', label: 'הכנה לקורס' },
    ],
  },
  {
    id: 'landing',
    label: 'דף הבית',
    icon: <Home size={18} />,
    children: [
      { id: 'landing-content', label: 'תוכן דף הבית' },
      { id: 'prompt-showcase', label: 'סקשן פרומפטים' },
    ],
  },
  {
    id: 'settings',
    label: 'הגדרות',
    icon: <Settings size={18} />,
  },
]

// Flat lookup: child id → parent id
const childToParent = new Map<string, string>()
const allIds = new Set<string>()
for (const item of navItems) {
  allIds.add(item.id)
  if (item.children) {
    for (const child of item.children) {
      childToParent.set(child.id, item.id)
      allIds.add(child.id)
    }
  }
}

// ── Prep tab wrapper ─────────────────────────────────────────────────────────

function PrepTabWrapper() {
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('courses').select('*').then(({ data }: { data: { id: string; title: string }[] | null }) => {
      const list = (data ?? []) as { id: string; title: string }[]
      setCourses(list)
      if (list.length > 0) setSelectedCourseId(list[0].id)
    })
  }, [])

  if (courses.length === 0) {
    return <p className="text-gray-500 text-sm" dir="rtl">אין קורסים במערכת. צרו קורס קודם.</p>
  }

  return (
    <div dir="rtl">
      {courses.length > 1 && (
        <div className="mb-6">
          <label className="text-xs text-gray-400 mb-1 block">בחרו קורס</label>
          <select
            value={selectedCourseId ?? ''}
            onChange={e => setSelectedCourseId(e.target.value)}
            className="bg-[#12121a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500/50"
          >
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      )}
      {selectedCourseId && <PrepManager courseId={selectedCourseId} />}
    </div>
  )
}

// ── Content renderer ─────────────────────────────────────────────────────────

function renderContent(activeId: string) {
  switch (activeId) {
    case 'dashboard':   return <AdminDashboard />
    case 'health':      return <SystemHealthCheck />
    case 'waitlist':    return <WaitlistManager />
    case 'insights':    return <StudentInsights />
    case 'wizard':      return <WizardManager />
    case 'notes':       return <NotesViewer />
    case 'manage':      return <CoursesManager />
    case 'prep':        return <PrepTabWrapper />
    case 'landing-content': return <LandingManager />
    case 'prompt-showcase': return <PromptShowcaseManager />
    case 'settings':    return <SettingsManager />
    default:            return <AdminDashboard />
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Resolve active page from URL
  const resolveActive = useCallback((): string => {
    const tab = searchParams.get('tab')
    const sub = searchParams.get('sub')
    // New format: ?tab=students&sub=wizard → wizard
    if (sub && allIds.has(sub)) return sub
    // Legacy format: ?tab=wizard → wizard
    if (tab && allIds.has(tab)) return tab
    // Legacy main group without sub: ?tab=students → first child
    if (tab) {
      const item = navItems.find(n => n.id === tab)
      if (item?.children) return item.children[0].id
    }
    return 'dashboard'
  }, [searchParams])

  const activeId = resolveActive()

  // Auto-expand the group containing the active item & scroll to top
  useEffect(() => {
    const parentId = childToParent.get(activeId)
    if (parentId) {
      setExpandedGroups(prev => {
        if (prev.has(parentId)) return prev
        const next = new Set(prev)
        next.add(parentId)
        return next
      })
    }
    // Reset scroll when switching pages
    document.getElementById('main-content')?.scrollTo(0, 0)
  }, [activeId])

  const navigate = useCallback((id: string) => {
    const parentId = childToParent.get(id)
    if (parentId) {
      setSearchParams({ tab: parentId, sub: id })
    } else {
      setSearchParams({ tab: id })
    }
    setSidebarOpen(false)
  }, [setSearchParams])

  function toggleGroup(groupId: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const isChildActive = (item: NavItem) =>
    item.children?.some(c => c.id === activeId) ?? false

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex" dir="rtl">
      <SEOHead title="לוח ניהול" noindex />

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 right-4 z-50 md:hidden bg-[#111118] border border-white/10 rounded-xl p-2.5 text-gray-400 hover:text-white transition-colors shadow-lg"
        aria-label="פתח תפריט"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-60 bg-[#0d0d14] border-l border-white/10 flex flex-col
        transition-transform duration-300 md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10">
          <span className="text-lg font-black text-white">
            Nextli: <span className="text-blue-400">ניהול</span>
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map(item => {
            const hasChildren = !!item.children
            const isExpanded = expandedGroups.has(item.id)
            const isActive = activeId === item.id || isChildActive(item)

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleGroup(item.id)
                    } else {
                      navigate(item.id)
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive && !hasChildren
                      ? 'bg-blue-600/15 text-blue-400'
                      : isActive && hasChildren
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="flex-1 text-right">{item.label}</span>
                  {hasChildren && (
                    <ChevronDown size={14} className={`shrink-0 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {/* Children */}
                {hasChildren && isExpanded && (
                  <div className="mt-1 mr-5 space-y-0.5">
                    {item.children!.map(child => (
                      <button
                        key={child.id}
                        onClick={() => navigate(child.id)}
                        className={`w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          activeId === child.id
                            ? 'bg-blue-600/15 text-blue-400'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors block mb-2"
          >
            צפה בדף הבית
          </a>
          <p className="text-[10px] text-gray-600 truncate mb-2">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            יציאה
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto" id="main-content">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pt-16 md:pt-8">
          <Suspense fallback={<div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
            {renderContent(activeId)}
          </Suspense>
        </div>
      </main>
    </div>
  )
}
