import { Link } from 'react-router-dom'
import { SEOHead } from '@/components/shared/SEOHead'
import { ArrowRight } from 'lucide-react'

export default function AccessibilityPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#0a0a0f] text-white" dir="rtl">
      <SEOHead title="הצהרת נגישות" description="הצהרת הנגישות של Nextli וייבקוד" />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mb-8 transition-colors">
          <ArrowRight size={14} />
          חזרה לדף הבית
        </Link>

        <h1 className="text-3xl font-black mb-8">הצהרת נגישות</h1>
        <p className="text-gray-400 text-sm mb-6">עדכון אחרון: מרץ 2026</p>

        <div className="space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">מחויבותנו לנגישות</h2>
            <p>
              Nextli וייבקוד מחויבת להנגיש את אתר האינטרנט שלה לכלל האוכלוסייה, לרבות אנשים עם מוגבלויות,
              בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ״ח-1998 ולתקנות שוויון זכויות לאנשים עם מוגבלות
              (התאמות נגישות לשירות), התשע״ג-2013, ובהתאם לתקן הישראלי ת״י 5568 המבוסס על הנחיות WCAG 2.0 ברמת AA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">מה עשינו כדי להנגיש את האתר?</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>התאמה לקוראי מסך (screen readers) באמצעות תגיות ARIA ומבנה סמנטי תקין</li>
              <li>ניווט מלא באמצעות מקלדת בלבד</li>
              <li>קישור &quot;דלג לתוכן הראשי&quot; בכל עמוד</li>
              <li>ניגודיות צבעים בהתאם לדרישות WCAG AA (יחס 4.5:1 לטקסט)</li>
              <li>תמיכה בהגדלת טקסט עד 130% ללא אובדן תוכן</li>
              <li>תמיכה במצב ניגודיות גבוהה</li>
              <li>הדגשת קישורים לצורך זיהוי קל</li>
              <li>תמיכה בהעדפת תנועה מופחתת (prefers-reduced-motion)</li>
              <li>תיאור חלופי (alt) לתמונות</li>
              <li>כותרות היררכיות תקינות (h1, h2, h3...)</li>
              <li>טפסים עם תוויות (labels) מתאימות</li>
              <li>כפתור נגישות קבוע בכל עמודי האתר</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">תוסף הנגישות</h2>
            <p>
              בכל עמוד באתר מופיע כפתור נגישות (בצד שמאל) הפותח סרגל צדדי עם 12 כלי נגישות:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 mt-2">
              <li>הגדלה והקטנה של גודל הטקסט (3 רמות)</li>
              <li>ניגודיות גבוהה</li>
              <li>צבעים הפוכים (Negative)</li>
              <li>גווני אפור</li>
              <li>הדגשת קישורים</li>
              <li>הדגשת כותרות</li>
              <li>פונט קריא</li>
              <li>עצירת אנימציות</li>
              <li>סמן מוגדל</li>
              <li>ריווח טקסט</li>
              <li>הסתרת תמונות</li>
              <li>מדריך קריאה (קו עוקב אחרי העכבר)</li>
            </ul>
            <p className="mt-2 text-sm text-gray-500">
              כל ההגדרות נשמרות אוטומטית לביקור הבא.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">דפדפנים נתמכים</h2>
            <p>
              האתר נבנה ונבדק על הדפדפנים העדכניים: Google Chrome, Mozilla Firefox, Safari, ו-Microsoft Edge.
              מומלץ להשתמש בגרסה העדכנית ביותר של הדפדפן לחוויה מיטבית.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">נתקלתם בבעיית נגישות?</h2>
            <p>
              אנחנו משקיעים מאמצים רבים להנגיש את האתר, אך ייתכן שיש עמודים או רכיבים שטרם הונגשו במלואם.
              אם נתקלתם בבעיית נגישות, נשמח לשמוע מכם:
            </p>
            <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 text-sm">
              <p><strong className="text-white">דוא״ל:</strong> accessibility@nextli.co.il</p>
              <p><strong className="text-white">טלפון:</strong> 050-1234567</p>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              אנו מתחייבים לטפל בכל פנייה תוך 5 ימי עסקים.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
