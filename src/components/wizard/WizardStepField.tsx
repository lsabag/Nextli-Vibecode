import type { WizardStep } from '@/types'

type Props = {
  step: WizardStep
  value: string
  onChange: (value: string) => void
}

export function WizardStepField({ step, value, onChange }: Props) {
  if (step.field_type === 'select' && step.options) {
    const opts: string[] = typeof step.options === 'string' ? JSON.parse(step.options) : step.options
    return (
      <div className="flex flex-col gap-3">
        {opts.map((option: string) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`w-full text-right px-5 py-4 rounded-xl border-2 transition-all font-medium ${
              value === option
                ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                : 'border-white/10 hover:border-white/25 text-gray-300 bg-white/5'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    )
  }

  if (step.field_type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        placeholder="כתוב כאן..."
        className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none outline-none focus:border-blue-500 transition-colors"
        dir="rtl"
      />
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="הכנס תשובה..."
      className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-colors"
      dir="rtl"
    />
  )
}
