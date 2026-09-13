import { useEffect, useMemo, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { LinkButton } from '@/components/ui/LinkButton'
import { Panel } from '@/components/ui/Panel'
import { LANGUAGES } from '@/core/config/languages'
import { computeLanguageStats, getAllCards, getGlobalCardStats, getNextDueDate } from '@/core/db'
import { formatTimeUntil } from '@/lib/format'
import { useNowTick } from '@/hooks/useNowTick'
import { useProgress } from '@/hooks/useProgress'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { countUp, enterStagger, withMotion } from '@/lib/motion'
import { HomeHero } from './HomeHero'
import { isStillStruggling } from '@/core/mastery'

/** O'yinlar ochilishi uchun kerakli ko'rilgan so'zlar (tezlik o'yini chegarasi) */
const GAMES_MIN_WORDS = 4
/** Qiyin so'z hisoblanish uchun eng kam unutishlar (profil bilan bir xil) */
const WEAK_MIN_LAPSES = 2
/** Bosh ekranda taklif chiqishi uchun eng kam qiyin so'zlar */
const WEAK_CARD_MIN = 2
import { LearningPath } from './LearningPath'
import { WordSky } from './WordSky'
import { WeeklyQuest } from './WeeklyQuest'
import { StreakTierToast } from './StreakTierToast'
import { Companion } from './Companion'
import { WordOfDay } from './WordOfDay'

/**
 * Bosh ekran (TZ 6.2): streak, kunlik maqsad progressi,
 * "Bugun takrorlash" tugmasi va lug'at holati.
 *
 * Barcha ko'rsatkichlar jonli: takrorlash ekranida javob berilsa,
 * bu yerdagi raqamlar o'zi yangilanadi.
 */
export function HomeScreen() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const dailyGoalWords = useSettingsStore((s) => s.dailyGoalWords)
  const language = learningLanguage ? LANGUAGES[learningLanguage] : null

  // `useLiveQuery` faqat bazaga yozuv bo'lganda qayta hisoblaydi. "Muddati
  // yetgan" va "bugungi kun" tushunchalari esa vaqtga bog'liq — shuning
  // uchun soat ham bog'liqlik sifatida qo'shiladi.
  const now = useNowTick()
  const progress = useProgress()

  /*
   * Kartalar BIR MARTA o'qiladi va ikki joyda ishlatiladi: statistika
   * uchun ham, o'quv yo'li uchun ham. Ilgari ularni ikkala qism alohida
   * o'qirdi — bitta ekran uchun butun jadval (4000+ yozuv) ikki marta
   * skanerlanardi.
   */
  /*
   * Natija TIL BILAN BIRGA qaytadi. `useLiveQuery` bog'liqlik o'zgarganda
   * yangi so'rov tugaguncha ESKI natijani ushlab turadi — til
   * almashtirilganda bir lahza "Arab tili" sarlavhasi ostida inglizcha
   * so'zlar soni ko'rinardi (auditda qayd etilgan). Til mos kelmasa
   * natija "yuklanmoqda" deb hisoblanadi.
   */
  const cardsResult = useLiveQuery(
    async () =>
      learningLanguage
        ? { language: learningLanguage, cards: await getAllCards(learningLanguage) }
        : undefined,
    [learningLanguage],
  )
  const cards = cardsResult?.language === learningLanguage ? cardsResult.cards : undefined

  const stats = useMemo(
    () => (cards ? computeLanguageStats(cards, now) : undefined),
    [cards, now],
  )

  /* Yo'ldosh BARCHA tillardagi ko'rilgan so'zlardan oziqlanadi — u bitta */
  const globalStats = useLiveQuery(() => getGlobalCardStats(), [])

  const nextDueAt = useLiveQuery(
    () => (learningLanguage ? getNextDueDate(learningLanguage, now) : undefined),
    [learningLanguage, now],
  )

  // `undefined` — hali yuklanmoqda; uni "0 ta karta" deb ko'rsatish noto'g'ri
  const isLoading = stats === undefined
  const dueCount = stats?.due ?? 0

  const streak = progress?.streak.current ?? 0
  /** Ko'rilgan so'zlar — o'yinlar shundan ochiladi */
  const seenCount = cards ? cards.filter((card) => card.totalReviews > 0).length : null
  /** Hozir ham qiyin so'zlar — kamida 2 marta unutilgan va hali mustahkam emas */
  const strugglingCount = cards
    ? cards.filter((card) => isStillStruggling(card, WEAK_MIN_LAPSES)).length
    : 0
  const wordsToday = progress?.daily.cardIds.length ?? 0
  const level = progress?.level

  const rootRef = useRef<HTMLDivElement>(null)
  const totalXp = progress?.profile.totalXp ?? 0

  /*
   * Kirish animatsiyasi: kartalar ketma-ket chiqadi, XP sanaladi.
   *
   * XP JSXda YAKUNIY qiymati bilan chiziladi — animatsiya bo'lmasa
   * foydalanuvchi to'g'ri sonni ko'radi, nolni emas.
   *
   * Bog'liqlik `totalXp`: son o'zgarganda (dars tugagach) hisob
   * qaytadan yuguradi va o'sish SEZILADI.
   */
  useEffect(() => {
    let cancelled = false
    let revert = () => {}

    void withMotion(rootRef.current, (gsap) => {
      enterStagger(gsap, '[data-home-card]', { stagger: 0.07, duration: 0.4, y: 18 })

      const xpNode = rootRef.current?.querySelector('[data-testid="total-xp"] [data-xp-value]')
      if (xpNode && totalXp > 0) countUp(gsap, xpNode, totalXp, 0.9)
    }).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [totalXp])

  return (
    <div ref={rootRef} className="flex flex-col gap-4">
      {/* Yangi olov darajasi — bir marta, bosh ekranga kirganda */}
      {progress && <StreakTierToast streak={streak} />}

      {/* Qahramon: salom, streak, kunlik halqa, daraja, bitta katta tugma */}
      <HomeHero
        language={language}
        streak={streak}
        streakAtRisk={progress?.streak.atRisk ?? false}
        level={level ?? null}
        totalXp={totalXp}
        wordsToday={wordsToday}
        dailyGoalWords={dailyGoalWords}
        dueCount={dueCount}
        isLoading={isLoading}
      />

      {/* Yo'ldosh — so'zlar bilan o'sadigan jonzot (g'amxo'rlik effekti) */}
      {globalStats && (
        <Companion
          seenWords={globalStats.learned}
          context={{
            streakAtRisk: progress?.streak.atRisk ?? false,
            goalDone: wordsToday >= dailyGoalWords,
            dueCount,
          }}
        />
      )}

      {/* Til almashtirgich: har til alohida progress bilan — istalgan payt
          o'tish mumkin, so'zlar yo'qolmaydi */}
      <LanguageSwitcher />

      {/* Kunning so'zi — qiziquvchanlik bo'shlig'i, har kuni yangi sir */}
      {cards && <WordOfDay cards={cards} />}

      <Panel interactive>
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="font-bold">Bugun takrorlash</h2>
          {dueCount > 0 && (
            <span className="rounded-full bg-brand-700 px-2.5 py-0.5 text-sm font-bold text-white">
              {dueCount}
            </span>
          )}
        </div>
        <p className="mb-3 text-sm text-ink-600">
          {isLoading
            ? 'Yuklanmoqda…'
            : dueCount > 0
              ? `${dueCount} ta so'z unutish arafasida.`
              : nextDueAt != null
                ? `Hammasi bajarildi. Keyingi takrorlash — ${formatTimeUntil(nextDueAt, now)}.`
                : 'Hozircha takrorlanadigan so‘z yo‘q.'}
        </p>
        {/* Yangi so'zlar endi o'quv yo'lidan olinadi — takrorlash va
            o'rganish alohida ishlar */}
        <LinkButton to={PATHS.review} block variant={dueCount > 0 ? 'primary' : 'secondary'}>
          {dueCount > 0 ? 'Takrorlashni boshlash' : 'Takrorlashni ochish'}
        </LinkButton>
      </Panel>

      {/* Haftalik sayohat — 7 qadam, 3 sandiq: "yetib borish" motivi */}
      <WeeklyQuest />

      {/*
        O'yinlar — mashqning boshqa formati. Bosh ekranda o'quv
        yo'lidan OLDIN turadi: bola kunlik darsni bajargach shu
        yerdan davom etishi mumkin.
      */}
      {/*
        NN/g #5: 4 ta so'z ko'rilmaguncha o'yinlar QULF — aks holda yangi
        foydalanuvchi ichkarida uch marta "bo'lmaydi" ko'rardi. Qulf
        holati ham ma'lumot beradi: nima qilish kerak va qancha qoldi.
      */}
      {seenCount === null ? null : seenCount < GAMES_MIN_WORDS ? (
        <Panel data-home-card data-testid="games-locked" className="flex items-center gap-3 opacity-90">
          <span aria-hidden="true" className="text-3xl grayscale">
            🎮
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">🔒 O‘yinlar</span>
            <span className="block text-sm text-ink-600">
              Birinchi darsdan keyin ochiladi · {seenCount}/{GAMES_MIN_WORDS} so‘z
            </span>
          </span>
        </Panel>
      ) : (
        <Link to={PATHS.games} className="tap-highlight-none block">
          <Panel data-home-card interactive className="flex items-center gap-3">
            <span aria-hidden="true" className="text-3xl">
              🎮
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">O‘yinlar</span>
              <span className="block text-sm text-ink-600">
                Bilganingizni tez va qiziqarli mustahkamlang
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-ink-600">
              ›
            </span>
          </Panel>
        </Link>
      )}

      {/*
        Qiyin so'zlar bo'lsa — bosh ekranda taklif. Profildagi "Ustida
        ishlash kerak" bo'limini hamma ham topmaydi; eng foydali mashq
        (aynan qoqilayotgan so'zlar) bir bosishda bo'lishi kerak.
      */}
      {strugglingCount >= WEAK_CARD_MIN && (
        <Link to={PATHS.weakReview} className="tap-highlight-none block">
          <Panel data-home-card data-testid="weak-card" tone="warning" interactive className="flex items-center gap-3">
            <span aria-hidden="true" className="text-3xl">
              🧠
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{strugglingCount} ta qiyin so‘z</span>
              <span className="block text-sm text-ink-600">
                Qoqilayotgan so‘zlaringizni alohida mashq qiling
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-ink-600">
              ›
            </span>
          </Panel>
        </Link>
      )}

      <LearningPath cards={cards} />

      {/* O'rganilgan so'zlar — shaxsiy osmon: raqam emas, tasvir */}
      {cards && <WordSky cards={cards} />}

      <section>
        <h2 className="mb-2 font-bold">Lug'at holati</h2>
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Yangi" value={stats?.fresh} accent="text-ink-600" />
          <StatTile label="O'rganilmoqda" value={stats?.learning} accent="text-flame-700" />
          <StatTile label="Mustahkam" value={stats?.mature} accent="text-brand-600" />
        </div>
      </section>

    </div>
  )
}


/** Bitta statistika katakchasi */
function StatTile({
  label,
  value,
  accent,
}: {
  label: string
  value: number | undefined
  accent: string
}) {
  return (
    // Kichik bo'shliq: uch ustunli tarmoqda 375 px li ekranda
    // "O'rganilmoqda" yorlig'i 4 px ga sig'may, kesilib qolardi
    <Panel padding="sm" className="text-center">
      <p className={`text-2xl font-extrabold ${accent}`}>{value ?? '—'}</p>
      <p className="mt-0.5 text-xs text-ink-600">{label}</p>
    </Panel>
  )
}
