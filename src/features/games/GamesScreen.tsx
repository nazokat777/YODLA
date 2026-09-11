import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Panel } from '@/components/ui/Panel'
import { cn } from '@/lib/cn'
import { claimChallengeBonus, db } from '@/core/db'
import type { GameId } from '@/core/db'
import { CHALLENGE_BONUS_XP, challengeProgress, dailyChallenge, isChallengeDone } from '@/core/games'
import { useProgress } from '@/hooks/useProgress'
import { enterStagger, pressTilt, revealHeading, withMotion } from '@/lib/motion'
import { useEffect, useRef } from 'react'

interface GameEntry {
  id: GameId
  to: string
  icon: string
  title: string
  description: string
  /** Rekord qanday o'lchanadi */
  unit: string
}

const GAMES: GameEntry[] = [
  {
    id: 'speed',
    to: PATHS.speedGame,
    icon: '⚡',
    title: 'Vaqtga qarshi',
    description: '60 soniyada nechta so‘zni bilasiz?',
    unit: 'ochko',
  },
  {
    id: 'memory',
    to: PATHS.memoryGame,
    icon: '🧠',
    title: 'Xotira o‘yini',
    description: 'Yopiq kartalardan juftini toping',
    unit: 'ball',
  },
  {
    id: 'truefalse',
    to: PATHS.trueFalseGame,
    icon: '⚖️',
    title: 'To‘g‘rimi?',
    description: 'Juft to‘g‘ri yoki xato — tez javob bering',
    unit: 'to‘g‘ri',
  },
]

/**
 * O'yinlar sahifasi.
 *
 * NEGA ALOHIDA SAHIFA, pastki navigatsiyada emas: u yerda allaqachon
 * beshta element bor va 320 px li ekranda ular tor joylashgan
 * (o'lchandi). Oltinchisi qo'shilsa yorliqlar o'qib bo'lmas holga
 * kelardi.
 */
export function GamesScreen() {
  const rootRef = useRef<HTMLDivElement>(null)

  /*
   * Kirish animatsiyasi: sarlavha harfma-harf, kartalar ketma-ket.
   * Bu ekranga BIR MARTA kiriladi va u "o'yin" kayfiyatini
   * belgilaydi — shuning uchun bu yerda katta harakat o'rinli
   * (mashq ichida esa u taqiqlangan).
   */
  useEffect(() => {
    let cancelled = false
    let revert = () => {}

    void withMotion(
      rootRef.current,
      (gsap) => {
        const heading = rootRef.current?.querySelector('h1')
        if (heading) revealHeading(gsap, heading)

        enterStagger(gsap, '[data-game-card]', { stagger: 0.08, duration: 0.45, y: 20 })
      },
      ['splitText'],
    ).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [])

  /** Bosilganda karta 3D qiyaladi — "haqiqiy" bo'lib tuyuladi */
  const handlePress = (element: HTMLElement) => {
    void withMotion(element, (gsap) => pressTilt(gsap, element))
  }

  /*
   * FAQAT O'QISH. `ensureProfile()` `rw` tranzaksiya ochadi va uni
   * `useLiveQuery` ichida chaqirib bo'lmaydi — Dexie xato beradi va
   * natija jimgina `undefined` bo'lib qoladi, ya'ni rekordlar hech
   * qachon ko'rinmasdi.
   */
  const profile = useLiveQuery(() => db.profile.get('me'), [])
  const progress = useProgress()

  const challenge = dailyChallenge()
  const bests = profile?.gameBests

  // Progress mavjud kunlik o'lchovlardan — manbalar `core/games` da
  const done = challengeProgress(challenge, {
    correctToday: progress?.daily.correct ?? 0,
    speedBest: bests?.speed ?? 0,
    lessonsToday: progress?.daily.lessonsCompleted ?? 0,
  })
  const challengeDone = isChallengeDone(challenge, done)

  /*
   * BONUS HAQIQATAN BERILADI. Ilgari ekranda "+50 XP" deb turardi,
   * lekin hech qayerga yozilmasdi — va'da qilingan mukofot yolg'on
   * edi. `claimChallengeBonus` bir kunda bir marta beradi, shuning
   * uchun bu effekt har renderda xavfsiz.
   */
  const bonusClaimed = progress?.daily.challengeBonusAwarded ?? false
  useEffect(() => {
    if (!challengeDone || bonusClaimed) return

    void claimChallengeBonus(CHALLENGE_BONUS_XP)
  }, [challengeDone, bonusClaimed])

  return (
    <div ref={rootRef} className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">O‘yinlar</h1>
        <p className="mt-1 text-sm text-ink-600">
          Bilganingizni mustahkamlang — tez va qiziqarli.
        </p>
      </div>

      {/*
        KUNLIK CHAQIRIQ — har kuni qaytish uchun sabab. Vazifa sanadan
        hisoblanadi, ya'ni kun davomida o'zgarmaydi.
      */}
      <Panel
        data-testid="daily-challenge"
        className={cn(
          'flex items-center gap-3',
          challengeDone && 'border-brand-500 bg-brand-50',
        )}
      >
        <span aria-hidden="true" className="text-3xl">
          {challengeDone ? '✅' : challenge.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-ink-600">Bugungi chaqiriq</span>
          <span className="block font-bold">{challenge.title}</span>
          <span className="block text-xs text-ink-600">
            {challengeDone
              ? `Bajarildi! +${CHALLENGE_BONUS_XP} XP`
              : `${Math.min(done, challenge.target)}/${challenge.target}`}
          </span>
        </span>
      </Panel>

      <ul className="flex flex-col gap-3">
        {GAMES.map((game) => {
          const best = profile?.gameBests?.[game.id] ?? 0

          return (
            <li key={game.id}>
              <Link
                to={game.to}
                data-game-card
                className="tap-highlight-none block"
                onPointerDown={(event) => handlePress(event.currentTarget)}
              >
                <Panel interactive className="flex items-center gap-3">
                  <span aria-hidden="true" className="text-4xl">
                    {game.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold">{game.title}</span>
                    <span className="block text-sm text-ink-600">{game.description}</span>
                  </span>
                  {/* Rekord FAQAT bor bo'lsa: "0 ochko" hech kimni
                      ilhomlantirmaydi va bo'sh joyni egallaydi */}
                  {best > 0 && (
                    <span className="shrink-0 rounded-full bg-flame-500/15 px-3 py-1 text-sm font-extrabold text-flame-700">
                      🏆 {best} {game.unit}
                    </span>
                  )}
                </Panel>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
