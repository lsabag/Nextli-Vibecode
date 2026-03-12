import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  title?: string
  description?: string
  noindex?: boolean
}

const SITE_NAME = 'Nextli: וייבקוד'
const DEFAULT_DESCRIPTION = 'קורס אינטנסיבי לפיתוח עם AI - למד לבנות אתרים ואפליקציות בעזרת וייבקוד'

export function SEOHead({ title, description, noindex }: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const desc = description || DEFAULT_DESCRIPTION

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="he_IL" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  )
}
