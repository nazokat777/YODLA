import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { LinkButton } from '@/components/ui/LinkButton'
import { Panel } from '@/components/ui/Panel'
import { getAllCards, recordExamPassed, recordLessonCompleted, type CardRecord } from '@/core/db'
import { examCoverage, examKey, pickExamCards } from '@/core/exam'
import { mergeLevelUp } from '@/core/gamification'
import { estimateMinutes } from '@/core/lesson/eta'
import { buildUnits, type PathUnit } from '@/core/path'
import { useTopicOrder } from '@/features/home/useTopicOrder'
import { SessionRunner, type SessionSummary } from '@/features/session/SessionRunner'
import { SessionSummaryPanel } from '@/features/session/SessionSummaryPanel'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { ExamReport } from './ExamReport'

/**
 * Imtihon bosqichlari.
 *
 *  intro → exam → (fix) → done
 *
 * `fix` — "xatolar ustida ishlash": imtihonda xato qilingan so'zlar
 * O'ZLASHTIRISH rejimida (ikki xil mashqda ketma-ket to'g'ri) qaytadi.
 * Imtihon shu bosqich tugamaguncha "topshirilgan" hisoblanmaydi — aks
 * holda 60% bilan o'tib ketilgan bo'lardi va "birorta so'z o'zlashtirilmay
 * qolmasin" talabi bajarilmasdi.
 */
type Phase = 'intro' | 'exam' | 'fix' | 'done'

/** Kirishda nechta bo'lim nomi chiziladi — 30-darsda ro'yxat ekranni to'ldirmasin */
const INTRO_UNIT_CHIPS = 10

/** Bo'sh yig'indi — bosqich natijalarini qo'shishda tayanch */
const EMPTY: SessionSummary = {
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

/** Ikki bosqich natijasini qo'shadi */
function mergeSummaries(first: SessionSummary, second: SessionSummary): SessionSummary {
  return {
    answered: first.answered + second.answered,
    correct: first.correct + second.correct,
    almost: first.almost + second.almost,
    wrong: first.wrong + second.wrong,
    xpEarned: first.xpEarned + second.xpEarned,
    perfectBonusXp: first.perfectBonusXp + second.perfectBonusXp,
    newBadges: [...new Set([...first.newBadges, ...second.newBadges])],
    masteredWords: first.masteredWords + second.masteredWords,
    pendingWords: second.pendingWords,
    levelUp: mergeLevelUp(first.levelUp, second.levelUp),
    learnedWords: [
      ...(first.learnedWords ?? []),
      ...(second.learnedWords ?? []).filter(
        (word) => !(first.learnedWords ?? []).some((known) => known.id === word.id),
      ),
    ],
    // Imtihondagi xatolar — hisobot uchun BIRINCHI urinishniki qoladi
    missedWords: first.missedWords,
  }
}

/**
 * YIG'MA IMTIHON — bo'lim tugagach, shu bo'limgacha bo'lgan HAMMASI.
 *
 * NEYROBIOLOGIYA: eslab chaqirishga urinish (retrieval) xotira izini
 * qayta o'qishdan ancha kuchliroq mustahkamlaydi — ayniqsa urinish
 * QIYIN bo'lsa ("desirable difficulty", Bjork). Yig'ma imtihon aynan
 * shuni beradi: eski mavzular yangilari bilan ARALASH keladi, bola
 * har savolda "bu qaysi mavzudan?" deb qo'shimcha ish qiladi.
 *
 * Xato — jazo emas, signal: xato so'z darhol "xatolar ustida ishlash"
 * bosqichiga tushadi va o'zlashtirilguncha qaytadi. Imtihon 100% bilan
 * tugaydi — har doim. Shuning uchun yakun har safar g'alaba.
 */
export function ExamScreen() {
  const navigate = useNavigate()
  const { unitId } = useParams<{ unitId: string }>()
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const startingLevel = useSettingsStore((s) => s.startingLevel)
  const topicOrder = useTopicOrder(learningLanguage)

  const [allCards, setAllCards] = useState<CardRecord[] | null>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const [examSummary, setExamSummary] = useState<SessionSummary | null>(null)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [bonusXp, setBonusXp] = useState(0)
  const [exitAsked, setExitAsked] = useState(false)

  useEffect(() => {
    if (!learningLanguage) return
    let cancelled = false
    setAllCards(null)
    setPhase('intro')
    setExamSummary(null)
    setSummary(null)
    getAllCards(learningLanguage)
      .then((cards) => {
        if (!cancelled) setAllCards(cards)
      })
      .catch((error: unknown) => {
        console.error('Imtihonni yuklab bo‘lmadi:', error)
        if (!cancelled) setAllCards([])
      })
    return () => {
      cancelled = true
    }
  }, [learningLanguage, unitId])

  /** Qamrov: bo'limgacha bo'lgan hammasi (o'tkazib yuborilganlar emas) */
  const covered = useMemo<PathUnit[] | null>(() => {
    if (!allCards || topicOrder === null || !unitId) return null
    const units = buildUnits(allCards, { minLevel: startingLevel, topicOrder })
    return examCoverage(units, unitId)
  }, [allCards, topicOrder, unitId, startingLevel])

  /*
   * Savollar BIR MARTA tuziladi (`useMemo`): har renderda qayta
   * aralashtirilsa, seans o'rtasida navbat almashib ketardi.
   */
  const examCards = useMemo(
    () => (covered && allCards ? pickExamCards(covered, allCards, Date.now()) : []),
    [covered, allCards],
  )

  /** Imtihonda xato qilingan kartalar — "xatolar ustida ishlash" uchun */
  const missedCards = useMemo(() => {
    const missed = new Set((examSummary?.missedWords ?? []).map((word) => word.id))
    return examCards.filter((card) => missed.has(card.id))
  }, [examSummary, examCards])

  const finish = useCallback(
    async (first: SessionSummary, total: SessionSummary) => {
      if (!unitId || !learningLanguage) return
      const correct = examCards.length - (first.missedWords?.length ?? 0)
      // Kunlik chaqiriq "bitta darsni o'zlashtir" — imtihon ham sanaladi:
      // u darsdan kam emas, ko'p ish
      void recordLessonCompleted()
      try {
        const { bonusXp: bonus, newBadges } = await recordExamPassed(examKey(learningLanguage, unitId), {
          correct,
          total: examCards.length,
        })
        setBonusXp(bonus)
        setSummary({
          ...total,
          xpEarned: total.xpEarned + bonus,
          newBadges: [...new Set([...total.newBadges, ...newBadges])],
        })
      } catch (error) {
        console.error('Imtihon natijasini yozib bo‘lmadi:', error)
        setSummary(total)
      }
      setPhase('done')
    },
    [unitId, learningLanguage, examCards.length],
  )

  /** Imtihon savollari tugadi */
  const handleExamFinish = useCallback(
    (result: SessionSummary) => {
      setExamSummary(result)
      if ((result.missedWords?.length ?? 0) > 0) {
        setPhase('fix')
        return
      }
      void finish(result, result)
    },
    [finish],
  )

  /** Xatolar ustida ishlash tugadi */
  const handleFixFinish = useCallback(
    (result: SessionSummary) => {
      const first = examSummary ?? EMPTY
      void finish(first, mergeSummaries(first, result))
    },
    [examSummary, finish],
  )

  const inProgress = phase === 'exam' || phase === 'fix'
  const handleExit = useCallback(() => {
    if (inProgress) setExitAsked(true)
    else navigate(PATHS.home)
  }, [inProgress, navigate])

  const isLoading = allCards === null || covered === null
  const unitCount = covered?.length ?? 0
  const title =
    phase === 'fix' ? 'Xatolar ustida ishlash' : unitCount > 0 ? `Imtihon · 1–${unitCount}` : 'Imtihon'

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleExit}
          aria-label="Imtihondan chiqish"
          className="tap-highlight-none -ms-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl text-ink-600"
        >
          ✕
        </button>
        <h1 className="text-lg font-extrabold">{title}</h1>
      </div>

      {isLoading && <Panel className="text-ink-600">Yuklanmoqda…</Panel>}

      {!isLoading && examCards.length === 0 && (
        <div className="flex flex-col gap-3">
          <Panel className="text-center text-ink-600">
            Bu imtihon uchun so‘z topilmadi — bo‘lim yangilanishdan keyin boshqa nom olgan bo‘lishi mumkin.
          </Panel>
          <LinkButton to={PATHS.home} block>
            Bosh sahifaga
          </LinkButton>
        </div>
      )}

      {!isLoading && examCards.length > 0 && phase === 'intro' && (
        <ExamIntro
          covered={covered}
          questionCount={examCards.length}
          onStart={() => setPhase('exam')}
        />
      )}

      {phase === 'exam' && allCards && (
        <SessionRunner
          key="exam"
          cards={examCards}
          pool={allCards}
          /*
            FIXED: har so'z BIR marta. Imtihon — tekshiruv, o'rgatish emas;
            o'rgatish keyingi bosqichda, faqat xato so'zlar uchun.
          */
          mode="fixed"
          onFinish={handleExamFinish}
        />
      )}

      {phase === 'fix' && allCards && missedCards.length > 0 && (
        <>
          <Panel tone="warning" padding="sm" className="mb-3 text-sm">
            <b>{missedCards.length} ta so‘z</b> imtihonda adashdi. Har birini ikki xil mashqda
            to‘g‘ri topsangiz — imtihon topshirildi. Xato — jazo emas, xotiraga yo‘l.
          </Panel>
          <SessionRunner
            key="fix"
            cards={missedCards}
            pool={allCards}
            mode="mastery"
            // Faqat adashilgan so'zlar — xatosiz tugatish "benuqson" emas
            perfectEligible={false}
            onFinish={handleFixFinish}
          />
        </>
      )}

      {phase === 'done' && summary && covered && (
        <SessionSummaryPanel
          summary={summary}
          caption="Imtihon topshirildi"
          actions={
            <>
              <ExamReport
                covered={covered}
                examCards={examCards}
                missed={examSummary?.missedWords ?? []}
                bonusXp={bonusXp}
              />
              <LinkButton to={PATHS.lesson} block size="lg">
                Keyingi dars
              </LinkButton>
              <LinkButton to={PATHS.home} block variant="ghost">
                Bosh sahifaga
              </LinkButton>
            </>
          }
        />
      )}

      <ConfirmSheet
        open={exitAsked}
        title="Imtihonni tugatmasdan chiqasizmi?"
        primaryLabel="Davom etish"
        dangerLabel="Chiqish"
        onPrimary={() => setExitAsked(false)}
        onDanger={() => navigate(PATHS.home)}
      >
        Chiqsangiz imtihon boshidan boshlanadi. Berilgan javoblar saqlanib qoladi.
      </ConfirmSheet>
    </div>
  )
}

interface ExamIntroProps {
  covered: PathUnit[] | null
  questionCount: number
  onStart: () => void
}

/**
 * Imtihon oldidagi kirish — nima kutilayotgani va NEGA.
 *
 * Bola imtihondan qo'rqmasligi kerak: "xato — jazo emas" bu yerda
 * oldindan aytiladi. Vaqt taxmini (NN/g: tizim holati) — "yana qancha?"
 * savoliga javob.
 */
function ExamIntro({ covered, questionCount, onStart }: ExamIntroProps) {
  const units = covered ?? []
  const minutes = estimateMinutes(questionCount, 1)

  return (
    <div className="flex flex-col gap-3">
      <Panel tone="brand" className="text-center">
        <div className="text-5xl" aria-hidden="true">
          🏆
        </div>
        <h2 className="mt-2 text-xl font-extrabold">Yig‘ma imtihon</h2>
        <p className="mt-1 text-sm text-ink-600">
          {units.length} ta dars · {questionCount} savol · ≈{minutes} daq
        </p>
      </Panel>

      <Panel padding="sm">
        <h3 className="mb-1 text-sm font-extrabold">Qaysi darslar?</h3>
        <ul className="flex flex-wrap gap-1.5" data-testid="exam-units">
          {units.slice(0, INTRO_UNIT_CHIPS).map((unit) => (
            <li
              key={unit.id}
              className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700"
            >
              {unit.title}
            </li>
          ))}
          {units.length > INTRO_UNIT_CHIPS && (
            <li className="rounded-full bg-ink-300/30 px-2.5 py-0.5 text-xs font-bold text-ink-600">
              +{units.length - INTRO_UNIT_CHIPS} ta dars
            </li>
          )}
        </ul>
      </Panel>

      <Panel padding="sm" className="text-sm text-ink-600">
        <b className="text-ink-900">Nega imtihon?</b> Eslab chaqirishga urinish — so‘zni qayta
        o‘qishdan ikki barobar mustahkamroq yodda qoldiradi. Xato qilsangiz — o‘sha so‘z darhol
        qaytadi va o‘zlashtirilguncha qo‘yib yubormaydi. Imtihon har doim 100% bilan tugaydi.
      </Panel>

      <Button block size="lg" onClick={onStart} data-testid="exam-start">
        Boshlash
      </Button>
    </div>
  )
}
