import { useState } from 'react'
import { WizardStepField } from './WizardStepField'
import type { WizardStep } from '@/types'

type Props = {
  step: WizardStep
  onAnswer: (stepId: string, answer: string) => Promise<void>
  saving: boolean
}

export function WizardForm({ step, onAnswer, saving }: Props) {
  const [answer, setAnswer] = useState('')

  async function handleSubmit() {
    if (!answer.trim()) return
    await onAnswer(step.id, answer)
    setAnswer('')
  }

  return (
    <div dir="rtl">
      <h2 className="text-2xl font-bold text-white mb-6">{step.question_text}</h2>
      <WizardStepField step={step} value={answer} onChange={setAnswer} />
      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || saving}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-colors"
      >
        {saving ? 'שומר...' : '← המשך'}
      </button>
    </div>
  )
}
