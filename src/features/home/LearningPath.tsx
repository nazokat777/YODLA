import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { loadLanguageDeck } from '@/content/starterDecks'
import { readTopicOrder, saveTopicOrder } from '@/content/topicOrderCache'
import type { CardRecord } from '@/core/db'
import { buildUnits, topicOrderFromDeck, type PathUnit } from '@/core/path'
import { loadGsap } from '@/lib/motion'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/cn'

/** Holatga qarab doira uslubi */
const CIRCLE = {
  completed: 'bg-brand-500 text-white shadow-[0_4px_0_0] shadow-brand-700',
  current: 'bg-brand-500 text-white ring-4 ring-brand-300 shadow-[0_4px_0_0] shadow-brand-700',
  skipped: 'border-2 border-brand-300 bg-brand-50 text-brand-700',
  locked: 'bg-ink-300/40 text-ink-600',
} as const

/**
 * O'quv yo'li — bo'limlar zanjiri.
 *
 * Bo'lim holati saqlanmaydi, kartalar progressidan hisoblanadi
 * (`core/path/units.ts`). Shuning uchun dars tugagach ro'yxat o'zi
 * yangilanadi: `useLiveQuery` bazadagi o'zgarishni sezadi.
 */
interface LearningPathProps {
  /**
   * Shu tildagi kartalar. `undefined` — hali yuklanmoqda.
   *
   * Kartalarni bosh ekran O'QIYDI va shu yerga uzatadi: u ularni
   * statistika uchun baribir o'qiydi, ikkinchi so'rov esa bitta ekran
   * uchun butun jadvalni ikki marta skanerlardi.
   */
  cards: CardRecord[] | undefined
}

export function LearningPath({ cards }: LearningPathProps) {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const startingLevel = useSettingsStore((s) => s.startingLevel)

  /**
   * Mavzu tartibi lug'atdan olinadi — lug'at dangasa yuklanadi.
   * `null` — hali kelmagan.
   *
   * Kelgunicha yo'l CHIZILMAYDI: `buildUnits` tartibsiz qolganda alifboga
   * tushadi va bo'limlar avval noto'g'ri ketma-ketlikda ko'rinib, keyin
   * sakrab qayta saralanardi (arabchada "10-dars" "2-dars" dan oldin).
   */
  const [topicOrder, setTopicOrder] = useState<string[] | null>(null)
  useEffect(() => {
    if (!learningLanguage) return

    /*
     * Avval KESH. Tartib lug'at bazaga yozilayotganda saqlab qo'yiladi,
     * shuning uchun odatda shu yerda topiladi va butun lug'atni (inglizchada
     * ~700 kB JS) qayta yuklash kerak bo'lmaydi.
     *
     * Kesh bo'sh bo'lishi mumkin: yangi versiya endi chiqqan yoki
     * foydalanuvchi tilni endi almashtirgan. Unda lug'at yuklanadi va
     * natija keyingi safar uchun saqlanadi.
     */
    const cached = readTopicOrder(learningLanguage)
    if (cached) {
      setTopicOrder(cached)
      return
    }

    let cancelled = false
    void loadLanguageDeck(learningLanguage).then((deck) => {
      if (cancelled) return

      const order = topicOrderFromDeck(deck)
      saveTopicOrder(learningLanguage, order)
      setTopicOrder(order)
    })
    return () => {
      cancelled = true
    }
  }, [learningLanguage])

  const units = useMemo(() => {
    if (!cards || !learningLanguage || topicOrder === null) return []

    return buildUnits(cards, { minLevel: startingLevel, topicOrder })
  }, [cards, learningLanguage, startingLevel, topicOrder])

  // Kartalar yoki mavzu tartibi hali yo'lda. Buni "bo'lim yo'q" dan
  // farqlash kerak: birinchi ochilishda lug'at bazaga yozilayotgan bir-ikki
  // soniya davomida yo'l butunlay g'oyib bo'lib turardi va keyin birdan
  // paydo bo'lardi
  const isLoading = cards === undefined || topicOrder === null

  const listRef = useRef<HTMLOListElement>(null)

  // Bo'limlar ketma-ket "otilib" chiqadi. Animatsiya bo'lmasa ro'yxat
  // shunchaki joyida turadi — DOM allaqachon to'g'ri
  useEffect(() => {
    if (units.length === 0) return

    let cancelled = false

    let context: { revert: () => void } | null = null

    void loadGsap().then((gsap) => {
      if (!gsap || cancelled || !listRef.current) return

      // `gsap.context` React uchun: `revert()` barcha o'zgarishlarni
      // qaytaradi, ya'ni komponent yo'q qilinganda DOM toza qoladi
      context = gsap.context(() => {
        gsap.from('[data-unit]', {
          // OPACITY ATAYLAB YO'Q: animatsiya tugamay qolsa (fon tab,
          // to'xtatilgan rAF) bo'limlar ko'rinmas bo'lib qolardi.
          // Siljish va masshtab esa yarim yo'lda ham o'qilaveradi.
          y: 28,
          scale: 0.9,
          duration: 0.5,
          stagger: 0.06,
          ease: 'back.out(1.8)',
          clearProps: 'transform',
        })

        // "Nafas": ko'z qayerga qarashni biladi
        gsap.to('[data-state="current"]', {
          scale: 1.04,
          duration: 1,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }, listRef)
    })

    return () => {
      cancelled = true
      context?.revert()
    }
  }, [units.length])

  if (isLoading) {
    return (
      <section data-testid="path-loading">
        <h2 className="mb-3 font-bold">O'quv yo'li</h2>
        <ol className="flex flex-col gap-3" aria-hidden="true">
          {[0, 1, 2].map((row) => (
            <li key={row} className={cn('flex items-center gap-3', row % 2 === 1 && 'ms-10')}>
              <div className="h-14 w-14 animate-pulse rounded-full bg-ink-300/40" />
              <div className="h-4 w-32 animate-pulse rounded bg-ink-300/40" />
            </li>
          ))}
        </ol>
      </section>
    )
  }

  if (units.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 font-bold">O'quv yo'li</h2>

      <ol ref={listRef} className="flex flex-col gap-3">
        {units.map((unit, index) => (
          <li key={unit.id} data-unit className="flex items-center gap-3">
            {/* Zigzag: har ikkinchi bo'lim biroz siljiydi */}
            <div className={cn('flex items-center gap-3', index % 2 === 1 && 'ms-10')}>
              <UnitCircle unit={unit} />
              <div className="flex flex-col">
                <span className="font-bold">{unit.topic}</span>
                <span className="text-xs text-ink-600">
                  {unit.level} · {unit.learned}/{unit.total} so'z
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Bo'lim doirasi — qulflanganida havola bo'lmaydi */
function UnitCircle({ unit }: { unit: PathUnit }) {
  const className = cn(
    'flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-extrabold',
    CIRCLE[unit.state],
  )

  const label =
    unit.state === 'locked'
      ? `${unit.topic} — hali ochilmagan`
      : `${unit.topic} — ${unit.learned}/${unit.total}`

  if (unit.state === 'locked') {
    return (
      <div
        data-testid={`unit-${unit.id}`}
        data-state={unit.state}
        role="button"
        aria-disabled="true"
        tabIndex={0}
        aria-label={label}
        className={className}
      >
        <span aria-hidden="true">🔒</span>
      </div>
    )
  }

  return (
    <Link
      to={PATHS.lessonById(unit.id)}
      data-testid={`unit-${unit.id}`}
      data-state={unit.state}
      aria-label={label}
      className={cn(className, 'tap-highlight-none transition-transform active:translate-y-0.5')}
    >
      {unit.state === 'completed' ? (
        <span aria-hidden="true">✓</span>
      ) : (
        <span aria-hidden="true">
          {unit.learned}/{unit.total}
        </span>
      )}
    </Link>
  )
}
