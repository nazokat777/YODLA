import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { LANGUAGES } from '@/core/config/languages'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import { Panel } from '@/components/ui/Panel'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getAllCards, gradeCard, recordAnswer, recordTypeResult, saveGameBest } from '@/core/db'
import { generateExercise, type Exercise } from '@/core/exercises'
import {
  SPEED_SECONDS,
  WRONG_PAUSE_MS,
  answerSpeed,
  gameGrade,
  startSpeed,
  tickSpeed,
} from '@/core/games'
import { shuffle } from '@/lib/random'
import { cn } from '@/lib/cn'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { playCorrectSound, playWrongSound } from '@/lib/sound'

/** O'yinga nechta karta tayyorlanadi — 60 soniyaga yetib ortadi */
const POOL_SIZE = 60

/**
 * Vaqtga qarshi poyga: 60 soniyada nechta so'zni bilasiz?
 *
 * SM-2 ga baho `gameGrade` orqali: o'yinda xato ko'pincha vaqt
 * yetmagani yoki chalg'iganidan bo'ladi, bilmaganidan emas — u jadvalni
 * buzmasligi kerak (`core/games/grade.ts`).
 */
interface SpeedGameProps {
  /**
   * O'yin davomiyligi. Sukut — 60 soniya.
   *
   * Parametr TESTLAR uchun ham: 60 soniyani soxta taymer bilan
   * o'tkazish Dexie tranzaksiyalarini uzib yuborardi va konsolga
   * hech kimga tegishli bo'lmagan xatolar chiqardi.
   */
  seconds?: number
}

export function SpeedGame({ seconds = SPEED_SECONDS }: SpeedGameProps = {}) {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const dailyGoalWords = useSettingsStore((s) => s.dailyGoalWords)
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const language = learningLanguage ? LANGUAGES[learningLanguage] : null

  const [cards, setCards] = useState<Awaited<ReturnType<typeof getAllCards>> | null>(null)
  const [state, setState] = useState(() => startSpeed(seconds))
  const [running, setRunning] = useState(false)
  const [index, setIndex] = useState(0)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [isRecord, setIsRecord] = useState(false)

  useEffect(() => {
    if (!learningLanguage) return

    let cancelled = false

    void getAllCards(learningLanguage)
      .then((all) => {
        if (cancelled) return

        /*
         * FAQAT ko'rilgan so'zlar: o'yin TEKSHIRUV, o'rgatish emas.
         * Hech qachon ko'rmagan so'zni 3 soniyada topish mumkin emas
         * va bu faqat xafa qilardi. Ilgari ular kam bo'lsa butun lug'at
         * olinardi — yangi foydalanuvchi B1 so'zlarini ko'rar, pastdagi
         * "avval dars o'ting" xabari esa hech qachon chiqmasdi.
         */
        const seen = all.filter((card) => card.totalReviews > 0)
        setCards(shuffle(seen).slice(0, POOL_SIZE))
      })
      .catch((error: unknown) => {
        console.error('O‘yin uchun so‘zlarni yuklab bo‘lmadi:', error)
        if (!cancelled) setCards([])
      })

    return () => {
      cancelled = true
    }
  }, [learningLanguage])

  // Taymer — faqat o'yin ketayotganda
  useEffect(() => {
    if (!running || state.finished) return

    const timer = setInterval(() => setState((current) => tickSpeed(current)), 1000)

    return () => clearInterval(timer)
  }, [running, state.finished])

  const bestSavedRef = useRef(false)

  // O'yin tugadi — rekord bir marta saqlanadi
  useEffect(() => {
    if (!state.finished || bestSavedRef.current) return

    bestSavedRef.current = true
    void saveGameBest('speed', state.score).then(setIsRecord)
  }, [state.finished, state.score])

  const exercise = useMemo<Exercise | null>(() => {
    const card = cards?.[index % Math.max(1, cards.length)]
    if (!card || !cards || cards.length < 4) return null

    // MAJBURAN tanib olish: eng tez javob beriladigan tur. Pog'onaga
    // tayansak, ko'p takrorlangan so'z uchun yozma mashq chiqib o'yin
    // ritmi buzilardi
    return generateExercise({
      card,
      pool: cards,
      allowAudio: false,
      stage: 0,
      forceType: 'recognition',
    })
  }, [cards, index])

  const handleAnswer = useCallback(
    (choiceIndex: number) => {
      if (!exercise || flash || state.finished) return
      if (exercise.type !== 'recognition') return

      const correct = choiceIndex === exercise.correctIndex

      setState((current) => answerSpeed(current, correct))
      setFlash(correct ? 'correct' : 'wrong')

      // Ovoz — seansdagi kabi. O'yinda ayniqsa kerak: bola ekranga
      // emas, tugmaga qaraydi va natijani QULOQ bilan oladi
      if (soundEnabled) (correct ? playCorrectSound : playWrongSound)()

      const cardId = exercise.card.id
      void gradeCard(cardId, gameGrade(correct))
      void recordTypeResult(cardId, 'recognition', !correct)
      void recordAnswer({ cardId, verdict: correct ? 'correct' : 'wrong', dailyGoalWords })

      // To'g'ri javobda darhol keyingisi, xatoda qisqa qizil pauza
      window.setTimeout(
        () => {
          setFlash(null)
          setIndex((current) => current + 1)
        },
        correct ? 150 : WRONG_PAUSE_MS,
      )
    },
    [exercise, flash, state.finished, dailyGoalWords, soundEnabled],
  )

  if (cards === null) {
    return <Panel className="text-ink-600">Yuklanmoqda…</Panel>
  }

  if (cards.length < 4) {
    return (
      <div className="flex flex-col gap-3">
        <Panel className="text-center text-ink-600">
          O‘yin uchun kamida 4 ta so‘z kerak. Avval bir dars o‘ting.
        </Panel>
        <LinkButton to={PATHS.home} block>
          Bosh sahifaga
        </LinkButton>
      </div>
    )
  }

  if (!running) {
    return (
      <div className="flex flex-col gap-3">
        <Panel className="text-center">
          <p className="text-5xl" aria-hidden="true">
            ⚡
          </p>
          <h2 className="mt-2 text-xl font-extrabold">Vaqtga qarshi</h2>
          <p className="mt-1 text-sm text-ink-600">
            {seconds} soniyada nechta so‘zni bilasiz? Har to‘g‘ri javob — 1 ochko.
          </p>
        </Panel>
        <Button block size="lg" onClick={() => setRunning(true)}>
          Boshlash
        </Button>
      </div>
    )
  }

  if (state.finished) {
    const accuracy = state.answered > 0 ? Math.round((state.score / state.answered) * 100) : 0

    return (
      <div className="flex flex-col gap-3">
        <Panel className="text-center">
          <p className="text-5xl" aria-hidden="true">
            {isRecord ? '🏆' : '⏱️'}
          </p>
          <h2 className="mt-2 text-xl font-extrabold">
            {isRecord ? 'Yangi rekord!' : 'Vaqt tugadi'}
          </h2>
          <p data-testid="speed-score" className="mt-2 text-4xl font-extrabold text-brand-700">
            {state.score}
          </p>
          <p className="mt-1 text-sm text-ink-600">
            {state.answered} ta javob · {accuracy}% aniqlik
          </p>
        </Panel>

        <Button
          block
          size="lg"
          onClick={() => {
            bestSavedRef.current = false
            setIsRecord(false)
            setState(startSpeed(seconds))
            setIndex((current) => current + 1)
          }}
        >
          Yana o‘ynash
        </Button>
        <Link to={PATHS.games} className="text-center text-sm font-semibold text-ink-600">
          O‘yinlarga qaytish
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <ProgressBar
          value={state.secondsLeft}
          max={seconds}
          label="Qolgan vaqt"
          className="h-4"
        />
        <span
          data-testid="speed-timer"
          className={cn(
            'shrink-0 text-lg font-extrabold tabular-nums',
            state.secondsLeft <= 10 ? 'text-wrong-600' : 'text-ink-900',
          )}
        >
          {state.secondsLeft}
        </span>
        <span
          data-testid="speed-live-score"
          className="shrink-0 rounded-full bg-brand-500/15 px-3 py-1 font-extrabold text-brand-700"
        >
          {state.score}
        </span>
      </div>

      {exercise?.type === 'recognition' && (
        <>
          <Panel className="flex min-h-24 items-center justify-center text-center">
            {/*
              `dir`/`lang` SHART: arab shrifti va harakatlar uchun
              satr balandligi `[dir='rtl']` orqali beriladi. Usiz
              arabcha so'z lotin shriftida, harakatlari bir-biriga
              yopishgan holda chiqardi.
            */}
            <p
              data-testid="speed-word"
              dir={language?.dir}
              lang={language?.code}
              className="text-3xl font-extrabold"
            >
              {exercise.prompt}
            </p>
          </Panel>

          <ul className="flex flex-col gap-2">
            {exercise.options.map((option, optionIndex) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => handleAnswer(optionIndex)}
                  className={cn(
                    'tap-highlight-none min-h-13 w-full rounded-2xl border-2 px-4 py-3 text-start font-semibold transition-colors',
                    flash && optionIndex === exercise.correctIndex
                      ? 'border-brand-500 bg-brand-100 text-brand-700'
                      : 'border-ink-300 bg-white',
                  )}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
