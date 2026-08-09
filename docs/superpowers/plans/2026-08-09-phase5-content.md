# Faza 5 — kontent va darajalar: amalga oshirish rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Har til uchun ~100 so'zlik kontent qo'shish (A1/A2/B1) va darslarni daraja tartibida berish.

**Architecture:** Kontent tilma-til fayllarga bo'linadi (`src/content/decks/*.ts`), `starterDecks.ts` ularni daraja tartibida bitta massivga yig'adi va mavjud `STARTER_DECKS` eksportini o'zgarishsiz saqlaydi. Dars tartibi `LessonScreen` ichidagi inline sortdan `core/lesson/order.ts` sof funksiyasiga ko'chiriladi va daraja mezonini oladi. Baza sxemasi o'zgarmaydi.

**Tech Stack:** TypeScript, React 19, Vitest, Dexie (IndexedDB), Vite, `@/` alias.

**Spec:** [docs/superpowers/specs/2026-08-09-phase5-content-design.md](../specs/2026-08-09-phase5-content-design.md)

## Global Constraints

- Kod izohlari va UI matni — **o'zbek tilida** (mavjud kod uslubi).
- Yo'nalishga bog'liq Tailwind utilitalari **taqiqlanadi**: `ml/mr/pl/pr/text-left/left-0` o'rniga `ms/me/ps/pe/text-start/start-0` (arab tili RTL).
- `core/` React'ga bog'liq bo'lmaydi — sof TypeScript.
- Karta `id` si `makeCardId(language, word)` orqali: `til:so'z` (kichik harf). Mavjud so'zlar o'sha `id` bilan qoladi, aks holda foydalanuvchi progressi yo'qoladi.
- `STARTER_DECKS` eksporti nomi va tipi o'zgarmaydi: `Record<LanguageCode, NewCardRecordInput[]>`.
- Har commit oldidan `npm test` to'liq o'tishi shart (hozirgi bazaviy holat: **264 test**).
- Buyruqlar Windows/PowerShell muhitida ishlatiladi, lekin `npm` skriptlari platformadan xoli.

---

### Task 1: Daraja tartibi va `pickLessonCards` sof funksiyasi

**Files:**
- Create: `src/core/config/levels.ts`
- Create: `src/core/lesson/order.ts`
- Test: `src/core/lesson/order.test.ts`

**Interfaces:**
- Consumes: `LevelCode` (`@/core/types`), `CardRecord` (`@/core/db`, faqat tip sifatida)
- Produces:
  - `LEVEL_ORDER: readonly LevelCode[]` — `['A1', 'A2', 'B1']`
  - `levelRank(level: LevelCode | undefined): number`
  - `pickLessonCards(cards: CardRecord[], size: number): CardRecord[]`

- [ ] **Step 1: Write the failing test**

`src/core/lesson/order.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { pickLessonCards } from './order'

/** Test uchun minimal karta; kerakli maydonlar ustidan yoziladi */
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

describe('pickLessonCards', () => {
  it('A1 kartalarni A2 va B1 dan oldin qaytaradi', () => {
    const cards = [
      card('b1', { level: 'B1' }),
      card('a2', { level: 'A2' }),
      card('a1', { level: 'A1' }),
    ]

    expect(pickLessonCards(cards, 3).map((c) => c.id)).toEqual(['a1', 'a2', 'b1'])
  })

  it('daraja ichida ko‘rilmagan karta ko‘rilganidan oldin turadi', () => {
    const cards = [
      card('seen', { level: 'A1', totalReviews: 4 }),
      card('fresh', { level: 'A1', totalReviews: 0 }),
    ]

    expect(pickLessonCards(cards, 2).map((c) => c.id)).toEqual(['fresh', 'seen'])
  })

  it('bir xil ko‘rilganda eng kam mustahkam karta oldin turadi', () => {
    const cards = [
      card('strong', { level: 'A1', totalReviews: 2, interval: 21 }),
      card('weak', { level: 'A1', totalReviews: 2, interval: 1 }),
    ]

    expect(pickLessonCards(cards, 2).map((c) => c.id)).toEqual(['weak', 'strong'])
  })

  it('A1 tugallangach A2 kartasi darsga chiqadi', () => {
    // A1 so'zlari allaqachon ko'rilgan, A2 hali yangi.
    // "Ko'rilmagan" mezoni darajadan ustun — aks holda dars A1 da
    // abadiy qolib ketardi va A2 hech qachon ochilmasdi.
    const cards = [
      card('a1', { level: 'A1', totalReviews: 3 }),
      card('a2', { level: 'A2', totalReviews: 0 }),
    ]

    expect(pickLessonCards(cards, 1).map((c) => c.id)).toEqual(['a2'])
    expect(pickLessonCards(cards, 2).map((c) => c.id)).toEqual(['a2', 'a1'])
  })

  it('ko‘rilmaganlar orasida past daraja oldin turadi', () => {
    const cards = [
      card('b1', { level: 'B1', totalReviews: 0 }),
      card('a1', { level: 'A1', totalReviews: 0 }),
      card('a2', { level: 'A2', totalReviews: 0 }),
    ]

    expect(pickLessonCards(cards, 3).map((c) => c.id)).toEqual(['a1', 'a2', 'b1'])
  })

  it('darajasi yo‘q kartalar oxirida turadi', () => {
    const cards = [card('none'), card('b1', { level: 'B1' })]

    expect(pickLessonCards(cards, 2).map((c) => c.id)).toEqual(['b1', 'none'])
  })

  it('so‘ralgan hajmdan ko‘p qaytarmaydi va bo‘sh ro‘yxatni qo‘llaydi', () => {
    const cards = [card('a', { level: 'A1' }), card('b', { level: 'A1' })]

    expect(pickLessonCards(cards, 1)).toHaveLength(1)
    expect(pickLessonCards([], 5)).toEqual([])
  })

  it('kiruvchi massivni o‘zgartirmaydi', () => {
    const cards = [card('b', { level: 'B1' }), card('a', { level: 'A1' })]

    pickLessonCards(cards, 2)

    expect(cards.map((c) => c.id)).toEqual(['b', 'a'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/core/lesson/order.test.ts
```

Expected: FAIL — `Failed to resolve import "./order"`.

- [ ] **Step 3: Write `src/core/config/levels.ts`**

```ts
import type { LevelCode } from '@/core/types'

/** Darajalar o'sish tartibida — dars va kontent shu ketma-ketlikda beriladi */
export const LEVEL_ORDER: readonly LevelCode[] = ['A1', 'A2', 'B1']

/**
 * Daraja tartib raqami (kichigi oldin).
 *
 * Darajasi belgilanmagan karta ENG OXIRIDA turadi: qo'lda qo'shilgan yoki
 * eski kartalar A1 darsini egallab olmasligi kerak.
 */
export function levelRank(level: LevelCode | undefined): number {
  if (level === undefined) return Number.MAX_SAFE_INTEGER

  const index = LEVEL_ORDER.indexOf(level)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}
```

- [ ] **Step 4: Write `src/core/lesson/order.ts`**

```ts
import { levelRank } from '@/core/config/levels'
import type { CardRecord } from '@/core/db'

/**
 * Darsga chiqadigan kartalarni tanlaydi.
 *
 * Tartib mezonlari (ketma-ket):
 *   1. hali ko'rilmagan kartalar oldin — dars YANGI so'z o'rgatadi
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
 * Yangi so'z qolmaganda ro'yxat mustahkamlashga o'tadi (eng zaif karta
 * oldin) — shuning uchun dars hech qachon bo'sh qaytmaydi.
 *
 * Bu domen qoidasi (qaysi so'z keyingi o'rgatiladi), UI emas — shuning
 * uchun ekrandan ajratilgan va React'siz test qilinadi.
 */
export function pickLessonCards(cards: CardRecord[], size: number): CardRecord[] {
  // Nusxa olinadi: chaqiruvchi bergan massiv o'zgarmasligi kerak
  return [...cards]
    .sort((a, b) => {
      const aSeen = a.totalReviews > 0 ? 1 : 0
      const bSeen = b.totalReviews > 0 ? 1 : 0
      if (aSeen !== bSeen) return aSeen - bSeen

      const byLevel = levelRank(a.level) - levelRank(b.level)
      if (byLevel !== 0) return byLevel

      if (a.totalReviews !== b.totalReviews) return a.totalReviews - b.totalReviews

      return a.interval - b.interval
    })
    .slice(0, size)
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/core/lesson/order.test.ts
```

Expected: PASS — 8 passed.

- [ ] **Step 6: Commit**

```bash
git add src/core/config/levels.ts src/core/lesson/order.ts src/core/lesson/order.test.ts
git commit -m "feat: dars kartalarini daraja tartibida tanlash (pickLessonCards)"
```

---

### Task 2: `LessonScreen` ni yangi funksiyaga ulash

**Files:**
- Modify: `src/features/lesson/LessonScreen.tsx` (import bloki va `useEffect` ichidagi sort, ~40–47-qatorlar)

**Interfaces:**
- Consumes: `pickLessonCards(cards, size)` (Task 1)
- Produces: —

- [ ] **Step 1: Importni qo'shish**

`src/features/lesson/LessonScreen.tsx` da `getAllCards` importidan keyin:

```ts
import { pickLessonCards } from '@/core/lesson/order'
```

- [ ] **Step 2: Inline sortni almashtirish**

Mavjud blok:

```ts
        // Avval yangi so'zlar, keyin eng kam mustahkamlanganlari
        const sorted = [...all].sort((a, b) => {
          if (a.totalReviews !== b.totalReviews) return a.totalReviews - b.totalReviews
          return a.interval - b.interval
        })

        setPool(all)
        setCards(sorted.slice(0, LESSON_SIZE))
```

o'rniga:

```ts
        setPool(all)
        // Tartib domen qoidasi — core/lesson/order.ts da test qilingan
        setCards(pickLessonCards(all, LESSON_SIZE))
```

- [ ] **Step 3: Testlar va tiplarni tekshirish**

```bash
npm test
npm run typecheck
```

Expected: 272 passed (264 bazaviy + 8 yangi); typecheck xatosiz.

- [ ] **Step 4: Commit**

```bash
git add src/features/lesson/LessonScreen.tsx
git commit -m "refactor: dars tartibini LessonScreen'dan core/lesson'ga ko'chirish"
```

---

### Task 3: Kontent fayllari tuzilmasi (kontent o'zgarmaydi)

Bu task **faqat ko'chirish** — so'zlar soni va mazmuni o'zgarmaydi, shuning uchun natijani testlar aniq tasdiqlaydi.

**Files:**
- Create: `src/content/decks/en.ts`, `src/content/decks/ru.ts`, `src/content/decks/ar.ts`
- Modify: `src/content/starterDecks.ts` (butunlay yig'uvchiga aylanadi)
- Test: `src/content/decks.test.ts`

**Interfaces:**
- Consumes: `NewCardRecordInput` (`@/core/db`), `LevelCode`/`LanguageCode` (`@/core/types`), `LEVEL_ORDER` (Task 1)
- Produces:
  - `EN_DECK`, `RU_DECK`, `AR_DECK`: `Record<LevelCode, NewCardRecordInput[]>`
  - `DECKS: Record<LanguageCode, Record<LevelCode, NewCardRecordInput[]>>`
  - `STARTER_DECKS: Record<LanguageCode, NewCardRecordInput[]>` (o'zgarmagan tip)

- [ ] **Step 1: Write the failing test**

`src/content/decks.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { LEVEL_ORDER } from '@/core/config/levels'
import { makeCardId } from '@/core/srs'
import type { LanguageCode } from '@/core/types'
import { DECKS, STARTER_DECKS } from './starterDecks'

const LANGUAGES: LanguageCode[] = ['en', 'ru', 'ar']

describe.each(LANGUAGES)('%s to‘plami', (language) => {
  const deck = DECKS[language]
  const all = LEVEL_ORDER.flatMap((level) => deck[level])

  it('har darajada kamida bitta so‘z bor', () => {
    LEVEL_ORDER.forEach((level) => {
      expect(deck[level].length).toBeGreaterThan(0)
    })
  })

  it('takrorlanuvchi so‘z yo‘q', () => {
    const ids = all.map((card) => makeCardId(card.language, card.word))

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('majburiy maydonlar to‘ldirilgan', () => {
    all.forEach((card) => {
      expect(card.word.trim()).not.toBe('')
      expect(card.translation.trim()).not.toBe('')
      expect(card.topic?.trim()).toBeTruthy()
      expect(card.sentence?.trim()).toBeTruthy()
      expect(card.sentenceTranslation?.trim()).toBeTruthy()
    })
  })

  it('har kartaning tili va darajasi o‘z guruhiga mos', () => {
    LEVEL_ORDER.forEach((level) => {
      deck[level].forEach((card) => {
        expect(card.language).toBe(language)
        expect(card.level).toBe(level)
      })
    })
  })

  it('STARTER_DECKS daraja tartibida yig‘ilgan', () => {
    const levels = STARTER_DECKS[language].map((card) => card.level)
    const sorted = [...levels].sort(
      (a, b) => LEVEL_ORDER.indexOf(a!) - LEVEL_ORDER.indexOf(b!),
    )

    expect(levels).toEqual(sorted)
    expect(STARTER_DECKS[language]).toHaveLength(all.length)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/content/decks.test.ts
```

Expected: FAIL — `DECKS` eksporti mavjud emas.

- [ ] **Step 3: Create `src/content/decks/en.ts`**

Mavjud `starterDecks.ts` dagi `EN` massividagi **10 ta so'zni o'zgartirmasdan** ko'chiring (hammasi `level: 'A1'`). Fayl shakli:

```ts
import type { NewCardRecordInput } from '@/core/db'
import type { LevelCode } from '@/core/types'

/**
 * Ingliz tili to'plami, CEFR darajalari bo'yicha.
 *
 * Har yozuvda qisqa jumla bor: u "jumla qurish" mashqi uchun ishlatiladi
 * va kontekstli kirish beradi (Krashen, i+1). Jumla bo'lmasa, o'sha mashq
 * turi bu karta uchun yaratilmaydi.
 */
export const EN_DECK: Record<LevelCode, NewCardRecordInput[]> = {
  A1: [
    {
      word: 'hello',
      translation: 'salom',
      language: 'en',
      topic: 'Salomlashish',
      level: 'A1',
      sentence: 'Hello my friend',
      sentenceTranslation: "Salom, do'stim",
    },
    // ... qolgan mavjud A1 so'zlari
  ],
  A2: [],
  B1: [],
}
```

**DIQQAT:** `A2` va `B1` hozircha bo'sh bo'lsa, 1-qadamdagi test yiqiladi. Shuning uchun bu qadamda har til uchun A2 va B1 ga **kamida bittadan** so'z yoziladi (mavjud so'zlardan mazmunan mos kelmasa, yangi yoziladi). Ingliz uchun:

```ts
  A2: [
    {
      word: 'airport',
      translation: 'aeroport',
      language: 'en',
      topic: 'Sayohat',
      level: 'A2',
      sentence: 'The airport is far',
      sentenceTranslation: 'Aeroport uzoqda',
    },
  ],
  B1: [
    {
      word: 'decision',
      translation: 'qaror',
      language: 'en',
      topic: 'Fikr bildirish',
      level: 'B1',
      sentence: 'It was a hard decision',
      sentenceTranslation: 'Bu qiyin qaror edi',
    },
  ],
```

- [ ] **Step 4: Create `src/content/decks/ru.ts` va `src/content/decks/ar.ts`**

Xuddi shu shaklda: mavjud `RU` va `AR` massivlari `A1` ga ko'chiriladi, `A2`/`B1` ga bittadan so'z yoziladi.

`ru.ts` uchun A2/B1 namunasi:

```ts
  A2: [
    {
      word: 'аэропорт',
      translation: 'aeroport',
      language: 'ru',
      topic: 'Sayohat',
      level: 'A2',
      sentence: 'Аэропорт далеко',
      sentenceTranslation: 'Aeroport uzoqda',
    },
  ],
  B1: [
    {
      word: 'решение',
      translation: 'qaror',
      language: 'ru',
      topic: 'Fikr bildirish',
      level: 'B1',
      sentence: 'Это было трудное решение',
      sentenceTranslation: 'Bu qiyin qaror edi',
    },
  ],
```

`ar.ts` uchun A2/B1 namunasi (harakatlar bilan):

```ts
  A2: [
    {
      word: 'مَطَار',
      translation: 'aeroport',
      language: 'ar',
      topic: 'Sayohat',
      level: 'A2',
      sentence: 'المطار بعيد',
      sentenceTranslation: 'Aeroport uzoqda',
    },
  ],
  B1: [
    {
      word: 'قَرَار',
      translation: 'qaror',
      language: 'ar',
      topic: 'Fikr bildirish',
      level: 'B1',
      sentence: 'كان قرارا صعبا',
      sentenceTranslation: 'Bu qiyin qaror edi',
    },
  ],
```

- [ ] **Step 5: Replace `src/content/starterDecks.ts` with the aggregator**

Faylning butun mazmuni:

```ts
import type { NewCardRecordInput } from '@/core/db'
import { LEVEL_ORDER } from '@/core/config/levels'
import type { LanguageCode, LevelCode } from '@/core/types'
import { AR_DECK } from './decks/ar'
import { EN_DECK } from './decks/en'
import { RU_DECK } from './decks/ru'

/** Til → daraja → so'zlar. Daraja bo'yicha so'rovlar uchun ochiq qoldirilgan */
export const DECKS: Record<LanguageCode, Record<LevelCode, NewCardRecordInput[]>> = {
  en: EN_DECK,
  ru: RU_DECK,
  ar: AR_DECK,
}

/** Bitta tilning barcha so'zlari — daraja tartibida (A1 → A2 → B1) */
function flatten(deck: Record<LevelCode, NewCardRecordInput[]>): NewCardRecordInput[] {
  return LEVEL_ORDER.flatMap((level) => deck[level])
}

/**
 * Bazaga yoziladigan boshlang'ich to'plamlar.
 *
 * Tartib muhim emas (dars tartibi `pickLessonCards` bilan aniqlanadi),
 * lekin daraja bo'yicha yig'ish faylni o'qishni osonlashtiradi.
 */
export const STARTER_DECKS: Record<LanguageCode, NewCardRecordInput[]> = {
  en: flatten(EN_DECK),
  ru: flatten(RU_DECK),
  ar: flatten(AR_DECK),
}
```

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: barcha testlar PASS (271 + yangi kontent testlari).

- [ ] **Step 7: Commit**

```bash
git add src/content
git commit -m "refactor: kontentni tilma-til fayllarga ajratish"
```

---

### Task 4: Ingliz tili kontenti to'liq (~100 so'z)

**Files:**
- Modify: `src/content/decks/en.ts`

**Interfaces:**
- Consumes: Task 3 dagi fayl shakli
- Produces: `EN_DECK` — A1 ~40, A2 ~35, B1 ~25 yozuv

**Kontent qoidalari (har yozuv uchun majburiy):**

1. Barcha olti maydon to'ldiriladi: `word`, `translation`, `language: 'en'`, `topic`, `level`, `sentence`, `sentenceTranslation`.
2. Jumla **qisqa** (3–6 so'z) va o'sha so'zni ishlatadi.
3. Tarjima **bir ma'noli** bo'lsin. Ko'p ma'noli so'zlardan qoching (`right`, `like`, `mean`) — mashqda "to'g'ri javob" chalkash bo'ladi.
4. Bir tildagi ikki so'zning o'zbekcha tarjimasi **bir xil bo'lmasin** (masalan `big` va `large` ikkalasi ham "katta" — chalg'ituvchi variantlar farqlanmay qoladi). Sinonim kerak bo'lsa, tarjimani aniqlashtiring: "katta" / "ulkan".
5. Mavjud 10 ta A1 so'zi **o'zgarmaydi** (`id` bir xil bo'lishi kerak, aks holda foydalanuvchi progressi yo'qoladi).
6. So'zlar kichik harfda (id `makeCardId` orqali kichik harfga o'tadi, lekin ko'rinishda ham izchil bo'lsin).

**Mavzular va taxminiy sonlar:**

| Daraja | Mavzular | Soni |
| ------ | -------- | ---- |
| A1 | Salomlashish, Oila, Raqamlar, Ovqat, Ranglar, Kundalik fe'llar | ~40 |
| A2 | Sayohat, Xarid, Ish, Sog'liq, Ob-havo, Vaqt | ~35 |
| B1 | His-tuyg'u, Fikr bildirish, Jamiyat, Texnologiya, Mavhum tushunchalar | ~25 |

- [ ] **Step 1: A1 darajasini ~40 so'zga to'ldirish**

Mavjud A1 so'zlarini saqlab, yuqoridagi mavzular bo'yicha yangilarini qo'shing. Har yozuv aynan shu shaklda:

```ts
    {
      word: 'family',
      translation: 'oila',
      language: 'en',
      topic: 'Oila',
      level: 'A1',
      sentence: 'My family is big',
      sentenceTranslation: 'Mening oilam katta',
    },
```

- [ ] **Step 2: Testlarni ishga tushirish**

```bash
npx vitest run src/content/decks.test.ts
```

Expected: PASS. Agar "takrorlanuvchi so'z yo'q" testi yiqilsa — bir so'z ikki marta yozilgan, birini o'chiring.

- [ ] **Step 3: A2 darajasini ~35 so'zga to'ldirish**

Sayohat, Xarid, Ish, Sog'liq, Ob-havo, Vaqt mavzulari bo'yicha, `level: 'A2'`.

- [ ] **Step 4: B1 darajasini ~25 so'zga to'ldirish**

His-tuyg'u, Fikr bildirish, Jamiyat, Texnologiya, Mavhum tushunchalar mavzulari bo'yicha, `level: 'B1'`.

- [ ] **Step 5: To'liq tekshiruv**

```bash
npm test
npm run typecheck
npm run lint
```

Expected: hammasi xatosiz.

- [ ] **Step 6: So'zlar sonini tasdiqlash**

```bash
node -e "const d=require('fs').readFileSync('src/content/decks/en.ts','utf8');console.log('yozuvlar:',(d.match(/word:/g)||[]).length)"
```

Expected: ~100 (95–105 oralig'i maqbul).

- [ ] **Step 7: Commit**

```bash
git add src/content/decks/en.ts
git commit -m "feat: ingliz tili kontenti (A1/A2/B1, ~100 so'z)"
```

---

### Task 5: Rus tili kontenti to'liq (~100 so'z)

**Files:**
- Modify: `src/content/decks/ru.ts`

**Interfaces:**
- Consumes: Task 3 fayl shakli
- Produces: `RU_DECK` — A1 ~40, A2 ~35, B1 ~25

**Kontent qoidalari** (Task 4 dagilar bilan bir xil, bu yerda to'liq takrorlangan):

1. Barcha olti maydon to'ldiriladi: `word`, `translation`, `language: 'ru'`, `topic`, `level`, `sentence`, `sentenceTranslation`.
2. Jumla qisqa (3–6 so'z) va o'sha so'zni ishlatadi.
3. Tarjima bir ma'noli bo'lsin; ko'p ma'noli so'zlardan qoching.
4. Ikki so'zning o'zbekcha tarjimasi bir xil bo'lmasin (chalg'ituvchi variantlar farqlanmay qoladi).
5. Mavjud A1 so'zlari o'zgarmaydi (`id` bir xil qolishi shart).

| Daraja | Mavzular | Soni |
| ------ | -------- | ---- |
| A1 | Salomlashish, Oila, Raqamlar, Ovqat, Ranglar, Kundalik fe'llar | ~40 |
| A2 | Sayohat, Xarid, Ish, Sog'liq, Ob-havo, Vaqt | ~35 |
| B1 | His-tuyg'u, Fikr bildirish, Jamiyat, Texnologiya, Mavhum tushunchalar | ~25 |

**Qo'shimcha qoida:** `normalize.ts` javobda `ё` ni `е` ga aylantiradi, shuning uchun `ё` li so'zlar (`ещё`, `всё`) xavfsiz — foydalanuvchi ikkala shaklda yozsa ham to'g'ri sanaladi. Urg'u belgisi qo'yilmaydi.

- [ ] **Step 1: A1 ni ~40 so'zga to'ldirish**

Mavjud A1 so'zlarini saqlang. Yozuv shakli:

```ts
    {
      word: 'семья',
      translation: 'oila',
      language: 'ru',
      topic: 'Oila',
      level: 'A1',
      sentence: 'Моя семья большая',
      sentenceTranslation: 'Mening oilam katta',
    },
```

- [ ] **Step 2: A2 ni ~35 so'zga to'ldirish** (Sayohat, Xarid, Ish, Sog'liq, Ob-havo, Vaqt)

- [ ] **Step 3: B1 ni ~25 so'zga to'ldirish** (His-tuyg'u, Fikr bildirish, Jamiyat, Texnologiya, Mavhum tushunchalar)

- [ ] **Step 4: Tekshiruv**

```bash
npm test
npm run typecheck
```

Expected: xatosiz.

- [ ] **Step 5: Commit**

```bash
git add src/content/decks/ru.ts
git commit -m "feat: rus tili kontenti (A1/A2/B1, ~100 so'z)"
```

---

### Task 6: Arab tili kontenti to'liq (~100 so'z)

**Files:**
- Modify: `src/content/decks/ar.ts`

**Interfaces:**
- Consumes: Task 3 fayl shakli
- Produces: `AR_DECK` — A1 ~40, A2 ~35, B1 ~25

**Kontent qoidalari** (Task 4 dagilar bilan bir xil, bu yerda to'liq takrorlangan):

1. Barcha olti maydon to'ldiriladi: `word`, `translation`, `language: 'ar'`, `topic`, `level`, `sentence`, `sentenceTranslation`.
2. Jumla qisqa (3–6 so'z) va o'sha so'zni ishlatadi.
3. Tarjima bir ma'noli bo'lsin; ko'p ma'noli so'zlardan qoching.
4. Ikki so'zning o'zbekcha tarjimasi bir xil bo'lmasin (chalg'ituvchi variantlar farqlanmay qoladi).
5. Mavjud A1 so'zlari o'zgarmaydi (`id` bir xil qolishi shart).

| Daraja | Mavzular | Soni |
| ------ | -------- | ---- |
| A1 | Salomlashish, Oila, Raqamlar, Ovqat, Ranglar, Kundalik fe'llar | ~40 |
| A2 | Sayohat, Xarid, Ish, Sog'liq, Ob-havo, Vaqt | ~35 |
| B1 | His-tuyg'u, Fikr bildirish, Jamiyat, Texnologiya, Mavhum tushunchalar | ~25 |

**Qo'shimcha qoidalar:**
- So'zlar **harakat bilan** yoziladi (`مَدِينَة`) — talaffuz uchun. `normalize.ts` javob tekshirishda harakatlarni tushiradi, shuning uchun foydalanuvchi harakatsiz yozsa ham to'g'ri sanaladi.
- Jumlalarda harakat shart emas (mavjud yozuvlarda ham yo'q).
- Kod ichidagi arab matni RTL — muharrirda qatorlar ko'chib ko'rinishi mumkin; nusxalashda tinish belgilari joyida qolganini tekshiring.

- [ ] **Step 1: A1 ni ~40 so'zga to'ldirish**

```ts
    {
      word: 'عَائِلَة',
      translation: 'oila',
      language: 'ar',
      topic: 'Oila',
      level: 'A1',
      sentence: 'عائلتي كبيرة',
      sentenceTranslation: 'Mening oilam katta',
    },
```

- [ ] **Step 2: A2 ni ~35 so'zga to'ldirish** (Sayohat, Xarid, Ish, Sog'liq, Ob-havo, Vaqt)

- [ ] **Step 3: B1 ni ~25 so'zga to'ldirish** (His-tuyg'u, Fikr bildirish, Jamiyat, Texnologiya, Mavhum tushunchalar)

- [ ] **Step 4: Tekshiruv**

```bash
npm test
npm run typecheck
```

Expected: xatosiz.

- [ ] **Step 5: Commit**

```bash
git add src/content/decks/ar.ts
git commit -m "feat: arab tili kontenti (A1/A2/B1, ~100 so'z)"
```

---

### Task 7: Faza 5 bildirishnomasini olib tashlash va hujjatni yangilash

**Files:**
- Modify: `src/features/home/HomeScreen.tsx` (`PhaseNotice` bloki va uning importi)
- Modify: `README.md` (fazalar holati, papka strukturasi izohi)

**Interfaces:**
- Consumes: Task 4–6 tugallangan kontent
- Produces: —

- [ ] **Step 1: `HomeScreen.tsx` dan bildirishnomani olib tashlash**

Quyidagi blok o'chiriladi:

```tsx
      <PhaseNotice phase="Faza 5">
        Darslar va o'quv yo'li to'liq kontent (har tildan ~100 so'z) qo'shilgach
        paydo bo'ladi. Hozircha har tilda 10 tadan namunaviy so'z bor.
      </PhaseNotice>
```

va ishlatilmay qolgan import:

```tsx
import { PhaseNotice } from '@/components/ui/PhaseNotice'
```

`PhaseNotice` komponenti **o'chirilmaydi** — u `LeagueScreen` va `ProfileScreen` da "Faza 7" uchun ishlatiladi.

- [ ] **Step 2: `LessonScreen.tsx` dagi bo'sh holat matnini yangilash**

```tsx
          Bu tilda hali so‘z yo‘q. Kontent Faza 5'da to‘ldiriladi.
```

o'rniga:

```tsx
          Bu tilda hali so‘z yo‘q.
```

- [ ] **Step 3: `README.md` fazalar bo'limini yangilash**

```markdown
- [x] **Faza 5** — uch til moduli + namuna kontent + TTS
```

Shuningdek papka strukturasidagi izohni yangilang:

```markdown
├── content/                 # har til uchun ~100 so'z (A1/A2/B1)
│   ├── decks/en.ts, ru.ts, ar.ts
│   └── starterDecks.ts      # daraja tartibida yig'uvchi
```

- [ ] **Step 4: To'liq tekshiruv**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: hammasi xatosiz (ishlatilmagan import qolsa, `lint` ogohlantiradi).

- [ ] **Step 5: Commit va deploy**

```bash
git add -A
git commit -m "chore: Faza 5 yakuni — bildirishnomani olib tashlash, README yangilash"
git push origin main
```

Push'dan keyin Vercel avtomatik deploy qiladi. Tekshirish:

```bash
vercel ls yodla --prod
```

Expected: eng yangi deploy `● Ready`.

---

## Yakuniy holat

- Har tilda ~100 so'z, uch darajaga taqsimlangan
- Dars A1 → A2 → B1 tartibida yangi so'z beradi
- Dars tartibi `core/` da, testlar bilan qoplangan
- Kontent yaxlitligi avtomatik tekshiriladi (dublikat, bo'sh maydon, til/daraja mosligi)
- Foydalanuvchining mavjud progressi saqlanadi (`id` o'zgarmaydi, `addMissingCards` idempotent)
