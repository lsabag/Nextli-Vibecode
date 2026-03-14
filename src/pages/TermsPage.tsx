import { Link } from 'react-router-dom'
import { SEOHead } from '@/components/shared/SEOHead'
import { ArrowRight } from 'lucide-react'

export default function TermsPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#0a0a0f] text-white" dir="rtl">
      <SEOHead title="תנאי שימוש" description="תנאי השימוש של Nextli וייבקוד" />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mb-8 transition-colors">
          <ArrowRight size={14} />
          חזרה לדף הבית
        </Link>

        <h1 className="text-3xl font-black mb-8">תנאי שימוש</h1>
        <p className="text-gray-400 text-sm mb-6">עדכון אחרון: מרץ 2026</p>

        <div className="space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">כללי</h2>
            <p>
              ברוכים הבאים לאתר Nextli וייבקוד (להלן: &quot;האתר&quot;). השימוש באתר ובשירותים המוצעים בו כפוף
              לתנאי שימוש אלה. עצם השימוש באתר מהווה הסכמה לתנאים אלה. אם אינכם מסכימים לתנאים,
              אנא הימנעו משימוש באתר.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">השירותים</h2>
            <p>
              האתר מציע קורסי לימוד בתחום פיתוח תוכנה עם כלי AI (Vibe Coding).
              השירותים כוללים גישה לתכני הקורס, מפגשים חיים, ספריית פרומפטים, ופרויקטים מעשיים.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">הרשמה וחשבון</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>ההרשמה לקורס מחייבת מסירת פרטים אישיים מדויקים ונכונים</li>
              <li>אתם אחראים לשמור על סודיות פרטי ההתחברות שלכם</li>
              <li>אין להעביר או לשתף את חשבונכם עם אחרים</li>
              <li>אנו שומרים לעצמנו את הזכות לחסום חשבונות שמפרים את תנאי השימוש</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">קניין רוחני</h2>
            <p>
              כל תכני האתר, לרבות טקסטים, תמונות, סרטונים, קוד, עיצובים ותכנים לימודיים,
              הם רכוש של Nextli וייבקוד ומוגנים בחוקי זכויות יוצרים.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 mt-2">
              <li>מותר להשתמש בתכנים למטרות לימוד אישי בלבד</li>
              <li>אין להעתיק, להפיץ, או למכור תכנים מהקורס</li>
              <li>הקוד שתפתחו במסגרת הפרויקטים האישיים הוא שלכם</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">מדיניות ביטולים והחזרים</h2>
            <p>
              ביטול השתתפות בקורס יתבצע בהתאם לחוק הגנת הצרכן, התשמ״א-1981:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 mt-2">
              <li>ביטול תוך 14 יום מיום הרכישה ובטרם התחלת הקורס — החזר מלא בניכוי דמי ביטול (5% או 100 ש״ח, הנמוך מביניהם)</li>
              <li>ביטול לאחר תחילת הקורס — באופן יחסי לתכנים שטרם נצרכו</li>
              <li>בקשת ביטול תישלח בכתב לדוא״ל: support@nextli.co.il</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">כללי התנהגות</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>יש להתנהג בכבוד כלפי צוות ההוראה והתלמידים האחרים</li>
              <li>אין לשתף תכנים פוגעניים, מאיימים, או בלתי חוקיים</li>
              <li>אין לנסות לפרוץ, לשבש, או לפגוע במערכות האתר</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">הגבלת אחריות</h2>
            <p>
              האתר והשירותים מסופקים &quot;כמות שהם&quot; (as-is). אנו עושים מאמצים לספק תכנים איכותיים ומדויקים,
              אך איננו מבטיחים תוצאות ספציפיות מהשתתפות בקורס. אנו לא נישא באחריות לנזקים עקיפים
              הנובעים מהשימוש באתר.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">שינויים בתנאים</h2>
            <p>
              אנו שומרים לעצמנו את הזכות לעדכן תנאים אלה מעת לעת.
              שינויים מהותיים יפורסמו באתר. המשך שימוש באתר לאחר עדכון התנאים מהווה הסכמה לתנאים המעודכנים.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">דין וסמכות שיפוט</h2>
            <p>
              על תנאים אלה יחולו דיני מדינת ישראל. סמכות השיפוט הבלעדית בכל סכסוך הנוגע לתנאים אלה
              תהיה לבתי המשפט המוסמכים במחוז תל אביב.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">יצירת קשר</h2>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 text-sm">
              <p><strong className="text-white">דוא״ל:</strong> support@nextli.co.il</p>
              <p><strong className="text-white">טלפון:</strong> 055-29-59-555</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
