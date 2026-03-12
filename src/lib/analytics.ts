/**
 * Google Analytics — uses Google Consent Mode v2.
 * The gtag script is loaded in index.html with consent defaulting to 'denied'.
 * This module updates consent state based on user's cookie choice.
 */

const COOKIE_KEY = 'nextli-cookie-consent'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

/** Grant analytics consent — called when user accepts cookies */
export function loadAnalytics() {
  if (typeof window.gtag !== 'function') return
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
  })
}

/** Revoke analytics consent — called when user declines cookies */
export function disableAnalytics() {
  if (typeof window.gtag !== 'function') return
  window.gtag('consent', 'update', {
    analytics_storage: 'denied',
  })
}

/**
 * Call on app init — if user already accepted cookies in a previous session,
 * grant consent automatically. If declined, keep denied.
 */
export function initAnalyticsFromConsent() {
  const consent = localStorage.getItem(COOKIE_KEY)
  if (consent === 'accepted') {
    loadAnalytics()
  } else if (consent === 'declined') {
    disableAnalytics()
  }
  // If no consent yet — stays 'denied' (the default from index.html)
}
