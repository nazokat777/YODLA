import type { ReactNode } from 'react'
import { Panel } from './Panel'

interface PhaseNoticeProps {
  /** Qaysi fazada bu ekran to'ldiriladi, masalan: "Faza 3" */
  phase: string
  children: ReactNode
}

/**
 * Vaqtinchalik ma'lumot bloki: ekran skeleti tayyor, mazmuni keyingi fazada.
 * Faza 1 tugagach bu komponent asta-sekin olib tashlanadi.
 */
export function PhaseNotice({ phase, children }: PhaseNoticeProps) {
  return (
    <Panel className="border-dashed bg-slate-50">
      <p className="mb-1 text-xs font-bold tracking-wide text-brand-600 uppercase">{phase}</p>
      <p className="text-sm text-ink-600">{children}</p>
    </Panel>
  )
}
