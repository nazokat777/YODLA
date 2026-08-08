import { Panel } from '@/components/ui/Panel'
import { BADGE_BY_ID } from '@/core/gamification'
import type { SessionSummary } from './SessionRunner'

interface SessionSummaryPanelProps {
  /** null — seans umuman boshlanmagan (takrorlanadigan karta yo'q edi) */
  summary: SessionSummary | null
}

/**
 * Seans yakuni.
 * Xatolar "muvaffaqiyatsizlik" sifatida emas, "o'rganilgan so'zlar" sifatida
 * ko'rsatiladi — TZ 4: xatoda jazolamaslik tamoyili.
 */
export function SessionSummaryPanel({ summary }: SessionSummaryPanelProps) {
  if (!summary || summary.answered === 0) {
    return (
      <Panel className="text-center">
        <div className="mb-2 text-5xl" aria-hidden="true">
          ☕
        </div>
        <p className="font-bold">Hozircha takrorlash uchun so‘z yo‘q</p>
        <p className="mt-1 text-sm text-ink-600">Yangi so‘zlarni darsda o‘rganishingiz mumkin.</p>
      </Panel>
    )
  }

  const accuracy = Math.round(((summary.correct + summary.almost) / summary.answered) * 100)
  const newBadges = summary.newBadges
    .map((id) => BADGE_BY_ID.get(id))
    .filter((badge) => badge !== undefined)

  return (
    <div className="flex flex-col gap-3">
      <Panel className="text-center">
        <div className="mb-2 text-5xl" aria-hidden="true">
          🎉
        </div>
        <p className="text-lg font-extrabold">Seans tugadi!</p>
        <p className="mt-1 text-sm text-ink-600">
          {summary.answered} ta javob · {accuracy}% aniqlik
        </p>

        {summary.xpEarned > 0 && (
          <p
            data-testid="session-xp"
            className="mt-3 inline-block rounded-full bg-brand-500 px-4 py-1.5 text-lg font-extrabold text-white"
          >
            +{summary.xpEarned} XP
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="To‘g‘ri" value={summary.correct} accent="text-brand-600" />
          <Stat label="Deyarli" value={summary.almost} accent="text-flame-600" />
          <Stat label="O‘rganildi" value={summary.wrong} accent="text-ink-600" />
        </div>
      </Panel>

      {newBadges.length > 0 && (
        <Panel className="border-brand-500 bg-brand-50">
          <p className="mb-2 text-sm font-bold text-brand-700">Yangi nishon qo‘lga kiritildi!</p>
          <ul className="flex flex-col gap-2">
            {newBadges.map((badge) => (
              <li key={badge.id} className="flex items-center gap-3">
                <span aria-hidden="true" className="text-3xl">
                  {badge.icon}
                </span>
                <span>
                  <span className="block font-bold">{badge.title}</span>
                  <span className="block text-xs text-ink-600">{badge.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <p className={`text-xl font-extrabold ${accent}`}>{value}</p>
      <p className="text-xs text-ink-600">{label}</p>
    </div>
  )
}
