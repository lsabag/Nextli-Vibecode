import { useState } from 'react'
import { X, Accessibility } from 'lucide-react'

export function AccessibilityStatement() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors underline-offset-4 hover:underline"
        aria-label="הצהרת נגישות"
      >
        <Accessibility size={14} aria-hidden="true" />
        הצהרת נגישות
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-title"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-[#111118] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-8" dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h2 id="a11y-title" className="text-xl font-bold text-white">הצהרת נגישות</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="סגור הצהרת נגישות"
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <p>
                <strong className="text-white">Nextli: וייבקוד</strong> מחויבת להנגשת האתר לאנשים עם מוגבלויות,
                בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ&quot;ח-1998, ותקנות שוויון זכויות
                לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע&quot;ג-2013.
              </p>

              <h3 className="text-white font-semibold text-base">תקן הנגישות</h3>
              <p>
                האתר עומד בדרישות תקן הנגישות הישראלי SI 5568 ברמת AA של הנחיות WCAG 2.1,
                ככל שהדבר מתאפשר מבחינה טכנולוגית.
              </p>

              <h3 className="text-white font-semibold text-base">התאמות הנגישות שבוצעו</h3>
              <ul className="list-disc pr-5 space-y-1">
                <li>ניווט מלא באמצעות מקלדת</li>
                <li>תמיכה בקוראי מסך (NVDA, JAWS, VoiceOver)</li>
                <li>שימוש בתגיות סמנטיות (header, nav, main, footer, article)</li>
                <li>תוויות ARIA לרכיבים אינטראקטיביים</li>
                <li>ניגודיות צבעים לפי תקן WCAG AA</li>
                <li>טקסט חלופי לתמונות ואלמנטים חזותיים</li>
                <li>תמיכה בהגדלת טקסט עד 200%</li>
                <li>קישור &quot;דלג לתוכן הראשי&quot;</li>
                <li>כיבוי אנימציות עבור משתמשים שביקשו (prefers-reduced-motion)</li>
                <li>תמיכה מלאה ב-RTL (ימין לשמאל)</li>
              </ul>

              <h3 className="text-white font-semibold text-base">יצירת קשר בנושא נגישות</h3>
              <p>
                נתקלתם בבעיית נגישות? אנחנו כאן לעזור.
                אנא פנו אלינו ואנו נטפל בפנייתכם בהקדם האפשרי.
              </p>

              <h3 className="text-white font-semibold text-base">תאריך עדכון</h3>
              <p>הצהרת נגישות זו עודכנה לאחרונה בתאריך מרץ 2026.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
