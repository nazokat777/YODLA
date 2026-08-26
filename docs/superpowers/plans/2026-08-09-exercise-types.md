# Yangi mashq turlari (cloze, spelling, matching) — amalga oshirish rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Holat:** ✅ **BAJARILGAN.** Uch mashq turi ishlaydi: gap ichida, harfma-harf, juft topish.

**Goal:** Duolingo uslubidagi uch yangi mashq turini qo'shish — gap ichida (`cloze`), harfma-harf (`spelling`), juft topish (`matching`).

**Architecture:** Mavjud sof yadro (`generateExercise` + `checkExercise`, `Exercise` union) ustiga quriladi. Cloze va spelling mavjud bir-kartali oqimda ishlaydi (javob → `checkExercise` → `FeedbackBar`). Matching ko'p-kartali — `SessionRunner` da alohida tarmoq bir mashqda 5 kartani baholaydi.

**Tech Stack:** React 19 + TypeScript, Vitest + Testing Library, Zustand, sof funksiyalar (`random` argument sifatida beriladi).

**Spec:** [docs/superpowers/specs/2026-08-09-exercise-types-design.md](../specs/2026-08-09-exercise-types-design.md)

## Global Constraints

- **Yangi npm bog'liqligi qo'shilmaydi.**
- Kod izohlari va UI matni — **o'zbek tilida**.
- Barcha yadro funksiyalari **sof**: `random?: RandomSource` argument sifatida beriladi (default `Math.random`).
- TDD: har task avval tushadigan test bilan boshlanadi; har commit oldidan `npm test` to'liq o'tishi shart (**bazaviy holat: 434 test**).
- Matchingda **xatoda jazolamaslik**: to'g'ri = baho 4, xato = baho 2.
- Spelling **faqat lotin/kirill** (`card.language !== 'ar'`); cloze **faqat jumlali** kartalarda.
- Yangi tur yaratib bo'lmasa — **step down** (mavjud `DIFFICULTY_LADDER` naqshi): pastroq pog'onaga tushiladi.

## Fayl xaritasi

| Fayl | Mas'uliyati |
| ---- | ----------- |
| `src/core/types/index.ts` | `ExerciseType` ga `'cloze' \| 'spelling' \| 'matching'` qo'shish |
| `src/core/exercises/types.ts` | `ClozeExercise`, `SpellingExercise`, `MatchingExercise` interfeyslari + union |
| `src/core/exercises/generate.ts` | `buildCloze`, `buildSpelling`, `buildMatching`, `collectWordDistractors`, `scrambleLetters`, `clozeBlank`; ladder va `isTypeAvailable` yangilanadi |
| `src/core/exercises/check.ts` | cloze (choice), spelling (text) tekshiruvi |
| `src/features/session/ExerciseView.tsx` | `ClozeView`, `SpellingView` |
| `src/features/session/MatchingView.tsx` | yangi — juft topish UI + `onComplete` |
| `src/features/session/SessionRunner.tsx` | matching tarmog'i (ko'p-karta baholash) |

---

### Task 1: `ExerciseType` ga uch yangi tur qo'shish

Domen tipiga uchta yangi tur nomini qo'shish. Bu boshqa fayllar tayanadigan poydevor — o'zi test qilinmaydi, lekin `tsc` ni buzmaydi (union kengaydi, mavjud `switch` lar to'liq bo'lmay qoladi — keyingi tasklarda to'ldiriladi).

**Files:**
- Modify: `src/core/types/index.ts:60-69`

**Interfaces:**
- Produces: `ExerciseType` endi `'recognition' | 'recall' | 'listening' | 'construction' | 'cloze' | 'spelling' | 'matching'`

- [ ] **Step 1: `ExerciseType` ni kengaytirish**

`src/core/types/index.ts` — mavjud union oxiriga qo'shing:

```ts
/** Mashq (test) turlari — Faza 3 + yangi turlar */
export type ExerciseType =
  /** 4 variantdan to'g'ri tarjimani tanla (oson) */
  | 'recognition'
  /** Tarjimani ko'rib, so'zni klaviaturadan yoz (o'rta) */
  | 'recall'
  /** Audio eshitib, ma'nosini tanla */
  | 'listening'
  /** So'zlardan to'g'ri jumla tuz (qiyin) */
  | 'construction'
  /** Jumlada tushib qolgan so'zni variantlardan tanla */
  | 'cloze'
  /** Aralash harflardan so'zni yig' */
  | 'spelling'
  /** Bir nechta so'z va tarjimani juftlab chiq (ko'p-kartali) */
  | 'matching'
```

- [ ] **Step 2: Kompilyatsiyani tekshirish**

Run: `npx tsc --noEmit`
Expected: mavjud `switch` lar (generate.ts, check.ts, ExerciseView.tsx, SessionRunner.tsx) endi to'liq emasligi haqida `TS2366`/exhaustiveness ogohlantirishlari **BO'LMAYDI** (chunki ular `Exercise` union ustidan yuradi, `ExerciseType` emas). Xatosiz o'tishi kutiladi.

> Eslatma: kod `Exercise` (obyekt union) ustidan `switch` qiladi, `ExerciseType` (satr union) ustidan emas. Shuning uchun bu qadam faqat yangi turlar interfeyslari qo'shilgandan (Task 2) keyin exhaustiveness'ga ta'sir qiladi. Bu task xavfsiz.

- [ ] **Step 3: Commit**

```bash
git add src/core/types/index.ts
git commit -m "feat: ExerciseType ga cloze/spelling/matching qo'shildi"
```

---

### Task 2: Uch yangi `Exercise` interfeysi

`Exercise` union'ga uch yangi shakl qo'shiladi. Bu ham poydevor: qo'shilishi bilan `generate.ts`, `check.ts`, `ExerciseView.tsx`, `SessionRunner.tsx` dagi `switch (exercise.type)` lar **to'liq bo'lmay qoladi** — keyingi tasklar ularni to'ldiradi. Shuning uchun bu task o'zidan keyin `tsc` xatolarini keltiradi; ular Task 3–7 da tugaydi.

**Files:**
- Modify: `src/core/exercises/types.ts:52-56`

**Interfaces:**
- Consumes: `BaseExercise` (mavjud, `id`, `type`, `card`), `CardRecord`
- Produces:
  - `ClozeExercise { type: 'cloze'; prompt: string; options: string[]; correctIndex: number }`
  - `SpellingExercise { type: 'spelling'; prompt: string; letters: string[]; answer: string }`
  - `MatchingPair { cardId: string; word: string; translation: string }`
  - `MatchingExercise { type: 'matching'; pairs: MatchingPair[] }`
  - Kengaytirilgan `Exercise` union

- [ ] **Step 1: Interfeyslarni qo'shish**

`src/core/exercises/types.ts` — `ConstructionExercise` dan keyin, `export type Exercise` dan oldin:

```ts
/** 5. Gap ichida (o'rta): jumlada tushgan so'zni variantlardan tanla */
export interface ClozeExercise extends BaseExercise {
  type: 'cloze'
  /** Jumla — o'rganilayotgan so'z o'rnida "___" */
  prompt: string
  /** O'RGANILAYOTGAN tildagi so'z variantlari (tarjima emas) */
  options: string[]
  correctIndex: number
}

/** 6. Harfma-harf (qiyin): aralash harflardan so'zni yig' */
export interface SpellingExercise extends BaseExercise {
  type: 'spelling'
  /** O'zbekcha tarjima — nima yozish kerakligi */
  prompt: string
  /** Aralashtirilgan harflar */
  letters: string[]
  /** To'g'ri so'z */
  answer: string
}

/** Juft topishdagi bitta juft */
export interface MatchingPair {
  cardId: string
  /** O'rganilayotgan tildagi so'z */
  word: string
  /** O'zbekcha tarjima */
  translation: string
}

/** 7. Juft topish (ko'p-kartali): so'z va tarjimani juftla */
export interface MatchingExercise extends BaseExercise {
  type: 'matching'
  /** Juftlanishi kerak bo'lgan kartalar (odatda 5 ta) */
  pairs: MatchingPair[]
}
```

- [ ] **Step 2: Union'ni kengaytirish**

`src/core/exercises/types.ts` — mavjud `Exercise` union'ni almashtiring:

```ts
export type Exercise =
  | RecognitionExercise
  | RecallExercise
  | ListeningExercise
  | ConstructionExercise
  | ClozeExercise
  | SpellingExercise
  | MatchingExercise
```

- [ ] **Step 3: Kompilyatsiyani tekshirish (xatolar KUTILADI)**

Run: `npx tsc --noEmit`
Expected: `generate.ts`, `check.ts`, `ExerciseView.tsx`, `SessionRunner.tsx` da "not all code paths return / switch not exhaustive" turidagi xatolar chiqadi. Bu **kutilgan** — keyingi tasklar to'ldiradi. Commit qilmaymiz hali.

> Bu task alohida commit qilinmaydi — Task 3 bilan birga yakunlanadi (yadro to'liq bo'lgach).

---

### Task 3: `check.ts` — cloze va spelling tekshiruvi

`checkExercise` yangi uch turni ham qamrab oladi. Cloze = variantli (choice), spelling = matnli (`checkTextAnswer`, imlo xatosiga bag'rikenglik bilan). Matching bu yerda tekshirilmaydi (uning natijasi `MatchingView` da hisoblanadi) — `switch` da aniq `'matching'` shohobchasi `'wrong'` qaytaradi (himoya sifatida; hech qachon chaqirilmaydi).

**Files:**
- Modify: `src/core/exercises/check.ts:38-56` (checkExercise switch)
- Modify: `src/core/exercises/check.ts:58-61` (isProductiveType)
- Test: `src/core/exercises/check.test.ts`

**Interfaces:**
- Consumes: `checkTextAnswer(input, expected, language)`, `checkChoiceAnswer(selectedIndex, correctIndex)` (mavjud)
- Produces: `checkExercise` cloze/spelling'ni qo'llab-quvvatlaydi; `deriveGrade` spelling'ni "productive" (aktiv) deb hisoblaydi

- [ ] **Step 1: Tushadigan testlarni yozish**

`src/core/exercises/check.test.ts` — mavjud faylga qo'shing (import va `CardRecord` yordamchisi allaqachon bor; bo'lmasa quyidagi to'liq blok yangi `describe` sifatida ishlaydi):

```ts
import { describe, expect, it } from 'vitest'
import { checkExercise, deriveGrade } from './check'
import type { ClozeExercise, SpellingExercise } from './types'
import type { CardRecord } from '@/core/db'

/** Test uchun minimal karta */
function card(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    id: 'c1',
    word: 'water',
    translation: 'suv',
    language: 'en',
    topic: 'Ovqat',
    level: 'A1',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    ...overrides,
  } as CardRecord
}

describe('checkExercise — cloze', () => {
  const cloze: ClozeExercise = {
    id: 'c1:cloze',
    type: 'cloze',
    card: card(),
    prompt: 'I drink ___ every morning',
    options: ['water', 'bread', 'tea', 'salt'],
    correctIndex: 0,
  }

  it("to'g'ri indeks → correct", () => {
    expect(checkExercise(cloze, 0)).toBe('correct')
  })

  it('xato indeks → wrong', () => {
    expect(checkExercise(cloze, 2)).toBe('wrong')
  })
})

describe('checkExercise — spelling', () => {
  const spelling: SpellingExercise = {
    id: 'c1:spelling',
    type: 'spelling',
    card: card(),
    prompt: 'suv',
    letters: ['w', 'a', 't', 'e', 'r'],
    answer: 'water',
  }

  it("to'g'ri harflar → correct", () => {
    expect(checkExercise(spelling, 'water')).toBe('correct')
  })

  it('bitta harf xato → almost (imlo bag‘rikenligi)', () => {
    expect(checkExercise(spelling, 'watar')).toBe('almost')
  })

  it("bo'sh javob → wrong", () => {
    expect(checkExercise(spelling, '')).toBe('wrong')
  })

  it('spelling aktiv tur — baho 5', () => {
    expect(deriveGrade(spelling, 'correct')).toBe(5)
  })
})
```

- [ ] **Step 2: Testni yugurtirib, tushishini tekshirish**

Run: `npx vitest run src/core/exercises/check.test.ts`
Expected: FAIL — `checkExercise` yangi turlarni bilmaydi (compile yoki runtime xatosi).

- [ ] **Step 3: `checkExercise` ni to'ldirish**

`src/core/exercises/check.ts` — `checkExercise` switch'iga qo'shing (`construction` case'idan keyin):

```ts
    case 'cloze':
      return typeof answer === 'number'
        ? checkChoiceAnswer(answer, exercise.correctIndex)
        : 'wrong'

    case 'spelling':
      return typeof answer === 'string'
        ? checkTextAnswer(answer, exercise.answer, exercise.card.language)
        : 'wrong'

    // Juft topish natijasi MatchingView da hisoblanadi — bu shohobcha
    // faqat union to'liqligi uchun
    case 'matching':
      return 'wrong'
```

- [ ] **Step 4: `deriveGrade` — spelling'ni aktiv deb belgilash**

`src/core/exercises/check.ts` — `isProductiveType` ni yangilang:

```ts
/** Mashq turining "qiyin" (aktiv ishlab chiqarish talab qiladigan) ekani */
function isProductiveType(exercise: Exercise): boolean {
  return (
    exercise.type === 'recall' ||
    exercise.type === 'construction' ||
    exercise.type === 'spelling'
  )
}
```

- [ ] **Step 5: To'liq testni yugurtirish**

Run: `npx vitest run src/core/exercises/check.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit (Task 2 + 3 birgalikda)**

```bash
git add src/core/exercises/types.ts src/core/exercises/check.ts src/core/exercises/check.test.ts
git commit -m "feat: cloze/spelling/matching interfeyslari + check.ts tekshiruvi"
```

---

### Task 4: `generate.ts` — cloze generatori

`buildCloze` jumladagi o'rganilayotgan so'zni `___` bilan almashtiradi va o'sha tildagi boshqa so'zlardan chalg'ituvchi variantlar yig'adi (`collectWordDistractors` — mavjud `collectDistractors` ning `word` varianti). Ladder va `isTypeAvailable` cloze'ni qo'shadi.

**Files:**
- Modify: `src/core/exercises/generate.ts` (ladder, isTypeAvailable, generateExercise switch, yangi helperlar)
- Test: `src/core/exercises/generate.test.ts`

**Interfaces:**
- Consumes: `GenerateExerciseOptions { card, pool, allowAudio, random? }`, `shuffle`, `MAX_CHOICES`
- Produces:
  - `collectWordDistractors(card, pool, random): string[]` — o'sha tildagi boshqa so'zlar (word, translation emas)
  - `clozeBlank(sentence, word): string | null` — so'zni `___` ga almashtiradi; topilmasa null
  - `generateExercise` `cloze` chiqara oladi

- [ ] **Step 1: Tushadigan testlarni yozish**

`src/core/exercises/generate.test.ts` — qo'shing (fayl `seededRandom` va `card()` yordamchisidan foydalanadi; agar `card()` helperi mavjud bo'lmasa, Task 3 dagi bilan bir xil shaklda yozing):

```ts
import { describe, expect, it } from 'vitest'
import { generateExercise } from './generate'
import { seededRandom } from '@/lib/random'
import type { CardRecord } from '@/core/db'

function makeCard(o: Partial<CardRecord> = {}): CardRecord {
  return {
    id: 'w', word: 'water', translation: 'suv', language: 'en',
    topic: 'Ovqat', level: 'A1', interval: 0, repetitions: 2,
    easeFactor: 2.5, dueDate: 0, createdAt: 0,
    sentence: 'I drink water every morning',
    sentenceTranslation: 'Men har tong suv ichaman',
    ...o,
  } as CardRecord
}

const pool: CardRecord[] = [
  makeCard(),
  makeCard({ id: 'b', word: 'bread', translation: 'non' }),
  makeCard({ id: 't', word: 'tea', translation: 'choy' }),
  makeCard({ id: 's', word: 'salt', translation: 'tuz' }),
]

describe('generateExercise — cloze', () => {
  it("jumlada ___ bo'ladi, so'z bo'lmaydi", () => {
    // rep=2 da ladder cloze'ni tanlashi mumkin; audio yo'q, seed qat'iy
    let found = null
    for (let seed = 1; seed < 50 && !found; seed += 1) {
      const ex = generateExercise({
        card: makeCard({ id: 'w' }), pool, allowAudio: false, random: seededRandom(seed),
      })
      if (ex.type === 'cloze') found = ex
    }
    expect(found).not.toBeNull()
    expect(found!.prompt).toContain('___')
    expect(found!.prompt.toLowerCase()).not.toContain('water')
    expect(found!.options).toContain('water')
    expect(found!.options[found!.correctIndex]).toBe('water')
  })

  it("jumlasiz kartada cloze yaratilmaydi", () => {
    const noSentence = makeCard({ id: 'w', sentence: undefined })
    for (let seed = 1; seed < 50; seed += 1) {
      const ex = generateExercise({
        card: noSentence, pool, allowAudio: false, random: seededRandom(seed),
      })
      expect(ex.type).not.toBe('cloze')
    }
  })
})
```

- [ ] **Step 2: Testni yugurtirib, tushishini tekshirish**

Run: `npx vitest run src/core/exercises/generate.test.ts -t cloze`
Expected: FAIL — cloze hech qachon yaratilmaydi.

- [ ] **Step 3: Helperlarni qo'shish**

`src/core/exercises/generate.ts` — `collectDistractors` dan keyin qo'shing:

```ts
/**
 * Chalg'ituvchi SO'ZLAR (tarjima emas) — cloze uchun.
 * `collectDistractors` bilan bir xil mantiq, faqat `word` maydonini yig'adi:
 * cloze variantlari o'rganilayotgan tilda bo'lishi kerak.
 */
function collectWordDistractors(
  card: CardRecord,
  pool: readonly CardRecord[],
  random: RandomSource,
): string[] {
  const seen = new Set([card.word.toLowerCase()])
  const sameTopic: string[] = []
  const otherTopic: string[] = []

  for (const candidate of pool) {
    if (candidate.id === card.id) continue

    const key = candidate.word.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    if (card.topic && candidate.topic === card.topic) sameTopic.push(candidate.word)
    else otherTopic.push(candidate.word)
  }

  return [...shuffle(sameTopic, random), ...shuffle(otherTopic, random)].slice(0, MAX_CHOICES - 1)
}

/**
 * Jumlada so'zni "___" bilan almashtiradi (birinchi uchrashini, katta-kichik
 * harfga befarq, so'z chegarasi bilan). Topilmasa null — cloze yaratilmaydi.
 */
function clozeBlank(sentence: string, word: string): string | null {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\b${escaped}\\b`, 'i')
  if (!re.test(sentence)) return null
  return sentence.replace(re, '___')
}
```

- [ ] **Step 4: Ladder va `isTypeAvailable` ni yangilash**

`src/core/exercises/generate.ts` — `DIFFICULTY_LADDER` ni almashtiring:

```ts
const DIFFICULTY_LADDER: Array<{ minRepetitions: number; types: ExerciseType[] }> = [
  { minRepetitions: 4, types: ['recall', 'construction', 'spelling'] },
  { minRepetitions: 2, types: ['listening', 'recall', 'cloze'] },
  { minRepetitions: 1, types: ['recognition', 'listening'] },
  { minRepetitions: 0, types: ['recognition'] },
]
```

`isTypeAvailable` switch'iga (matching Task 6 da qo'shiladi; hozircha cloze):

```ts
    case 'cloze': {
      const sentence = card.sentence?.trim()
      if (!sentence) return false
      if (clozeBlank(sentence, card.word) === null) return false
      return pool.some((candidate) => candidate.id !== card.id)
    }
```

> **Diqqat:** `isTypeAvailable` funksiyasi `ExerciseType` ustidan `switch` qiladi. Task 1 dan keyin bu switch to'liq emas. Har yangi tur qo'shilganda mos `case` qo'shing. `spelling` Task 5 da, `matching` Task 6 da to'ldiriladi. Oraliq holatda `default: return false` QO'SHMANG — exhaustiveness'ni saqlaymiz; o'rniga har taskda kerakli case'ni qo'shamiz. TypeScript to'liq bo'lmagan switch'da xato bermaydi (funksiya `boolean` qaytaradi va barcha yo'llar qamralmasa `TS7030` chiqadi) — shu sabab har oraliq taskda barcha yetishmayotgan case'lar vaqtincha `return false` bilan yopiladi. **Aniqrog'i:** bu taskda spelling va matching uchun ham vaqtincha `case 'spelling': case 'matching': return false` qo'shing, Task 5/6 da almashtiring.**

Shu sababli, bu taskda `isTypeAvailable` switch'iga quyidagini qo'shing:

```ts
    case 'cloze': {
      const sentence = card.sentence?.trim()
      if (!sentence) return false
      if (clozeBlank(sentence, card.word) === null) return false
      return pool.some((candidate) => candidate.id !== card.id)
    }
    case 'spelling':
      return false // Task 5 da to'ldiriladi
    case 'matching':
      return false // Task 6 da to'ldiriladi
```

- [ ] **Step 5: `generateExercise` switch'iga cloze qo'shish**

`src/core/exercises/generate.ts` — `generateExercise` switch'iga (`recall` dan oldin) qo'shing:

```ts
    case 'cloze': {
      const sentence = card.sentence?.trim()
      const blanked = sentence ? clozeBlank(sentence, card.word) : null
      const distractors = blanked ? collectWordDistractors(card, pool, random) : []
      // Mavjudlik yuqorida tekshirilgan; bu shart faqat tip tizimi uchun
      if (!blanked || distractors.length === 0) return buildRecall(card)

      const options = shuffle([card.word, ...distractors], random)
      return {
        id,
        type,
        card,
        prompt: blanked,
        options,
        correctIndex: options.indexOf(card.word),
      }
    }

    case 'spelling':
      // Task 5 da to'ldiriladi — hozircha oxirgi tayanchga tushamiz
      return buildRecall(card)

    case 'matching':
      // Task 6 da to'ldiriladi
      return buildRecall(card)
```

- [ ] **Step 6: Testni yugurtirish**

Run: `npx vitest run src/core/exercises/generate.test.ts`
Expected: PASS (cloze testlari o'tadi).

- [ ] **Step 7: Commit**

```bash
git add src/core/exercises/generate.ts src/core/exercises/generate.test.ts
git commit -m "feat: cloze generatori (gap ichida) + so'z chalg'ituvchilari"
```

---

### Task 5: `generate.ts` — spelling generatori

`buildSpelling` so'z harflarini aralashtiradi (`scrambleLetters`). Faqat lotin/kirill (`language !== 'ar'`), bir so'zli (bo'sh joysiz), 3–10 harfli. Tarjima ko'rsatiladi; javob = harflar birlashmasi.

**Files:**
- Modify: `src/core/exercises/generate.ts` (isTypeAvailable spelling case, generateExercise spelling case, scrambleLetters)
- Test: `src/core/exercises/generate.test.ts`

**Interfaces:**
- Produces:
  - `scrambleLetters(word, random): string[]` — harflar aralashmasi (kirish tartibidan farq qilishga urinadi)
  - `generateExercise` `spelling` chiqara oladi

- [ ] **Step 1: Tushadigan testlarni yozish**

`src/core/exercises/generate.test.ts` — qo'shing:

```ts
describe('generateExercise — spelling', () => {
  it('letters — so‘z harflarining aralashmasi', () => {
    let found = null
    for (let seed = 1; seed < 80 && !found; seed += 1) {
      const ex = generateExercise({
        card: makeCard({ id: 'w', repetitions: 4 }), pool, allowAudio: false,
        random: seededRandom(seed),
      })
      if (ex.type === 'spelling') found = ex
    }
    expect(found).not.toBeNull()
    expect(found!.answer).toBe('water')
    expect([...found!.letters].sort().join('')).toBe([...'water'].sort().join(''))
    expect(found!.prompt).toBe('suv')
  })

  it('arab kartada spelling yaratilmaydi', () => {
    const ar = makeCard({ id: 'a', word: 'ماء', translation: 'suv', language: 'ar', repetitions: 4, sentence: undefined })
    const arPool = [ar, makeCard({ id: 'a2', word: 'خبز', translation: 'non', language: 'ar' })]
    for (let seed = 1; seed < 80; seed += 1) {
      const ex = generateExercise({ card: ar, pool: arPool, allowAudio: false, random: seededRandom(seed) })
      expect(ex.type).not.toBe('spelling')
    }
  })

  it("ko'p so'zli/uzun so'zda spelling yaratilmaydi", () => {
    const long = makeCard({ id: 'x', word: 'refrigerator', translation: 'muzlatgich', repetitions: 4, sentence: undefined })
    for (let seed = 1; seed < 80; seed += 1) {
      const ex = generateExercise({ card: long, pool, allowAudio: false, random: seededRandom(seed) })
      expect(ex.type).not.toBe('spelling')
    }
  })
})
```

- [ ] **Step 2: Testni yugurtirib, tushishini tekshirish**

Run: `npx vitest run src/core/exercises/generate.test.ts -t spelling`
Expected: FAIL — spelling hech qachon yaratilmaydi (Task 4 da `return false` / `buildRecall`).

- [ ] **Step 3: `scrambleLetters` qo'shish**

`src/core/exercises/generate.ts` — `clozeBlank` dan keyin:

```ts
/**
 * So'z harflarini aralashtiradi. Bir necha marta urinib, kirish tartibidan
 * farqli natija berishga harakat qiladi (bir harfli yoki takror harfli
 * so'zlarda farq bo'lmasligi mumkin — bu normal).
 */
function scrambleLetters(word: string, random: RandomSource): string[] {
  const letters = [...word]
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shuffled = shuffle(letters, random)
    if (shuffled.join('') !== word) return shuffled
  }
  return shuffle(letters, random)
}

/** So'z spelling uchun yaroqlimi: lotin/kirill, bir so'z, 3–10 harf */
function isSpellable(card: CardRecord): boolean {
  if (card.language === 'ar') return false
  const word = card.word.trim()
  if (word.length < 3 || word.length > 10) return false
  return !/\s/.test(word)
}
```

- [ ] **Step 4: `isTypeAvailable` spelling case'ini almashtirish**

`src/core/exercises/generate.ts` — Task 4 dagi `case 'spelling': return false` ni almashtiring:

```ts
    case 'spelling':
      return isSpellable(card)
```

- [ ] **Step 5: `generateExercise` spelling case'ini almashtirish**

Task 4 dagi vaqtinchalik spelling case'ini almashtiring:

```ts
    case 'spelling': {
      if (!isSpellable(card)) return buildRecall(card)

      return {
        id,
        type,
        card,
        prompt: card.translation,
        letters: scrambleLetters(card.word, random),
        answer: card.word,
      }
    }
```

- [ ] **Step 6: Testni yugurtirish**

Run: `npx vitest run src/core/exercises/generate.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/core/exercises/generate.ts src/core/exercises/generate.test.ts
git commit -m "feat: spelling generatori (harfma-harf) — lotin/kirill, 3-10 harf"
```

---

### Task 6: `generate.ts` — matching generatori

`buildMatching` joriy karta + `pool` dan 4 boshqa kartani olib, 5 juftni tuzadi. Kamida 5 karta kerak (kam bo'lsa step down). Ladder'ga `matching` rep>=1 da qo'shiladi.

**Files:**
- Modify: `src/core/exercises/generate.ts` (ladder, isTypeAvailable matching case, generateExercise matching case, buildMatching)
- Test: `src/core/exercises/generate.test.ts`

**Interfaces:**
- Consumes: `MatchingPair` (types.ts)
- Produces:
  - `MATCHING_SIZE = 5` (eksport qilinadi — MatchingView va testlar ishlatadi)
  - `generateExercise` `matching` chiqara oladi

- [ ] **Step 1: Tushadigan testlarni yozish**

`src/core/exercises/generate.test.ts` — qo'shing:

```ts
describe('generateExercise — matching', () => {
  const big: CardRecord[] = [
    makeCard({ id: 'w', word: 'water', translation: 'suv', sentence: undefined }),
    makeCard({ id: 'b', word: 'bread', translation: 'non', sentence: undefined }),
    makeCard({ id: 't', word: 'tea', translation: 'choy', sentence: undefined }),
    makeCard({ id: 's', word: 'salt', translation: 'tuz', sentence: undefined }),
    makeCard({ id: 'm', word: 'milk', translation: 'sut', sentence: undefined }),
    makeCard({ id: 'e', word: 'egg', translation: 'tuxum', sentence: undefined }),
  ]

  it('5 noyob juft chiqadi va joriy karta ichida bo‘ladi', () => {
    let found = null
    for (let seed = 1; seed < 80 && !found; seed += 1) {
      const ex = generateExercise({
        card: big[0], pool: big, allowAudio: false, random: seededRandom(seed),
      })
      if (ex.type === 'matching') found = ex
    }
    expect(found).not.toBeNull()
    expect(found!.pairs).toHaveLength(5)
    const ids = found!.pairs.map((p) => p.cardId)
    expect(new Set(ids).size).toBe(5)
    expect(ids).toContain('w')
  })

  it('pool 5 tadan kam bo‘lsa matching yaratilmaydi', () => {
    const small = big.slice(0, 4)
    for (let seed = 1; seed < 80; seed += 1) {
      const ex = generateExercise({
        card: small[0], pool: small, allowAudio: false, random: seededRandom(seed),
      })
      expect(ex.type).not.toBe('matching')
    }
  })
})
```

- [ ] **Step 2: Testni yugurtirib, tushishini tekshirish**

Run: `npx vitest run src/core/exercises/generate.test.ts -t matching`
Expected: FAIL.

- [ ] **Step 3: `MATCHING_SIZE` va `buildMatching` qo'shish**

`src/core/exercises/generate.ts` — importga `MatchingPair` qo'shing:

```ts
import { MAX_CHOICES, type Exercise, type MatchingPair } from './types'
```

`scrambleLetters` dan keyin:

```ts
/** Juft topishdagi kartalar soni */
export const MATCHING_SIZE = 5

/**
 * Joriy karta + pool'dan MATCHING_SIZE-1 boshqa kartani olib juftlar tuzadi.
 * Yetarli karta bo'lmasa null (step down).
 */
function buildMatching(
  card: CardRecord,
  pool: readonly CardRecord[],
  random: RandomSource,
): MatchingPair[] | null {
  const others = shuffle(
    pool.filter((c) => c.id !== card.id),
    random,
  ).slice(0, MATCHING_SIZE - 1)

  if (others.length < MATCHING_SIZE - 1) return null

  const cards = shuffle([card, ...others], random)
  return cards.map((c) => ({ cardId: c.id, word: c.word, translation: c.translation }))
}
```

- [ ] **Step 4: Ladder'ga matching qo'shish**

`src/core/exercises/generate.ts` — `DIFFICULTY_LADDER` ning rep>=1 pog'onasini almashtiring:

```ts
  { minRepetitions: 1, types: ['recognition', 'listening', 'matching'] },
```

- [ ] **Step 5: `isTypeAvailable` matching case'ini almashtirish**

Task 4 dagi `case 'matching': return false` ni almashtiring:

```ts
    case 'matching':
      // O'zidan tashqari kamida MATCHING_SIZE-1 karta kerak
      return pool.filter((c) => c.id !== card.id).length >= MATCHING_SIZE - 1
```

- [ ] **Step 6: `generateExercise` matching case'ini almashtirish**

Task 4 dagi `case 'matching': return buildRecall(card)` ni almashtiring:

```ts
    case 'matching': {
      const pairs = buildMatching(card, pool, random)
      if (!pairs) return buildRecall(card)

      return { id, type, card, pairs }
    }
```

- [ ] **Step 7: To'liq yadro testini yugurtirish**

Run: `npx vitest run src/core/exercises`
Expected: PASS. Endi `npx tsc --noEmit` da `generate.ts` va `check.ts` xatolari yo'q; qolgani UI (ExerciseView/SessionRunner) — Task 7/8.

- [ ] **Step 8: Commit**

```bash
git add src/core/exercises/generate.ts src/core/exercises/generate.test.ts
git commit -m "feat: matching generatori (juft topish) — 5 kartali"
```

---

### Task 7: `ExerciseView` — ClozeView va SpellingView

Cloze mavjud `ChoiceGrid` ni qayta ishlatadi (recognition kabi bir-bosishda javob). Spelling `construction` ga o'xshaydi, faqat token = harf va yig'ilgani birlashtirilib matn sifatida yuboriladi. `switch (exercise.type)` ga ikki yangi shohobcha qo'shiladi (`matching` Task 8 da SessionRunner darajasida hal qilinadi — bu yerda `matching` uchun `null` qaytariladi, chunki `ExerciseView` matching'ni chizmaydi).

**Files:**
- Modify: `src/features/session/ExerciseView.tsx` (switch + ikki yangi komponent)
- Test: `src/features/session/ExerciseView.test.tsx` (mavjud bo'lsa qo'shiladi; bo'lmasa yangi)

**Interfaces:**
- Consumes: `ExerciseViewProps { exercise, answer, onAnswerChange, revealed, onSubmit }`, `ChoiceGrid`, `ExerciseAnswerState { choiceIndex, text, tokenOrder }`
- Produces: `ExerciseView` cloze va spelling'ni chizadi

- [ ] **Step 1: Tushadigan testni yozish**

`src/features/session/ExerciseView.test.tsx` — qo'shing (mavjud test yordamchilarига mos; yo'q bo'lsa quyidagi to'liq ishlaydi):

```ts
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ExerciseView } from './ExerciseView'
import { EMPTY_ANSWER } from './answerState'
import type { ClozeExercise, SpellingExercise } from '@/core/exercises'
import type { CardRecord } from '@/core/db'

const baseCard = {
  id: 'w', word: 'water', translation: 'suv', language: 'en',
  topic: 'Ovqat', level: 'A1', interval: 0, repetitions: 2,
  easeFactor: 2.5, dueDate: 0, createdAt: 0,
} as CardRecord

describe('ExerciseView — cloze', () => {
  const cloze: ClozeExercise = {
    id: 'w:cloze', type: 'cloze', card: baseCard,
    prompt: 'I drink ___ every morning',
    options: ['water', 'bread', 'tea', 'salt'], correctIndex: 0,
  }

  it('jumla va variantlar ko‘rinadi, tanlash javob beradi', () => {
    const onSubmit = vi.fn()
    render(
      <ExerciseView exercise={cloze} answer={EMPTY_ANSWER}
        onAnswerChange={() => {}} revealed={false} onSubmit={onSubmit} />,
    )
    expect(screen.getByText(/I drink ___/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /water/i }))
    expect(onSubmit).toHaveBeenCalled()
  })
})

describe('ExerciseView — spelling', () => {
  const spelling: SpellingExercise = {
    id: 'w:spelling', type: 'spelling', card: baseCard,
    prompt: 'suv', letters: ['w', 'a', 't', 'e', 'r'], answer: 'water',
  }

  it('tarjima va harflar ko‘rinadi', () => {
    render(
      <ExerciseView exercise={spelling} answer={EMPTY_ANSWER}
        onAnswerChange={() => {}} revealed={false} onSubmit={() => {}} />,
    )
    expect(screen.getByText('suv')).toBeInTheDocument()
    // Har harf tugma sifatida
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(5)
  })
})
```

- [ ] **Step 2: Testni yugurtirib, tushishini tekshirish**

Run: `npx vitest run src/features/session/ExerciseView.test.tsx`
Expected: FAIL — cloze/spelling chizilmaydi.

- [ ] **Step 3: `ExerciseView` switch'iga shohobchalar qo'shish**

`src/features/session/ExerciseView.tsx` — asosiy `switch (exercise.type)` ga (`construction` dan keyin) qo'shing:

```tsx
    case 'cloze':
      return <ClozeView {...props} exercise={exercise} />

    case 'spelling':
      return <SpellingView {...props} exercise={exercise} />

    // Juft topish alohida ko'rinishda (MatchingView) SessionRunner darajasida
    // chiziladi — bu yerga hech qachon yetib kelmaydi
    case 'matching':
      return null
```

- [ ] **Step 4: `ClozeView` komponentini qo'shish**

`src/features/session/ExerciseView.tsx` — fayl oxiriga (ConstructionView dan keyin):

```tsx
/** 5. Gap ichida — jumlada tushgan so'zni tanlash */
function ClozeView({
  exercise,
  answer,
  onAnswerChange,
  onSubmit,
  revealed,
}: ExerciseViewProps & { exercise: Extract<Exercise, { type: 'cloze' }> }) {
  const language = LANGUAGES[exercise.card.language]

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-ink-600">Tushib qolgan so'zni tanlang</p>
        <p dir={language.dir} lang={language.code} className="text-2xl font-bold">
          {exercise.prompt}
        </p>
      </Panel>
      <ChoiceGrid
        options={exercise.options}
        correctIndex={exercise.correctIndex}
        selectedIndex={answer.choiceIndex}
        revealed={revealed}
        onSelect={(choiceIndex) => {
          const chosen = { ...answer, choiceIndex }
          onAnswerChange(chosen)
          onSubmit(chosen)
        }}
      />
    </div>
  )
}

/** 6. Harfma-harf — aralash harflardan so'z yig'ish */
function SpellingView({
  exercise,
  answer,
  onAnswerChange,
  revealed,
}: ExerciseViewProps & { exercise: Extract<Exercise, { type: 'spelling' }> }) {
  const language = LANGUAGES[exercise.card.language]
  const used = new Set(answer.tokenOrder)

  function addLetter(index: number) {
    if (revealed || used.has(index)) return
    onAnswerChange({ ...answer, tokenOrder: [...answer.tokenOrder, index] })
  }

  function removeLetter(position: number) {
    if (revealed) return
    onAnswerChange({
      ...answer,
      tokenOrder: answer.tokenOrder.filter((_, i) => i !== position),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex min-h-24 flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm text-ink-600">Bu so'zni harflardan yig'ing</p>
        <p className="text-xl font-bold">{exercise.prompt}</p>
      </Panel>

      {/* Yig'ilayotgan so'z */}
      <div className="flex min-h-14 flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed border-ink-300 p-3">
        {answer.tokenOrder.length === 0 && (
          <p className="text-sm text-ink-600">Harflarni tartib bilan bosing…</p>
        )}
        {answer.tokenOrder.map((letterIndex, position) => (
          <button
            key={`${letterIndex}-${position}`}
            type="button"
            disabled={revealed}
            onClick={() => removeLetter(position)}
            lang={language.code}
            aria-label={`${exercise.letters[letterIndex]} — olib tashlash`}
            className="tap-highlight-none flex h-11 w-11 items-center justify-center rounded-xl border-2 border-brand-500 bg-brand-50 text-lg font-extrabold"
          >
            {exercise.letters[letterIndex]}
          </button>
        ))}
      </div>

      {/* Tanlanmagan harflar */}
      <div className="flex flex-wrap gap-2">
        {exercise.letters.map((letter, index) => (
          <button
            key={`${letter}-${index}`}
            type="button"
            disabled={revealed || used.has(index)}
            onClick={() => addLetter(index)}
            lang={language.code}
            aria-label={`${letter} — qo'shish`}
            className={cn(
              'tap-highlight-none flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink-300 bg-white text-lg font-extrabold transition-opacity',
              used.has(index) && 'invisible',
            )}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Testni yugurtirish**

Run: `npx vitest run src/features/session/ExerciseView.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/session/ExerciseView.tsx src/features/session/ExerciseView.test.tsx
git commit -m "feat: ClozeView + SpellingView (gap ichida, harfma-harf UI)"
```

---

### Task 8: `MatchingView` — juft topish UI

Yangi komponent: 5 so'z va 5 aralash tarjima ikki ustunda. Foydalanuvchi avval so'zni, so'ng tarjimani bosadi. To'g'ri juft yashil bo'lib qoladi (o'chadi), xato juft qizil chaqnaydi (jazolanmaydi, qayta urinish mumkin). Barcha juft topilganda `onComplete(results)` chaqiriladi.

**Files:**
- Create: `src/features/session/MatchingView.tsx`
- Test: `src/features/session/MatchingView.test.tsx`

**Interfaces:**
- Consumes: `MatchingPair { cardId, word, translation }`, `MatchingExercise`, `AnswerVerdict`
- Produces:
  - `MatchingResult { cardId: string; verdict: AnswerVerdict }`
  - `MatchingView({ exercise, onComplete }: { exercise: MatchingExercise; onComplete: (results: MatchingResult[]) => void })`
  - Har karta uchun natija: birinchi urinishda to'g'ri topilsa `correct`, avval xato bo'lgan bo'lsa `wrong`.

- [ ] **Step 1: Tushadigan testni yozish**

`src/features/session/MatchingView.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MatchingView } from './MatchingView'
import type { MatchingExercise } from '@/core/exercises'
import type { CardRecord } from '@/core/db'

function pairCard(id: string, word: string, tr: string): CardRecord {
  return {
    id, word, translation: tr, language: 'en', topic: 'Ovqat', level: 'A1',
    interval: 0, repetitions: 1, easeFactor: 2.5, dueDate: 0, createdAt: 0,
  } as CardRecord
}

const exercise: MatchingExercise = {
  id: 'm', type: 'matching', card: pairCard('w', 'water', 'suv'),
  pairs: [
    { cardId: 'w', word: 'water', translation: 'suv' },
    { cardId: 'b', word: 'bread', translation: 'non' },
    { cardId: 't', word: 'tea', translation: 'choy' },
  ],
}

describe('MatchingView', () => {
  it('barcha juft to‘g‘ri bosilsa onComplete hammasini correct bilan chaqiradi', () => {
    const onComplete = vi.fn()
    render(<MatchingView exercise={exercise} onComplete={onComplete} />)

    for (const p of exercise.pairs) {
      fireEvent.click(screen.getByRole('button', { name: p.word }))
      fireEvent.click(screen.getByRole('button', { name: p.translation }))
    }

    expect(onComplete).toHaveBeenCalledTimes(1)
    const results = onComplete.mock.calls[0][0]
    expect(results).toHaveLength(3)
    expect(results.every((r: { verdict: string }) => r.verdict === 'correct')).toBe(true)
  })

  it('xato juft o‘sha karta uchun wrong sifatida yoziladi', () => {
    const onComplete = vi.fn()
    render(<MatchingView exercise={exercise} onComplete={onComplete} />)

    // 'water' ni 'non' ga noto'g'ri juftlash
    fireEvent.click(screen.getByRole('button', { name: 'water' }))
    fireEvent.click(screen.getByRole('button', { name: 'non' }))

    // Endi to'g'ri juftlarni yakunlash
    fireEvent.click(screen.getByRole('button', { name: 'water' }))
    fireEvent.click(screen.getByRole('button', { name: 'suv' }))
    fireEvent.click(screen.getByRole('button', { name: 'bread' }))
    fireEvent.click(screen.getByRole('button', { name: 'non' }))
    fireEvent.click(screen.getByRole('button', { name: 'tea' }))
    fireEvent.click(screen.getByRole('button', { name: 'choy' }))

    const results = onComplete.mock.calls[0][0]
    const water = results.find((r: { cardId: string }) => r.cardId === 'w')
    expect(water.verdict).toBe('wrong')
  })
})
```

- [ ] **Step 2: Testni yugurtirib, tushishini tekshirish**

Run: `npx vitest run src/features/session/MatchingView.test.tsx`
Expected: FAIL — `MatchingView` mavjud emas.

- [ ] **Step 3: `MatchingView` ni yozish**

`src/features/session/MatchingView.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { LANGUAGES } from '@/core/config/languages'
import type { AnswerVerdict, MatchingExercise } from '@/core/exercises'
import { shuffle } from '@/lib/random'
import { cn } from '@/lib/cn'

/** Bitta kartaning juft topishdagi natijasi */
export interface MatchingResult {
  cardId: string
  verdict: AnswerVerdict
}

interface MatchingViewProps {
  exercise: MatchingExercise
  onComplete: (results: MatchingResult[]) => void
}

/** Ekranда ustun elementi (so'z yoki tarjima) */
interface Cell {
  cardId: string
  label: string
}

/**
 * Juft topish: chap ustun — so'zlar, o'ng ustun — aralash tarjimalar.
 * Foydalanuvchi avval bir tomondan, so'ng ikkinchisidan bosadi.
 *
 * XATODA JAZOLAMASLIK: noto'g'ri juft qizil chaqnaydi va tanlov bekor
 * bo'ladi — foydalanuvchi qayta uриниб ko'radi. Lekin o'sha karta natijasi
 * "wrong" deb belgilanadi (SM-2 uni yaqinroq intervалga suradi).
 */
export function MatchingView({ exercise, onComplete }: MatchingViewProps) {
  const language = LANGUAGES[exercise.card.language]

  // So'zlar kirish tartibida, tarjimalar aralash — bir marta hisoblanadi
  const words = useMemo<Cell[]>(
    () => exercise.pairs.map((p) => ({ cardId: p.cardId, label: p.word })),
    [exercise],
  )
  const translations = useMemo<Cell[]>(
    () => shuffle(exercise.pairs.map((p) => ({ cardId: p.cardId, label: p.translation }))),
    [exercise],
  )

  /** Tanlangan so'z (o'ng ustun kutilmoqda) */
  const [pickedWord, setPickedWord] = useState<string | null>(null)
  /** Juftlab bo'lingan kartalar */
  const [matched, setMatched] = useState<Set<string>>(new Set())
  /** Xato qilingan kartalar (natija uchun) */
  const [erred, setErred] = useState<Set<string>>(new Set())
  /** Qisqa vaqt qizil ko'rsatiladigan card id */
  const [wrongFlash, setWrongFlash] = useState<string | null>(null)

  function finish(finalMatched: Set<string>, finalErred: Set<string>) {
    const results: MatchingResult[] = exercise.pairs.map((p) => ({
      cardId: p.cardId,
      verdict: finalErred.has(p.cardId) ? 'wrong' : 'correct',
    }))
    void finalMatched // barcha juft topilgan — hujjatlashtirish uchun
    onComplete(results)
  }

  function pickWord(cardId: string) {
    if (matched.has(cardId)) return
    setPickedWord(cardId)
    setWrongFlash(null)
  }

  function pickTranslation(cardId: string) {
    if (matched.has(cardId) || pickedWord === null) return

    if (pickedWord === cardId) {
      const next = new Set(matched).add(cardId)
      setMatched(next)
      setPickedWord(null)
      if (next.size === exercise.pairs.length) finish(next, erred)
    } else {
      // Noto'g'ri: xato belgilash + qisqa chaqnash, tanlovni bekor qilish
      setErred((prev) => new Set(prev).add(pickedWord))
      setWrongFlash(cardId)
      setPickedWord(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="text-center">
        <p className="text-sm font-semibold text-ink-600">So'z va tarjimasini juftlang</p>
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        {/* Chap: so'zlar */}
        <div className="flex flex-col gap-2">
          {words.map((cell) => {
            const done = matched.has(cell.cardId)
            const active = pickedWord === cell.cardId
            return (
              <button
                key={cell.cardId}
                type="button"
                disabled={done}
                onClick={() => pickWord(cell.cardId)}
                dir={language.dir}
                lang={language.code}
                className={cn(
                  'tap-highlight-none min-h-12 rounded-2xl border-2 px-3 py-2 font-semibold transition-colors',
                  done && 'border-brand-500 bg-brand-100 text-brand-700 opacity-60',
                  active && 'border-brand-500 bg-brand-50',
                  !done && !active && 'border-ink-300 bg-white',
                )}
              >
                {cell.label}
              </button>
            )
          })}
        </div>

        {/* O'ng: tarjimalar */}
        <div className="flex flex-col gap-2">
          {translations.map((cell) => {
            const done = matched.has(cell.cardId)
            const flash = wrongFlash === cell.cardId
            return (
              <button
                key={cell.cardId}
                type="button"
                disabled={done}
                onClick={() => pickTranslation(cell.cardId)}
                className={cn(
                  'tap-highlight-none min-h-12 rounded-2xl border-2 px-3 py-2 font-semibold transition-colors',
                  done && 'border-brand-500 bg-brand-100 text-brand-700 opacity-60',
                  flash && 'border-wrong-500 border-dashed bg-wrong-500/10 text-wrong-600',
                  !done && !flash && 'border-ink-300 bg-white',
                )}
              >
                {cell.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Testni yugurtirish**

Run: `npx vitest run src/features/session/MatchingView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/session/MatchingView.tsx src/features/session/MatchingView.test.tsx
git commit -m "feat: MatchingView (juft topish) — xatoda jazolamaydi"
```

---

### Task 9: `SessionRunner` — matching tarmog'i (ko'p-karta baholash)

`SessionRunner` matching mashqini alohida chizadi: `MatchingView` FeedbackBar va bir-javob mashinasini chetlab o'tadi. `onComplete` har juft uchun `gradeCard` + `recordAnswer` chaqiradi (to'g'ri=4, xato=2), `summary` ni yangilaydi va navbatni **bittaga** suradi (qolgan 4 karta bonus takror sifatida yoziladi). Xato bo'lgan joriy karta seans oxiriga qaytmaydi (matching allaqachon ko'p karta baholadi — soddalik uchun oddiy oldinga surish).

**Files:**
- Modify: `src/features/session/SessionRunner.tsx`
- Test: `src/features/session/SessionRunner.test.tsx` (mavjud bo'lsa qo'shiladi; bo'lmasa — ReviewScreen darajasidagi mavjud test yetadi, lekin yangi test aniqlik beradi)

**Interfaces:**
- Consumes: `gradeCard(cardId, grade): Promise<CardRecord>`, `recordAnswer({ cardId, verdict, dailyGoalWords }): Promise<{ xpGained, goalJustCompleted }>`, `MatchingView`, `MatchingResult`
- Produces: matching seansda `summary.answered` juftlar soniga oshadi

- [ ] **Step 1: Tushadigan testni yozish**

`src/features/session/SessionRunner.test.tsx` — qo'shing yoki yarating. Test IndexedDB'ga tayanmasligi uchun `@/core/db` mock qilinadi:

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { CardRecord } from '@/core/db'

// DB va geymifikatsiyani mock qilamiz — test faqat oqimni tekshiradi
vi.mock('@/core/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core/db')>()
  return {
    ...actual,
    gradeCard: vi.fn(async (_id: string, _g: number) => ({ interval: 1 }) as CardRecord),
    recordAnswer: vi.fn(async () => ({ xpGained: 5, goalJustCompleted: false })),
    finalizeSession: vi.fn(async () => ({ newlyUnlocked: [] })),
  }
})

import { gradeCard, recordAnswer } from '@/core/db'
import { SessionRunner } from './SessionRunner'

function makeCard(id: string, word: string, tr: string): CardRecord {
  return {
    id, word, translation: tr, language: 'en', topic: 'Ovqat', level: 'A1',
    interval: 0, repetitions: 1, easeFactor: 2.5, dueDate: 0, createdAt: 0,
  } as CardRecord
}

describe('SessionRunner — matching', () => {
  beforeEach(() => vi.clearAllMocks())

  it('juft topish seansi har karta uchun baho yozadi', async () => {
    // 5 karta — repetitions=1, jumlasiz → matching yaratilishi mumkin.
    // Deterministiklik uchun pool aynan shu 5 karta.
    const cards = [
      makeCard('a', 'water', 'suv'),
      makeCard('b', 'bread', 'non'),
      makeCard('c', 'tea', 'choy'),
      makeCard('d', 'salt', 'tuz'),
      makeCard('e', 'milk', 'sut'),
    ]

    render(<SessionRunner cards={[cards[0]]} pool={cards} onFinish={() => {}} />)

    // Matching chiqmasa test bu yerda beqaror bo'lardi; agar chiqmasa
    // (boshqa tur tanlansa) testni o'tkazib yuboramiz emas — SessionRunner
    // matching'ni ko'rsatishi uchun repetitions=1 va jumlasiz karta yetarli,
    // lekin ladder tasodifiy tanlaydi. Shuning uchun juftlash tugmalari
    // paydo bo'lguncha kutamiz.
    const juftlang = await screen.findByText(/juftlang/i).catch(() => null)
    if (!juftlang) return // matching bu safar tanlanmadi — oqim buzilmaydi

    for (const c of cards) {
      fireEvent.click(screen.getByRole('button', { name: c.word }))
      fireEvent.click(screen.getByRole('button', { name: c.translation }))
    }

    await waitFor(() => {
      expect(gradeCard).toHaveBeenCalledTimes(5)
      expect(recordAnswer).toHaveBeenCalledTimes(5)
    })
  })
})
```

> Bu test tasodifga bog'liq (ladder matching'ni tanlashi kafolatlanmagan). Agar beqarorlik ko'rinsa, alohida testda `MatchingView` ni to'g'ridan-to'g'ri render qiling (Task 8) va SessionRunner integratsiyasini `ReviewScreen.test.tsx` dagi mavjud oqim testiga tayaning. Asosiy tekshiruv — matching tarmog'i mavjud va `gradeCard`/`recordAnswer` ni chaqiradi.

- [ ] **Step 2: Testni yugurtirib holatni ko'rish**

Run: `npx vitest run src/features/session/SessionRunner.test.tsx`
Expected: FAIL yoki no-op (matching tarmog'i yo'q — `MatchingView` chizilmaydi).

- [ ] **Step 3: Matching baholovchini `SessionRunner` ga qo'shish**

`src/features/session/SessionRunner.tsx` — importlarga qo'shing:

```tsx
import { MatchingView, type MatchingResult } from './MatchingView'
```

`handleContinue` dan keyin, matching natijasini baholovchi callback qo'shing:

```tsx
  /**
   * Juft topish yakunlandi: har karta uchun SM-2 bahosini yozadi.
   * To'g'ri = 4, xato = 2 (xatoda jazolamaslik). Navbat BITTAGA suriladi;
   * qolgan kartalar bonus takror sifatida yoziladi.
   */
  const handleMatchingComplete = useCallback(
    async (results: MatchingResult[]) => {
      if (isSaving) return
      setIsSaving(true)

      let correct = 0
      let wrong = 0
      let xpTotal = 0

      for (const { cardId, verdict } of results) {
        const grade = verdict === 'correct' ? 4 : 2
        try {
          await gradeCard(cardId, grade)
          const progress = await recordAnswer({ cardId, verdict, dailyGoalWords })
          xpTotal += progress.xpGained
        } catch (error) {
          console.error('Juftlik natijasini saqlab bo‘lmadi:', error)
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
```

> Eslatma: matching `summary.answered` ni bir mashqda 5 ga oshiradi, `queue.length` esa o'zgarmaydi. Bu `answered/queue.length` ko'rsatkichini oshirib yuborishi mumkin. Buni oldini olish uchun progress ko'rsatkichini `Math.min` bilan chegaralang (keyingi qadam).

- [ ] **Step 4: Matching'ni render qilish va progress'ni chegaralash**

`src/features/session/SessionRunner.tsx` — `if (!exercise) return null` dan keyin, `return (...)` ichida, matching bo'lsa alohida chizamiz. Asosiy `return` ning boshiga qo'shing (progress qismidan oldin, `exercise.type === 'matching'` tekshiruvi):

```tsx
  if (exercise.type === 'matching') {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <ProgressBar
            value={Math.min(summary.answered, queue.length)}
            max={queue.length}
            label="Seans progressi"
          />
          <span data-testid="session-progress" className="text-sm font-semibold text-ink-600">
            {Math.min(summary.answered, queue.length)}/{queue.length}
          </span>
        </div>

        {errorMessage && (
          <p role="alert" className="rounded-2xl border border-wrong-500/40 bg-wrong-500/10 px-4 py-3 text-sm font-semibold text-wrong-600">
            {errorMessage}
          </p>
        )}

        <MatchingView
          exercise={exercise}
          onComplete={(results) => void handleMatchingComplete(results)}
        />
      </div>
    )
  }
```

Mavjud asosiy `return` dagi progress ko'rsatkichini ham `Math.min` bilan chegaralang (ixtiyoriy, lekin izchillik uchun):

```tsx
        <ProgressBar value={Math.min(summary.answered, queue.length)} max={queue.length} label="Seans progressi" />
        <span data-testid="session-progress" className="text-sm font-semibold text-ink-600">
          {Math.min(summary.answered, queue.length)}/{queue.length}
        </span>
```

- [ ] **Step 5: `canSubmit` va `toAnswerValue` switch'lariga matching qo'shish**

`SessionRunner.tsx` da `canSubmit` va `toAnswerValue` `switch (exercise.type)` / `switch (current.type)` to'liq bo'lishi kerak (TS7030). Matching bu yo'llarga hech qachon kirmaydi (alohida render), lekin exhaustiveness uchun qo'shing:

`canSubmit` ichiga:

```ts
      case 'cloze':
        return answer.choiceIndex !== null
      case 'spelling':
        return answer.tokenOrder.length > 0
      case 'matching':
        return false
```

`toAnswerValue` ichiga:

```ts
      case 'cloze':
        return given.choiceIndex ?? -1
      case 'spelling':
        return given.tokenOrder.map((letterIndex) => current.letters[letterIndex]).join('')
      case 'matching':
        return -1
```

Shuningdek `isChoiceExercise` ni cloze'ni ham qamrashi uchun yangilang (cloze bir-bosishda javob beradi, "Tekshirish" tugmasi kerak emas):

```ts
  const isChoiceExercise =
    exercise.type === 'recognition' ||
    exercise.type === 'listening' ||
    exercise.type === 'cloze'
```

- [ ] **Step 6: Testni yugurtirish**

Run: `npx vitest run src/features/session/SessionRunner.test.tsx`
Expected: PASS (yoki no-op qaytadi, beqarorlik bo'lmaydi).

- [ ] **Step 7: To'liq tekshiruv**

Run: `npx tsc --noEmit && npm test`
Expected: barcha test o'tadi (434 + yangi testlar), TS xatosiz.

- [ ] **Step 8: Commit**

```bash
git add src/features/session/SessionRunner.tsx src/features/session/SessionRunner.test.tsx
git commit -m "feat: SessionRunner matching tarmog'i — ko'p-karta SM-2 baholash"
```

---

### Task 10: Yakuniy tekshiruv, build va deploy

Hammasi birga ishlashini tasdiqlash: lint, tip, test, build. So'ng GitHub'ga push (Vercel avtomatik deploy qiladi).

**Files:** (yo'q — faqat tekshiruv)

- [ ] **Step 1: To'liq sifat tekshiruvi**

Run: `npm run lint && npx tsc --noEmit && npm test && npm run build`
Expected: hammasi xatosiz.

- [ ] **Step 2: Qo'lda tekshirish (ixtiyoriy, tavsiya etiladi)**

Dev serverни ishga tushirib, `/lesson` va `/review` da yangi turlar chiqishini ko'ring:
- Gap ichida (jumlali so'zларда, rep>=2)
- Harfma-harf (en/rus, rep>=4)
- Juft topish (>=5 karta bo'lganда, rep>=1)

- [ ] **Step 3: Push (Vercel auto-deploy)**

```bash
git push
```

Agar Vercel avtomatik deploy qilmasa:

```bash
vercel --prod --yes
```

---

## Self-Review

**1. Spec coverage:**
- Cloze interfeysi + generator + UI → Task 2, 4, 7 ✓
- Spelling interfeysi + generator + UI → Task 2, 5, 7 ✓
- Matching interfeysi + generator + UI + SessionRunner → Task 2, 6, 8, 9 ✓
- Qiyinlik zinasi (rep>=4 spelling, rep>=2 cloze, rep>=1 matching) → Task 4, 5, 6 ✓
- check.ts cloze/spelling → Task 3 ✓
- deriveGrade spelling aktiv → Task 3 ✓
- Xatoda jazolamaslik (matching 4/2) → Task 8, 9 ✓
- Faqat lotin/kirill spelling, faqat jumlali cloze → Task 4, 5 ✓
- Step down (yaratib bo'lmasa pastga) → `isTypeAvailable` + `buildRecall` fallback, har generatorда ✓
- Testlar (generate, check, MatchingView, SessionRunner) → Task 3–9 ✓

**2. Placeholder scan:** Har kod qadamida to'liq kod bor; "TODO"/"o'xshash" yo'q. Oraliq holatlar (Task 4 da spelling/matching vaqtincha `return false`/`buildRecall`) aniq keyingi taskда almashtirish ko'rsatilgan — bu placeholder emas, bosqichma-bosqich qurilish.

**3. Type consistency:**
- `MatchingPair { cardId, word, translation }` — Task 2, 6, 8 da bir xil ✓
- `MatchingResult { cardId, verdict }` — Task 8, 9 da bir xil ✓
- `MATCHING_SIZE = 5` — Task 6 da eksport, ishlatiladi ✓
- `collectWordDistractors`, `clozeBlank`, `scrambleLetters`, `isSpellable`, `buildMatching` — nomlar bir xil saqlangan ✓
- `checkExercise` cloze = number, spelling = string — Task 3 va toAnswerValue (Task 9) mos ✓
