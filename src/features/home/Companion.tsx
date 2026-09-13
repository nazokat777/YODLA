import { useEffect, useRef, useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { db, markCompanionStageCelebrated } from '@/core/db'
import {
  companionAccessories,
  companionLine,
  companionProgress,
  companionStage,
  nextCompanionStage,
  type CompanionContext,
} from '@/core/gamification'
import { haptic } from '@/lib/haptics'
import { particleBurst, withMotion } from '@/lib/motion'
import { playMasteredSound } from '@/lib/sound'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface CompanionProps {
  /** Ko'rilgan so'zlar (barcha tillar) — yo'ldosh shundan oziqlanadi */
  seenWords: number
  /** Gap uchun holat (bosh ekran biladi) */
  context?: CompanionContext
  /** Eng uzun streak — bezaklar shundan */
  longestStreak?: number
}

/**
 * YO'LDOSH kartasi — bosh ekranda, qahramon kartadan keyin.
 *
 * Har ochilishda yo'ldosh "gapiradi" va keyingi bosqichgacha don
 * sanaladi (kutish). Yangi bosqichga o'tilgan kuni BIR MARTA bayram:
 * zarrachalar, akkord, tebranish — va bazada belgilanadi.
 */
const QUIET: CompanionContext = { streakAtRisk: false, goalDone: false, dueCount: 0 }

export function Companion({ seenWords, context = QUIET, longestStreak = 0 }: CompanionProps) {
  const accessories = companionAccessories(longestStreak)
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const stage = companionStage(seenWords)
  const next = nextCompanionStage(seenWords)
  const progress = companionProgress(seenWords)
  const rootRef = useRef<HTMLDivElement>(null)
  const [evolved, setEvolved] = useState(false)

  useEffect(() => {
    if (stage.minWords === 0) return

    let cancelled = false
    void db.profile
      .get('me')
      .then(async (profile) => {
        if (!profile || cancelled) return
        if ((profile.celebratedCompanionStages ?? []).includes(stage.minWords)) return
        const fresh = await markCompanionStageCelebrated(stage.minWords)
        if (!fresh || cancelled) return
        setEvolved(true)
        // Bir vaqtda ikki bayram (olov darajasi + yo'ldosh) — ikki ohang
        // ustma-ust tushmasin: yo'ldoshniki biroz kechikadi
        window.setTimeout(() => {
          if (cancelled) return
          if (soundEnabled) playMasteredSound()
          haptic('celebrate')
        }, 900)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [stage.minWords, soundEnabled])

  useEffect(() => {
    if (!evolved) return
    let cancelled = false
    let revert = () => {}
    void withMotion(rootRef.current, (gsap) => particleBurst(gsap, '[data-spark]'), ['physics2D']).then(
      (fn) => {
        if (cancelled) fn()
        else revert = fn
      },
    )
    return () => {
      cancelled = true
      revert()
    }
  }, [evolved])

  return (
    <Panel
      data-home-card
      data-testid="companion"
      className="relative flex items-center gap-4 overflow-hidden"
      tone={evolved ? 'brand' : 'default'}
    >
      <div ref={rootRef} className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          {evolved &&
            Array.from({ length: 12 }, (_, i) => (
              <span key={i} data-spark className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-flame-500" />
            ))}
        </span>
        <span
          aria-hidden="true"
          data-testid="companion-emoji"
          className={evolved ? 'levelup-number block text-6xl' : 'flicker block text-6xl'}
        >
          {stage.emoji}
        </span>
        {/* Bezaklar — streak bilan ochilgan to'plam, yo'ldosh ustida */}
        {accessories.length > 0 && (
          <span
            data-testid="companion-accessories"
            aria-label={`Bezaklar: ${accessories.map((a) => a.name).join(', ')}`}
            className="absolute -right-1 -top-1 flex gap-0.5 text-base"
          >
            {accessories.map((a) => (
              <span key={a.emoji}>{a.emoji}</span>
            ))}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold uppercase tracking-wider text-ink-600">
          {evolved ? '✨ Yangi bosqich!' : 'Yo‘ldoshing'}
        </p>
        <p className="text-lg font-extrabold">{stage.name}</p>
        <p data-testid="companion-line" className="text-sm text-ink-600">
          “{companionLine(stage, context)}”
        </p>

        {next ? (
          <>
            <div
              role="progressbar"
              aria-valuenow={seenWords}
              aria-valuemin={stage.minWords}
              aria-valuemax={next.minWords}
              aria-label={`${next.name} bosqichigacha ${next.minWords - seenWords} so‘z`}
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-300/40"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-flame-500 to-brand-500 transition-[width] duration-700"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p data-testid="companion-next" className="mt-1 text-xs text-ink-600">
              {next.emoji} {next.name} — yana {next.minWords - seenWords} so‘z
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs text-ink-600">Eng yuqori bosqich. Sen afsonasan!</p>
        )}
      </div>
    </Panel>
  )
}
