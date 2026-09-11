import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ExerciseHelpButton } from './ExerciseHelpButton'
import { WordIntro } from './WordIntro'
import { LANGUAGES } from '@/core/config/languages'
import {
  finalizeSession,
  gradeCard,
  recordAnswer,
  recordTypeResult,
  type CardRecord,
} from '@/core/db'
import {
  checkExercise,
  deriveGrade,
  generateExercise,
  type AnswerVerdict,
  type Exercise,
} from '@/core/exercises'
import type { ExerciseType } from '@/core/types'
import { MAX_LESSON_STEPS, buildLessonQueue, type LessonStep } from '@/core/lesson/queue'
import { LUCKY_MULTIPLIER, gameGrade, isLucky } from '@/core/games'
import {
  applyAnswer,
  emptyProgress,
  REQUIRED_STREAK,
  excludedTypesFor,
  pickNextCardId,
  weakestType,
  EXERCISE_TYPES,
  type WordProgress,
} from '@/core/mastery'
import { comboBonusXp, nextCombo, xpForAnswer } from '@/core/gamification'
import { slideIn, withMotion } from '@/lib/motion'
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
  /** Benuqson seans uchun berilgan bonus (0 — benuqson emas) */
  perfectBonusXp: number
  /** Shu seansda ochilgan nishonlar id lari */
  newBadges: string[]
  /** O'zlashtirilgan so'zlar (faqat `mastery` rejimida) */
  masteredWords: number
  /**
   * O'zlashtirilmay qolgan so'zlar.
   *
   * Nolldan katta bo'lishi — 60 qadamlik chegara ishlaganini bildiradi.
   * Yakun panelida bu HALOL aytiladi: bola nima qilganini va nima
   * qolganini bilishi kerak.
   */
  pendingWords: number
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
  perfectBonusXp: 0,
  newBadges: [],
  masteredWords: 0,
  pendingWords: 0,
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
  /**
   * Seans qanday tugaydi.
   *
   * `fixed` — oldindan tuzilgan navbat tugaganda (takrorlash ekrani:
   * maqsad o'rgatish emas, SM-2 ni tekshirish).
   *
   * `mastery` — har so'z O'ZLASHTIRILGANDA. Navbat oldindan ma'lum
   * emas: har javobdan keyin eng kam bilingan so'z tanlanadi va
   * so'z ikki xil turdagi mashqda ketma-ket to'g'ri javob olguncha
   * qaytaveradi (`core/mastery`).
   */
  mode?: 'fixed' | 'mastery'
  /**
   * O'zlashtirish uchun kerakli ketma-ket to'g'ri javoblar.
   *
   * Sukut — 2 (yangi so'z: bitta javob taxmin bo'lishi mumkin).
   * Aralash TAKROR bosqichida 1 uzatiladi: u yerdagi so'zlar
   * allaqachon o'rganilgan va ikki xil turni talab qilish darsni
   * ikki barobar uzaytirardi.
   */
  requiredStreak?: number
  onFinish: (summary: SessionSummary) => void
}

/**
 * O'zlashtirish rejimida seansning eng ko'p qadami.
 *
 * NEGA CHEGARA KERAK: "100% gacha" qoidasi qattiq qo'llansa,
 * qiynalayotgan bola darsdan umuman chiqolmasdi. Chegaraga yetilganda
 * seans halol tugaydi va o'zlashtirilmagan so'zlar ertaga birinchi
 * navbatda qaytadi — bola muvaffaqiyat bilan chiqadi, mag'lubiyat
 * bilan emas.
 */
export const MAX_SESSION_STEPS = 60

/**
 * Mashq seansi: navbatdagi har karta uchun mos mashq yaratadi, javobni
 * tekshiradi, SM-2 bahosini chiqaradi va darhol feedback beradi.
 *
 * Takrorlash (`/review`) va dars (`/lesson`) ekranlari shu bir komponentni
 * ishlatadi — farq faqat kartalar qayerdan olinishida.
 */
export function SessionRunner({
  cards,
  pool,
  stagesFor = () => 1,
  mode = 'fixed',
  requiredStreak = REQUIRED_STREAK,
  onFinish,
}: SessionRunnerProps) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const dailyGoalWords = useSettingsStore((s) => s.dailyGoalWords)

  /**
   * Har so'zning o'zlashtirish holati (faqat `mastery` rejimida).
   *
   * `useState` (`useRef` emas): ko'rsatkich shu holatdan hisoblanadi,
   * ya'ni o'zgarish qayta render talab qiladi.
   */
  const [mastery, setMastery] = useState<Map<string, WordProgress>>(
    () => new Map(cards.map((card) => [card.id, emptyProgress(card.id)])),
  )

  /**
   * Navbat.
   *
   * `mastery` rejimida u OLDINDAN to'liq emas: bitta qadam bilan
   * boshlanadi va har javobdan keyin keyingi qadam qo'shiladi. Shu
   * tufayli "navbat tugadi" sharti (`index >= queue.length`) ikkala
   * rejimda ham bir xil ishlaydi.
   */
  const [queue, setQueue] = useState<LessonStep[]>(() => {
    if (mode === 'fixed') return buildLessonQueue(cards, stagesFor)

    const first = cards[0]
    return first ? [{ card: first, stage: 0 }] : []
  })

  /** Shu kartaning o'zlashtirish holati (yo'q bo'lsa — bo'sh) */
  const progressFor = useCallback(
    (cardId: string) => mastery.get(cardId) ?? emptyProgress(cardId),
    [mastery],
  )

  /**
   * Seansdagi REJALASHTIRILGAN qadamlar soni — progress maxraji.
   *
   * `queue.length` EMAS: xato javob qadamni navbat oxiriga qaytaradi va
   * navbat uzayadi. O'lchandi: foydalanuvchi 0/12 → 1/13 → 2/14 ni
   * ko'rardi — ya'ni har xatoda MAQSAD UNDAN UZOQLASHARDI. Bu jazolash
   * hissini beradi va "yana qancha qoldi?" degan savolga yolg'on javob.
   *
   * Qayta urinish yangi maqsad emas — o'sha maqsadning ikkinchi imkoni.
   */
  const plannedSteps = useRef(queue.length).current
  const [index, setIndex] = useState(0)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [answer, setAnswer] = useState<ExerciseAnswerState>(EMPTY_ANSWER)
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null)
  const [nextIntervalDays, setNextIntervalDays] = useState<number | null>(1)
  /**
   * BAHOLANGAN karta — feedback panelidagi "so'z kuchi" uchun.
   *
   * `exercise.card` mashq yaratilgan paytdagi holat, ya'ni javobdan
   * OLDINGI. Indikator uni o'qisa, bola bugun qilgan ishi so'zni
   * oldinga surganini KO'RMASDI — indikatorning butun maqsadi shu edi.
   */
  const [gradedCard, setGradedCard] = useState<CardRecord | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [summary, setSummary] = useState<SessionSummary>(EMPTY_SUMMARY)
  /** Oxirgi javob uchun berilgan XP — feedbackda ko'rsatiladi */
  const [lastXpGained, setLastXpGained] = useState(0)
  const [goalJustCompleted, setGoalJustCompleted] = useState(false)
  /** Ketma-ket to'g'ri javoblar — seans ichidagi holat, saqlanmaydi */
  const [combo, setCombo] = useState(0)
  /**
   * Shu savol "omadli" mi — XP ikki barobar.
   *
   * Javobdan OLDIN e'lon qilinadi: dofaminning asosiy manbai
   * mukofotning o'zi emas, uni KUTISH. O'zgaruvchan mukofot
   * (tasodifiy kelishi) barqarordan kuchliroq ta'sir qiladi.
   */
  const [lucky, setLucky] = useState(false)

  /**
   * Shu seansda TANISHTIRILGAN so'zlar.
   *
   * Bola hech ko'rmagan so'zning tarjimasini variantlardan topa olmaydi —
   * u faqat taxmin qiladi. Shuning uchun hali bir marta ham takrorlanmagan
   * so'z birinchi savolidan OLDIN ko'rsatiladi: so'z, tarjimasi, talaffuzi.
   *
   * `useRef` (`useState` emas): to'plamga yozish qayta render talab
   * qilmaydi — ko'rinishni `introCard` ning o'zi boshqaradi.
   */
  /**
   * Muvaffaqiyatli o'tilgan qadamlar (`kartaId:bosqich`).
   *
   * Progress ko'rsatkichi shu to'plamga tayanadi: xato javob qadamni
   * o'tgan deb hisoblamaydi, qayta urinib to'g'ri javob berilganda esa
   * qadam bir marta qo'shiladi.
   */
  const [doneSteps, setDoneSteps] = useState<Set<string>>(() => new Set())

  const introducedRef = useRef(new Set<string>())
  const [introCard, setIntroCard] = useState<CardRecord | null>(null)

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
  /** Savol animatsiyasi yo'nalishi — arabchada teskari tomondan kiradi */
  const dir = LANGUAGES[cards[0]?.language ?? 'en'].dir
  const allowAudio = useHasVoice(speechLocale) && cards.length > 0

  // Navbatdagi karta o'zgarganda yangi mashq yaratiladi
  useEffect(() => {
    const step = queue[index]
    if (!step) {
      setExercise(null)
      return
    }

    /*
     * TANISHTIRISH avval. `totalReviews === 0` — so'z hech qachon
     * so'ralmagan, ya'ni uni bilishning imkoni yo'q.
     *
     * "Ko'rsatildi" belgisi BU YERDA QO'YILMAYDI, "Tushundim" bosilganda
     * qo'yiladi. Sabab o'lchangan: bu effekt `allowAudio` ga ham bog'liq,
     * u esa ovozlar ro'yxati asinxron yuklangach false→true bo'ladi.
     * Belgi shu yerda qo'yilganda effekt ikkinchi marta ishlab, endigina
     * ochilgan tanishtirishni o'zi yopib yuborardi — kartani hech kim
     * ko'rmasdi.
     */
    const needsIntro =
      step.card.totalReviews === 0 && !introducedRef.current.has(step.card.id)

    setIntroCard(needsIntro ? step.card : null)

    /*
     * O'zlashtirish rejimida OXIRGI to'g'ri javob turi chetlanadi:
     * qoida ikki XIL turda ketma-ket to'g'ri javobni talab qiladi
     * (`core/mastery/progress.ts`).
     */
    const excludeTypes = mode === 'mastery' ? excludedTypesFor(progressFor(step.card.id)) : []

    /*
     * ZAIF KO'NIKMAGA yo'naltirish: foydalanuvchi shu so'zda eng ko'p
     * qiynalayotgan tur yarim ehtimol bilan tanlanadi. Chetlangan
     * turlar bundan chiqariladi — aks holda qoida buzilardi.
     */
    const preferType = weakestType(
      step.card,
      EXERCISE_TYPES.filter((type) => !excludeTypes.includes(type)),
    )

    setExercise(
      generateExercise({
        card: step.card,
        pool,
        // Juftlar seansning O'Z so'zlaridan — begona so'z darsga kirmaydi
        partners: cards,
        allowAudio,
        stage: step.stage,
        excludeTypes,
        preferType,
      }),
    )
    setAnswer(EMPTY_ANSWER)
    setVerdict(null)
    setErrorMessage(null)
    setGradedCard(null)
    setLucky(isLucky())
  // `mastery` ataylab bog'liqlikda EMAS: u har javobda o'zgaradi va
  // mashqni javob berilgan zahoti qayta yaratib yuborardi
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, index, pool, cards, allowAudio, mode])

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
  /** Fokus nishoni — GSAP unga TEGMAYDI (pastdagi izohga qarang) */
  const stageRef = useRef<HTMLDivElement>(null)
  /** Animatsiya nishoni */
  const animRef = useRef<HTMLDivElement>(null)

  // Faqat mashq ALMASHGANDA — obyektning o'zi qayta yaratilganda emas
  const exerciseId = exercise?.id

  useEffect(() => {
    if (!exerciseId) return

    let cancelled = false
    let revert = () => {}

    // Savol yon tomondan siljib kiradi. RTL'da teskari tomondan:
    // arabcha o'quvchi uchun "keyingi" — chap tomon
    void withMotion(animRef.current, (gsap) => {
      slideIn(gsap, animRef.current as Element, dir)
    }).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [exerciseId, dir])

  /*
   * Yangi savol chizilganda FOKUS unga ko'chiriladi.
   *
   * "Davom etish" tugmasi DOM'dan olib tashlanadi va fokus <body> ga
   * tushadi — klaviatura foydalanuvchisi har savolda sahifa boshidan
   * qaytadan Tab bosishga majbur bo'lardi. `FeedbackBar` da xuddi shu
   * naqsh bor (u paydo bo'lganda o'ziga fokus oladi).
   *
   * FAQAT fokus <body> da bo'lsa: "eslab yozish" mashqida `ExerciseView`
   * kiritish maydoniga fokus beradi va uni tortib olish yaramaydi.
   */
  useEffect(() => {
    if (!exerciseId) return
    if (document.activeElement && document.activeElement !== document.body) return

    stageRef.current?.focus()
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

    // O'zlashtirish hisobi — yakun panelida halol ko'rsatiladi
    const mastered = mode === 'mastery' ? [...mastery.values()].filter((w) => w.mastered).length : 0
    const counts = {
      masteredWords: mastered,
      pendingWords: mode === 'mastery' ? cards.length - mastered : 0,
    }

    finalizeSession({ answered: summary.answered, wrong: summary.wrong })
      .then(({ newlyUnlocked, perfectBonusXp }) =>
        onFinish({
          ...summary,
          ...counts,
          // Benuqson bonusi bazaga `finalizeSession` da yozildi — yakun
          // ekranidagi son bilan haqiqiy XP mos kelishi uchun bu yerda ham
          xpEarned: summary.xpEarned + perfectBonusXp,
          perfectBonusXp,
          newBadges: newlyUnlocked,
        }),
      )
      .catch((error: unknown) => {
        // Nishonlarni hisoblab bo'lmasa ham seans yakuni ko'rsatiladi:
        // geymifikatsiya o'quv jarayonini to'sib qo'ymasligi kerak
        console.error('Nishonlarni yangilab bo‘lmadi:', error)
        onFinish({ ...summary, ...counts })
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, queue.length, onFinish, summary])

  /**
   * Javoblarni o'zlashtirish holatiga qo'llaydi va YANGI xaritani
   * qaytaradi. Qaytarish shart: `setState` shu render'da ko'rinmaydi,
   * keyingi qadam esa aynan yangilangan holatdan tanlanadi.
   */
  const applyToMastery = useCallback(
    (results: ReadonlyArray<{ cardId: string; verdict: AnswerVerdict }>, type: ExerciseType) => {
      const next = new Map(mastery)

      for (const result of results) {
        /*
         * FAQAT shu seansning so'zlari. Juft topish mashqi juftlarni
         * butun POOL dan oladi, ya'ni natijalar orasida darsga
         * kirmagan kartalar ham bo'ladi. Ular xaritaga tushsa,
         * keyingi qadam o'sha "begona" so'zga tanlanar, `cards` da
         * topilmasdi va seans o'zlashtirilmagan so'zlar qolganida
         * jimgina tugab qolardi (o'lchandi: 4 ta so'zdan 3 tasi).
         */
        const current = next.get(result.cardId)
        if (!current) continue

        next.set(result.cardId, applyAnswer(current, result.verdict, type, requiredStreak))
      }

      setMastery(next)

      return next
    },
    [mastery, requiredStreak],
  )

  /**
   * Keyingi qadamni navbatga qo'shadi (o'zlashtirish rejimi).
   *
   * Hech nima qo'shilmasa seans tugaydi: `index >= queue.length`.
   */
  const enqueueNext = useCallback(
    (state: Map<string, WordProgress>, lastShownId: string | null, stepsUsed: number) => {
      if (stepsUsed >= MAX_SESSION_STEPS) return

      const nextId = pickNextCardId([...state.values()], lastShownId)
      if (!nextId) return

      const card = cards.find((item) => item.id === nextId)
      if (!card) return

      // Qiyinlik pog'onasi so'zga berilgan savollar soniga qarab
      // ko'tariladi: birinchi marta tanish, keyin yozish, so'ng yig'ish
      const stage = state.get(nextId)?.asked ?? 0

      setQueue((current) => [...current, { card, stage }])
    },
    [cards],
  )

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

    // Kombo javob YOZILISHIDAN oldin hisoblanadi: bonus aynan shu
    // javobning XP siga qo'shiladi va bitta tranzaksiyada saqlanadi
    const streak = nextCombo(combo, result)
    setCombo(streak)

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
          /*
           * OMADLI KARTA bonusi shu yerda, `bonusXp` orqali beriladi.
           *
           * Natijani ekranda ko'paytirish YARAMAYDI: bazaga oddiy XP
           * yozilar va foydalanuvchi "+20 XP" ni ko'rib, aslida 10 ta
           * olardi. Bonus ham aynan shu tranzaksiyaga qo'shiladi —
           * ikki yozuv orasida ilova yopilsa u yo'qolardi.
           */
          bonusXp:
            comboBonusXp(streak) + (lucky ? xpForAnswer(result) * (LUCKY_MULTIPLIER - 1) : 0),
        })
        xpGained = progress.xpGained
        goalCompleted = progress.goalJustCompleted
      } catch (error) {
        console.error('XP ni yozib bo‘lmadi:', error)
      }

      setNextIntervalDays(saved ? saved.interval : null)
      setGradedCard(saved)
      /*
       * Qadam FAQAT to'g'ri (yoki "deyarli") javobda bajarilgan
       * hisoblanadi. Xato javobda u navbat oxiriga qaytadi va progress
       * ko'rsatkichi joyida qoladi — foydalanuvchi qayta urinib ko'radi.
       */
      if (result !== 'wrong') {
        const step = queue[index]
        if (step) {
          setDoneSteps((current) => new Set(current).add(`${step.card.id}:${step.stage}`))
        }
      }

      /*
       * KO'NIKMA statistikasi — QAYSI mashq turi oqsayotganini yozadi.
       * SM-2 dan mustaqil: u so'z qachon qaytishini, bu esa qaysi
       * ko'nikma zaifligini o'lchaydi.
       */
      void recordTypeResult(cardId, exercise.type, result === 'wrong')

      // O'zlashtirish holati — keyingi qadam aynan shundan tanlanadi
      if (mode === 'mastery') {
        applyToMastery([{ cardId: exercise.card.id, verdict: result }], exercise.type)
      }

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
    /*
     * `queue`, `index` va `applyToMastery` BOG'LIQLIKDA BO'LISHI SHART.
     *
     * O'lchangan xato: ular yo'q edi va funksiya BIRINCHI renderdagi
     * bo'sh o'zlashtirish xaritasini ushlab qolardi. Har javob o'sha
     * eski xaritadan yangisini yasardi, ya'ni oldingi javoblar
     * yo'qolardi — ko'rsatkich 9 ta to'g'ri javobdan keyin ham 0/4 da
     * turardi va dars hech qachon o'zlashtirilmasdi.
     */
  }, [
    exercise,
    canSubmit,
    isSaving,
    verdict,
    answer,
    soundEnabled,
    dailyGoalWords,
    combo,
    queue,
    index,
    mode,
    applyToMastery,
    lucky,
  ])

  /** Feedback'dan keyin keyingi mashqqa o'tish */
  const handleContinue = useCallback(() => {
    if (mode === 'mastery') {
      /*
       * Keyingi qadam O'ZLASHTIRISH HOLATIDAN tanlanadi: eng kam
       * bilingan so'z oldinga chiqadi va o'zlashtirilgani boshqa
       * qaytmaydi. Hech nima qo'shilmasa seans tugaydi.
       */
      enqueueNext(mastery, queue[index]?.card.id ?? null, queue.length)
    } else if (verdict === 'wrong') {
      // Xato javob berilgan karta shu seansning oxiriga qaytariladi:
      // darhol qayta eslab chaqirish (retrieval practice) samaraliroq.
      // Bosqich O'SHANDAYLIGICHA qoladi — foydalanuvchi uni hali o'tmadi,
      // keyingisiga ko'tarish qiyinlikni asossiz oshirardi.
      const failed = queue[index]
      if (failed && queue.length < MAX_LESSON_STEPS) {
        setQueue((current) => [...current, failed])
      }
    }

    setIndex((current) => current + 1)
  }, [verdict, queue, index, mode, mastery, enqueueNext])

  /**
   * Juft topish yakunlandi — bir mashqda BIR NECHTA karta baholanadi.
   *
   * Baho `gameGrade` orqali: to'g'ri = 4, xato = 3 ("qiyin, lekin
   * o'tdi"). Juft topish tanib olishga yaqin passiv tur: bu yerdagi xato
   * so'z butunlay unutilganini bildirmaydi. Ilgari 2 berilardi va bu
   * SM-2 uchun yiqilish edi — interval noldan boshlanar, `lapses`
   * oshardi (`core/games/grade.ts`).
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

      /*
       * FAQAT seansning o'z so'zlari baholanadi. Sheriklar kam bo'lganda
       * taxta `pool` dan to'ldiriladi — o'sha begona so'z hali
       * o'rgatilmagan (yoki o'z jadvalida) va bir juftlik uchun SM-2
       * jadvaliga tushmasligi kerak: aks holda u "takrorlash"
       * navbatida paydo bo'lardi.
       */
      const own = new Set(cards.map((card) => card.id))
      const ownResults = results.filter((result) => own.has(result.cardId))

      for (const { cardId, verdict } of ownResults) {
        // Juft topish bir mashqda bir nechta kartani baholaydi, ya'ni
        // seansda allaqachon baholangan so'zni ikkinchi marta baholab
        // yuborishi mumkin — shuning uchun shu yerda ham tekshiriladi
        if (!gradedRef.current.has(cardId)) {
          gradedRef.current.add(cardId)
          try {
            await gradeCard(cardId, gameGrade(verdict === 'correct'))
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
        answered: current.answered + ownResults.length,
        correct: current.correct + correct,
        wrong: current.wrong + wrong,
        xpEarned: current.xpEarned + xpTotal,
      }))

      // Juft topish bitta qadam: u to'liq tugagandagina bajarilgan
      const matchingStep = queue[index]
      if (matchingStep) {
        setDoneSteps((current) =>
          new Set(current).add(`${matchingStep.card.id}:${matchingStep.stage}`),
        )
      }

      /*
       * Juft topish BIR NECHTA kartani baholaydi — hammasi
       * o'zlashtirish holatiga tushadi. Keyingi qadam shu yerda
       * qo'shiladi: bu mashqda "Davom etish" tugmasi yo'q.
       */
      if (mode === 'mastery') {
        const next = applyToMastery(results, 'matching')
        enqueueNext(next, matchingStep?.card.id ?? null, queue.length)
      }

      if (soundEnabled) playCorrectSound()

      setIsSaving(false)
      setIndex((current) => current + 1)
    },
    [isSaving, dailyGoalWords, soundEnabled, queue, index, mode, applyToMastery, enqueueNext, cards],
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
  /*
   * BAJARILGAN qadamlar: har qadam bir marta sanaladi.
   *
   * `summary.answered` EMAS: u qayta urinishlarni ham sanaydi va maxraj
   * qotirilganda ko'rsatkich 13/12 bo'lib ketardi.
   */
  /*
   * O'zlashtirish rejimida ko'rsatkich QADAMLARNI emas, SO'ZLARNI
   * sanaydi: bola savollarni emas, so'zlarni o'rganadi va uning
   * ongidagi model shunday. `mastered` qaytmas holat, ya'ni ko'rsatkich
   * hech qachon orqaga ketmaydi.
   */
  const masteredCount = [...mastery.values()].filter((item) => item.mastered).length

  const progressValue =
    mode === 'mastery' ? masteredCount : Math.min(doneSteps.size, plannedSteps)
  const progressMax = mode === 'mastery' ? cards.length : plannedSteps

  /*
   * Tanishtirish mashqning O'RNIGA emas, OLDIDAN chiziladi: "Tushundim"
   * bosilgach ayni shu savol ochiladi. Shuning uchun `index` o'zgarmaydi
   * va progress ko'rsatkichi ham joyida qoladi.
   */
  if (introCard) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <ProgressBar value={progressValue} max={progressMax} label="Seans progressi" />
          <span data-testid="session-progress" className="text-sm font-semibold text-ink-600">
            {progressValue}/{progressMax}
          </span>
        </div>

        <WordIntro
          card={introCard}
          onContinue={() => {
            introducedRef.current.add(introCard.id)
            setIntroCard(null)
          }}
        />
      </div>
    )
  }


  // Juft topish standart "javob → feedback" oqimidan chetda: o'z yakunini
  // o'zi belgilaydi, shuning uchun FeedbackBar va bir-javob mashinasi
  // chetlab o'tiladi
  if (exercise.type === 'matching') {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <ProgressBar value={progressValue} max={progressMax} label="Seans progressi" />
          <span data-testid="session-progress" className="text-sm font-semibold text-ink-600">
            {progressValue}/{progressMax}
          </span>
        </div>

        <ExerciseHelpButton type="matching" />

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
        <ProgressBar value={progressValue} max={progressMax} label="Seans progressi" />
        <span data-testid="session-progress" className="text-sm font-semibold text-ink-600">
          {progressValue}/{progressMax}
        </span>

        {/*
          Kombo 2 dan boshlab ko'rinadi: "🔥 1" har to'g'ri javobdan keyin
          chiqib, shovqinga aylanardi va hech nima anglatmasdi.
        */}
        {/*
          OMADLI KARTA javobdan OLDIN e'lon qilinadi: dofaminning
          asosiy manbai mukofotning o'zi emas, uni KUTISH.
        */}
        {lucky && verdict === null && (
          <span
            data-testid="lucky-badge"
            className="shrink-0 rounded-full bg-flame-500/20 px-2.5 py-1 text-sm font-extrabold text-flame-700"
          >
            ✨ ×{LUCKY_MULTIPLIER} XP
          </span>
        )}

        {combo >= 2 && (
          <span
            data-testid="combo"
            className="shrink-0 rounded-full bg-flame-500/15 px-2.5 py-1 text-sm font-extrabold text-flame-700"
          >
            🔥 {combo}
          </span>
        )}
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-2xl border border-wrong-500/40 bg-wrong-500/10 px-4 py-3 text-sm font-semibold text-wrong-600"
        >
          {errorMessage}
        </p>
      )}

      {/*
        IKKI QATLAM: tashqisi fokusni oladi, ichkisi animatsiyalanadi.
        Bitta elementda bo'lsa, GSAP fokusni yo'qotardi — o'lchandi:
        fokus berilgandan ~50 ms keyin u <body> ga qaytardi va klaviatura
        foydalanuvchisi har savolda sahifa boshidan Tab bosishga majbur
        bo'lardi.

        `tabIndex={-1}` — dasturiy fokus uchun; Tab tartibiga kirmaydi.
      */}
      {/*
        Ko'rsatma mashqning O'ZIDAN oldin turadi: birinchi marta ochilganda
        u savolni pastga surib yubormaydi, chunki savol allaqachon pastda.
      */}
      {/*
        `key` — HAR JAVOBDAN KEYIN komponent qaytadan yaratiladi.
        Usiz birinchi savolda ochilgan ko'rsatma seans oxirigacha ochiq
        qolar va har savolda ekranning uchdan birini egallab turardi.
        Yangi nusxa esa "bu tur ko'rilganmi" ni qaytadan o'qiydi.

        Kalitda javoblar SONI ham bor: xato javobdan keyin ayni savol
        qaytadan chiqadi va `exercise.id` o'zgarmaydi — faqat id bo'lsa
        ko'rsatma o'sha yerda ochiq qolardi.
      */}
      <ExerciseHelpButton key={`${exercise.id}:${summary.answered}`} type={exercise.type} />

      <div ref={stageRef} tabIndex={-1} className="focus:outline-none">
        <div ref={animRef}>
        <ExerciseView
          exercise={exercise}
          answer={answer}
          onAnswerChange={setAnswer}
          revealed={verdict !== null}
          onSubmit={(submitted) => void handleSubmit(submitted)}
        />
        </div>
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
            gradedCard={gradedCard}
            xpGained={lastXpGained}
            goalJustCompleted={goalJustCompleted}
            onContinue={handleContinue}
          />
        )}
      </div>
    </div>
  )
}
