/**
 * Google Analytics — loaded dynamically only after user consents to cookies.
 * Replace GA_MEASUREMENT_ID with your real ID when deploying.
 */

const GA_ID = 'G-WRL0SR0JW4'
const COOKIE_KEY = 'nextli-cookie-consent'

let loaded = false

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

export function loadAnalytics() {
  if (loaded) return
  if (!GA_ID || GA_ID === 'GA_MEASUREMENT_ID') return // skip placeholder
  loaded = true

  // Inject gtag.js script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID)
}

export function disableAnalytics() {
  if (!GA_ID || GA_ID === 'GA_MEASUREMENT_ID') return
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true
}

/**
 * Call on app init — if user already accepted cookies in a previous session,
 * load GA automatically. If declined, disable it.
 */
export function initAnalyticsFromConsent() {
  const consent = localStorage.getItem(COOKIE_KEY)
  if (consent === 'accepted') {
    loadAnalytics()
  } else if (consent === 'declined') {
    disableAnalytics()
  }
  // If no consent yet — do nothing, wait for the banner
}
