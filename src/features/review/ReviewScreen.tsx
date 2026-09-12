import { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PATHS } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import { Panel } from '@/components/ui/Panel'
import { getAllCards, getNextDueDate, type CardRecord } from '@/core/db'
import { pickDueCards } from '@/core/srs'
import { isStillStruggling, pickWeakest } from '@/core/mastery'
import { formatTimeUntil } from '@/lib/format'
import { SessionRunner, type SessionSummary } from '@/features/session/SessionRunner'
import { SessionSummaryPanel } from '@/features/session/SessionSummaryPanel'
import { useSettingsStore } from '@/stores/useSettingsStore'

/** Bir seansda ko'rsatiladigan kartalarning yuqori chegarasi (charchashning oldini oladi) */
const SESSION_LIMIT = 20

/** Qiyin so'zlar seansida nechta so'z beriladi */
const WEAK_SESSION_SIZE = 10

/** Qiyin so'zlar ro'yxatiga tushish uchun eng kam xato soni */
const MIN_LAPSES = 2

/**
 * Qiyin so'z qolmaganda — bu YUTUQ, "takrorlash uchun so'z yo'q" emas.
 * Standart matn muddat haqida va bu yerda chalg'itardi.
 */
const NO_WEAK_WORDS = {
  icon: '🎉',
  title: 'Qiyin so‘zlar qolmadi!',
  hint: 'Hammasi mustahkam yodlangan. Yangi darsga o‘tishingiz mumkin.',
}

/** Hali birorta so'z ko'rilmagan — "hammasi yodlangan" deyish yolg'on bo'lardi */
const NOTHING_SEEN_YET = {
  icon: '📗',
  title: 'Hali qiyin so‘zlar yo‘q',
  hint: 'Avval bir dars o‘ting — qiynalgan so‘zlaringiz shu yerda to‘planadi.',
}

/**
 * Takrorlash ekrani (TZ 6.4).
 *
 * SRS bo'yicha muddati yetgan kartalar to'rt xil mashq turi orqali
 * takrorlanadi. Qaysi tur chiqishi kartaning `repetitions` darajasiga
 * qarab avtomatik tanlanadi (adaptiv qiyinlik).
 */
interface ReviewScreenProps {
  /**
   * `weak` — muddati yetganini emas, eng ko'p UNUTILGAN so'zlarni
   * beradi ("Ustida ishlash kerak" bo'limidagi tugma shu yerga olib
   * keladi).
   */
  focus?: 'due' | 'weak'
}

export function ReviewScreen({ focus = 'due' }: ReviewScreenProps = {}) {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)

  /** null — hali yuklanmoqda */
  const [cards, setCards] = useState<CardRecord[] | null>(null)
  const [pool, setPool] = useState<CardRecord[]>([])
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  /** Qiymati o'zgarganda yangi seans boshlanadi */
  const [sessionKey, setSessionKey] = useState(0)

  /**
   * Keyingi takrorlash vaqti JONLI o'qiladi: seans davomida har javob
   * `dueDate` larni o'zgartiradi, shuning uchun bir marta o'qish yetarli emas.
   */
  const nextDueAt = useLiveQuery(
    () => (learningLanguage ? getNextDueDate(learningLanguage) : undefined),
    [learningLanguage],
  )

  useEffect(() => {
    if (!learningLanguage) return

    let cancelled = false

    setCards(null)
    setSummary(null)
    setErrorMessage(null)

    // Lug'at BIR MARTA o'qiladi: u ham chalg'ituvchi variantlar manbai
    // (`pool`), ham navbatning o'zi shundan hisoblanadi. Ilgari ikki
    // alohida so'rov bor edi va ikkalasi ham o'sha 4400 yozuvni diskdan
    // ko'chirardi.
    getAllCards(learningLanguage)
      .then((all) => {
        if (cancelled) return
        /*
         * Qiyin so'zlar rejimida MUDDAT hisobga olinmaydi: maqsad
         * jadvalni bajarish emas, aynan qoqilayotgan so'zlar ustida
         * ishlash. Ular o'zlashtirish rejimida beriladi — ya'ni
         * ikki xil turdagi mashqda to'g'ri javob olguncha qaytadi.
         */
        const queue =
          focus === 'weak'
            ? pickWeakest(
                all.filter((card) => isStillStruggling(card, MIN_LAPSES)),
                WEAK_SESSION_SIZE,
                Date.now(),
              )
            : pickDueCards(all, Date.now(), SESSION_LIMIT)

        setCards(queue)
        setPool(all)
      })
      .catch((error: unknown) => {
        console.error('Takrorlash navbatini yuklab bo‘lmadi:', error)
        if (cancelled) return
        setCards([])
        setErrorMessage('Takrorlash navbatini yuklab bo‘lmadi. Sahifani yangilab ko‘ring.')
      })

    return () => {
      cancelled = true
    }
  }, [learningLanguage, sessionKey, focus])

  const handleFinish = useCallback((result: SessionSummary) => setSummary(result), [])

  if (!learningLanguage) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold">{focus === 'weak' ? 'Qiyin so‘zlar' : 'Takrorlash'}</h1>
        <Panel>Avval til tanlang.</Panel>
      </div>
    )
  }

  if (cards === null) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold">{focus === 'weak' ? 'Qiyin so‘zlar' : 'Takrorlash'}</h1>
        <Panel className="text-ink-600">Yuklanmoqda…</Panel>
      </div>
    )
  }

  // --- Seans tugadi yoki umuman kartalar yo'q ---
  if (summary !== null || cards.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold">{focus === 'weak' ? 'Qiyin so‘zlar' : 'Takrorlash'}</h1>

        <SessionSummaryPanel
          summary={summary}
          emptyMessage={
            focus === 'weak'
              ? pool.some((card) => card.totalReviews > 0)
                ? NO_WEAK_WORDS
                : NOTHING_SEEN_YET
              : undefined
          }
        />

        {/* Muddat qiyin so'zlar rejimiga aloqasiz — u yerda chalg'itadi */}
        {focus === 'due' && nextDueAt != null && (
          <p className="text-center text-sm text-ink-600">
            Keyingi takrorlash: {formatTimeUntil(nextDueAt)}.
          </p>
        )}

        {errorMessage && (
          <p
            role="alert"
            className="rounded-2xl border border-wrong-500/40 bg-wrong-500/10 px-4 py-3 text-sm font-semibold text-wrong-600"
          >
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <LinkButton to={PATHS.home} block>
            Bosh sahifaga
          </LinkButton>
          <Button variant="ghost" block onClick={() => setSessionKey((key) => key + 1)}>
            Yana bor-yo‘qligini tekshirish
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-3">
      {/*
        Sarlavha SEANS PAYTIDA ham qoladi.
        Foydalanuvchi profildagi "Shu so'zlarni mashq qilish" tugmasidan
        keladi va u qaysi ekranga tushganini bilishi kerak — usiz
        ekranda faqat ko'rsatkich va savol turardi.
      */}
      <h1 className="text-2xl font-extrabold">
        {focus === 'weak' ? 'Qiyin so‘zlar' : 'Takrorlash'}
      </h1>

      {/*
        `stagesFor` UZATILMAYDI — takrorlashda har so'z bir marta chiqadi.
        Bu yerda maqsad o'rgatish emas, tekshirish: bir so'zni ketma-ket
        uch marta so'rash SM-2 o'lchovini buzardi.
      */}
      <SessionRunner
        key={sessionKey}
        cards={cards}
        pool={pool}
        /*
          Qiyin so'zlarda O'ZLASHTIRISH rejimi: maqsad jadvalni
          bajarish emas, so'zni haqiqatan o'rgatish. Oddiy takrorlashda
          esa har so'z bir marta chiqadi — u SM-2 o'lchovi.
        */
        mode={focus === 'weak' ? 'mastery' : 'fixed'}
        onFinish={handleFinish}
      />
    </div>
  )
}
