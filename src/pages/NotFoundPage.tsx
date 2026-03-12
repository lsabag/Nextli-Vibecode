import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, ArrowRight } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4" dir="rtl">
      <Helmet>
        <title>הדף לא נמצא | Nextli: וייבקוד</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-white/10 mb-4 select-none" aria-hidden="true">404</div>
        <h1 className="text-2xl font-bold text-white mb-3">הדף לא נמצא</h1>
        <p className="text-gray-400 mb-8">
          העמוד שחיפשת לא קיים, הועבר או נמחק.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <Home size={18} aria-hidden="true" />
            חזרה לדף הבית
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <ArrowRight size={18} aria-hidden="true" />
            התחברות
          </Link>
        </div>
      </div>
    </main>
  )
}
