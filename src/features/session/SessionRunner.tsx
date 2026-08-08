import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LANGUAGES } from '@/core/config/languages'
import { finalizeSession, gradeCard, recordAnswer, type CardRecord } from '@/core/db'
import {
  checkExercise,
  deriveGrade,
  generateExercise,
  type AnswerVerdict,
  type Exercise,
} from '@/core/exercises'
import { PASSING_GRADE } from '@/core/srs'
import { cancelSpeech, hasVoiceForLocale, isSpeechSupported } from '@/lib/speech'
import { playCorrectSound, playWrongSound } from '@/lib/sound'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { ExerciseView } from './ExerciseView'
import { EMPTY_ANSWER, type ExerciseAnswerState } from './answerState'
import { FeedbackBar } from './FeedbackBar'

/** Seans yakunidagi hisobot */
export interface SessionSummary {
  /** Jami javoblar (takroran chiqqanlar ham sanaladi) */
  answered: number
  correct: number
  almost: number
  wrong: number
  /** Seansda to'plangan XP (kunlik maqsad bonusi bilan) */
  xpEarned: number
  /** Shu seansda ochilgan nishonlar id lari */
  newBadges: string[]
}

const EMPTY_SUMMARY: SessionSummary = {
  answered: 0,
  correct: 0,
  almost: 0,
  wrong: 0,
  xpEarned: 0,
  newBadges: [],
}

interface SessionRunnerProps {
  /** Mashq qilinadigan kartalar (navbat) */
  cards: CardRecord[]
  /** Chalg'ituvchi variantlar manbai — odatda o'sha tildagi barcha kartalar */
  pool: CardRecord[]
  onFinish: (summary: SessionSummary) => void
}

/**
 * Mashq seansi: navbatdagi har karta uchun mos mashq yaratadi, javobni
 * tekshiradi, SM-2 bahosini chiqaradi va darhol feedback beradi.
 *
 * Takrorlash (`/review`) va dars (`/lesson`) ekranlari shu bir komponentni
 * ishlatadi — farq faqat kartalar qayerdan olinishida.
 */
export function SessionRunner({ cards, pool, onFinish }: SessionRunnerProps) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const dailyGoalWords = useSettingsStore((s) => s.dailyGoalWords)

  const [queue, setQueue] = useState<CardRecord[]>(cards)
  const [index, setIndex] = useState(0)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [answer, setAnswer] = useState<ExerciseAnswerState>(EMPTY_ANSWER)
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null)
  const [nextIntervalDays, setNextIntervalDays] = useState(1)
  const [updatedCard, setUpdatedCard] = useState<CardRecord | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [summary, setSummary] = useState<SessionSummary>(EMPTY_SUMMARY)
  /** Oxirgi javob uchun berilgan XP — feedbackda ko'rsatiladi */
  const [lastXpGained, setLastXpGained] = useState(0)
  const [goalJustCompleted, setGoalJustCompleted] = useState(false)

  /**
   * Audio mashqlari faqat brauzer nutq sintezini qo'llab-quvvatlasa
   * yaratiladi. Aks holda foydalanuvchi hech narsa eshitmasdan
   * javob berishga majbur bo'lardi.
   */
  const allowAudio = useMemo(() => {
    const language = cards[0] ? LANGUAGES[cards[0].language] : null
    if (!language) return false

    return isSpeechSupported() && hasVoiceForLocale(language.speechLocale)
  }, [cards])

  // Navbatdagi karta o'zgarganda yangi mashq yaratiladi
  useEffect(() => {
    const card = queue[index]
    if (!card) {
      setExercise(null)
      return
    }

    setExercise(generateExercise({ card, pool, allowAudio }))
    setAnswer(EMPTY_ANSWER)
    setVerdict(null)
    setErrorMessage(null)
  }, [queue, index, pool, allowAudio])

  // Ekrandan chiqilganda o'qish to'xtatiladi
  useEffect(() => cancelSpeech, [])

  // Seans tugadi — nishonlar qayta hisoblanadi va hisobot bir marta yuboriladi
  const finishedRef = useRef(false)
  useEffect(() => {
    if (finishedRef.current || index < queue.length) return

    finishedRef.current = true

    finalizeSession({ answered: summary.answered, wrong: summary.wrong })
      .then(({ newlyUnlocked }) => onFinish({ ...summary, newBadges: newlyUnlocked }))
      .catch((error: unknown) => {
        // Nishonlarni hisoblab bo'lmasa ham seans yakuni ko'rsatiladi:
        // geymifikatsiya o'quv jarayonini to'sib qo'ymasligi kerak
        console.error('Nishonlarni yangilab bo‘lmadi:', error)
        onFinish(summary)
      })
  }, [index, queue.length, onFinish, summary])

  /** Javob berishga tayyormi */
  const canSubmit = useMemo(() => {
    if (!exercise) return false

    switch (exercise.type) {
      case 'recognition':
      case 'listening':
        return answer.choiceIndex !== null
      case 'recall':
        return answer.text.trim().length > 0
      case 'construction':
        return answer.tokenOrder.length > 0
    }
  }, [exercise, answer])

  /** Tekshirish uchun javobni mashq turiga mos ko'rinishga keltirish */
  function toAnswerValue(current: Exercise): number | string {
    switch (current.type) {
      case 'recognition':
      case 'listening':
        return answer.choiceIndex ?? -1
      case 'recall':
        return answer.text
      case 'construction':
        return answer.tokenOrder.map((tokenIndex) => current.tokens[tokenIndex]).join(' ')
    }
  }

  const handleSubmit = useCallback(async () => {
    if (!exercise || !canSubmit || isSaving || verdict !== null) return

    const result = checkExercise(exercise, toAnswerValue(exercise))
    const grade = deriveGrade(exercise, result)

    setIsSaving(true)
    try {
      const saved = await gradeCard(exercise.card.id, grade)

      // Geymifikatsiya ALOHIDA yoziladi va o'z xatosini o'zi yutadi:
      // XP yozilmasa ham takrorlash progressi saqlanib qolishi kerak
      let xpGained = 0
      let goalCompleted = false
      try {
        const progress = await recordAnswer({
          cardId: exercise.card.id,
          verdict: result,
          dailyGoalWords,
        })
        xpGained = progress.xpGained
        goalCompleted = progress.goalJustCompleted
      } catch (error) {
        console.error('XP ni yozib bo‘lmadi:', error)
      }

      setUpdatedCard(saved)
      setNextIntervalDays(saved.interval)
      setVerdict(result)
      setLastXpGained(xpGained)
      setGoalJustCompleted(goalCompleted)
      setSummary((current) => ({
        ...current,
        answered: current.answered + 1,
        correct: current.correct + (result === 'correct' ? 1 : 0),
        almost: current.almost + (result === 'almost' ? 1 : 0),
        wrong: current.wrong + (result === 'wrong' ? 1 : 0),
        xpEarned: current.xpEarned + xpGained,
      }))

      if (soundEnabled) {
        if (grade >= PASSING_GRADE) playCorrectSound()
        else playWrongSound()
      }
    } catch (error) {
      // Baho saqlanmasa feedback ko'rsatilmaydi — aks holda ekranda
      // "keyingi takrorlash 6 kun" yozilib, aslida hech narsa yozilmagan bo'lardi
      console.error('Bahoni saqlab bo‘lmadi:', error)
      setErrorMessage('Javobni saqlab bo‘lmadi. Qaytadan urinib ko‘ring.')
    } finally {
      setIsSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise, canSubmit, isSaving, verdict, answer, soundEnabled, dailyGoalWords])

  /** Feedback'dan keyin keyingi mashqqa o'tish */
  const handleContinue = useCallback(() => {
    // Xato javob berilgan karta shu seansning oxiriga qaytariladi:
    // darhol qayta eslab chaqirish (retrieval practice) samaraliroq.
    // Navbatga bazadan qaytgan YANGILANGAN yozuv qo'shiladi — shunda
    // keyingi mashq turi ham yangi `repetitions` ga qarab tanlanadi.
    if (verdict === 'wrong' && updatedCard) {
      const repeated = updatedCard
      setQueue((current) => [...current, repeated])
    }

    setIndex((current) => current + 1)
  }, [verdict, updatedCard])

  if (!exercise) return null

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-3">
        <ProgressBar value={summary.answered} max={queue.length} label="Seans progressi" />
        <span data-testid="session-progress" className="text-sm font-semibold text-ink-600">
          {summary.answered}/{queue.length}
        </span>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-2xl border border-wrong-500/40 bg-wrong-500/10 px-4 py-3 text-sm font-semibold text-wrong-600"
        >
          {errorMessage}
        </p>
      )}

      <ExerciseView
        exercise={exercise}
        answer={answer}
        onAnswerChange={setAnswer}
        revealed={verdict !== null}
        onSubmit={() => void handleSubmit()}
      />

      <div className="mt-auto pt-2">
        {verdict === null ? (
          <Button
            block
            size="lg"
            disabled={!canSubmit || isSaving}
            onClick={() => void handleSubmit()}
          >
            Tekshirish
          </Button>
        ) : (
          <FeedbackBar
            exercise={exercise}
            verdict={verdict}
            nextIntervalDays={nextIntervalDays}
            xpGained={lastXpGained}
            goalJustCompleted={goalJustCompleted}
            onContinue={handleContinue}
          />
        )}
      </div>
    </div>
  )
}
