import { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import { Panel } from '@/components/ui/Panel'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { countCards, getAllCards, recordLessonCompleted, type CardRecord } from '@/core/db'
import { pickLessonCards } from '@/core/lesson/order'
import { mergeLevelUp } from '@/core/gamification'
import { isLightningOffered } from '@/core/games'
import { buildUnits, unitIdOf } from '@/core/path'
import { pickWeakest, REVIEW_STREAK } from '@/core/mastery'
import { readTopicOrder } from '@/content/topicOrderCache'
import type { LanguageCode, LevelCode } from '@/core/types'
import { SessionRunner, type SessionSummary } from '@/features/session/SessionRunner'
import { SessionSummaryPanel } from '@/features/session/SessionSummaryPanel'
import { useSettingsStore } from '@/stores/useSettingsStore'

/** Bir darsda nechta so'z beriladi */
/**
 * Bir darsdagi TURLI so'zlar soni.
 *
 * Har so'z necha marta chiqishi OLDINDAN ma'lum emas: dars
 * o'zlashtirish rejimida ishlaydi va so'z ikki xil turdagi mashqda
 * ketma-ket to'g'ri javob olguncha qaytaveradi. To'rt so'z odatda
 * 10-16 savol beradi — "kuniga 5 daqiqa" va'dasiga shu mos keladi.
 */
const LESSON_SIZE = 4

/**
 * Aralash takror bosqichida nechta eski so'z qaytariladi.
 *
 * Oldingi BARCHA so'zlarni har safar so'rash mumkin emas: 20-darsda
 * ular 250 tadan oshadi va seans yarim soatga cho'ziladi. Shuning uchun
 * eng ko'p e'tibor talab qiladigan 12 tasi tanlanadi
 * (`core/mastery/weakness.ts`).
 */
const MIXED_REVIEW_SIZE = 12

/** Bo'sh natija — ikki bosqichni qo'shishda tayanch nuqta */
const EMPTY_LESSON_SUMMARY: SessionSummary = {
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

/**
 * Dars ekrani (TZ 6.3): yangi so'zlarni o'rganish.
 *
 * Takrorlashdan farqi — bu yerda avval HALI KO'RILMAGAN so'zlar beriladi.
 * Ular yetmasa, eng kam mustahkamlangan so'zlar bilan to'ldiriladi.
 */
export function LessonScreen() {
  const navigate = useNavigate()
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const startingLevel = useSettingsStore((s) => s.startingLevel)
  const { lessonId } = useParams<{ lessonId?: string }>()

  const [cards, setCards] = useState<CardRecord[] | null>(null)
  /**
   * Aralash takror uchun so'zlar — oldingi darslardan eng zaif 12 tasi.
   *
   * `null` — bosqich hali boshlanmagan; bo'sh massiv — qaytariladigan
   * so'z yo'q (birinchi dars).
   */
  const [mixedCards, setMixedCards] = useState<CardRecord[] | null>(null)
  /**
   * Butun tildagi kartalar — ARALASH bosqichning chalg'ituvchi
   * variantlari uchun.
   *
   * Bo'limning o'z `pool` i yaramaydi: aralash bosqichdagi so'zlar
   * BOSHQA bo'limlardan keladi va ularga o'sha bo'lim so'zlaridan
   * variant qo'yish savolni juda oson qilardi ("Oila" so'ziga
   * "Ovqat" variantlari). Juft topish mashqi esa umuman boshqa
   * kartalarni baholab, bosqichni tiqilib qoldirardi.
   */
  const [allCards, setAllCards] = useState<CardRecord[]>([])
  /** Bosqich 1 natijasi — yakunda ikkalasi qo'shiladi */
  const [lessonSummary, setLessonSummary] = useState<SessionSummary | null>(null)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  /** So'ralgan bo'lim umuman mavjud emas (eskirgan havola) */
  const [isMissingUnit, setIsMissingUnit] = useState(false)
  /** Qiymati o'zgarganda yangi dars yuklanadi */
  const [lessonKey, setLessonKey] = useState(0)
  /** Chiqish tasdig'i ochiqmi */
  const [exitAsked, setExitAsked] = useState(false)
  /** Joriy bosqich ko'rsatkichi — tasdiqda "3/4 so'z" deb aytish uchun */
  const [sessionProgress, setSessionProgress] = useState<{ done: number; total: number } | null>(
    null,
  )
  const handleProgress = useCallback((done: number, total: number) => {
    setSessionProgress({ done, total })
  }, [])

  /*
   * NN/g #3 va #5: ✕ bir bosishda darsni yo'qotmaydi. Seans hali
   * ketayotgan bo'lsa tasdiq so'raladi (o'zlashtirish halqasi xotirada —
   * chiqilsa noldan boshlanadi); yakun ekranida esa to'g'ridan-to'g'ri.
   */
  const inProgress = cards !== null && cards.length > 0 && summary === null
  const handleExit = useCallback(() => {
    if (inProgress) setExitAsked(true)
    else navigate(PATHS.home)
  }, [inProgress, navigate])

  /** Chaqmoq raund taklifi — har dars uchun BIR marta tashlanadi */
  const [lightningOffered, setLightningOffered] = useState(isLightningOffered)

  /**
   * Shu tildagi kartalar soni — JONLI.
   *
   * NEGA KERAK: lug'at ilova ochilganda FONDA bazaga yoziladi
   * (`useStarterDeck`). Foydalanuvchi tilni almashtirib, import
   * tugagunicha darsga kirsa, ekran "Bu tilda hali so'z yo'q" deb
   * qotib qolardi va o'zi tuzalmasdi: kartalar bir marta, effektda
   * o'qilardi. Jonli son import tugaganda o'zgaradi va dars qaytadan
   * yuklanadi.
   */
  const cardCount = useLiveQuery(
    () => (learningLanguage ? countCards(learningLanguage) : undefined),
    [learningLanguage],
  )

  useEffect(() => {
    if (!learningLanguage) return

    let cancelled = false
    setCards(null)
    setSummary(null)
    setIsMissingUnit(false)
    setLightningOffered(isLightningOffered())

    getAllCards(learningLanguage)
      .then((all) => {
        if (cancelled) return

        /*
         * Bo'lim BERILMAGAN bo'lsa (onboarding "Birinchi darsni boshlash"
         * va "Yana bir dars"), o'quv yo'lidagi JORIY bo'lim olinadi.
         *
         * Ilgari bunday holatda butun lug'at manba bo'lardi va tartib
         * karta qo'shilish tartibiga tushib qolardi: yangi foydalanuvchi
         * "Salomlashish" o'rniga import qilingan lug'atning birinchi
         * so'zlari — `ability`, `about` — bilan boshlardi. Ekran esa
         * ayni paytda yo'lda "Salomlashish" joriy deb turardi, ya'ni
         * ilova bir vaqtda ikki xil gap aytardi.
         */
        const targetUnit = lessonId ?? currentUnitId(all, learningLanguage, startingLevel)

        // Bo'lim ichida daraja bir xil, shuning uchun minLevel uzatilmaydi.
        const scope = targetUnit
          ? all.filter((card) =>
              card.level && card.topic ? unitIdOf(card.level, card.topic) === targetUnit : false,
            )
          : all

        // Bo'lim so'ralgan, lekin unga hech bir karta tushmadi — holbuki
        // tilda kartalar bor. Ya'ni bo'lim YO'Q (eskirgan xatcho'p yoki
        // yangilanishdan keyin nomi o'zgargan mavzu), lug'at bo'sh emas.
        setIsMissingUnit(Boolean(lessonId) && scope.length === 0 && all.length > 0)


        setAllCards(all)

        /*
         * ARALASH TAKROR uchun manba: shu darsga KIRMAGAN va allaqachon
         * ko'rilgan so'zlar. "Ko'rilgan" — amaliy ta'rif: foydalanuvchi
         * haqiqatan o'tgan so'zlar, bo'lim raqami emas.
         */
        const lessonIds = new Set(
          pickLessonCards(scope, LESSON_SIZE, targetUnit ? undefined : startingLevel).map(
            (card) => card.id,
          ),
        )
        const seen = all.filter((card) => card.totalReviews > 0 && !lessonIds.has(card.id))
        setMixedCards(pickWeakest(seen, MIXED_REVIEW_SIZE, Date.now()))
        // Tartib domen qoidasi — core/lesson/order.ts da test qilingan
        setCards(pickLessonCards(scope, LESSON_SIZE, targetUnit ? undefined : startingLevel))
      })
      .catch((error: unknown) => {
        console.error('Darsni yuklab bo‘lmadi:', error)
        if (!cancelled) setCards([])
      })

    return () => {
      cancelled = true
    }
  }, [learningLanguage, lessonKey, startingLevel, lessonId, cardCount])

  /**
   * Bosqich 1 tugadi.
   *
   * Qaytariladigan eski so'z bo'lsa — ARALASH TAKROR boshlanadi
   * (interleaving: yangi bilim eski bilim bilan bog'lanadi). Bo'lmasa
   * (birinchi dars) seans shu yerda tugaydi.
   */
  const handleLessonFinish = useCallback(
    (result: SessionSummary) => {
      if (mixedCards && mixedCards.length > 0) {
        setLessonSummary(result)
        return
      }

      // Aralash bosqich yo'q — dars shu yerda TO'LIQ tugadi
      void recordLessonCompleted()
      setSummary(result)
    },
    [mixedCards],
  )

  /** Bosqich 2 tugadi — ikkala bosqich natijasi qo'shiladi */
  const handleMixedFinish = useCallback(
    (result: SessionSummary) => {
      const first = lessonSummary ?? EMPTY_LESSON_SUMMARY

      // Ikkala bosqich ham tugadi — kunlik chaqiriq shuni sanaydi
      void recordLessonCompleted()

      setSummary({
        answered: first.answered + result.answered,
        correct: first.correct + result.correct,
        almost: first.almost + result.almost,
        wrong: first.wrong + result.wrong,
        xpEarned: first.xpEarned + result.xpEarned,
        perfectBonusXp: first.perfectBonusXp + result.perfectBonusXp,
        // Takrorlanmasin: ikkala bosqichda bir nishon ochilishi mumkin
        newBadges: [...new Set([...first.newBadges, ...result.newBadges])],
        masteredWords: first.masteredWords + result.masteredWords,
        pendingWords: first.pendingWords + result.pendingWords,
        // Daraja IKKALA bosqich davomida oshgan bo'lishi mumkin —
        // boshlang'ich birinchi bosqichdan, yakuniy ikkinchisidan
        levelUp: mergeLevelUp(first.levelUp, result.levelUp),
        // Ikkala bosqichning so'zlari — takrorlanmasin
        learnedWords: [
          ...(first.learnedWords ?? []),
          ...(result.learnedWords ?? []).filter(
            (word) => !(first.learnedWords ?? []).some((known) => known.id === word.id),
          ),
        ],
      })
    },
    [lessonSummary],
  )

  return (
    <div className="flex flex-1 flex-col p-4">
      {/* Yuqori panel: darsdan chiqish */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleExit}
          aria-label="Darsdan chiqish"
          /*
           * 44×44 — barmoq uchun eng kichik ishonchli o'lcham.
           * Ilgari tugma faqat ✕ belgisining o'zi edi (20×32) va uni
           * telefonda birinchi urinishda bosish qiyin bo'lardi. Bu esa
           * darsdan chiqishning YAGONA yo'li.
           */
          className="tap-highlight-none -ms-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl text-ink-600"
        >
          ✕
        </button>
        <h1 className="text-lg font-extrabold">
          {lessonSummary && summary === null ? 'Aralash takror' : 'Dars'}
        </h1>
      </div>

      {cards === null && <Panel className="text-ink-600">Yuklanmoqda…</Panel>}

      {cards !== null && cards.length === 0 && isMissingUnit && (
        <div className="flex flex-col gap-3">
          <Panel className="text-center text-ink-600">
            Bu bo‘lim topilmadi. U yangilanishdan keyin boshqa nom olgan
            bo‘lishi mumkin — o‘quv yo‘lidan qaytadan tanlang.
          </Panel>
          <LinkButton to={PATHS.home} block>
            Bosh sahifaga
          </LinkButton>
        </div>
      )}

      {cards !== null && cards.length === 0 && !isMissingUnit && (
        <Panel className="text-center text-ink-600">
          Bu tilda hali so‘z yo‘q.
        </Panel>
      )}

      {/*
        BOSQICH 2 — aralash takror. Yangi so'zlar o'zlashtirilgach,
        oldingi darslardan eng zaif 12 tasi qaytariladi: yangi bilim
        eski bilim bilan bog'lanadi (interleaving).

        Alohida `key`: seans holati (o'zlashtirish xaritasi, navbat)
        noldan boshlanishi kerak.
      */}
      {lessonSummary !== null && summary === null && mixedCards !== null && (
        <SessionRunner
          key={`mixed-${lessonKey}`}
          cards={mixedCards}
          pool={allCards}
          mode="mastery"
          /*
            TAKRORDA bitta to'g'ri javob yetarli: bu so'zlar allaqachon
            o'rganilgan. Ikki xil turni talab qilish 12 so'zni 24+
            savolga aylantirardi — o'lchandi, butun dars 78 savolga
            cho'zilib, "kuniga 5 daqiqa" va'dasidan chiqib ketgandi.
          */
          requiredStreak={REVIEW_STREAK}
          onProgressChange={handleProgress}
          onFinish={handleMixedFinish}
        />
      )}

      {cards !== null && cards.length > 0 && summary === null && lessonSummary === null && (
        <SessionRunner
          key={lessonKey}
          cards={cards}
          /*
            Chalg'ituvchilar BUTUN lug'atdan (`collectDistractors` bir
            mavzudagilarni baribir afzal ko'radi). Bo'limning o'zi manba
            bo'lsa, 1–2 so'zli bo'limlarda ("Maktab 0/1") variant
            topilmas, har mashq "tarjimani yozish" bo'lib qolar va ikki
            XIL tur qoidasi hech qachon bajarilmasdi. Juftlash sheriklari
            esa `partners` (seans so'zlari) orqali — begona so'z kirmaydi.
          */
          pool={allCards}
          /*
            DARSDA o'zlashtirish rejimi: so'z ikki xil turdagi mashqda
            ketma-ket to'g'ri javob olguncha qaytaveradi. `stagesFor`
            endi kerak emas — necha marta so'rash kerakligini
            foydalanuvchining javoblari hal qiladi, oldindan belgilangan
            son emas.
          */
          mode="mastery"
          onProgressChange={handleProgress}
          onFinish={handleLessonFinish}
        />
      )}

      <ConfirmSheet
        open={exitAsked}
        title="Darsni tugatmasdan chiqasizmi?"
        primaryLabel="Davom etish"
        dangerLabel="Chiqish"
        onPrimary={() => setExitAsked(false)}
        onDanger={() => navigate(PATHS.home)}
      >
        {sessionProgress && sessionProgress.done > 0
          ? `${sessionProgress.done}/${sessionProgress.total} so‘z o‘zlashtirildi — chiqsangiz dars boshidan boshlanadi. Berilgan javoblar saqlanib qoladi.`
          : 'Chiqsangiz dars boshidan boshlanadi. Berilgan javoblar saqlanib qoladi.'}
      </ConfirmSheet>

      {summary !== null && (
        <SessionSummaryPanel
          summary={summary}
          actions={
            <>
              {/*
                KUTILMAGAN taklif: ~har uchinchi darsdan keyin 20 soniyalik
                chaqmoq raund (XP ×2). O'zgaruvchan — "balki shu safar".
              */}
              {lightningOffered && (
                <LinkButton
                  to={`${PATHS.speedGame}?bonus=1`}
                  block
                  variant="lightning"
                  data-testid="lightning-offer"
                >
                  ⚡ Chaqmoq raund — 20 soniya, XP ×2!
                </LinkButton>
              )}
              <Button block size="lg" onClick={() => setLessonKey((key) => key + 1)}>
                Yana bir dars
              </Button>
              <LinkButton to={PATHS.home} block variant="ghost">
                Bosh sahifaga
              </LinkButton>
            </>
          }
        />
      )}
    </div>
  )
}

/**
 * O'quv yo'lidagi JORIY bo'lim identifikatori (topilmasa `null`).
 *
 * Mavzular tartibi keshdan o'qiladi — u bosh ekran tomonidan yoziladi.
 * Kesh bo'sh bo'lsa (foydalanuvchi to'g'ridan-to'g'ri darsga kirgan)
 * `null` qaytadi va dars eski yo'l bilan, butun lug'atdan tuziladi:
 * lug'atni shu yerda yuklash darsning boshlanishini kechiktirardi.
 */
function currentUnitId(
  cards: CardRecord[],
  language: LanguageCode,
  minLevel: LevelCode,
): string | null {
  const topicOrder = readTopicOrder(language)
  if (!topicOrder) return null

  const units = buildUnits(cards, { minLevel, topicOrder })

  return units.find((unit) => unit.state === 'current')?.id ?? null
}
