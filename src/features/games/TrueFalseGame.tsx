import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import { Panel } from '@/components/ui/Panel'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LANGUAGES } from '@/core/config/languages'
import {
  getAllCards,
  gradeCard,
  recordAnswer,
  recordTypeResult,
  saveGameBest,
  type CardRecord,
} from '@/core/db'
import { checkTrueFalse, gameGrade, makeTrueFalsePair } from '@/core/games'
import { shuffle } from '@/lib/random'
import { cn } from '@/lib/cn'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { playCorrectSound, playWrongSound } from '@/lib/sound'

/** Bir o'yinda nechta savol */
const ROUND_SIZE = 15

/** Javobdan keyin natija necha ms ko'rinadi */
const FEEDBACK_MS = 450

/**
 * "To'g'rimi yoki xato?" — eng tez format.
 *
 * O'ZLASHTIRISHGA HISOBGA O'TMAYDI: ikki variantdan bittasini tanlash
 * 50% ehtimol bilan to'g'ri chiqadi. Shuning uchun bu o'yin
 * `core/mastery` ga umuman tegmaydi va `SessionRunner` dan mustaqil
 * ishlaydi. SM-2 ga esa yumshoq baho beradi — takrorlashning o'zi
 * foydali.
 */
export function TrueFalseGame() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const dailyGoalWords = useSettingsStore((s) => s.dailyGoalWords)
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const language = learningLanguage ? LANGUAGES[learningLanguage] : null

  const [cards, setCards] = useState<CardRecord[] | null>(null)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [isRecord, setIsRecord] = useState(false)
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!learningLanguage) return

    let cancelled = false

    void getAllCards(learningLanguage)
      .then((all) => {
        if (cancelled) return

        // FAQAT ko'rilgan so'zlar — kam bo'lsa "avval dars o'ting"
        const seen = all.filter((card) => card.totalReviews > 0)
        setCards(shuffle(seen))
      })
      .catch((error: unknown) => {
        console.error('O‘yin uchun so‘zlarni yuklab bo‘lmadi:', error)
        if (!cancelled) setCards([])
      })

    return () => {
      cancelled = true
    }
  }, [learningLanguage, round])

  const pair = useMemo(() => {
    if (!cards || cards.length < 2 || index >= ROUND_SIZE) return null

    const card = cards[index % cards.length]!

    return makeTrueFalsePair(card, cards)
    // `index` o'zgarganda yangi juft — `cards` o'zgarmaydi
  }, [cards, index])

  const finished = index >= ROUND_SIZE
  const savedRef = useRef(false)

  useEffect(() => {
    if (!finished || savedRef.current) return

    savedRef.current = true
    void saveGameBest('truefalse', score).then(setIsRecord)
  }, [finished, score])

  const answer = useCallback(
    (saidTrue: boolean) => {
      if (!pair || feedback) return

      const correct = checkTrueFalse(pair, saidTrue)
      setFeedback(correct ? 'correct' : 'wrong')
      setScore((current) => current + (correct ? 1 : 0))
      if (soundEnabled) (correct ? playCorrectSound : playWrongSound)()

      // SM-2 ga yumshoq baho: takrorlashning o'zi foydali, lekin
      // 50% taxmin qilinadigan formatga qattiq tayanib bo'lmaydi
      void gradeCard(pair.card.id, gameGrade(correct))
      void recordTypeResult(pair.card.id, 'recognition', !correct)
      // XP va kunlik maqsad — vaqtga qarshi o'yin bilan bir xil
      void recordAnswer({ cardId: pair.card.id, verdict: correct ? 'correct' : 'wrong', dailyGoalWords })

      window.setTimeout(() => {
        setFeedback(null)
        setIndex((current) => current + 1)
      }, FEEDBACK_MS)
    },
    [pair, feedback, dailyGoalWords, soundEnabled],
  )

  if (cards === null) return <Panel className="text-ink-600">Yuklanmoqda…</Panel>

  if (cards.length < 2) {
    return (
      <div className="flex flex-col gap-3">
        <Panel className="text-center text-ink-600">
          O‘yin uchun kamida 2 ta so‘z kerak. Avval bir dars o‘ting.
        </Panel>
        <LinkButton to={PATHS.home} block>
          Bosh sahifaga
        </LinkButton>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-3">
        <Panel className="text-center">
          <p className="text-5xl" aria-hidden="true">
            {isRecord ? '🏆' : '✅'}
          </p>
          <h2 className="mt-2 text-xl font-extrabold">
            {isRecord ? 'Yangi rekord!' : 'Tugadi'}
          </h2>
          <p data-testid="tf-score" className="mt-2 text-4xl font-extrabold text-brand-700">
            {score}/{ROUND_SIZE}
          </p>
        </Panel>
        <Button
          block
          size="lg"
          onClick={() => {
            savedRef.current = false
            setIsRecord(false)
            setScore(0)
            setIndex(0)
            setRound((current) => current + 1)
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
        <ProgressBar value={index} max={ROUND_SIZE} label="O‘yin progressi" />
        <span data-testid="tf-progress" className="shrink-0 text-sm font-semibold text-ink-600">
          {index}/{ROUND_SIZE}
        </span>
      </div>

      {pair && (
        <>
          <Panel
            className={cn(
              'flex min-h-32 flex-col items-center justify-center gap-2 text-center transition-colors',
              feedback === 'correct' && 'border-brand-500 bg-brand-50',
              feedback === 'wrong' && 'border-wrong-500 bg-wrong-500/10',
            )}
          >
            <p
              data-testid="tf-word"
              dir={language?.dir}
              lang={language?.code}
              className="text-3xl font-extrabold"
            >
              {pair.card.word}
            </p>
            <p aria-hidden="true" className="text-ink-600">
              =
            </p>
            <p data-testid="tf-shown" className="text-2xl font-bold text-brand-700">
              {pair.shown}
            </p>
          </Panel>

          <p className="text-center text-sm font-semibold text-ink-600">To‘g‘rimi?</p>

          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" variant="secondary" onClick={() => answer(false)}>
              ✕ Yo‘q
            </Button>
            <Button size="lg" onClick={() => answer(true)}>
              ✓ Ha
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
