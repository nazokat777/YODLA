import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Emblem } from '@/components/ui/Emblem'
import { LanguageBadge } from '@/components/ui/LanguageBadge'
import type { LanguageMeta } from '@/core/types'
import { levelTitle, nextStreakTier, streakTier, type LevelProgress } from '@/core/gamification'
import { cn } from '@/lib/cn'
import { greetingFor } from '@/lib/greeting'
import { ringFill, withMotion } from '@/lib/motion'
import { useEffect, useRef } from 'react'

interface HomeHeroProps {
  language: LanguageMeta | null
  streak: number
  streakAtRisk: boolean
  level: LevelProgress | null
  totalXp: number
  wordsToday: number
  dailyGoalWords: number
  dueCount: number
  isLoading: boolean
}

/** Halqa geometriyasi */
const RING_R = 40
const RING_C = 2 * Math.PI * RING_R

/**
 * BOSH EKRAN QAHRAMONI — bitta kuchli fokus.
 *
 * DIZAYN: ilgari bosh ekran bir xil oq kartalarning ustuni edi va
 * asosiy harakat ("darsni boshla") pastda, o'quv yo'lining ichida
 * yashiringan edi. Endi tepada BITTA gradient sahna: salom, streak,
 * kunlik maqsad HALQASI (yumaloq progress — to'lish sezilarli), daraja
 * va bitta katta tugma. Rang o'rganilayotgan tilga qarab o'zgaradi
 * (`--accent-*`, html[data-lang]) — ilova "sening tilingda" kiyinadi.
 *
 * Halqa SVG: `stroke-dashoffset` bilan — GPU'da, GSAP siz.
 */
export function HomeHero({
  language,
  streak,
  streakAtRisk,
  level,
  totalXp,
  wordsToday,
  dailyGoalWords,
  dueCount,
  isLoading,
}: HomeHeroProps) {
  const ratio = dailyGoalWords > 0 ? Math.min(1, wordsToday / dailyGoalWords) : 0
  const goalDone = wordsToday >= dailyGoalWords
  const tier = streakTier(streak)
  const next = nextStreakTier(streak)
  const ringRef = useRef<SVGCircleElement>(null)

  // Halqa boshidan joriy qiymatgacha elastik to'ladi — o'sish SEZILADI
  useEffect(() => {
    let cancelled = false
    let revert = () => {}

    void withMotion(ringRef.current, (gsap) => {
      if (ringRef.current) ringFill(gsap, ringRef.current, RING_C, RING_C * (1 - ratio))
    }).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [ratio])

  return (
    <section
      data-home-card
      data-testid="home-hero"
      className="hero-surface relative overflow-hidden rounded-[var(--radius-card)] p-5 text-white shadow-pop-lg"
    >
      {/* Yorug'lik dog'lari — gradientga "chuqurlik" */}
      <span aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0" />

      <header className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white/80">{greetingFor(new Date().getHours())}!</p>
          <h1 className="mt-0.5 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            {language ? (
              <>
                <LanguageBadge language={language} size="sm" />
                <span className="truncate">{language.name}</span>
              </>
            ) : (
              'Til tanlanmagan'
            )}
          </h1>
        </div>

        <div
          data-testid="streak-badge"
          title={streakAtRisk ? 'Streak xavf ostida — bugun hali mashq qilmadingiz' : undefined}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 font-extrabold backdrop-blur-md',
            streakAtRisk && 'ring-2 ring-flame-500',
          )}
        >
          <span aria-hidden="true" className="flicker">
            {tier.emoji}
          </span>
          <span>{streak}</span>
          <span className="sr-only">
            kunlik streak · {tier.name}
            {next && ` · ${next.name} gacha ${next.minDays - streak} kun`}
          </span>
        </div>
      </header>

      <div className="relative mt-5 flex items-center gap-5">
        {/* Kunlik maqsad halqasi */}
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={RING_R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="10" />
            <circle
              ref={ringRef}
              data-testid="goal-ring"
              cx="50"
              cy="50"
              r={RING_R}
              fill="none"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - ratio)}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="sr-only">Kunlik maqsad: </span>
            <span data-testid="daily-goal" className="text-lg font-extrabold leading-none">
              {wordsToday} / {dailyGoalWords}
              <span className="sr-only"> so'z</span>
            </span>
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/80">
              {goalDone ? 'Bajarildi' : "so'z"}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {level && (
            <>
              <p className="flex items-baseline gap-2">
                <span className="whitespace-nowrap text-lg font-extrabold">{level.level}-daraja</span>
                <span className="truncate text-sm text-white/80">{levelTitle(level.level)}</span>
              </p>
              <div
                role="progressbar"
                aria-valuenow={level.xpIntoLevel}
                aria-valuemin={0}
                aria-valuemax={level.xpForNextLevel}
                aria-label={`Keyingi darajagacha: ${level.xpForNextLevel - level.xpIntoLevel} XP`}
                className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/25"
              >
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.round(level.ratio * 100)}%` }}
                />
              </div>
            </>
          )}
          <p
            data-testid="total-xp"
            className="mt-2 inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-bold"
          >
            <Emblem kind="coin" size="sm" className="h-5 w-5" />
            <span data-xp-value>{totalXp}</span> XP
            {level && (
              <span className="text-white/70">
                · {level.level + 1}-darajagacha {level.xpForNextLevel - level.xpIntoLevel} XP
              </span>
            )}
          </p>
        </div>
      </div>

      {goalDone && (
        <p
          data-testid="goal-done"
          className="mastered-pop relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-bold backdrop-blur-md"
        >
          🎯 Daily goal — done! <span className="font-semibold text-white/85">Kunlik maqsad bajarildi</span>
        </p>
      )}

      {/*
        BITTA katta tugma: takrorlash bor bo'lsa — u (unutish arafasidagi
        so'zlar yangi so'zdan muhim), aks holda dars.
      */}
      <Link
        to={dueCount > 0 ? PATHS.review : PATHS.lesson}
        data-testid="hero-cta"
        className="hero-cta tap-highlight-none relative mt-5 flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-5 py-3.5 text-base font-extrabold text-ink-900 shadow-[0_6px_0_0_rgb(0_0_0/0.18)] transition-transform active:translate-y-[3px] active:shadow-none"
      >
        <span aria-hidden="true" className="hero-shimmer pointer-events-none absolute inset-0" />
        {isLoading ? 'Yuklanmoqda…' : dueCount > 0 ? `Takrorlash · ${dueCount} so‘z` : 'Darsni boshlash'}
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  )
}
