interface Props {
  percent: number
  size?: 'sm' | 'md'
  label?: string
}

export function ProgressBar({ percent, size = 'sm', label }: Props) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5'
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className="w-full" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'התקדמות'}>
      <div className={`w-full bg-white/10 rounded-full ${h} overflow-hidden`}>
        <div
          className={`${h} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${clamped}%`,
            background: clamped === 100
              ? 'linear-gradient(90deg, #22c55e, #10b981)'
              : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          }}
        />
      </div>
    </div>
  )
}
