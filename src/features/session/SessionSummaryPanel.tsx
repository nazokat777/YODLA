import { useEffect, useRef } from 'react'
import { Mascot } from '@/components/ui/Mascot'
import { Panel } from '@/components/ui/Panel'
import { loadGsap } from '@/lib/motion'
import { Confetti } from './Confetti'
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
  // Hook erta `return` dan OLDIN chaqiriladi: React hook'lar har renderda
  // bir xil tartibda bo'lishi shart
  const panelRef = useCelebration(summary?.xpEarned ?? 0)

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
      <Panel className="relative overflow-hidden text-center">
        <div ref={panelRef}>
          <Confetti />
          <span data-celebrate="mascot" className="block">
            <Mascot mood="celebrating" size="md" className="mx-auto mb-2" />
          </span>
          <p className="text-lg font-extrabold">Seans tugadi!</p>
          <p className="mt-1 text-sm text-ink-600">
            {summary.answered} ta javob · {accuracy}% aniqlik
          </p>

          {summary.xpEarned > 0 && (
            <p
              data-testid="session-xp"
              className="mt-3 inline-block rounded-full bg-brand-700 px-4 py-1.5 text-lg font-extrabold text-white"
            >
              +<span data-celebrate="xp">{summary.xpEarned}</span> XP
            </p>
          )}

          {summary.perfectBonusXp > 0 && (
            <p
              data-testid="perfect-bonus"
              className="mt-2 text-sm font-bold text-flame-700"
            >
              ⭐ Benuqson dars — +{summary.perfectBonusXp} XP
            </p>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2" data-celebrate="stats">
            <Stat label="To‘g‘ri" value={summary.correct} accent="text-brand-600" />
            <Stat label="Deyarli" value={summary.almost} accent="text-flame-700" />
            <Stat label="O‘rganildi" value={summary.wrong} accent="text-ink-600" />
          </div>
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

/**
 * Tantana timeline'i: mascot sakraydi → XP sanaladi → kartalar ko'tariladi.
 *
 * XP raqami JSX'da YAKUNIY qiymati bilan chiziladi; bu yerda u 0 dan
 * sanab chiqiladi. Animatsiya ishlamasa foydalanuvchi to'g'ri sonni
 * ko'radi — 0 ni emas.
 */
function useCelebration(xpEarned: number) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let context: { revert: () => void } | null = null

    void loadGsap().then((gsap) => {
      if (!gsap || cancelled || !rootRef.current) return

      context = gsap.context(() => {
        const timeline = gsap.timeline()

        timeline.from('[data-celebrate="mascot"]', {
          y: -40,
          scale: 0.6,
          duration: 0.5,
          ease: 'back.out(2)',
        })

        if (xpEarned > 0) {
          const counter = { value: 0 }
          timeline.to(
            counter,
            {
              value: xpEarned,
              duration: 0.8,
              ease: 'power1.out',
              onUpdate: () => {
                const node = rootRef.current?.querySelector('[data-celebrate="xp"]')
                if (node) node.textContent = String(Math.round(counter.value))
              },
            },
            '-=0.2',
          )
        }

        timeline.from(
          '[data-celebrate="stats"] > *',
          { y: 16, duration: 0.3, stagger: 0.08, ease: 'back.out(1.6)' },
          '-=0.4',
        )
      }, rootRef)
    })

    return () => {
      cancelled = true
      context?.revert()
    }
  }, [xpEarned])

  return rootRef
}
