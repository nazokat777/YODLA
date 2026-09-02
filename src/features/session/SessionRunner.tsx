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
import { MAX_LESSON_STEPS, buildLessonQueue, type LessonStep } from '@/core/lesson/queue'
import { loadGsap } from '@/lib/motion'
import { PASSING_GRADE } from '@/core/srs'
import { cancelSpeech } from '@/lib/speech'
import { requestPersistentStorage } from '@/lib/storage'
import { useHasVoice } from '@/hooks/useHasVoice'
import { playCorrectSound, playWrongSound } from '@/lib/sound'
import { useLeagueSync } from '@/hooks/useLeagueSync'
import { usePushActivity } from '@/hooks/usePushActivity'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { ExerciseView } from './ExerciseView'
import { EMPTY_ANSWER, type ExerciseAnswerState } from './answerState'
import { FeedbackBar } from './FeedbackBar'
import { MatchingView, type MatchingResult } from './MatchingView'

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

/**
 * To'g'ri javobdan keyin keyingi mashqqa o'zi o'tishdan oldingi pauza (ms).
 *
 * Yetarli: ✓ belgisi va "+XP" ni ko'rish, tovushni eshitish. Ortiqcha emas:
 * har savolda "Davom etish"ni bosish seans ritmini buzadi.
 */
const AUTO_ADVANCE_MS = 900

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
  /**
   * Har karta seansda necha marta chiqishi. Sukut — bir marta.
   *
   * Dars ekrani yangi so'zlarga 3 beradi (so'z shu darsning O'ZIDA
   * mustahkamlanadi), takrorlash ekrani esa hech nima uzatmaydi — u
   * yerda maqsad o'rgatish emas, tekshirish.
   */
  stagesFor?: (card: CardRecord) => number
  onFinish: (summary: SessionSummary) => void
}

/**
 * Mashq seansi: navbatdagi har karta uchun mos mashq yaratadi, javobni
 * tekshiradi, SM-2 bahosini chiqaradi va darhol feedback beradi.
 *
 * Takrorlash (`/review`) va dars (`/lesson`) ekranlari shu bir komponentni
 * ishlatadi — farq faqat kartalar qayerdan olinishida.
 */
export function SessionRunner({ cards, pool, stagesFor = () => 1, onFinish }: SessionRunnerProps) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const dailyGoalWords = useSettingsStore((s) => s.dailyGoalWords)

  const [queue, setQueue] = useState<LessonStep[]>(() => buildLessonQueue(cards, stagesFor))
  const [index, setIndex] = useState(0)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [answer, setAnswer] = useState<ExerciseAnswerState>(EMPTY_ANSWER)
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null)
  const [nextIntervalDays, setNextIntervalDays] = useState<number | null>(1)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [summary, setSummary] = useState<SessionSummary>(EMPTY_SUMMARY)
  /** Oxirgi javob uchun berilgan XP — feedbackda ko'rsatiladi */
  const [lastXpGained, setLastXpGained] = useState(0)
  const [goalJustCompleted, setGoalJustCompleted] = useState(false)

  // Bugungi natija ligaga SEANS TUGAGANDA bir marta yuboriladi (rozilik
  // bo'lsa). Har javobda yuborish o'nlab ortiqcha so'rov bo'lardi.
  useLeagueSync(index >= queue.length ? 'finished' : 'running')

  // Bugun mashq qilgan odamga kechqurun eslatma yuborilmasligi uchun
  usePushActivity(index >= queue.length)

  /**
   * Audio mashqlari faqat shu tilda HAQIQIY ovoz bo'lsa yaratiladi.
   *
   * MUHIM — bu bir martalik hisob EMAS: ovozlar ro'yxati asinxron yuklanadi
   * va birinchi renderda bo'sh bo'ladi. Bir marta tekshirilsa "ovoz bor" deb
   * qabul qilinardi va foydalanuvchiga hech narsa eshitilmaydigan "nima
   * eshitdingiz?" mashqi berilardi. `useHasVoice` ro'yxat to'lgach javobni
   * yangilaydi va mashq qayta tanlanadi.
   */
  const speechLocale = LANGUAGES[cards[0]?.language ?? 'en'].speechLocale
  const allowAudio = useHasVoice(speechLocale) && cards.length > 0

  // Navbatdagi karta o'zgarganda yangi mashq yaratiladi
  useEffect(() => {
    const step = queue[index]
    if (!step) {
      setExercise(null)
      return
    }

    setExercise(generateExercise({ card: step.card, pool, allowAudio, stage: step.stage }))
    setAnswer(EMPTY_ANSWER)
    setVerdict(null)
    setErrorMessage(null)
  }, [queue, index, pool, allowAudio])

  /*
   * Yangi savol pastdan siljib chiqadi.
   *
   * Usiz savollar bir-birining ustiga jimgina almashardi va yangi savol
   * kelgani sezilmasdi — ayniqsa turi bir xil bo'lganda.
   *
   * OPACITY ATAYLAB YO'Q: fon tabda yoki to'xtatilgan `rAF` da savol
   * ko'rinmas bo'lib qolardi. Siljish yarim yo'lda to'xtasa ham matn
   * o'qilaveradi.
   */
  const stageRef = useRef<HTMLDivElement>(null)

  // Faqat mashq ALMASHGANDA — obyektning o'zi qayta yaratilganda emas
  const exerciseId = exercise?.id

  useEffect(() => {
    if (!exerciseId) return

    let cancelled = false
    let context: { revert: () => void } | null = null

    void loadGsap().then((gsap) => {
      if (!gsap || cancelled || !stageRef.current) return

      context = gsap.context(() => {
        gsap.from(stageRef.current, {
          y: 16,
          duration: 0.25,
          ease: 'power2.out',
          clearProps: 'transform',
        })
      }, stageRef)
    })

    return () => {
      cancelled = true
      context?.revert()
    }
  }, [exerciseId])

  // Ekrandan chiqilganda o'qish to'xtatiladi
  useEffect(() => cancelSpeech, [])

  // Seans tugadi — nishonlar qayta hisoblanadi va hisobot bir marta yuboriladi
  /**
   * Shu seansda SM-2 jadvali allaqachon yangilangan kartalar.
   *
   * So'z ikkinchi va uchinchi marta chiqqanda javob XP va aniqlikka
   * kiradi, lekin jadvalga tegmaydi: ikki daqiqa ichida uch marta
   * "esladim" deb hisoblash intervalni asossiz uzaytirardi.
   */
  const gradedRef = useRef(new Set<string>())

  const finishedRef = useRef(false)
  useEffect(() => {
    if (finishedRef.current || index < queue.length) return

    finishedRef.current = true

    /*
     * Progress endi haqiqiy qiymatga ega — brauzerdan uni SAQLAB QOLISHNI
     * so'raymiz. Brauzer disk to'lganda IndexedDB'ni ogohlantirishsiz
     * o'chirib yuborishi mumkin, bizda esa butun o'quv tarixi faqat shu
     * yerda. Ilova ochilishida emas, aynan shu yerda so'raladi: Firefox
     * ruxsat oynasini ko'rsatadi va uni hali hech nima qilmagan odamga
     * chiqarish tushunarsiz bo'lardi.
     */
    void requestPersistentStorage()

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
      case 'spelling':
        return answer.tokenOrder.length > 0
      case 'cloze':
        return answer.choiceIndex !== null
      // Juft topishda "Tekshirish" tugmasi yo'q — yakuni o'zi keladi
      case 'matching':
        return false
    }
  }, [exercise, answer])

  /** Tekshirish uchun javobni mashq turiga mos ko'rinishga keltirish */
  function toAnswerValue(current: Exercise, given: ExerciseAnswerState): number | string {
    switch (current.type) {
      case 'recognition':
      case 'listening':
        return given.choiceIndex ?? -1
      case 'recall':
        return given.text
      case 'construction':
        return given.tokenOrder.map((tokenIndex) => current.tokens[tokenIndex]).join(' ')
      case 'cloze':
        return given.choiceIndex ?? -1
      case 'spelling':
        return given.tokenOrder.map((letterIndex) => current.letters[letterIndex]).join('')
      case 'matching':
        return -1
    }
  }

  /**
   * @param submitted variantli mashqlarda tanlangan javob to'g'ridan-to'g'ri
   *   uzatiladi — `setState` shu render'da hali ko'rinmaydi, holatga tayansak
   *   birinchi bosish "javob berilmagan" deb hisoblanardi.
   */
  const handleSubmit = useCallback(async (submitted?: ExerciseAnswerState) => {
    const given = submitted ?? answer
    const ready = submitted ? true : canSubmit
    if (!exercise || !ready || isSaving || verdict !== null) return

    const result = checkExercise(exercise, toAnswerValue(exercise, given))
    const grade = deriveGrade(exercise, result)

    setIsSaving(true)
    try {
      const cardId = exercise.card.id
      const isFirstAnswer = !gradedRef.current.has(cardId)

      const saved = isFirstAnswer ? await gradeCard(cardId, grade) : null
      if (isFirstAnswer) gradedRef.current.add(cardId)

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

      setNextIntervalDays(saved ? saved.interval : null)
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
    // Bosqich O'SHANDAYLIGICHA qoladi — foydalanuvchi uni hali o'tmadi,
    // keyingisiga ko'tarish qiyinlikni asossiz oshirardi.
    if (verdict === 'wrong') {
      const failed = queue[index]
      if (failed && queue.length < MAX_LESSON_STEPS) {
        setQueue((current) => [...current, failed])
      }
    }

    setIndex((current) => current + 1)
  }, [verdict, queue, index])

  /**
   * Juft topish yakunlandi — bir mashqda BIR NECHTA karta baholanadi.
   *
   * Baho: to'g'ri = 4, xato = 2. Nol emas, chunki juft topish tanib olishga
   * yaqin passiv tur: bu yerdagi xato so'z butunlay unutilganini bildirmaydi,
   * shuning uchun intervalni noldan boshlash haqsizlik bo'lardi.
   *
   * Navbat BITTAGA suriladi: qolgan kartalar o'z navbatida yana chiqadi,
   * bu yerdagi baho ular uchun bonus takror bo'ladi.
   */
  const handleMatchingComplete = useCallback(
    async (results: MatchingResult[]) => {
      if (isSaving) return

      setIsSaving(true)

      let correct = 0
      let wrong = 0
      let xpTotal = 0

      for (const { cardId, verdict } of results) {
        // Juft topish bir mashqda bir nechta kartani baholaydi, ya'ni
        // seansda allaqachon baholangan so'zni ikkinchi marta baholab
        // yuborishi mumkin — shuning uchun shu yerda ham tekshiriladi
        if (!gradedRef.current.has(cardId)) {
          gradedRef.current.add(cardId)
          try {
            await gradeCard(cardId, verdict === 'correct' ? 4 : 2)
          } catch (error) {
            // Bittasi saqlanmasa ham qolganlari yoziladi — butun juftlikni
            // bekor qilish foydalanuvchining mehnatini yo'qqa chiqarardi
            console.error('Juftlik bahosini saqlab bo‘lmadi:', error)
          }
        }

        try {
          const progress = await recordAnswer({ cardId, verdict, dailyGoalWords })
          xpTotal += progress.xpGained
        } catch (error) {
          console.error('XP ni yozib bo‘lmadi:', error)
        }

        if (verdict === 'correct') correct += 1
        else wrong += 1
      }

      setSummary((current) => ({
        ...current,
        answered: current.answered + results.length,
        correct: current.correct + correct,
        wrong: current.wrong + wrong,
        xpEarned: current.xpEarned + xpTotal,
      }))

      if (soundEnabled) playCorrectSound()

      setIsSaving(false)
      setIndex((current) => current + 1)
    },
    [isSaving, dailyGoalWords, soundEnabled],
  )

  /**
   * To'g'ri javobdan keyin keyingi mashqqa O'ZI o'tadi.
   *
   * Faqat "correct" uchun: o'sha panelda o'qiladigan yangi ma'lumot yo'q
   * (✓ va XP). Xato yoki "deyarli" javobda esa to'g'ri javob, talaffuz va
   * assotsiatsiya yozish taklifi ko'rsatiladi — u yerda vaqtni foydalanuvchi
   * o'zi belgilaydi, aks holda o'rganishning eng foydali lahzasi qochadi.
   *
   * "Davom etish" tugmasi qoladi: kutmasdan darhol o'tish mumkin.
   */
  useEffect(() => {
    if (verdict !== 'correct') return

    const timer = setTimeout(handleContinue, AUTO_ADVANCE_MS)
    return () => clearTimeout(timer)
  }, [verdict, handleContinue])

  if (!exercise) return null

  /** Variantli mashqda javob bir bosishda beriladi */
  const isChoiceExercise =
    exercise.type === 'recognition' || exercise.type === 'listening' || exercise.type === 'cloze'

  // Juft topish bir mashqda bir nechta kartani baholaydi, shuning uchun
  // ko'rsatkich navbat uzunligidan oshib ketishi mumkin
  const progressValue = Math.min(summary.answered, queue.length)

  // Juft topish standart "javob → feedback" oqimidan chetda: o'z yakunini
  // o'zi belgilaydi, shuning uchun FeedbackBar va bir-javob mashinasi
  // chetlab o'tiladi
  if (exercise.type === 'matching') {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <ProgressBar value={progressValue} max={queue.length} label="Seans progressi" />
          <span data-testid="session-progress" className="text-sm font-semibold text-ink-600">
            {progressValue}/{queue.length}
          </span>
        </div>

        <MatchingView
          exercise={exercise}
          onComplete={(results) => void handleMatchingComplete(results)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-3">
        <ProgressBar value={progressValue} max={queue.length} label="Seans progressi" />
        <span data-testid="session-progress" className="text-sm font-semibold text-ink-600">
          {progressValue}/{queue.length}
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

      <div ref={stageRef}>
        <ExerciseView
          exercise={exercise}
          answer={answer}
          onAnswerChange={setAnswer}
          revealed={verdict !== null}
          onSubmit={(submitted) => void handleSubmit(submitted)}
        />
      </div>

      <div className="mt-auto pt-2">
        {verdict === null ? (
          // Variant tanlash o'zi javob berish hisoblanadi — u yerda
          // "Tekshirish" tugmasi hech qachon bosilmasdi
          isChoiceExercise ? null : (
            <Button
              block
              size="lg"
              disabled={!canSubmit || isSaving}
              onClick={() => void handleSubmit()}
            >
              Tekshirish
            </Button>
          )
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
