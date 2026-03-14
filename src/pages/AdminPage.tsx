import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { SEOHead } from '@/components/shared/SEOHead'
import { AdminDirtyProvider, UnsavedChangesDialog, useAdminDirty } from '@/hooks/useAdminDirty'
import {
  LayoutDashboard, Users, GraduationCap, Home, Settings, Menu,
  ChevronDown, ClipboardCheck, Search, X, Monitor, Share2, ListOrdered, PackagePlus,
} from 'lucide-react'
import { getSettingsSearchIndex } from '@/components/admin/SettingsManager'
import { updateSystemSetting } from '@/lib/supabase/queries/admin'
import type { NavOrderItem } from '@/components/admin/NavOrderManager'

const StudentInsights = lazy(() => import('@/components/admin/StudentInsights').then(m => ({ default: m.StudentInsights })))
const WizardManager = lazy(() => import('@/components/admin/WizardManager').then(m => ({ default: m.WizardManager })))
const CoursesManager = lazy(() => import('@/components/admin/CoursesManager').then(m => ({ default: m.CoursesManager })))
const SettingsManager = lazy(() => import('@/components/admin/SettingsManager').then(m => ({ default: m.SettingsManager })))
const LandingPageSettings = lazy(() => import('@/components/admin/SettingsManager').then(m => ({ default: m.LandingPageSettings })))
const StudentAreaSettings = lazy(() => import('@/components/admin/SettingsManager').then(m => ({ default: m.StudentAreaSettings })))
const SystemHealthCheck = lazy(() => import('@/components/admin/SystemHealthCheck').then(m => ({ default: m.SystemHealthCheck })))
const LandingManager = lazy(() => import('@/components/admin/LandingManager').then(m => ({ default: m.LandingManager })))
const WaitlistManager = lazy(() => import('@/components/admin/WaitlistManager').then(m => ({ default: m.WaitlistManager })))
const PrepManager = lazy(() => import('@/components/admin/PrepManager').then(m => ({ default: m.PrepManager })))
const NotesViewer = lazy(() => import('@/components/admin/NotesViewer').then(m => ({ default: m.NotesViewer })))
const PromptShowcaseManager = lazy(() => import('@/components/admin/PromptShowcaseManager').then(m => ({ default: m.PromptShowcaseManager })))
const IntakeManager = lazy(() => import('@/components/admin/IntakeManager').then(m => ({ default: m.IntakeManager })))
const FeedbackViewer = lazy(() => import('@/components/admin/FeedbackViewer').then(m => ({ default: m.FeedbackViewer })))
const ImageAltAudit = lazy(() => import('@/components/admin/ImageAltAudit').then(m => ({ default: m.ImageAltAudit })))
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const ShareSettingsManager = lazy(() => import('@/components/admin/ShareSettingsManager').then(m => ({ default: m.ShareSettingsManager })))
const NavOrderManager = lazy(() => import('@/components/admin/NavOrderManager').then(m => ({ default: m.NavOrderManager })))
const ContentTemplatesManager = lazy(() => import('@/components/admin/ContentTemplatesManager').then(m => ({ default: m.ContentTemplatesManager })))
const ContactMessagesManager = lazy(() => import('@/components/admin/ContactMessagesManager').then(m => ({ default: m.ContactMessagesManager })))

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
    children: [
      { id: 'health-check', label: 'בדיקת מערכת' },
      { id: 'image-alt', label: 'ALT תמונות' },
    ],
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
      { id: 'contact-messages', label: 'פניות ולידים' },
    ],
  },
  {
    id: 'courses',
    label: 'קורסים',
    icon: <GraduationCap size={18} />,
    children: [
      { id: 'manage', label: 'ניהול קורסים' },
      { id: 'content-templates', label: 'ספריית תבניות' },
      { id: 'prep', label: 'הכנה לקורס' },
    ],
  },
  {
    id: 'landing',
    label: 'דף הבית',
    icon: <Home size={18} />,
    children: [
      { id: 'landing-settings', label: 'הגדרות דף הבית' },
      { id: 'landing-content', label: 'תוכן דינמי' },
      { id: 'prompt-showcase', label: 'סקשן פרומפטים' },
      { id: 'share-settings', label: 'הגדרות שיתוף' },
    ],
  },
  {
    id: 'student-area',
    label: 'אזור תלמידים',
    icon: <Monitor size={18} />,
    children: [
      { id: 'student-overview', label: 'סקירה כללית' },
      { id: 'student-workspace', label: 'אזור למידה' },
      { id: 'student-wizard', label: 'שאלון קבלה' },
      { id: 'student-intake', label: 'טופס הרשמה' },
      { id: 'student-intake-questions', label: 'שאלות הטופס' },
      { id: 'student-prep', label: 'הכנה לקורס' },
      { id: 'student-feedback', label: 'פידבק תלמידים' },
    ],
  },
  {
    id: 'settings',
    label: 'הגדרות',
    icon: <Settings size={18} />,
    children: [
      { id: 'general-settings', label: 'הגדרות כלליות' },
      { id: 'nav-order', label: 'סידור תפריט' },
    ],
  },
]

// Flat lookup helpers — built from current navItems (default)
function buildNavLookups(items: NavItem[]) {
  const childToParent = new Map<string, string>()
  const allIds = new Set<string>()
  for (const item of items) {
    allIds.add(item.id)
    if (item.children) {
      for (const child of item.children) {
        childToParent.set(child.id, item.id)
        allIds.add(child.id)
      }
    }
  }
  return { childToParent, allIds }
}

// Default lookups (used at module level for search index etc.)
const { childToParent, allIds } = buildNavLookups(navItems)

// Icon map — maps group id to its icon element
const NAV_ICONS: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={18} />,
  health: <ClipboardCheck size={18} />,
  students: <Users size={18} />,
  courses: <GraduationCap size={18} />,
  landing: <Home size={18} />,
  'student-area': <Monitor size={18} />,
  settings: <Settings size={18} />,
}

// Nav config stored in system_settings as JSON
type NavConfig = {
  id: string
  label?: string
  hidden?: boolean
  children?: { id: string; label?: string; hidden?: boolean }[]
}[]

function applyNavConfig(defaults: NavItem[], config: NavConfig | null): NavItem[] {
  if (!config) return defaults
  const defaultMap = new Map(defaults.map(d => [d.id, d]))
  const result: NavItem[] = []
  const seen = new Set<string>()

  for (const cfg of config) {
    const def = defaultMap.get(cfg.id)
    if (!def) continue
    seen.add(cfg.id)

    let children = def.children
    if (cfg.children && def.children) {
      const childMap = new Map(def.children.map(c => [c.id, c]))
      const orderedChildren: NavItem['children'] = []
      const seenChildren = new Set<string>()
      for (const cc of cfg.children) {
        const dc = childMap.get(cc.id)
        if (!dc) continue
        seenChildren.add(cc.id)
        if (!cc.hidden) {
          orderedChildren.push({ id: dc.id, label: cc.label || dc.label })
        }
      }
      // Add any new children not in config
      for (const dc of def.children) {
        if (!seenChildren.has(dc.id)) orderedChildren.push(dc)
      }
      children = orderedChildren
    }

    if (!cfg.hidden) {
      result.push({
        ...def,
        label: cfg.label || def.label,
        icon: NAV_ICONS[cfg.id] || def.icon,
        children,
      })
    }
  }

  // Add any new items not in config
  for (const def of defaults) {
    if (!seen.has(def.id)) result.push(def)
  }

  return result
}

// ── Search index ─────────────────────────────────────────────────────────────

type SearchResult = {
  label: string
  /** Optional secondary line — shows the actual value from the site */
  valuePreview?: string
  sectionTitle: string
  sectionIcon: string
  navigateTo: string // admin tab id
}

type SiteContent = {
  settings: Record<string, string>
  courses: { id: string; title: string; description: string }[]
  additionalCourses: { id: string; title: string; description: string; badge: string }[]
  teamMembers: { id: string; name: string; role: string }[]
}

function buildSearchIndex(site?: SiteContent): SearchResult[] {
  const results: SearchResult[] = []

  // Settings entries (with live values)
  for (const entry of getSettingsSearchIndex()) {
    const navigateTo = entry.mode === 'landing' ? 'landing-settings' : entry.mode === 'student' ? 'student-workspace' : 'settings'
    const val = site?.settings[entry.key]
    results.push({
      label: entry.label,
      valuePreview: val ? (val.length > 60 ? val.slice(0, 60) + '…' : val) : undefined,
      sectionTitle: entry.sectionTitle,
      sectionIcon: entry.sectionIcon,
      navigateTo,
    })
  }

  // Course titles & descriptions
  if (site?.courses) {
    for (const c of site.courses) {
      if (c.title) results.push({ label: c.title, valuePreview: c.description || undefined, sectionTitle: 'קורסים', sectionIcon: '🎓', navigateTo: 'manage' })
    }
  }

  // Additional courses
  if (site?.additionalCourses) {
    for (const c of site.additionalCourses) {
      if (c.title) results.push({ label: c.title, valuePreview: c.description || undefined, sectionTitle: 'קורסים נוספים (דף הבית)', sectionIcon: '📚', navigateTo: 'landing-content' })
    }
  }

  // Team members
  if (site?.teamMembers) {
    for (const m of site.teamMembers) {
      if (m.name) results.push({ label: m.name, valuePreview: m.role || undefined, sectionTitle: 'חברי צוות (דף הבית)', sectionIcon: '👥', navigateTo: 'landing-content' })
    }
  }

  // Nav pages
  for (const item of navItems) {
    if (item.children) {
      for (const child of item.children) {
        results.push({ label: child.label, sectionTitle: item.label, sectionIcon: '', navigateTo: child.id })
      }
    } else {
      results.push({ label: item.label, sectionTitle: '', sectionIcon: '', navigateTo: item.id })
    }
  }

  return results
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

// ── Student area wrapper with preview links ──────────────────────────────

type StudentPageCard = {
  label: string
  desc: string
  previewHref: string | null
  adminTab: string
  icon: string
  color: string
}

const STUDENT_CARDS: Omit<StudentPageCard, 'previewHref'>[] = [
  { label: 'אזור למידה', desc: 'הממשק הראשי של התלמיד — מפגשים, תוכן, הערות', adminTab: 'student-workspace', icon: '📖', color: 'blue' },
  { label: 'שאלון קבלה', desc: 'שאלון הכרות לתלמידים חדשים לפני הכניסה', adminTab: 'student-wizard', icon: '👋', color: 'purple' },
  { label: 'טופס הרשמה', desc: 'נרשמים + עריכת שאלות הטופס', adminTab: 'student-intake', icon: '📝', color: 'green' },
  { label: 'הכנה לקורס', desc: 'משימות הכנה לפני תחילת הקורס', adminTab: 'student-prep', icon: '🎯', color: 'amber' },
  { label: 'פידבק תלמידים', desc: 'דירוגים וחוות דעת על מפגשים', adminTab: 'student-feedback', icon: '💬', color: 'purple' },
]

const previewColors: Record<string, { bg: string; border: string; hover: string }> = {
  blue:   { bg: 'bg-blue-500/5',   border: 'border-blue-500/20', hover: 'hover:border-blue-500/40 hover:bg-blue-500/10' },
  purple: { bg: 'bg-purple-500/5', border: 'border-purple-500/20', hover: 'hover:border-purple-500/40 hover:bg-purple-500/10' },
  green:  { bg: 'bg-green-500/5',  border: 'border-green-500/20', hover: 'hover:border-green-500/40 hover:bg-green-500/10' },
  amber:  { bg: 'bg-amber-500/5',  border: 'border-amber-500/20', hover: 'hover:border-amber-500/40 hover:bg-amber-500/10' },
}

function StudentAreaOverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [firstCourseId, setFirstCourseId] = useState<string | null>(null)
  useEffect(() => {
    supabase.from('courses').select('id').order('display_order', { ascending: true }).limit(1)
      .then(({ data }: { data: { id: string }[] | null }) => {
        if (data?.[0]) setFirstCourseId(data[0].id)
      })
  }, [])

  const previewHrefs: Record<string, string | null> = {
    'student-workspace': '/workspace',
    'student-wizard': '/onboarding',
    'student-intake': '/intake',
    'student-prep': firstCourseId ? `/preparation/${firstCourseId}` : null,
    'student-feedback': null,
  }

  return (
    <div dir="rtl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-1">אזור תלמידים</h2>
        <p className="text-sm text-gray-500">ניהול כל העמודים שהתלמיד רואה — לחצו על כרטיס כדי לנהל את התוכן</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {STUDENT_CARDS.map(p => {
          const c = previewColors[p.color] ?? previewColors.blue
          const preview = previewHrefs[p.adminTab]
          return (
            <button
              key={p.adminTab}
              onClick={() => onNavigate(p.adminTab)}
              className={`group relative text-right ${c.bg} border ${c.border} ${c.hover} rounded-xl p-4 transition-all duration-200`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">{p.icon}</span>
                <span className="text-sm font-semibold text-white">{p.label}</span>
                <span className="mr-auto flex items-center gap-1.5">
                  {preview && (
                    <a
                      href={preview}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-gray-600 hover:text-blue-400 transition-colors"
                      title="תצוגה מקדימה"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{p.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-gray-600 font-medium">טקסטים והגדרות</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <StudentAreaSettings />
    </div>
  )
}

// ── Content renderer ─────────────────────────────────────────────────────────

function renderContent(activeId: string, onNavigate: (tab: string) => void) {
  switch (activeId) {
    case 'dashboard':         return <AdminDashboard />
    case 'health':            return <SystemHealthCheck />
    case 'health-check':      return <SystemHealthCheck />
    case 'image-alt':         return <ImageAltAudit />
    case 'waitlist':          return <WaitlistManager />
    case 'insights':          return <StudentInsights />
    case 'wizard':            return <WizardManager />
    case 'notes':             return <NotesViewer />
    case 'contact-messages':  return <ContactMessagesManager />
    case 'manage':              return <CoursesManager />
    case 'content-templates':   return <ContentTemplatesManager />
    case 'prep':                return <PrepTabWrapper />
    case 'student-overview':          return <StudentAreaOverview onNavigate={onNavigate} />
    case 'student-workspace':         return <StudentAreaSettings />
    case 'student-wizard':            return <WizardManager />
    case 'student-intake':            return <WaitlistManager />
    case 'student-intake-questions':  return <IntakeManager />
    case 'student-prep':              return <PrepTabWrapper />
    case 'student-feedback':          return <FeedbackViewer />
    case 'landing-settings':  return <LandingPageSettings />
    case 'landing-content':   return <LandingManager />
    case 'prompt-showcase':   return <PromptShowcaseManager />
    case 'share-settings':    return <ShareSettingsManager />
    case 'settings':          return <SettingsManager />
    case 'general-settings':  return <SettingsManager />
    default:                  return <AdminDashboard />
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  return (
    <AdminDirtyProvider>
      <AdminPageInner />
    </AdminDirtyProvider>
  )
}

function AdminPageInner() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [siteContent, setSiteContent] = useState<SiteContent | undefined>()
  const [navConfig, setNavConfig] = useState<NavConfig | null>(null)
  const [navConfigOriginal, setNavConfigOriginal] = useState<NavConfig | null>(null)

  // Load site content for extended search + nav config
  useEffect(() => {
    Promise.all([
      supabase.from('system_settings').select('*'),
      supabase.from('courses').select('*'),
      supabase.from('additional_courses').select('*'),
      supabase.from('team_members').select('*'),
    ]).then(([settingsRes, coursesRes, addCoursesRes, teamRes]) => {
      const settings: Record<string, string> = {}
      for (const row of (settingsRes.data ?? []) as { key: string; value: string }[]) {
        settings[row.key] = row.value
      }
      setSiteContent({
        settings,
        courses: (coursesRes.data ?? []) as SiteContent['courses'],
        additionalCourses: (addCoursesRes.data ?? []) as SiteContent['additionalCourses'],
        teamMembers: (teamRes.data ?? []) as SiteContent['teamMembers'],
      })
      // Load nav config
      if (settings.admin_nav_config) {
        try {
          const parsed = JSON.parse(settings.admin_nav_config) as NavConfig
          setNavConfig(parsed)
          setNavConfigOriginal(parsed)
        } catch { /* invalid JSON — use defaults */ }
      }
    })
  }, [])

  // Effective nav items (defaults + config overrides)
  const effectiveNav = useMemo(() => applyNavConfig(navItems, navConfig), [navConfig])
  const effectiveLookups = useMemo(() => buildNavLookups(effectiveNav), [effectiveNav])

  const searchIndex = useMemo(() => buildSearchIndex(siteContent), [siteContent])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.trim().toLowerCase()
    return searchIndex.filter(r =>
      r.label.toLowerCase().includes(q) ||
      r.sectionTitle.toLowerCase().includes(q) ||
      (r.valuePreview && r.valuePreview.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [searchQuery, searchIndex])

  // Resolve active page from URL
  const resolveActive = useCallback((): string => {
    const tab = searchParams.get('tab')
    const sub = searchParams.get('sub')
    // New format: ?tab=students&sub=wizard → wizard
    if (sub && effectiveLookups.allIds.has(sub)) return sub
    // Legacy format: ?tab=wizard → wizard
    if (tab && effectiveLookups.allIds.has(tab)) return tab
    // Also check default allIds for backward compat
    if (sub && allIds.has(sub)) return sub
    if (tab && allIds.has(tab)) return tab
    // Legacy main group without sub: ?tab=students → first child
    if (tab) {
      const item = effectiveNav.find(n => n.id === tab)
      if (item?.children) return item.children[0].id
    }
    return 'dashboard'
  }, [searchParams, effectiveLookups, effectiveNav])

  const activeId = resolveActive()

  // Auto-expand the group containing the active item & scroll to top
  useEffect(() => {
    const parentId = effectiveLookups.childToParent.get(activeId) || childToParent.get(activeId)
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
  }, [activeId, effectiveLookups])

  const dirtyCtx = useAdminDirty()

  const doNavigate = useCallback((id: string) => {
    const parentId = effectiveLookups.childToParent.get(id) || childToParent.get(id)
    if (parentId) {
      setSearchParams({ tab: parentId, sub: id })
    } else {
      setSearchParams({ tab: id })
    }
    setSidebarOpen(false)
    setSearchQuery('')
    setSearchFocused(false)
  }, [setSearchParams, effectiveLookups])

  const navigate = useCallback((id: string) => {
    dirtyCtx.confirmNavigation(() => doNavigate(id))
  }, [dirtyCtx, doNavigate])

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

  // ── Nav order management ──────────────────────────────────────────
  const navOrderItems: NavOrderItem[] = useMemo(() => {
    // Build from current config or defaults
    const source = navConfig || navItems.map(item => ({
      id: item.id,
      label: item.label,
      hidden: false,
      children: item.children?.map(c => ({ id: c.id, label: c.label, hidden: false })),
    }))
    // Ensure all defaults are represented
    const ids = new Set(source.map(s => s.id))
    const result = [...source]
    for (const def of navItems) {
      if (!ids.has(def.id)) {
        result.push({
          id: def.id,
          label: def.label,
          hidden: false,
          children: def.children?.map(c => ({ id: c.id, label: c.label, hidden: false })),
        })
      }
    }
    return result as NavOrderItem[]
  }, [navConfig])

  const [navOrderLocal, setNavOrderLocal] = useState<NavOrderItem[] | null>(null)
  const navOrderDisplay = navOrderLocal ?? navOrderItems
  const navOrderDirty = navOrderLocal !== null && JSON.stringify(navOrderLocal) !== JSON.stringify(navOrderItems)

  function handleNavOrderChange(items: NavOrderItem[]) {
    setNavOrderLocal(items)
  }

  async function handleNavOrderSave(items: NavOrderItem[]) {
    const config: NavConfig = items.map(item => ({
      id: item.id,
      label: item.label,
      hidden: item.hidden,
      children: item.children?.map(c => ({ id: c.id, label: c.label, hidden: c.hidden })),
    }))
    await updateSystemSetting('admin_nav_config', JSON.stringify(config))
    setNavConfig(config)
    setNavConfigOriginal(config)
    setNavOrderLocal(null)
  }

  function handleNavOrderReset() {
    setNavOrderLocal(null)
    // Reset to defaults
    if (navConfigOriginal) {
      setNavConfig(null)
      updateSystemSetting('admin_nav_config', '')
    }
  }

  return (
    <div className="h-screen bg-[#0a0a0f] flex overflow-hidden" dir="rtl">
      <SEOHead title="לוח ניהול" noindex />
      <UnsavedChangesDialog />

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

      {/* Sidebar — fixed width, full height, no scroll with content */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-60 bg-[#0d0d14] border-l border-white/10 flex flex-col shrink-0
        transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10">
          <span className="text-lg font-black text-white">
            Nextli: <span className="text-blue-400">ניהול</span>
          </span>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-1 relative">
          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="חיפוש טקסט, הגדרה, קורס..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pr-8 pl-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-colors"
              dir="rtl"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute right-3 left-3 top-full mt-1 z-50 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  onMouseDown={() => navigate(result.navigateTo)}
                  className="w-full text-right px-3 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                >
                  <div className="text-xs text-white font-medium">{result.label}</div>
                  {result.valuePreview && (
                    <div className="text-[10px] text-gray-600 mt-0.5 truncate" dir="rtl">"{result.valuePreview}"</div>
                  )}
                  <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                    {result.sectionIcon && <span>{result.sectionIcon}</span>}
                    {result.sectionTitle}
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchFocused && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute right-3 left-3 top-full mt-1 z-50 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl px-3 py-3">
              <p className="text-xs text-gray-500 text-center">לא נמצאו תוצאות</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {effectiveNav.map(item => {
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

      {/* Main content — scrolls independently */}
      <main className="flex-1 overflow-y-auto h-screen" id="main-content">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pt-16 md:pt-8">
          <Suspense fallback={<div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
            {activeId === 'nav-order' ? (
              <NavOrderManager
                items={navOrderDisplay}
                onChange={handleNavOrderChange}
                onSave={handleNavOrderSave}
                onReset={handleNavOrderReset}
                dirty={navOrderDirty}
              />
            ) : (
              renderContent(activeId, navigate)
            )}
          </Suspense>
        </div>
      </main>
    </div>
  )
}
