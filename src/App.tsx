import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { AccessibilityWidget } from '@/components/shared/AccessibilityWidget'
import { CookieConsent } from '@/components/shared/CookieConsent'
import type { UserProfile } from '@/types'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))
const WorkspacePage = lazy(() => import('@/pages/WorkspacePage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const IntakePage = lazy(() => import('@/pages/IntakePage'))
const AccessibilityPage = lazy(() => import('@/pages/AccessibilityPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const PreparationPage = lazy(() => import('@/pages/PreparationPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]" dir="rtl">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" role="status">
        <span className="sr-only">טוען...</span>
      </div>
    </div>
  )
}

function getPostLoginRedirect(profile: UserProfile | null): string {
  if (!profile) return '/onboarding'
  if (profile.role === 'admin') return '/admin'
  if (!profile.onboarding_completed) return '/onboarding'
  return '/workspace'
}

export default function App() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  return (
    <BrowserRouter>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[10000] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        דלג לתוכן הראשי
      </a>
      <AccessibilityWidget />
      <CookieConsent />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/preparation/:courseId" element={<PreparationPage />} />
          <Route
            path="/login"
            element={
              user
                ? <Navigate to={getPostLoginRedirect(profile)} replace />
                : <LoginPage />
            }
          />

          {/* Protected - any authenticated user */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute user={user}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected - must be paid */}
          <Route
            path="/workspace"
            element={
              <ProtectedRoute user={user} profile={profile} requirePaid>
                <WorkspacePage />
              </ProtectedRoute>
            }
          />

          {/* Protected - admin only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute user={user} profile={profile} requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
