import { useState } from 'react'

type Props = {
  content: string
  language: string | null
  title: string
}

export function CodeBlock({ content, language, title }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 my-4">
      <div className="flex items-center justify-between bg-white/10 px-4 py-2">
        <span className="text-sm text-gray-300 font-medium">{title}</span>
        <div className="flex items-center gap-3">
          {language && (
            <span className="text-xs text-blue-400 font-mono bg-blue-600/20 px-2 py-0.5 rounded">
              {language}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {copied ? '✓ הועתק' : 'העתק'}
          </button>
        </div>
      </div>
      <pre className="p-4 text-sm font-mono text-gray-100 overflow-x-auto bg-[#111118]">
        <code>{content}</code>
      </pre>
    </div>
  )
}
