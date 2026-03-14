import { Link } from 'react-router-dom'
import { SEOHead } from '@/components/shared/SEOHead'
import { ArrowRight } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#0a0a0f] text-white" dir="rtl">
      <SEOHead title="מדיניות פרטיות" description="מדיניות הפרטיות של Nextli וייבקוד" />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mb-8 transition-colors">
          <ArrowRight size={14} />
          חזרה לדף הבית
        </Link>

        <h1 className="text-3xl font-black mb-8">מדיניות פרטיות</h1>
        <p className="text-gray-400 text-sm mb-6">עדכון אחרון: מרץ 2026</p>

        <div className="space-y-6 text-gray-300 leading-relaxed">
          <p>
            Nextli וייבקוד מכבדת את פרטיותכם ופועלת בהתאם לחוק הגנת הפרטיות, התשמ״א-1981.
          </p>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">מידע שאנו אוספים</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>שם, דוא״ל וטלפון — בעת הרשמה לקורס או לרשימת המתנה</li>
              <li>תשובות לשאלון ההתאמה</li>
              <li>מידע טכני ושימוש באתר — באמצעות עוגיות ו-Google Analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">שימוש במידע</h2>
            <p>המידע משמש לניהול חשבונכם, התאמת מסלול לימודי, שליחת עדכונים, ושיפור האתר.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">עוגיות</h2>
            <p>
              האתר משתמש בעוגיות הכרחיות (אימות), עוגיות העדפות (נגישות), ועוגיות אנליטיקה (Google Analytics).
              ניתן לנהל העדפות דרך באנר העוגיות או הגדרות הדפדפן.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">צדדים שלישיים</h2>
            <p>
              איננו מוכרים מידע אישי. המידע מעובד על ידי ספקי שירות בלבד: Supabase (אחסון ואימות),
              Google Analytics (אנליטיקה), ו-Vercel (אירוח).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">זכויותיכם</h2>
            <p>
              באפשרותכם לעיין, לתקן או למחוק את המידע האישי שלכם, ולהתנגד לדיוור ישיר.
              לפניות: privacy@nextli.co.il
            </p>
          </section>

          <section>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 text-sm">
              <p><strong className="text-white">דוא״ל:</strong> privacy@nextli.co.il</p>
              <p><strong className="text-white">טלפון:</strong> 055-29-59-555</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
