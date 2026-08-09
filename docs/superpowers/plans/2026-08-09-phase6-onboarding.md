# Faza 6 — onboarding, daraja testi va mascot: amalga oshirish rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Onboardingni to'rt qadamga kengaytirish — til, daraja testi, kunlik maqsad, birinchi dars — va darslarni aniqlangan darajadan boshlash.

**Architecture:** Daraja testi sof funksiyalar ustiga quriladi: savollar kontentdan yasaladi (`buildPlacementQuiz`), natija `scorePlacement` bilan hisoblanadi. Ikkalasi ham bazaga tegmaydi. Natija `useSettingsStore.startingLevel` ga yoziladi va `pickLessonCards` ning yangi `minLevel` argumenti orqali darslarga ta'sir qiladi. Onboarding bitta marshrut ichida qadamlarga bo'linadi.

**Tech Stack:** TypeScript, React 19, Vitest + Testing Library, Zustand (`persist`), Tailwind v4, `@/` alias.

**Spec:** [docs/superpowers/specs/2026-08-09-phase6-onboarding-design.md](../specs/2026-08-09-phase6-onboarding-design.md)

## Global Constraints

- Kod izohlari va UI matni — **o'zbek tilida** (mavjud kod uslubi).
- Yo'nalishga bog'liq Tailwind utilitalari **taqiqlanadi**: `ml/mr/pl/pr/text-left/left-0` o'rniga `ms/me/ps/pe/text-start/start-0` (arab tili RTL).
- `core/` React'ga bog'liq bo'lmaydi — sof TypeScript.
- Tasodifiylik **argument** sifatida beriladi (`RandomSource` — `@/lib/random`), hech qachon `Math.random` to'g'ridan-to'g'ri chaqirilmaydi.
- `useSettingsStore` dagi `persist` **versiyasi oshirilmaydi** — yangi maydon standart qiymatini oladi; versiya oshirilsa saqlangan holat butunlay tashlanadi.
- Daraja testi bazaga **hech narsa yozmaydi** (SRS, XP, streak — hammasi tegilmaydi).
- Mascot bezak element: `aria-hidden="true"`.
- Har commit oldidan `npm test` to'liq o'tishi shart (bazaviy holat: **314 test**).

## Fayl xaritasi

| Fayl | Mas'uliyati |
| ---- | ----------- |
| `src/core/placement/score.ts` | Daraja hisoblash (sof funksiya) |
| `src/core/placement/questions.ts` | Savollarni kontentdan yasash (sof funksiya) |
| `src/core/placement/index.ts` | Modul eksportlari |
| `src/core/lesson/order.ts` | `minLevel` argumenti qo'shiladi |
| `src/stores/useSettingsStore.ts` | `startingLevel` maydoni |
| `src/components/ui/Mascot.tsx` | SVG boyqush, 4 kayfiyat |
| `src/features/onboarding/OnboardingScreen.tsx` | Qadamlar ketma-ketligi |
| `src/features/onboarding/steps/LanguageStep.tsx` | 1-qadam |
| `src/features/onboarding/steps/PlacementStep.tsx` | 2-qadam |
| `src/features/onboarding/steps/GoalStep.tsx` | 3-qadam |
| `src/features/onboarding/steps/ReadyStep.tsx` | 4-qadam |

---

### Task 1: Daraja hisoblash (`scorePlacement`)

**Files:**
- Create: `src/core/placement/score.ts`
- Test: `src/core/placement/score.test.ts`

**Interfaces:**
- Consumes: `LevelCode` (`@/core/types`), `LEVEL_ORDER` (`@/core/config/levels`)
- Produces:
  - `QUESTIONS_PER_LEVEL = 3`
  - `PASSING_ANSWERS = 2`
  - `scorePlacement(correctByLevel: Record<LevelCode, number>): LevelCode`

- [ ] **Step 1: Write the failing test**

`src/core/placement/score.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { scorePlacement } from './score'

describe('scorePlacement', () => {
  it('3 tadan 2 tasi to‘g‘ri bo‘lsa daraja o‘tilgan hisoblanadi', () => {
    expect(scorePlacement({ A1: 2, A2: 0, B1: 0 })).toBe('A2')
  })

  it('3 tadan 1 tasi yetarli emas', () => {
    expect(scorePlacement({ A1: 1, A2: 3, B1: 3 })).toBe('A1')
  })

  it('past daraja yiqilsa yuqorilari hisobga olinmaydi', () => {
    // A2 yiqilgan — B1 dagi natija ahamiyatsiz
    expect(scorePlacement({ A1: 3, A2: 1, B1: 3 })).toBe('A2')
  })

  it('hammasi o‘tilganda eng yuqori daraja qaytadi', () => {
    // B1 dan yuqori daraja kontentda yo'q
    expect(scorePlacement({ A1: 3, A2: 3, B1: 3 })).toBe('B1')
  })

  it('hech narsa to‘g‘ri bo‘lmasa A1', () => {
    expect(scorePlacement({ A1: 0, A2: 0, B1: 0 })).toBe('A1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/core/placement/score.test.ts
```

Expected: FAIL — `Failed to resolve import "./score"`.

- [ ] **Step 3: Write the implementation**

`src/core/placement/score.ts`:

```ts
import { LEVEL_ORDER } from '@/core/config/levels'
import type { LevelCode } from '@/core/types'

/** Har daraja uchun beriladigan savollar soni */
export const QUESTIONS_PER_LEVEL = 3

/** Daraja "o'tilgan" hisoblanishi uchun kerakli to'g'ri javoblar soni */
export const PASSING_ANSWERS = 2

/**
 * Test natijasidan boshlang'ich darajani aniqlaydi.
 *
 * Qoida: daraja o'tilgan bo'lsa keyingisiga o'tiladi; birinchi
 * O'TILMAGAN daraja — foydalanuvchi shu yerdan boshlaydi.
 *
 * Nega past daraja yiqilganda yuqorilari hisobga olinmaydi: bilim
 * zinapoyasi uzluksiz deb qaraladi. A2 ni bilmay turib B1 ni bilish —
 * ko'pincha tasodifiy to'g'ri javob, uni "bilim" deb qabul qilsak,
 * foydalanuvchi tushunmaydigan so'zlar bilan boshlanardi.
 */
export function scorePlacement(correctByLevel: Record<LevelCode, number>): LevelCode {
  for (const level of LEVEL_ORDER) {
    if ((correctByLevel[level] ?? 0) < PASSING_ANSWERS) return level
  }

  // Hammasi o'tildi — eng yuqori mavjud daraja
  return LEVEL_ORDER[LEVEL_ORDER.length - 1]
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/core/placement/score.test.ts
```

Expected: PASS — 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/placement/score.ts src/core/placement/score.test.ts
git commit -m "feat: daraja testining natijasini hisoblash (scorePlacement)"
```

---

### Task 2: Savollarni kontentdan yasash (`buildPlacementQuiz`)

**Files:**
- Create: `src/core/placement/questions.ts`
- Create: `src/core/placement/index.ts`
- Test: `src/core/placement/questions.test.ts`

**Interfaces:**
- Consumes: `QUESTIONS_PER_LEVEL` (Task 1), `LEVEL_ORDER` (`@/core/config/levels`), `shuffle`/`RandomSource` (`@/lib/random`), `NewCardRecordInput` (`@/core/db`), `LevelCode` (`@/core/types`)
- Produces:
  - `interface PlacementQuestion { level: LevelCode; word: string; options: string[]; correctIndex: number }`
  - `buildPlacementQuiz(deck: Record<LevelCode, NewCardRecordInput[]>, random?: RandomSource): PlacementQuestion[]`
  - `src/core/placement/index.ts` — `export * from './score'` va `export * from './questions'`

- [ ] **Step 1: Write the failing test**

`src/core/placement/questions.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { DECKS } from '@/content/starterDecks'
import { seededRandom } from '@/lib/random'
import { buildPlacementQuiz } from './questions'

describe('buildPlacementQuiz', () => {
  it('har darajadan 3 tadan savol beradi', () => {
    const quiz = buildPlacementQuiz(DECKS.en, seededRandom(1))

    expect(quiz).toHaveLength(9)
    expect(quiz.filter((q) => q.level === 'A1')).toHaveLength(3)
    expect(quiz.filter((q) => q.level === 'A2')).toHaveLength(3)
    expect(quiz.filter((q) => q.level === 'B1')).toHaveLength(3)
  })

  it('savollar oson darajadan boshlanadi', () => {
    const quiz = buildPlacementQuiz(DECKS.en, seededRandom(2))

    expect(quiz.map((q) => q.level)).toEqual([
      'A1', 'A1', 'A1', 'A2', 'A2', 'A2', 'B1', 'B1', 'B1',
    ])
  })

  it('har savolda 4 ta variant va bitta to‘g‘ri javob bor', () => {
    const quiz = buildPlacementQuiz(DECKS.ru, seededRandom(3))

    quiz.forEach((question) => {
      expect(question.options).toHaveLength(4)
      expect(question.correctIndex).toBeGreaterThanOrEqual(0)
      expect(question.correctIndex).toBeLessThan(4)
      expect(question.options[question.correctIndex].length).toBeGreaterThan(0)
    })
  })

  it('variantlar takrorlanmaydi', () => {
    const quiz = buildPlacementQuiz(DECKS.ar, seededRandom(4))

    quiz.forEach((question) => {
      expect(new Set(question.options).size).toBe(4)
    })
  })

  it('so‘zlar takrorlanmaydi', () => {
    const quiz = buildPlacementQuiz(DECKS.en, seededRandom(5))
    const words = quiz.map((q) => q.word)

    expect(new Set(words).size).toBe(words.length)
  })

  it('bir xil urug‘ — bir xil natija', () => {
    const first = buildPlacementQuiz(DECKS.en, seededRandom(7))
    const second = buildPlacementQuiz(DECKS.en, seededRandom(7))

    expect(first).toEqual(second)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/core/placement/questions.test.ts
```

Expected: FAIL — `Failed to resolve import "./questions"`.

- [ ] **Step 3: Write the implementation**

`src/core/placement/questions.ts`:

```ts
import { LEVEL_ORDER } from '@/core/config/levels'
import type { NewCardRecordInput } from '@/core/db'
import type { LevelCode } from '@/core/types'
import { shuffle, type RandomSource } from '@/lib/random'
import { QUESTIONS_PER_LEVEL } from './score'

/** Bitta test savoli — tanib olish ko'rinishida */
export interface PlacementQuestion {
  level: LevelCode
  /** O'rganilayotgan tildagi so'z */
  word: string
  /** O'zbekcha variantlar */
  options: string[]
  correctIndex: number
}

/** Savoldagi variantlar soni */
const CHOICES = 4

/**
 * Daraja testi savollarini KONTENTDAN yasaydi.
 *
 * Nega bazadan emas: onboarding paytida foydalanuvchining bazasi hali
 * bo'sh bo'lishi mumkin. Bundan tashqari test SRS holatiga umuman
 * tegmasligi kerak — u faqat o'qiydi va hech narsa yozmaydi.
 *
 * Savollar oson darajadan boshlanadi: qiyin savol birinchi bo'lib chiqsa,
 * boshlovchi o'zini bilimsiz his qilib testni tashlab ketishi mumkin.
 */
export function buildPlacementQuiz(
  deck: Record<LevelCode, NewCardRecordInput[]>,
  random: RandomSource = Math.random,
): PlacementQuestion[] {
  const everyTranslation = LEVEL_ORDER.flatMap((level) =>
    deck[level].map((card) => card.translation),
  )

  return LEVEL_ORDER.flatMap((level) => {
    const chosen = shuffle(deck[level], random).slice(0, QUESTIONS_PER_LEVEL)

    return chosen.map((card) => {
      // Chalg'ituvchilar butun to'plamdan olinadi: shu tildagi boshqa
      // so'zlar eng ishonchli chalg'ituvchi bo'ladi (tarjimalar noyob —
      // buni kontent testi kafolatlaydi)
      const distractors = shuffle(
        everyTranslation.filter((translation) => translation !== card.translation),
        random,
      ).slice(0, CHOICES - 1)

      const options = shuffle([card.translation, ...distractors], random)

      return {
        level,
        word: card.word,
        options,
        correctIndex: options.indexOf(card.translation),
      }
    })
  })
}
```

- [ ] **Step 4: Create `src/core/placement/index.ts`**

```ts
/**
 * Daraja aniqlash — sof funksiyalar.
 * Bu modul bazaga tegmaydi: savollar kontentdan yasaladi, natija esa
 * faqat bitta qiymat (boshlang'ich daraja) qaytaradi.
 */
export * from './score'
export * from './questions'
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/core/placement/questions.test.ts
```

Expected: PASS — 6 passed.

- [ ] **Step 6: Commit**

```bash
git add src/core/placement
git commit -m "feat: daraja testi savollarini kontentdan yasash"
```

---

### Task 3: `pickLessonCards` — `minLevel` argumenti

**Files:**
- Modify: `src/core/lesson/order.ts`
- Test: `src/core/lesson/order.test.ts` (mavjud faylga qo'shiladi)

**Interfaces:**
- Consumes: `levelRank`, `LEVEL_ORDER` (`@/core/config/levels`), `CardRecord` (`@/core/db`)
- Produces: `pickLessonCards(cards: CardRecord[], size: number, minLevel?: LevelCode): CardRecord[]`

- [ ] **Step 1: Write the failing test**

`src/core/lesson/order.test.ts` faylining oxiriga, mavjud `describe` blokidan keyin qo'shing:

```ts
describe('pickLessonCards — boshlang‘ich daraja', () => {
  it('past darajadagi ko‘rilmagan so‘z oxirga suriladi', () => {
    const cards = [
      card('a1', { level: 'A1', totalReviews: 0 }),
      card('a2', { level: 'A2', totalReviews: 0 }),
    ]

    expect(pickLessonCards(cards, 2, 'A2').map((c) => c.id)).toEqual(['a2', 'a1'])
  })

  it('ko‘rilgan kartalar past darajadagi yangi so‘zdan oldin turadi', () => {
    // Mustahkamlash "bilaman" deb belgilangan darajadagi so'zdan muhimroq
    const cards = [
      card('a1', { level: 'A1', totalReviews: 0 }),
      card('b1seen', { level: 'B1', totalReviews: 5 }),
    ]

    expect(pickLessonCards(cards, 2, 'A2').map((c) => c.id)).toEqual(['b1seen', 'a1'])
  })

  it('boshqa hech narsa qolmasa past daraja baribir qaytadi', () => {
    // Dars hech qachon bo'sh qaytmaydi
    const cards = [card('a1', { level: 'A1', totalReviews: 0 })]

    expect(pickLessonCards(cards, 5, 'B1').map((c) => c.id)).toEqual(['a1'])
  })

  it('minLevel berilmasa tartib o‘zgarmaydi', () => {
    const cards = [
      card('a2', { level: 'A2', totalReviews: 0 }),
      card('a1', { level: 'A1', totalReviews: 0 }),
    ]

    expect(pickLessonCards(cards, 2).map((c) => c.id)).toEqual(['a1', 'a2'])
  })

  it('minLevel A1 bo‘lsa hech narsa surilmaydi', () => {
    const cards = [
      card('a2', { level: 'A2', totalReviews: 0 }),
      card('a1', { level: 'A1', totalReviews: 0 }),
    ]

    expect(pickLessonCards(cards, 2, 'A1').map((c) => c.id)).toEqual(['a1', 'a2'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/core/lesson/order.test.ts
```

Expected: FAIL — birinchi yangi test `['a1', 'a2']` qaytaradi, `['a2', 'a1']` kutilgan.

- [ ] **Step 3: Write the implementation**

`src/core/lesson/order.ts` faylini to'liq shu bilan almashtiring:

```ts
import { levelRank } from '@/core/config/levels'
import type { CardRecord } from '@/core/db'
import type { LevelCode } from '@/core/types'

/**
 * Tartiblash guruhlari (kichigi oldin).
 *
 * `LOW_LEVEL_NEW` — foydalanuvchi daraja testida "bilaman" deb ko'rsatgan
 * darajadagi yangi so'zlar. Ular O'CHIRILMAYDI, faqat zaxiraga suriladi:
 * A2 dan boshlagan foydalanuvchining A2/B1 so'zlari tugasa, dars bo'sh
 * qaytmasligi kerak.
 */
const GROUP = { NEW: 0, SEEN: 1, LOW_LEVEL_NEW: 2 } as const

function groupOf(card: CardRecord, minRank: number): number {
  if (card.totalReviews > 0) return GROUP.SEEN

  return levelRank(card.level) < minRank ? GROUP.LOW_LEVEL_NEW : GROUP.NEW
}

/**
 * Darsga chiqadigan kartalarni tanlaydi.
 *
 * Tartib mezonlari (ketma-ket):
 *   1. guruh — yangi → mustahkamlash → past darajadagi yangi
 *   2. daraja — A1 → A2 → B1
 *   3. kam ko'rilgani oldin (`totalReviews`)
 *   4. eng kam mustahkamlangani oldin (`interval`)
 *
 * NEGA daraja BIRINCHI mezon emas: A1 kartalari o'rganib bo'lingandan
 * keyin ham ro'yxatda qoladi. Daraja birinchi bo'lsa, ular har doim A2
 * dan oldin turardi va dars A1 da abadiy qolib ketardi. "Ko'rilmagan"
 * mezonini oldinga qo'yish "eng past TUGALLANMAGAN darajadan" degan
 * qoidani beradi: A1 yangi so'zlari tugagach A2 o'zi ochiladi.
 *
 * Bu domen qoidasi (qaysi so'z keyingi o'rgatiladi), UI emas — shuning
 * uchun ekrandan ajratilgan va React'siz test qilinadi.
 *
 * @param minLevel daraja testi natijasi; berilmasa hamma daraja teng
 */
export function pickLessonCards(
  cards: CardRecord[],
  size: number,
  minLevel?: LevelCode,
): CardRecord[] {
  const minRank = minLevel === undefined ? 0 : levelRank(minLevel)

  // Nusxa olinadi: chaqiruvchi bergan massiv o'zgarmasligi kerak
  return [...cards]
    .sort((a, b) => {
      const byGroup = groupOf(a, minRank) - groupOf(b, minRank)
      if (byGroup !== 0) return byGroup

      const byLevel = levelRank(a.level) - levelRank(b.level)
      if (byLevel !== 0) return byLevel

      if (a.totalReviews !== b.totalReviews) return a.totalReviews - b.totalReviews

      return a.interval - b.interval
    })
    .slice(0, size)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/core/lesson/order.test.ts
```

Expected: PASS — 13 passed (mavjud 8 + yangi 5).

- [ ] **Step 5: Commit**

```bash
git add src/core/lesson/order.ts src/core/lesson/order.test.ts
git commit -m "feat: dars tartibi boshlang'ich darajani hisobga oladi"
```

---

### Task 4: `startingLevel` sozlamasi va uni darsga ulash

**Files:**
- Modify: `src/stores/useSettingsStore.ts`
- Modify: `src/features/lesson/LessonScreen.tsx`

**Interfaces:**
- Consumes: `pickLessonCards(cards, size, minLevel?)` (Task 3), `LevelCode` (`@/core/types`)
- Produces: `useSettingsStore` da `startingLevel: LevelCode` (standart `'A1'`) va `setStartingLevel(level: LevelCode): void`

- [ ] **Step 1: `useSettingsStore` ga maydon qo'shish**

`SettingsState` interfeysiga, `dailyGoalWords` dan keyin:

```ts
  /** Daraja testi natijasi — darslar shu darajadan boshlanadi (Faza 6) */
  startingLevel: LevelCode
```

`SettingsState` ichidagi funksiyalar ro'yxatiga:

```ts
  setStartingLevel: (level: LevelCode) => void
```

`INITIAL` obyektiga:

```ts
  startingLevel: 'A1',
```

`create` ichidagi amallar ro'yxatiga, `setDailyGoalWords` dan keyin:

```ts
      setStartingLevel: (startingLevel) => set({ startingLevel }),
```

Import qatorini yangilang:

```ts
import type { LanguageCode, LevelCode } from '@/core/types'
```

**DIQQAT:** `persist` versiyasini **oshirmang** (fayldagi izohda sababi
yozilgan): yangi maydon qo'shilganda saqlangan holat boshlang'ich
qiymatlar ustiga yoziladi va maydon o'z standart qiymatini oladi.

- [ ] **Step 2: `LessonScreen` ni ulash**

`src/features/lesson/LessonScreen.tsx` da til o'qiladigan qatordan keyin:

```ts
  const startingLevel = useSettingsStore((s) => s.startingLevel)
```

`pickLessonCards` chaqiruvini almashtiring:

```ts
        setCards(pickLessonCards(all, LESSON_SIZE, startingLevel))
```

`useEffect` bog'liqliklari ro'yxatiga `startingLevel` qo'shing:

```ts
  }, [learningLanguage, lessonKey, startingLevel])
```

- [ ] **Step 3: Tekshirish**

```bash
npm test
npm run typecheck
```

Expected: barcha testlar PASS; typecheck xatosiz.

- [ ] **Step 4: Commit**

```bash
git add src/stores/useSettingsStore.ts src/features/lesson/LessonScreen.tsx
git commit -m "feat: startingLevel sozlamasi darslarga ulandi"
```

---

### Task 5: Mascot (SVG boyqush)

**Files:**
- Create: `src/components/ui/Mascot.tsx`
- Test: `src/components/ui/Mascot.test.tsx`

**Interfaces:**
- Consumes: `cn` (`@/lib/cn`)
- Produces: `Mascot({ mood, size, className })` — `mood: 'idle' | 'happy' | 'thinking' | 'celebrating'`, `size: 'sm' | 'md' | 'lg'`

- [ ] **Step 1: Write the failing test**

`src/components/ui/Mascot.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Mascot } from './Mascot'

describe('Mascot', () => {
  it('bezak element sifatida ekran o‘quvchidan yashiriladi', () => {
    // Yonidagi matn ma'noni allaqachon beradi — takrorlash shovqin bo'lardi
    const { container } = render(<Mascot mood="idle" />)
    const svg = container.querySelector('svg')

    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('har kayfiyat uchun boshqacha chizadi', () => {
    const { container: idle } = render(<Mascot mood="idle" />)
    const { container: happy } = render(<Mascot mood="happy" />)

    expect(idle.innerHTML).not.toBe(happy.innerHTML)
  })

  it('kayfiyat data-atributi bilan belgilanadi', () => {
    const { container } = render(<Mascot mood="celebrating" />)

    expect(container.querySelector('svg')).toHaveAttribute('data-mood', 'celebrating')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/ui/Mascot.test.tsx
```

Expected: FAIL — `Failed to resolve import "./Mascot"`.

- [ ] **Step 3: Write the implementation**

`src/components/ui/Mascot.tsx`:

```tsx
import { cn } from '@/lib/cn'

export type MascotMood = 'idle' | 'happy' | 'thinking' | 'celebrating'

interface MascotProps {
  mood?: MascotMood
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = { sm: 'h-16 w-16', md: 'h-24 w-24', lg: 'h-32 w-32' } as const

/**
 * Ilova personaji — boyqush.
 *
 * NEGA EMOJI EMAS: emoji har platformada har xil chiziladi, ba'zilarida
 * umuman chizilmaydi (Windows'da bayroq emojilari o'rniga harflar
 * chiqqani shunga misol). SVG hamma joyda bir xil ko'rinadi.
 *
 * NEGA TASHQI RASM HAM EMAS: qo'shimcha so'rov va yuklanish kechikishi.
 * Boyqush oddiy shakllardan iborat.
 *
 * Bezak element — `aria-hidden`.
 */
export function Mascot({ mood = 'idle', size = 'md', className }: MascotProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="presentation"
      aria-hidden="true"
      data-mood={mood}
      className={cn(SIZES[size], className)}
    >
      {/* Tana */}
      <ellipse cx="50" cy="58" rx="34" ry="36" fill="#f59e0b" />
      <ellipse cx="50" cy="64" rx="24" ry="27" fill="#fbbf24" />

      {/* Quloqlar */}
      <path d="M22 30 L30 8 L44 24 Z" fill="#f59e0b" />
      <path d="M78 30 L70 8 L56 24 Z" fill="#f59e0b" />

      {/* Ko'z oqi */}
      <circle cx="37" cy="45" r="14" fill="#ffffff" />
      <circle cx="63" cy="45" r="14" fill="#ffffff" />

      <Eyes mood={mood} />

      {/* Tumshuq */}
      <path d="M50 54 L44 63 L56 63 Z" fill="#ea580c" />

      {/* Panjalar */}
      <path d="M40 92 h8 M52 92 h8" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

/** Kayfiyat ko'z shakli bilan beriladi */
function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === 'happy' || mood === 'celebrating') {
    // Kulgan ko'z — yoy shaklida
    return (
      <g stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M29 47 q8 -10 16 0" />
        <path d="M55 47 q8 -10 16 0" />
      </g>
    )
  }

  if (mood === 'thinking') {
    // Bir ko'z qisilgan
    return (
      <g fill="#0f172a">
        <circle cx="37" cy="45" r="6" />
        <rect x="53" y="43" width="20" height="4" rx="2" />
      </g>
    )
  }

  return (
    <g fill="#0f172a">
      <circle cx="37" cy="45" r="6" />
      <circle cx="63" cy="45" r="6" />
    </g>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/ui/Mascot.test.tsx
```

Expected: PASS — 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Mascot.tsx src/components/ui/Mascot.test.tsx
git commit -m "feat: mascot — SVG boyqush, to'rt kayfiyat"
```

---

### Task 6: Onboarding qadamlari (til, maqsad, tayyor)

Daraja testi qadami keyingi taskda — u eng murakkabi va alohida ko'rib chiqishga arziydi.

**Files:**
- Create: `src/features/onboarding/steps/LanguageStep.tsx`
- Create: `src/features/onboarding/steps/GoalStep.tsx`
- Create: `src/features/onboarding/steps/ReadyStep.tsx`

**Interfaces:**
- Consumes: `Mascot` (Task 5), `LanguageBadge` (`@/components/ui/LanguageBadge`), `Button` (`@/components/ui/Button`), `LANGUAGE_LIST` (`@/core/config/languages`), `useSettingsStore`
- Produces:
  - `LanguageStep({ onNext }: { onNext: () => void })`
  - `GoalStep({ onNext, onBack }: { onNext: () => void; onBack: () => void })`
  - `ReadyStep({ onFinish }: { onFinish: (destination: 'lesson' | 'home') => void })`

- [ ] **Step 1: `LanguageStep.tsx`**

Mavjud `OnboardingScreen` ning til tanlash qismi shu yerga ko'chadi:

```tsx
import { Button } from '@/components/ui/Button'
import { LanguageBadge } from '@/components/ui/LanguageBadge'
import { Mascot } from '@/components/ui/Mascot'
import { LANGUAGE_LIST } from '@/core/config/languages'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/cn'

/** Onboarding, 1-qadam: o'rganiladigan tilni tanlash */
export function LanguageStep({ onNext }: { onNext: () => void }) {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const setLearningLanguage = useSettingsStore((s) => s.setLearningLanguage)

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col items-center text-center">
        <Mascot mood="idle" size="lg" className="mb-3" />
        <h1 className="text-2xl font-extrabold">Qaysi tilni o'rganamiz?</h1>
        <p className="mt-2 text-sm text-ink-600">
          Kuniga 5 daqiqa — va so'zlar o'zi esda qoladi.
        </p>
        <p className="mt-1 text-xs text-ink-600">
          Bittadan boshlang — keyin Profil orqali boshqa til ham qo'shsangiz bo'ladi.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {LANGUAGE_LIST.map((lang) => {
          const isSelected = learningLanguage === lang.code
          return (
            <li key={lang.code}>
              <button
                type="button"
                onClick={() => setLearningLanguage(lang.code)}
                aria-pressed={isSelected}
                className={cn(
                  'tap-highlight-none flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-4 text-start transition-colors',
                  isSelected ? 'border-brand-500 bg-brand-50' : 'border-ink-300 hover:border-ink-600/40',
                )}
              >
                <LanguageBadge language={lang} size="lg" />
                <span className="flex flex-col">
                  <span className="font-bold">{lang.name}</span>
                  <span className="text-sm text-ink-600" dir={lang.dir} lang={lang.code}>
                    {lang.nativeName}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto pt-8">
        <Button block size="lg" disabled={!learningLanguage} onClick={onNext}>
          Davom etish
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `GoalStep.tsx`**

```tsx
import { Button } from '@/components/ui/Button'
import { Mascot } from '@/components/ui/Mascot'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/cn'

/** Kunlik maqsad variantlari — so'z/kun */
const GOALS = [
  { words: 10, title: 'Yengil', hint: '~3 daqiqa' },
  { words: 20, title: 'Oddiy', hint: '~5 daqiqa' },
  { words: 30, title: 'Jiddiy', hint: '~8 daqiqa' },
] as const

/**
 * Onboarding, 3-qadam: kunlik maqsad.
 *
 * Maqsadni foydalanuvchi O'ZI tanlaydi — o'zi qo'ygan maqsadga sodiqlik
 * tashqaridan berilganiga qaraganda yuqori bo'ladi.
 */
export function GoalStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const dailyGoalWords = useSettingsStore((s) => s.dailyGoalWords)
  const setDailyGoalWords = useSettingsStore((s) => s.setDailyGoalWords)

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col items-center text-center">
        <Mascot mood="idle" size="md" className="mb-3" />
        <h1 className="text-2xl font-extrabold">Kunlik maqsad</h1>
        <p className="mt-2 text-sm text-ink-600">
          Keyin Profil orqali o'zgartirsangiz bo'ladi.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {GOALS.map((goal) => {
          const isSelected = dailyGoalWords === goal.words
          return (
            <li key={goal.words}>
              <button
                type="button"
                onClick={() => setDailyGoalWords(goal.words)}
                aria-pressed={isSelected}
                className={cn(
                  'tap-highlight-none flex w-full items-center justify-between rounded-2xl border-2 bg-white p-4 text-start transition-colors',
                  isSelected ? 'border-brand-500 bg-brand-50' : 'border-ink-300 hover:border-ink-600/40',
                )}
              >
                <span className="flex flex-col">
                  <span className="font-bold">{goal.title}</span>
                  <span className="text-sm text-ink-600">{goal.hint}</span>
                </span>
                <span className="text-lg font-extrabold text-brand-700">
                  {goal.words} so'z
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <Button block size="lg" onClick={onNext}>
          Davom etish
        </Button>
        <Button block variant="ghost" onClick={onBack}>
          Orqaga
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: `ReadyStep.tsx`**

```tsx
import { Button } from '@/components/ui/Button'
import { Mascot } from '@/components/ui/Mascot'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Onboarding, 4-qadam: yakun.
 *
 * Asosiy tugma to'g'ridan-to'g'ri DARSGA olib boradi (TZ 6.1): bosh
 * ekranga tushgan yangi foydalanuvchi nima qilishni bilmay qolishi mumkin.
 */
export function ReadyStep({ onFinish }: { onFinish: (destination: 'lesson' | 'home') => void }) {
  const startingLevel = useSettingsStore((s) => s.startingLevel)
  const dailyGoalWords = useSettingsStore((s) => s.dailyGoalWords)

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col items-center text-center">
        <Mascot mood="celebrating" size="lg" className="mb-3" />
        <h1 className="text-2xl font-extrabold">Tayyor!</h1>
        <p className="mt-2 text-sm text-ink-600">
          Boshlang'ich daraja: <strong>{startingLevel}</strong> · Kuniga{' '}
          <strong>{dailyGoalWords} so'z</strong>
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <Button block size="lg" onClick={() => onFinish('lesson')}>
          Birinchi darsni boshlash
        </Button>
        <Button block variant="ghost" onClick={() => onFinish('home')}>
          Keyinroq
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Tiplarni tekshirish**

```bash
npm run typecheck
```

Expected: xatosiz. (Bu qadamlar hali hech qayerdan chaqirilmaydi — ular Task 8 da ulanadi.)

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/steps
git commit -m "feat: onboarding qadamlari — til, kunlik maqsad, yakun"
```

---

### Task 7: Daraja testi qadami

**Files:**
- Create: `src/features/onboarding/steps/PlacementStep.tsx`

**Interfaces:**
- Consumes: `buildPlacementQuiz`, `scorePlacement`, `PlacementQuestion` (`@/core/placement`), `DECKS` (`@/content/starterDecks`), `Mascot` (Task 5), `LEVEL_ORDER` (`@/core/config/levels`)
- Produces: `PlacementStep({ language, onDone }: { language: LanguageCode; onDone: (level: LevelCode) => void })`

- [ ] **Step 1: Write the component**

`src/features/onboarding/steps/PlacementStep.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Mascot } from '@/components/ui/Mascot'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DECKS } from '@/content/starterDecks'
import { LANGUAGES } from '@/core/config/languages'
import { LEVEL_ORDER } from '@/core/config/levels'
import { buildPlacementQuiz, scorePlacement } from '@/core/placement'
import type { LanguageCode, LevelCode } from '@/core/types'
import { cn } from '@/lib/cn'

interface PlacementStepProps {
  language: LanguageCode
  /** Test tugadi (yoki o'tkazib yuborildi) — natija bilan */
  onDone: (level: LevelCode) => void
}

/** Boshlang'ich hisob: har daraja uchun nol to'g'ri javob */
function emptyScore(): Record<LevelCode, number> {
  return LEVEL_ORDER.reduce(
    (acc, level) => ({ ...acc, [level]: 0 }),
    {} as Record<LevelCode, number>,
  )
}

/**
 * Onboarding, 2-qadam: daraja testi.
 *
 * MUHIM: bu yerda `SessionRunner` ISHLATILMAYDI va bazaga hech narsa
 * yozilmaydi. `SessionRunner` har javobni SM-2 bahosi, XP va kunlik
 * statistika sifatida yozadi — natijada foydalanuvchi hali o'rganishni
 * boshlamasdan turib bilmagan so'zlari "unutilgan" deb belgilanardi.
 * Bu yerdan faqat bitta qiymat chiqadi: boshlang'ich daraja.
 */
export function PlacementStep({ language, onDone }: PlacementStepProps) {
  // Savollar bir marta yasaladi: har javobdan keyin qayta yasalsa,
  // foydalanuvchi oldinga siljimasdi
  const quiz = useMemo(() => buildPlacementQuiz(DECKS[language]), [language])
  const meta = LANGUAGES[language]

  const [index, setIndex] = useState(0)
  const [score, setScore] = useState<Record<LevelCode, number>>(emptyScore)

  const question = quiz[index]

  function handleAnswer(choice: number) {
    const isCorrect = choice === question.correctIndex
    const nextScore = isCorrect
      ? { ...score, [question.level]: score[question.level] + 1 }
      : score

    setScore(nextScore)

    if (index + 1 >= quiz.length) {
      onDone(scorePlacement(nextScore))
      return
    }

    setIndex(index + 1)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex flex-col items-center text-center">
        <Mascot mood="thinking" size="md" className="mb-2" />
        <h1 className="text-xl font-extrabold">Darajangizni aniqlaymiz</h1>
        <p className="mt-1 text-sm text-ink-600">
          Bilmasangiz — xato javob ham natijaga yordam beradi.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={index} max={quiz.length} label="Test progressi" />
        <span data-testid="placement-progress" className="text-sm font-semibold text-ink-600">
          {index + 1}/{quiz.length}
        </span>
      </div>

      <p
        data-testid="placement-word"
        dir={meta.dir}
        lang={meta.code}
        className="mb-4 rounded-2xl border-2 border-ink-300 bg-white p-6 text-center text-3xl font-extrabold"
      >
        {question.word}
      </p>

      <ul className="flex flex-col gap-2">
        {question.options.map((option, choice) => (
          <li key={option}>
            <button
              type="button"
              onClick={() => handleAnswer(choice)}
              className={cn(
                'tap-highlight-none w-full rounded-2xl border-2 border-ink-300 bg-white p-4',
                'text-start font-semibold transition-colors hover:border-brand-500',
              )}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <Button block variant="ghost" onClick={() => onDone('A1')}>
          Testni o'tkazib yuborish
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Tiplarni tekshirish**

```bash
npm run typecheck
```

Expected: xatosiz.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/steps/PlacementStep.tsx
git commit -m "feat: onboarding daraja testi qadami"
```

---

### Task 8: Qadamlarni birlashtirish va oqim testlari

**Files:**
- Modify: `src/features/onboarding/OnboardingScreen.tsx` (to'liq almashtiriladi)
- Test: `src/features/onboarding/OnboardingScreen.test.tsx`

**Interfaces:**
- Consumes: `LanguageStep`, `GoalStep`, `ReadyStep` (Task 6), `PlacementStep` (Task 7), `setStartingLevel` (Task 4), `PATHS` (`@/app/paths`)
- Produces: to'liq onboarding oqimi

- [ ] **Step 1: Write the failing test**

`src/features/onboarding/OnboardingScreen.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { OnboardingScreen } from './OnboardingScreen'

function renderScreen() {
  useSettingsStore.getState().reset()

  return render(
    <MemoryRouter>
      <OnboardingScreen />
    </MemoryRouter>,
  )
}

/** 1-qadamdan 2-qadamga o'tish */
function chooseEnglish() {
  fireEvent.click(screen.getByRole('button', { name: /ingliz tili/i }))
  fireEvent.click(screen.getByRole('button', { name: /davom etish/i }))
}

describe('OnboardingScreen — oqim', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset()
  })

  it('til tanlanmaguncha davom etib bo‘lmaydi', () => {
    renderScreen()

    expect(screen.getByRole('button', { name: /davom etish/i })).toBeDisabled()
  })

  it('til tanlangach daraja testiga o‘tadi', () => {
    renderScreen()
    chooseEnglish()

    expect(screen.getByTestId('placement-progress')).toHaveTextContent('1/9')
  })

  it('testni o‘tkazib yuborsa daraja A1 bo‘ladi', () => {
    renderScreen()
    chooseEnglish()

    fireEvent.click(screen.getByRole('button', { name: /o.tkazib yuborish/i }))

    expect(useSettingsStore.getState().startingLevel).toBe('A1')
    // Keyingi qadam — kunlik maqsad
    expect(screen.getByText(/kunlik maqsad/i)).toBeInTheDocument()
  })

  it('barcha savollarga javob berilgach maqsad qadamiga o‘tadi', () => {
    renderScreen()
    chooseEnglish()

    // Har savolda birinchi variantni tanlaymiz — natija muhim emas,
    // muhimi oqim oxirigacha borishi
    for (let i = 0; i < 9; i += 1) {
      const options = screen.getAllByRole('listitem')
      fireEvent.click(options[0].querySelector('button')!)
    }

    expect(screen.getByText(/kunlik maqsad/i)).toBeInTheDocument()
  })

  it('kunlik maqsad tanlanadi va yakun qadamida ko‘rinadi', () => {
    renderScreen()
    chooseEnglish()
    fireEvent.click(screen.getByRole('button', { name: /o.tkazib yuborish/i }))

    fireEvent.click(screen.getByRole('button', { name: /yengil/i }))
    fireEvent.click(screen.getByRole('button', { name: /davom etish/i }))

    expect(useSettingsStore.getState().dailyGoalWords).toBe(10)
    expect(screen.getByText(/tayyor/i)).toBeInTheDocument()
  })

  it('maqsad qadamidan orqaga qaytish mumkin', () => {
    renderScreen()
    chooseEnglish()
    fireEvent.click(screen.getByRole('button', { name: /o.tkazib yuborish/i }))

    fireEvent.click(screen.getByRole('button', { name: /orqaga/i }))

    expect(screen.getByTestId('placement-progress')).toBeInTheDocument()
  })

  it('yakunda onboarding tugallangan deb belgilanadi', () => {
    renderScreen()
    chooseEnglish()
    fireEvent.click(screen.getByRole('button', { name: /o.tkazib yuborish/i }))
    fireEvent.click(screen.getByRole('button', { name: /davom etish/i }))

    expect(useSettingsStore.getState().onboardingCompleted).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: /birinchi darsni boshlash/i }))

    expect(useSettingsStore.getState().onboardingCompleted).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/features/onboarding/OnboardingScreen.test.tsx
```

Expected: FAIL — `placement-progress` topilmaydi (hozirgi ekran bitta qadamdan iborat).

- [ ] **Step 3: Write the implementation**

`src/features/onboarding/OnboardingScreen.tsx` faylini to'liq shu bilan almashtiring:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import type { LevelCode } from '@/core/types'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { GoalStep } from './steps/GoalStep'
import { LanguageStep } from './steps/LanguageStep'
import { PlacementStep } from './steps/PlacementStep'
import { ReadyStep } from './steps/ReadyStep'

type Step = 'language' | 'placement' | 'goal' | 'ready'

/**
 * Onboarding (TZ 6.1): til tanlash → daraja testi → kunlik maqsad →
 * birinchi dars.
 *
 * Qadamlar BITTA marshrut ichida: har qadamga alohida URL berilsa, har
 * biriga "oldingi qadam bajarilganmi" tekshiruvi kerak bo'lardi. Bu bir
 * martalik oqim uchun ortiqcha murakkablik — qadamlarga havola berilmaydi.
 */
export function OnboardingScreen() {
  const navigate = useNavigate()
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const setStartingLevel = useSettingsStore((s) => s.setStartingLevel)
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding)

  const [step, setStep] = useState<Step>('language')

  function handlePlacementDone(level: LevelCode) {
    setStartingLevel(level)
    setStep('goal')
  }

  function handleFinish(destination: 'lesson' | 'home') {
    completeOnboarding()
    navigate(destination === 'lesson' ? PATHS.lesson : PATHS.home, { replace: true })
  }

  return (
    <div className="flex flex-1 flex-col px-5 py-8">
      {step === 'language' && <LanguageStep onNext={() => setStep('placement')} />}

      {step === 'placement' && learningLanguage && (
        <PlacementStep language={learningLanguage} onDone={handlePlacementDone} />
      )}

      {step === 'goal' && (
        <GoalStep onNext={() => setStep('ready')} onBack={() => setStep('placement')} />
      )}

      {step === 'ready' && <ReadyStep onFinish={handleFinish} />}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/features/onboarding/OnboardingScreen.test.tsx
```

Expected: PASS — 7 passed.

- [ ] **Step 5: Full verification**

```bash
npm test
npm run typecheck
npm run lint
```

Expected: hammasi xatosiz.

- [ ] **Step 6: Commit**

```bash
git add src/features/onboarding
git commit -m "feat: to'rt qadamli onboarding oqimi"
```

---

### Task 9: Mascot'ni seans yakuniga qo'shish, hujjatlarni yangilash va deploy

**Files:**
- Modify: `src/features/session/SessionSummaryPanel.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `Mascot` (Task 5)
- Produces: —

- [ ] **Step 1: Seans yakunida mascot**

`src/features/session/SessionSummaryPanel.tsx` da eng tashqi konteyner ichiga, sarlavhadan oldin qo'shing:

```tsx
      <Mascot mood="celebrating" size="md" className="mx-auto" />
```

va importni qo'shing:

```tsx
import { Mascot } from '@/components/ui/Mascot'
```

- [ ] **Step 2: `README.md` — fazalar holati**

```markdown
- [x] **Faza 6** — to'liq onboarding + daraja testi + mascot
```

- [ ] **Step 3: `README.md` — papka strukturasi**

`core/` daraxtiga qo'shing:

```markdown
│   ├── placement/           # daraja testi — sof funksiyalar
│   │   ├── score.ts         # natijadan boshlang'ich darajani aniqlash
│   │   └── questions.ts     # savollarni kontentdan yasash
```

`features/` daraxtidagi onboarding qatorini almashtiring:

```markdown
│   ├── onboarding/          # til → daraja testi → maqsad → birinchi dars
│   │   └── steps/           # har qadam alohida komponent
```

- [ ] **Step 4: `README.md` — yangi bo'lim**

"Kontent va darajalar" bo'limidan keyin qo'shing:

```markdown
## Daraja testi (onboarding)

Yangi foydalanuvchi 9 savolga javob beradi (A1/A2/B1 dan 3 tadan).
Darajadan 2 ta to'g'ri javob — o'tilgan; boshlang'ich daraja esa
**o'tilmagan eng past daraja** ([score.ts](src/core/placement/score.ts)).

> Test SRS holatiga **tegmaydi**: `SessionRunner` ishlatilmaydi va bazaga
> hech narsa yozilmaydi. Aks holda foydalanuvchi o'rganishni boshlamasdan
> turib bilmagan so'zlari "unutilgan" deb belgilanardi va streak/XP
> sun'iy boshlanardi.

Natija `startingLevel` sifatida saqlanadi va `pickLessonCards` ga
uzatiladi: past darajadagi ko'rilmagan so'zlar **o'chirilmaydi**, faqat
zaxiraga suriladi — shunda A2 dan boshlagan foydalanuvchi so'zlari
tugaganda ham dars bo'sh qaytmaydi.
```

- [ ] **Step 5: Full verification**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: hammasi xatosiz.

- [ ] **Step 6: Commit va deploy**

```bash
git add -A
git commit -m "chore: Faza 6 yakuni — mascot seans yakunida, README yangilandi"
git push origin main
```

Push'dan keyin Vercel avtomatik deploy qiladi. Tekshirish:

```bash
vercel ls yodla --prod
```

Expected: eng yangi deploy `● Ready`.

---

## Yakuniy holat

- Onboarding: til → daraja testi → kunlik maqsad → birinchi dars
- Daraja testi bazaga tegmaydi; natija `startingLevel` sifatida saqlanadi
- Darslar aniqlangan darajadan boshlanadi, past daraja zaxirada qoladi
- Mascot — ichki SVG, to'rt kayfiyat, platformaga bog'liq emas
- Yangi testlar: `scorePlacement` (5), `buildPlacementQuiz` (6), `pickLessonCards` daraja qoidasi (5), `Mascot` (3), onboarding oqimi (7)
