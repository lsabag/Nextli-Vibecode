import { SEOHead } from '@/components/shared/SEOHead'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { useAuth } from '@/hooks/useAuth'
import { FomoBanner } from '@/components/landing/FomoBanner'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { SyllabusSection } from '@/components/landing/SyllabusSection'
import { PromptHelperPreview } from '@/components/landing/PromptHelperPreview'
import { StudentProjects } from '@/components/landing/StudentProjects'
import { AdditionalCourses } from '@/components/landing/AdditionalCourses'
import { TeamSection } from '@/components/landing/TeamSection'
import { ContactSection } from '@/components/landing/ContactSection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function LandingPage() {
  const { settings, loading: settingsLoading } = useSystemSettings()
  const { user, profile } = useAuth()

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir="rtl">
      <SEOHead description="קורס אינטנסיבי לפיתוח עם AI - למד לבנות אתרים ואפליקציות בעזרת וייבקוד. שלושה מפגשים, פרויקט אמיתי, קהילה תומכת." />
      {!settingsLoading && !user && settings.fomo_banner_active === 'true' && settings.fomo_text && (
        <FomoBanner
          text={settings.fomo_text}
          variant={settings.fomo_variant}
          endTime={settings.fomo_end_time || undefined}
          ctaText={settings.fomo_cta_text || undefined}
          ctaLink={settings.fomo_cta_link || undefined}
        />
      )}
      <LandingNavbar user={user} profile={profile} settings={settings} />
      <main id="main-content">
      <HeroSection
        settings={settings}
        user={user}
        profile={profile}
      />
      <SyllabusSection settings={settings} />
      <PromptHelperPreview />
      <StudentProjects settings={settings} />
      <AdditionalCourses settings={settings} />
      <TeamSection settings={settings} />
      <ContactSection settings={settings} />
      </main>
      <LandingFooter settings={settings} />
    </div>
  )
}
