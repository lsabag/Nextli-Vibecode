import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { trackEvent } from '@/lib/analytics'
import type { SystemSettingsMap, UserProfile } from '@/types'
import type { AuthUser } from '@/lib/supabase/client'

type Props = {
  settings: SystemSettingsMap
  user: AuthUser | null
  profile: UserProfile | null
}

const defaultFeatureCards = [
  { icon: '⚡', label: 'AI-First Development', desc: 'בונים עם AI מהיום הראשון' },
  { icon: '🛠️', label: 'Vibe Coding Matrix', desc: 'מתודולוגיה ייחודית שלנו' },
  { icon: '🚀', label: 'Ship in 3 Sessions', desc: 'מוצר אמיתי תוך שבועיים' },
  { icon: '💬', label: 'Prompt Engineering', desc: 'לדבר עם AI ב-Spec & Prompt' },
]

function parseJSON<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback
  try { return JSON.parse(json) } catch { return fallback }
}

function getPersonalAreaRoute(profile: UserProfile | null): string {
  if (profile?.role === 'admin') return '/admin'
  if (!profile?.onboarding_completed) return '/onboarding'
  return '/workspace'
}

export function HeroSection({ settings, user, profile }: Props) {
  const isLoggedIn = !!user
  const ctaRoute = isLoggedIn ? getPersonalAreaRoute(profile) : '/intake'
  const featureCards = parseJSON(settings.hero_features, defaultFeatureCards)
  const badgeText = settings.hero_badge_text || 'סטודיו אינטנסיבי (hands-on) — Vibe Coding'
  const badgeLink = settings.hero_badge_link || ''

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" dir="rtl" aria-labelledby="hero-heading">

      {/* ── Background atmosphere ── */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.22) 0%, transparent 70%)' }} />
        <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 65%)' }} />
        <div className="absolute top-[30%] left-[-5%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.1) 0%, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(10,10,15,0.7) 100%)' }} />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-36 pb-24 text-center">

        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.45 }}
        >
          {badgeLink ? (
            <a
              href={badgeLink}
              target={badgeLink.startsWith('http') ? '_blank' : undefined}
              rel={badgeLink.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-2.5 rounded-full px-5 py-2 mb-8 border hover:scale-[1.03] transition-transform"
              style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(124,58,237,0.12))',
                borderColor: 'rgba(99,102,241,0.35)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-blue-300 text-sm font-bold tracking-wide">{badgeText}</span>
            </a>
          ) : (
            <div
              className="inline-flex items-center gap-2.5 rounded-full px-5 py-2 mb-8 border"
              style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(124,58,237,0.12))',
                borderColor: 'rgba(99,102,241,0.35)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-blue-300 text-sm font-bold tracking-wide">{badgeText}</span>
            </div>
          )}
        </motion.div>

        {/* Main headline */}
        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 45 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-black leading-[1.06] mb-6 tracking-tight"
          style={{ fontSize: 'clamp(2.4rem, 7vw, 4.5rem)' }}
        >
          <span className="text-white block drop-shadow-[0_2px_40px_rgba(37,99,235,0.35)]">
            {settings.hero_headline ?? 'מרעיון למוצר'}
          </span>
          <span
            className="block"
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 45%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 30px rgba(96,165,250,0.4))',
            }}
          >
            {settings.hero_subheadline ?? 'תוך 3 מפגשים'}
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          {settings.hero_description ?? 'לומדים לבנות מוצרים דיגיטליים אמיתיים עם AI — בלי ניסיון קודם בקוד'}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.55 }}
          className="flex flex-col sm:flex-row justify-center gap-4 mb-4"
        >
          {/* Primary CTA */}
          <Link
            to={ctaRoute}
            onClick={() => trackEvent('cta_click', { cta_type: isLoggedIn ? 'personal_area' : 'signup' })}
            className="group relative inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg text-white overflow-hidden transition-transform hover:scale-[1.04] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
              boxShadow: '0 0 40px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            <span className="relative z-10">
              {isLoggedIn
                ? 'אזור האישי שלי'
                : (settings.hero_cta_primary || 'הצטרף עכשיו')
              }
            </span>
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}
            />
          </Link>

          {/* Secondary CTA */}
          <a
            href="#syllabus"
            onClick={() => trackEvent('cta_click', { cta_type: 'view_syllabus' })}
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg text-gray-300 hover:text-white transition-all hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.15)' }}
          >
            {settings.hero_cta_secondary || 'ראה את המסלול'}
          </a>
        </motion.div>

        <div className="mb-16" />

        {/* Feature cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featureCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group rounded-2xl p-5 text-center cursor-default transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              whileHover={{
                background: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(99,102,241,0.3)',
              }}
            >
              <div className="text-3xl mb-2.5" aria-hidden="true">{card.icon}</div>
              <h3 className="text-white text-sm font-bold mb-1" lang="en">{card.label}</h3>
              <p className="text-gray-400 text-xs leading-snug">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
