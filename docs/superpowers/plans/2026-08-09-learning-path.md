# O'quv yo'li va motion: amalga oshirish rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Holat:** ✅ **BAJARILGAN.** O'quv yo'li bosh ekranda.

**Goal:** Bosh sahifada bo'limlar zanjiri, bo'limga bog'langan dars va GSAP xoreografiyasi.

**Architecture:** Bo'limlar `core/path/units.ts` dagi sof funksiya bilan kartalardan hisoblanadi (yangi ma'lumot saqlanmaydi). UI shu ro'yxatni chizadi va mavjud `/lesson/:lessonId` marshrutiga bog'lanadi. Animatsiya alohida qatlam: `src/lib/motion.ts` GSAP'ni dangasa yuklaydi va harakat kamaytirilganda `null` qaytaradi.

**Tech Stack:** TypeScript, React 19, Vitest + Testing Library, Dexie, GSAP (yangi), Tailwind v4.

**Spec:** [docs/superpowers/specs/2026-08-09-learning-path-design.md](../specs/2026-08-09-learning-path-design.md)

## Global Constraints

- Kod izohlari va UI matni — **o'zbek tilida**.
- Yo'nalishga bog'liq Tailwind utilitalari taqiqlanadi: `ms/me/ps/pe/text-start` ishlatiladi.
- `core/` React'ga bog'liq bo'lmaydi va **`content/` dan import qilmaydi** — kontent argument sifatida uzatiladi.
- **Animatsiya bezak:** DOM animatsiyasiz ham to'g'ri bo'lishi shart. Hech bir test animatsiyaga bog'liq bo'lmaydi.
- GSAP faqat `src/lib/motion.ts` orqali yuklanadi (`await import('gsap')`), komponentlarda to'g'ridan-to'g'ri import qilinmaydi.
- `prefers-reduced-motion` da animatsiya **o'chiriladi** (sekinlashtirilmaydi).
- Har commit oldidan `npm test` to'liq o'tishi shart (bazaviy holat: **358 test**).

## Fayl xaritasi

| Fayl | Mas'uliyati |
| ---- | ----------- |
| `src/core/path/units.ts` | Bo'limlarni hisoblash (sof funksiya) |
| `src/core/path/index.ts` | Modul eksportlari |
| `src/lib/motion.ts` | `prefersReducedMotion`, `loadGsap` |
| `src/features/home/LearningPath.tsx` | Zanjir ko'rinishi va xoreografiya |
| `src/features/home/HomeScreen.tsx` | Yo'lni joylashtirish |
| `src/features/lesson/LessonScreen.tsx` | `lessonId` bo'yicha filtrlash |

---

### Task 1: Bo'limlarni hisoblash (`buildUnits`)

**Files:**
- Create: `src/core/path/units.ts`, `src/core/path/index.ts`
- Test: `src/core/path/units.test.ts`

**Interfaces:**
- Consumes: `LEVEL_ORDER`, `levelRank` (`@/core/config/levels`), `CardRecord`, `NewCardRecordInput` (`@/core/db`), `LevelCode` (`@/core/types`)
- Produces:
  - `type UnitState = 'completed' | 'current' | 'locked' | 'skipped'`
  - `interface PathUnit { id: string; level: LevelCode; topic: string; total: number; learned: number; state: UnitState }`
  - `slugifyTopic(topic: string): string`
  - `unitIdOf(level: LevelCode, topic: string): string`
  - `topicOrderFromDeck(deck: Record<LevelCode, NewCardRecordInput[]>): string[]`
  - `buildUnits(cards: CardRecord[], options?: { minLevel?: LevelCode; topicOrder?: string[] }): PathUnit[]`

- [ ] **Step 1: Write the failing test**

`src/core/path/units.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { buildUnits, slugifyTopic, unitIdOf } from './units'

/** Test uchun minimal karta */
function card(id: string, partial: Partial<CardRecord> = {}): CardRecord {
  return {
    id,
    word: id,
    translation: id,
    language: 'en',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    ...partial,
  }
}

describe('slugifyTopic', () => {
  it('tutuq belgisini TUSHIRADI, chiziqchaga aylantirmaydi', () => {
    // "fe-llar" bo'lib qolsa havola o'qib bo'lmas edi
    expect(slugifyTopic("Kundalik fe'llar")).toBe('kundalik-fellar')
    expect(slugifyTopic("Sog'liq")).toBe('sogliq')
    expect(slugifyTopic("His-tuyg'u")).toBe('his-tuygu')
  })

  it('oddiy nomni kichik harfga o‘tkazadi', () => {
    expect(slugifyTopic('Oila')).toBe('oila')
    expect(slugifyTopic('Mavhum tushunchalar')).toBe('mavhum-tushunchalar')
  })
})

describe('unitIdOf', () => {
  it('daraja va mavzudan barqaror id yasaydi', () => {
    expect(unitIdOf('A1', 'Oila')).toBe('a1-oila')
    expect(unitIdOf('B1', "His-tuyg'u")).toBe('b1-his-tuygu')
  })
})

describe('buildUnits', () => {
  it('daraja va mavzu bo‘yicha guruhlaydi', () => {
    const units = buildUnits([
      card('a', { level: 'A1', topic: 'Oila' }),
      card('b', { level: 'A1', topic: 'Oila' }),
      card('c', { level: 'A1', topic: 'Ovqat' }),
    ])

    expect(units).toHaveLength(2)
    expect(units[0]).toMatchObject({ id: 'a1-oila', topic: 'Oila', total: 2, learned: 0 })
    expect(units[1]).toMatchObject({ id: 'a1-ovqat', total: 1 })
  })

  it('darajalar tartibida joylashtiradi', () => {
    const units = buildUnits([
      card('b1', { level: 'B1', topic: 'Jamiyat' }),
      card('a1', { level: 'A1', topic: 'Oila' }),
      card('a2', { level: 'A2', topic: 'Ish' }),
    ])

    expect(units.map((unit) => unit.level)).toEqual(['A1', 'A2', 'B1'])
  })

  it('mavzu tartibi kontentdan olinadi', () => {
    const units = buildUnits(
      [
        card('a', { level: 'A1', topic: 'Ovqat' }),
        card('b', { level: 'A1', topic: 'Oila' }),
      ],
      { topicOrder: ['Oila', 'Ovqat'] },
    )

    expect(units.map((unit) => unit.topic)).toEqual(['Oila', 'Ovqat'])
  })

  it('barcha so‘zi ko‘rilgan bo‘lim tugallangan', () => {
    const units = buildUnits([
      card('a', { level: 'A1', topic: 'Oila', totalReviews: 3 }),
      card('b', { level: 'A1', topic: 'Oila', totalReviews: 1 }),
    ])

    expect(units[0]).toMatchObject({ state: 'completed', learned: 2 })
  })

  it('birinchi tugallanmagan bo‘lim joriy, keyingilari qulflangan', () => {
    const units = buildUnits([
      card('a', { level: 'A1', topic: 'Oila', totalReviews: 2 }),
      card('b', { level: 'A1', topic: 'Ovqat' }),
      card('c', { level: 'A1', topic: 'Ranglar' }),
    ])

    expect(units.map((unit) => unit.state)).toEqual(['completed', 'current', 'locked'])
  })

  it('boshlang‘ich darajadan past bo‘lim "skipped"', () => {
    // Daraja testida A2 chiqqan: A1 o'rganilmagan, lekin qulflanmaydi
    const units = buildUnits(
      [
        card('a', { level: 'A1', topic: 'Oila' }),
        card('b', { level: 'A2', topic: 'Ish' }),
      ],
      { minLevel: 'A2' },
    )

    expect(units.map((unit) => unit.state)).toEqual(['skipped', 'current'])
  })

  it('past darajadagi bo‘lim tugallangan bo‘lsa "completed" qoladi', () => {
    const units = buildUnits(
      [
        card('a', { level: 'A1', topic: 'Oila', totalReviews: 1 }),
        card('b', { level: 'A2', topic: 'Ish' }),
      ],
      { minLevel: 'A2' },
    )

    expect(units.map((unit) => unit.state)).toEqual(['completed', 'current'])
  })

  it('darajasi yoki mavzusi yo‘q kartalar yo‘lga kirmaydi', () => {
    const units = buildUnits([card('a'), card('b', { level: 'A1' })])

    expect(units).toEqual([])
  })

  it('bo‘sh ro‘yxatda bo‘sh natija', () => {
    expect(buildUnits([])).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/core/path/units.test.ts
```

Expected: FAIL — `Failed to resolve import "./units"`.

- [ ] **Step 3: Write `src/core/path/units.ts`**

```ts
import { levelRank } from '@/core/config/levels'
import type { CardRecord, NewCardRecordInput } from '@/core/db'
import type { LevelCode } from '@/core/types'

export type UnitState = 'completed' | 'current' | 'locked' | 'skipped'

export interface PathUnit {
  id: string
  level: LevelCode
  topic: string
  /** Bo'limdagi so'zlar soni */
  total: number
  /** Kamida bir marta ko'rilganlari */
  learned: number
  state: UnitState
}

/** Tutuq belgisining barcha ko'rinishlari */
const APOSTROPHES = /['’‘ʻʼ`´]/g

/**
 * Mavzu nomidan URL uchun barqaror slug.
 *
 * Tutuq TUSHIRILADI, chiziqchaga aylantirilmaydi: `fe'llar` → `fellar`.
 * Aks holda `fe-llar` chiqib, havola o'qib bo'lmas holga kelardi.
 */
export function slugifyTopic(topic: string): string {
  return topic
    .toLowerCase()
    .replace(APOSTROPHES, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Bo'lim identifikatori: `a1-oila` */
export function unitIdOf(level: LevelCode, topic: string): string {
  return `${level.toLowerCase()}-${slugifyTopic(topic)}`
}

/**
 * Kontentdagi mavzular tartibi.
 *
 * Bazadagi kartalar birlamchi kalit (id) bo'yicha keladi — ya'ni alifbo
 * tartibida. Mavzular ketma-ketligini o'shandan olsak, o'quv yo'li
 * tasodifiy tartibda chiqardi. Shuning uchun tartib KONTENTDAN olinadi.
 */
export function topicOrderFromDeck(
  deck: Record<LevelCode, NewCardRecordInput[]>,
): string[] {
  const seen: string[] = []

  for (const cards of Object.values(deck)) {
    for (const card of cards) {
      if (card.topic && !seen.includes(card.topic)) seen.push(card.topic)
    }
  }

  return seen
}

interface BuildOptions {
  /** Daraja testi natijasi — undan pastdagi bo'limlar "skipped" bo'ladi */
  minLevel?: LevelCode
  /** Mavzular ketma-ketligi (`topicOrderFromDeck`) */
  topicOrder?: string[]
}

/**
 * Kartalardan o'quv yo'lini quradi.
 *
 * Bo'lim holati SAQLANMAYDI — har safar progressdan hisoblanadi. Shuning
 * uchun kontent kengaysa yoki foydalanuvchi so'z o'rgansa, yo'l o'zi
 * yangilanadi va migratsiya kerak bo'lmaydi.
 */
export function buildUnits(cards: CardRecord[], options: BuildOptions = {}): PathUnit[] {
  const { minLevel, topicOrder = [] } = options

  // Daraja va mavzusi belgilanmagan kartalar yo'lda ko'rsatilmaydi:
  // ular qo'lda qo'shilgan yoki eski yozuvlar bo'lishi mumkin
  const grouped = new Map<string, PathUnit>()

  for (const card of cards) {
    if (!card.level || !card.topic) continue

    const id = unitIdOf(card.level, card.topic)
    const unit = grouped.get(id) ?? {
      id,
      level: card.level,
      topic: card.topic,
      total: 0,
      learned: 0,
      state: 'locked' as UnitState,
    }

    unit.total += 1
    if (card.totalReviews > 0) unit.learned += 1

    grouped.set(id, unit)
  }

  const topicIndex = (topic: string) => {
    const index = topicOrder.indexOf(topic)
    // Ro'yxatda yo'q mavzu oxiriga tushadi
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
  }

  const units = [...grouped.values()].sort((a, b) => {
    const byLevel = levelRank(a.level) - levelRank(b.level)
    if (byLevel !== 0) return byLevel

    const byTopic = topicIndex(a.topic) - topicIndex(b.topic)
    if (byTopic !== 0) return byTopic

    return a.topic.localeCompare(b.topic)
  })

  const minRank = minLevel === undefined ? 0 : levelRank(minLevel)
  let currentAssigned = false

  for (const unit of units) {
    if (unit.learned === unit.total) {
      unit.state = 'completed'
      continue
    }

    // Daraja testida "bilaman" deb belgilangan darajalar: qulflanmaydi,
    // lekin "tugallangan" ham emas — foydalanuvchi ularni ko'rmagan
    if (levelRank(unit.level) < minRank) {
      unit.state = 'skipped'
      continue
    }

    if (!currentAssigned) {
      unit.state = 'current'
      currentAssigned = true
      continue
    }

    unit.state = 'locked'
  }

  return units
}
```

- [ ] **Step 4: Write `src/core/path/index.ts`**

```ts
/** O'quv yo'li — bo'limlar kartalardan hisoblanadi, saqlanmaydi */
export * from './units'
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/core/path/units.test.ts
```

Expected: PASS — 12 passed.

- [ ] **Step 6: Commit**

```bash
git add src/core/path
git commit -m "feat: o'quv yo'li bo'limlarini kartalardan hisoblash"
```

---

### Task 2: Motion qatlami (GSAP)

**Files:**
- Modify: `package.json` (gsap qo'shiladi)
- Create: `src/lib/motion.ts`
- Test: `src/lib/motion.test.ts`

**Interfaces:**
- Produces:
  - `prefersReducedMotion(): boolean`
  - `loadGsap(): Promise<GsapLike | null>`

- [ ] **Step 1: GSAP o'rnatish**

```bash
npm install gsap
```

Expected: `package.json` dependencies ro'yxatiga `gsap` qo'shiladi.

- [ ] **Step 2: Write the failing test**

`src/lib/motion.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadGsap, prefersReducedMotion } from './motion'

afterEach(() => {
  vi.unstubAllGlobals()
})

/** `matchMedia` ni berilgan javob bilan almashtiradi */
function stubMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches, media: query }))
}

describe('prefersReducedMotion', () => {
  it('tizim harakatni kamaytirishni so‘rasa — true', () => {
    stubMatchMedia(true)

    expect(prefersReducedMotion()).toBe(true)
  })

  it('odatiy holatda — false', () => {
    stubMatchMedia(false)

    expect(prefersReducedMotion()).toBe(false)
  })

  it('matchMedia yo‘q brauzerda xato bermaydi', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('loadGsap', () => {
  it('harakat kamaytirilganda null qaytaradi', async () => {
    // Animatsiya kodi umuman yuklanmasligi kerak
    stubMatchMedia(true)

    await expect(loadGsap()).resolves.toBeNull()
  })

  it('odatiy holatda gsap qaytaradi', async () => {
    stubMatchMedia(false)

    const gsap = await loadGsap()

    expect(typeof gsap?.to).toBe('function')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run src/lib/motion.test.ts
```

Expected: FAIL — `Failed to resolve import "./motion"`.

- [ ] **Step 4: Write `src/lib/motion.ts`**

```ts
/**
 * Animatsiya qatlami.
 *
 * ASOSIY QOIDA: animatsiya — bezak. Interfeys animatsiyasiz ham to'g'ri
 * bo'lishi shart, shuning uchun bu modul hech qachon xato tashlamaydi va
 * kerak bo'lmasa GSAP umuman yuklanmaydi.
 */
import type { gsap as GsapNamespace } from 'gsap'

type GsapLike = typeof GsapNamespace

/**
 * Foydalanuvchi tizim sozlamasida harakatni kamaytirishni so'raganmi.
 *
 * Bu did masalasi emas: harakat vestibulyar buzilishi bor odamlarda bosh
 * aylanishi va ko'ngil aynishini keltirib chiqaradi.
 */
export function prefersReducedMotion(): boolean {
  if (typeof matchMedia !== 'function') return false

  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * GSAP'ni dangasa yuklaydi.
 *
 * `null` qaytishi mumkin: harakat kamaytirilgan yoki kutubxona yuklanmadi.
 * Chaqiruvchi shu bitta tekshiruv bilan cheklanadi — animatsiya bo'lmasa
 * interfeys shunchaki yakuniy holatida qoladi.
 */
export async function loadGsap(): Promise<GsapLike | null> {
  if (prefersReducedMotion()) return null

  try {
    const module = await import('gsap')
    return module.gsap
  } catch (error) {
    console.error('GSAP yuklanmadi:', error)
    return null
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/lib/motion.test.ts
```

Expected: PASS — 5 passed.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/motion.ts src/lib/motion.test.ts
git commit -m "feat: motion qatlami — GSAP dangasa yuklanadi, reduced-motion hurmat qilinadi"
```

---

### Task 3: Yo'l komponenti

**Files:**
- Create: `src/features/home/LearningPath.tsx`
- Test: `src/features/home/LearningPath.test.tsx`

**Interfaces:**
- Consumes: `buildUnits`, `topicOrderFromDeck`, `PathUnit` (`@/core/path`), `DECKS` (`@/content/starterDecks`), `getAllCards` (`@/core/db`), `PATHS` (`@/app/paths`), `useSettingsStore`, `loadGsap` (Task 2)
- Produces: `LearningPath()` — propssiz, tilni store'dan oladi

- [ ] **Step 1: Write the failing test**

`src/features/home/LearningPath.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { addMissingCards, db, type NewCardRecordInput } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LearningPath } from './LearningPath'

const WORDS: NewCardRecordInput[] = [
  { word: 'hello', translation: 'salom', language: 'en', topic: 'Salomlashish', level: 'A1' },
  { word: 'mother', translation: 'ona', language: 'en', topic: 'Oila', level: 'A1' },
  { word: 'airport', translation: 'aeroport', language: 'en', topic: 'Sayohat', level: 'A2' },
]

function renderPath() {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter>
      <LearningPath />
    </MemoryRouter>,
  )
}

describe('LearningPath', () => {
  beforeEach(async () => {
    await db.cards.clear()
  })

  it('bo‘limlarni ko‘rsatadi', async () => {
    await addMissingCards(WORDS)
    renderPath()

    expect(await screen.findByText('Salomlashish')).toBeInTheDocument()
    expect(screen.getByText('Oila')).toBeInTheDocument()
    expect(screen.getByText('Sayohat')).toBeInTheDocument()
  })

  it('joriy bo‘lim darsga havola qiladi', async () => {
    await addMissingCards(WORDS)
    renderPath()

    const link = await screen.findByRole('link', { name: /salomlashish/i })

    expect(link).toHaveAttribute('href', '/lesson/a1-salomlashish')
  })

  it('qulflangan bo‘lim havola emas va aria-disabled', async () => {
    await addMissingCards(WORDS)
    renderPath()

    // Birinchi bo'lim joriy; keyingilari qulflangan
    const locked = await screen.findByTestId('unit-a1-oila')

    expect(locked).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByRole('link', { name: /oila/i })).not.toBeInTheDocument()
  })

  it('tugallangan bo‘limni belgilaydi', async () => {
    await addMissingCards(WORDS)
    await db.cards.update('en:hello', { totalReviews: 2 })

    renderPath()

    await waitFor(() => {
      expect(screen.getByTestId('unit-a1-salomlashish')).toHaveAttribute(
        'data-state',
        'completed',
      )
    })
  })

  it('animatsiyasiz ham to‘g‘ri chizadi', async () => {
    // jsdom'da GSAP ishlamaydi — bu test "animatsiya bezak" qoidasini
    // avtomatik qo'riqlaydi
    await addMissingCards(WORDS)
    renderPath()

    const unit = await screen.findByTestId('unit-a1-salomlashish')

    expect(unit).toBeVisible()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/features/home/LearningPath.test.tsx
```

Expected: FAIL — `Failed to resolve import "./LearningPath"`.

- [ ] **Step 3: Write `src/features/home/LearningPath.tsx`**

```tsx
import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { PATHS } from '@/app/paths'
import { DECKS } from '@/content/starterDecks'
import { getAllCards } from '@/core/db'
import { buildUnits, topicOrderFromDeck, type PathUnit } from '@/core/path'
import { loadGsap } from '@/lib/motion'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/cn'

/** Holatga qarab doira uslubi */
const CIRCLE = {
  completed: 'bg-brand-500 text-white shadow-[0_4px_0_0] shadow-brand-700',
  current: 'bg-brand-500 text-white ring-4 ring-brand-300 shadow-[0_4px_0_0] shadow-brand-700',
  skipped: 'bg-brand-50 text-brand-700 border-2 border-brand-300',
  locked: 'bg-ink-300/40 text-ink-600',
} as const

/**
 * O'quv yo'li — bo'limlar zanjiri.
 *
 * Bo'lim holati saqlanmaydi, kartalar progressidan hisoblanadi
 * (`core/path/units.ts`). Shuning uchun dars tugagach ro'yxat o'zi
 * yangilanadi: `useLiveQuery` bazadagi o'zgarishni sezadi.
 */
export function LearningPath() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const startingLevel = useSettingsStore((s) => s.startingLevel)

  const cards = useLiveQuery(
    () => (learningLanguage ? getAllCards(learningLanguage) : undefined),
    [learningLanguage],
  )

  const units = useMemo(() => {
    if (!cards || !learningLanguage) return []

    return buildUnits(cards, {
      minLevel: startingLevel,
      topicOrder: topicOrderFromDeck(DECKS[learningLanguage]),
    })
  }, [cards, learningLanguage, startingLevel])

  const listRef = useRef<HTMLOListElement>(null)

  // Bo'limlar ketma-ket "otilib" chiqadi. Animatsiya bo'lmasa ro'yxat
  // shunchaki joyida turadi — DOM allaqachon to'g'ri
  useEffect(() => {
    if (units.length === 0) return

    let cancelled = false

    void loadGsap().then((gsap) => {
      if (!gsap || cancelled || !listRef.current) return

      gsap.from(listRef.current.querySelectorAll('[data-unit]'), {
        y: 24,
        opacity: 0,
        duration: 0.45,
        stagger: 0.06,
        ease: 'back.out(1.7)',
        clearProps: 'all',
      })

      const current = listRef.current.querySelector('[data-state="current"]')
      if (current) {
        // "Nafas": ko'z qayerga qarashni biladi
        gsap.to(current, {
          scale: 1.04,
          duration: 1,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [units.length])

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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/features/home/LearningPath.test.tsx
```

Expected: PASS — 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/features/home/LearningPath.tsx src/features/home/LearningPath.test.tsx
git commit -m "feat: o'quv yo'li komponenti"
```

---

### Task 4: Darsni bo'limga bog'lash va bosh sahifaga joylash

**Files:**
- Modify: `src/features/lesson/LessonScreen.tsx`
- Modify: `src/features/home/HomeScreen.tsx`
- Test: `src/features/lesson/LessonScreen.test.tsx`

**Interfaces:**
- Consumes: `unitIdOf` (Task 1), `LearningPath` (Task 3)
- Produces: `/lesson/:lessonId` faqat o'sha bo'lim so'zlarini beradi

- [ ] **Step 1: Write the failing test**

`src/features/lesson/LessonScreen.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { addMissingCards, db, type NewCardRecordInput } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LessonScreen } from './LessonScreen'

const WORDS: NewCardRecordInput[] = [
  { word: 'hello', translation: 'salom', language: 'en', topic: 'Salomlashish', level: 'A1' },
  { word: 'mother', translation: 'ona', language: 'en', topic: 'Oila', level: 'A1' },
  { word: 'father', translation: 'ota', language: 'en', topic: 'Oila', level: 'A1' },
]

function renderLesson(path: string) {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lesson/:lessonId?" element={<LessonScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LessonScreen — bo‘lim bo‘yicha dars', () => {
  beforeEach(async () => {
    await db.cards.clear()
    await addMissingCards(WORDS)
  })

  it('faqat o‘sha bo‘lim so‘zlarini beradi', async () => {
    renderLesson('/lesson/a1-oila')

    // "Oila" bo'limida ikkita so'z bor
    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/2')
  })

  it('bo‘limsiz ochilganda butun to‘plamdan tanlaydi', async () => {
    renderLesson('/lesson')

    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/3')
  })

  it('noto‘g‘ri bo‘lim id sida bo‘sh holat', async () => {
    renderLesson('/lesson/yoq-bunday-bolim')

    expect(await screen.findByText(/hali so.z yo.q/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/features/lesson/LessonScreen.test.tsx
```

Expected: FAIL — birinchi test `0/3` qaytaradi (filtr yo'q).

- [ ] **Step 3: `LessonScreen.tsx` ni yangilash**

Importlarga qo'shing:

```ts
import { useParams } from 'react-router-dom'
import { unitIdOf } from '@/core/path'
```

Komponent boshida:

```ts
  const { lessonId } = useParams<{ lessonId?: string }>()
```

`getAllCards(...).then((all) => {` ichidagi blokni almashtiring:

```ts
        // Bo'lim berilgan bo'lsa — faqat o'sha mavzu so'zlari.
        // Bo'lim ichida daraja bir xil, shuning uchun minLevel uzatilmaydi.
        const scope = lessonId
          ? all.filter((card) =>
              card.level && card.topic ? unitIdOf(card.level, card.topic) === lessonId : false,
            )
          : all

        setPool(scope)
        setCards(pickLessonCards(scope, LESSON_SIZE, lessonId ? undefined : startingLevel))
```

`useEffect` bog'liqliklariga `lessonId` qo'shing:

```ts
  }, [learningLanguage, lessonKey, startingLevel, lessonId])
```

- [ ] **Step 4: `HomeScreen.tsx` ga yo'lni joylash**

Importga qo'shing:

```tsx
import { LearningPath } from './LearningPath'
```

"Bugun takrorlash" panelidagi ikkinchi tugmani (`Yangi so'zlarni o'rganish`) o'chiring — uning o'rnini yo'l egallaydi:

```tsx
        <div className="flex flex-col gap-2">
          <LinkButton to={PATHS.review} block variant={dueCount > 0 ? 'primary' : 'secondary'}>
            {dueCount > 0 ? 'Takrorlashni boshlash' : 'Takrorlashni ochish'}
          </LinkButton>
        </div>
```

va shu paneldan keyin yo'lni qo'shing:

```tsx
      <LearningPath />
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/features/lesson/LessonScreen.test.tsx
npm test
npm run typecheck
npm run lint
```

Expected: hammasi xatosiz.

- [ ] **Step 6: Commit**

```bash
git add src/features/lesson/LessonScreen.tsx src/features/lesson/LessonScreen.test.tsx src/features/home/HomeScreen.tsx
git commit -m "feat: dars bo'limga bog'landi, yo'l bosh sahifaga joylashdi"
```

---

### Task 5: Hujjat va deploy

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Texnologiyalar jadvaliga qator**

```markdown
| Motion   | GSAP (dangasa yuklanadi, Faza 7) |
```

- [ ] **Step 2: Papka strukturasiga qo'shish**

`core/` daraxtiga:

```markdown
│   ├── path/units.ts        # o'quv yo'li bo'limlari (kartalardan hisoblanadi)
```

- [ ] **Step 3: Yangi bo'lim**

"Offline rejim (PWA)" bo'limidan oldin qo'shing:

````markdown
## O'quv yo'li

Bosh sahifadagi zanjir — **bo'lim = daraja + mavzu**. Ikkalasi ham
kartada bor, shuning uchun yo'l uchun alohida ma'lumot saqlanmaydi:
holat har safar progressdan hisoblanadi
([units.ts](src/core/path/units.ts)).

| Holat | Ma'nosi |
| ----- | ------- |
| `completed` | barcha so'zi kamida bir marta ko'rilgan |
| `current` | birinchi tugallanmagan bo'lim |
| `locked` | joriydan keyingilari |
| `skipped` | daraja testi "bilaman" degan, lekin ko'rilmagan |

`skipped` ataylab alohida: A2 dan boshlagan foydalanuvchining A1
bo'limlariga ✓ qo'yish yolg'on bo'lardi — ular so'nik ko'rinadi, lekin
ochib o'rganish mumkin.

Bo'lim bosilganda `/lesson/a1-oila` ochiladi va dars faqat o'sha mavzu
so'zlaridan tuziladi.

## Animatsiya

GSAP **dangasa yuklanadi** ([motion.ts](src/lib/motion.ts)) — birinchi
ochilish tezligiga tegmaydi.

> **Animatsiya — bezak.** Interfeys animatsiyasiz ham to'g'ri bo'lishi
> shart: GSAP yuklanmasa yoki `prefers-reduced-motion` yoqilgan bo'lsa,
> ekran shunchaki yakuniy holatida turadi. Testlar shuni tekshiradi
> (jsdom'da animatsiya yo'q).

`loadGsap()` harakat kamaytirilganda `null` qaytaradi — kutubxona
umuman yuklanmaydi. Bu did emas: harakat vestibulyar buzilishi bor
odamlarda ko'ngil aynishiga sabab bo'ladi.

Kuchli effektlar yo'l, bosh sahifa va yakun ekranida; mashq siklida esa
harakatlar ≤200 ms — javob va keyingi savol orasidagi ritm buzilmasligi
kerak.
````

- [ ] **Step 4: To'liq tekshiruv**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: hammasi xatosiz. Build hajmi ~24KB (gzip) oshadi — GSAP alohida chunk'ga chiqadi.

- [ ] **Step 5: Commit va deploy**

```bash
git add -A
git commit -m "chore: o'quv yo'li yakuni — README yangilandi"
git push origin main
```

- [ ] **Step 6: Jonli saytda tekshirish**

Deploy `● Ready` bo'lgach:

1. Bosh sahifada zanjir ko'rinishi va bo'limlar ketma-ket chiqishi
2. Joriy bo'lim "nafas olishi"
3. Bo'lim bosilganda faqat o'sha mavzu so'zlari chiqishi
4. Dars tugagach o'sha bo'lim `completed` bo'lib, keyingisi ochilishi

---

## Yakuniy holat

- Bosh sahifada o'quv yo'li; bo'lim holati progressdan hisoblanadi
- `/lesson/:lessonId` marshruti nihoyat ishlaydi
- GSAP xoreografiyasi, `prefers-reduced-motion` hurmat qilinadi
- Yangi testlar: bo'limlar (12), motion (5), yo'l komponenti (5), dars filtri (3)
