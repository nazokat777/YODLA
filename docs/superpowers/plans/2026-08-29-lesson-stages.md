# Dars bosqichlari — implementatsiya rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bir so'z bitta darsda bir necha marta, har safar qiyinroq mashq turida uchrasin — shunda birinchi darsdagi bir xil savollar ketma-ketligi tugaydi.

**Architecture:** Seans navbati `CardRecord[]` o'rniga `LessonStep[]` (`{ card, stage }`) bo'ladi. Mashq turini tanlaydigan zinapoya `card.repetitions + stage` ga qaraydi, ya'ni qiyinlik seans ichida ko'tariladi. SM-2 jadvali esa faqat BIRINCHI javobda yangilanadi.

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library, Dexie.

## Global Constraints

- Izohlar o'zbek tilida va NEGA shundayligini tushuntiradi (NIMA qilinayotganini emas).
- Yangi npm paketi YO'Q.
- `npm test | grep` ISHLATMANG. To'g'ri usul: `npm test -- --run > /tmp/t.log 2>&1; echo "EXIT=$?"`
- Yakunda `npm run build` ham ishlatiladi — `tsc --noEmit` yetarli emas.
- `core/` React'ga ham, `content/` ga ham bog'lanmaydi.
- Dars hajmi: **4 ta karta**, yangi so'z uchun **3 bosqich**, navbat chegarasi **20 qadam**.
- Spec: `docs/superpowers/specs/2026-08-29-lesson-stages-design.md`

---

### Task 1: Navbat qurish mantig'i

**Files:**
- Create: `src/core/lesson/queue.ts`
- Create: `src/core/lesson/queue.test.ts`

**Interfaces:**
- Produces: `interface LessonStep { card: CardRecord; stage: number }`,
  `MAX_LESSON_STEPS: number` (20),
  `buildLessonQueue(cards: readonly CardRecord[], stagesFor: (card: CardRecord) => number): LessonStep[]`

- [ ] **Step 1: Yiqiladigan testni yozing**

`src/core/lesson/queue.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { MAX_LESSON_STEPS, buildLessonQueue } from './queue'

function card(id: string, totalReviews = 0): CardRecord {
  return {
    id,
    word: id,
    translation: `${id}-uz`,
    language: 'en',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews,
    lapses: 0,
  }
}

/** Har kartaga uchtadan bosqich */
const THREE = () => 3

describe('buildLessonQueue', () => {
  it('har karta uchun berilgan sondagi qadam yaratadi', () => {
    const queue = buildLessonQueue([card('a'), card('b')], THREE)

    expect(queue).toHaveLength(6)
    expect(queue.filter((step) => step.card.id === 'a')).toHaveLength(3)
  })

  it('bosqichlar 0 dan boshlab o‘sadi', () => {
    const queue = buildLessonQueue([card('a')], THREE)

    expect(queue.map((step) => step.stage)).toEqual([0, 1, 2])
  })

  it('bir so‘zning ikki qadami YONMA-YON turmaydi', () => {
    const queue = buildLessonQueue([card('a'), card('b'), card('c')], THREE)

    // Ketma-ket ikki marta bir xil so'z so'ralsa, bu eslab chaqirish emas,
    // ekrandan nusxa ko'chirish bo'lardi
    for (let i = 1; i < queue.length; i += 1) {
      expect(queue[i].card.id).not.toBe(queue[i - 1].card.id)
    }
  })

  it('kartaga qarab bosqich soni har xil bo‘lishi mumkin', () => {
    // Takrorlanadigan so'zni qayta o'rgatish shart emas — u tekshiriladi
    const queue = buildLessonQueue(
      [card('yangi'), card('eski', 5)],
      (item) => (item.totalReviews === 0 ? 3 : 1),
    )

    expect(queue.filter((step) => step.card.id === 'yangi')).toHaveLength(3)
    expect(queue.filter((step) => step.card.id === 'eski')).toHaveLength(1)
  })

  it('chegaradan oshmaydi', () => {
    const many = Array.from({ length: 10 }, (_, i) => card(`c${i}`))

    expect(buildLessonQueue(many, THREE).length).toBeLessThanOrEqual(MAX_LESSON_STEPS)
  })

  it('bo‘sh ro‘yxat — bo‘sh navbat', () => {
    expect(buildLessonQueue([], THREE)).toEqual([])
  })

  it('nol bosqich so‘ralsa ham kamida bitta qadam beradi', () => {
    // Chaqiruvchi xato hisob bersa ham dars bo'sh qolmasligi kerak
    expect(buildLessonQueue([card('a')], () => 0)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Test yiqilishini tasdiqlang**

Run: `npx vitest run src/core/lesson/queue.test.ts`
Expected: FAIL — `Failed to resolve import "./queue"`

- [ ] **Step 3: Implementatsiya**

`src/core/lesson/queue.ts`:

```ts
import type { CardRecord } from '@/core/db'

/**
 * Seans navbatining bitta qadami.
 *
 * `stage` — shu so'z seans ichida nechanchi marta chiqyapti (0 dan).
 * Mashq turi shunga qarab qiyinlashadi: bir so'z avval tanib olishda,
 * keyin eshitishda, oxirida yozishda uchraydi.
 */
export interface LessonStep {
  card: CardRecord
  stage: number
}

/**
 * Navbatdagi qadamlarning eng ko'p soni.
 *
 * Xato javob qadamni navbat oxiriga qaytaradi, ya'ni yomon kunda dars
 * cheksiz cho'zilishi mumkin. Dars jazoga aylanmasligi kerak — chegaraga
 * yetilganda so'z keyingi darsda baribir qaytadi.
 */
export const MAX_LESSON_STEPS = 20

/**
 * Kartalardan seans navbatini quradi.
 *
 * TARTIB AYLANMA: avval hamma so'zning 1-bosqichi, keyin hammasining
 * 2-bosqichi. Shunda bir so'zning takrorlari orasida boshqa so'zlar
 * turadi — aks holda javobni ekrandan nusxa ko'chirish mumkin bo'lardi
 * va mashq eslab chaqirishni talab qilmasdi.
 *
 * @param stagesFor har karta necha marta chiqishi (kamida 1)
 */
export function buildLessonQueue(
  cards: readonly CardRecord[],
  stagesFor: (card: CardRecord) => number,
): LessonStep[] {
  const stages = cards.map((card) => Math.max(1, Math.floor(stagesFor(card))))
  const deepest = Math.max(0, ...stages)

  const queue: LessonStep[] = []

  for (let stage = 0; stage < deepest; stage += 1) {
    cards.forEach((card, index) => {
      if (stage < stages[index]) queue.push({ card, stage })
    })
  }

  return queue.slice(0, MAX_LESSON_STEPS)
}
```

- [ ] **Step 4: Testlar o'tishini tasdiqlang**

Run: `npx vitest run src/core/lesson/queue.test.ts`
Expected: PASS (7 test)

- [ ] **Step 5: Commit**

```bash
git add src/core/lesson/queue.ts src/core/lesson/queue.test.ts
git commit -m "feat: dars navbati bosqichlardan quriladi"
```

---

### Task 2: Zinapoyaga bosqich qo'shish

**Files:**
- Modify: `src/core/exercises/generate.ts`
- Modify: `src/core/exercises/generate.test.ts`

**Interfaces:**
- Consumes: hech nima (Task 1 dan mustaqil)
- Produces: `GenerateExerciseOptions` ga `stage?: number` maydoni; `exercise.id` endi `${card.id}:${type}:${stage}` ko'rinishida

- [ ] **Step 1: Yiqiladigan testni yozing**

`src/core/exercises/generate.test.ts` da, `describe('pickExerciseType — adaptiv qiyinlik', ...)` blokining ICHIGA, oxirgi `it(...)` dan keyin qo'shing:

```ts
  it('bosqich qiyinlikni KO‘TARADI — yangi so‘z ham xilma-xil chiqadi', () => {
    // Yangi so'zning `repetitions` i 0, ya'ni zinapoyada faqat
    // "tanib olish" ochiq. Shu sababli birinchi darsdagi HAMMA savol
    // bir xil bo'lardi. Bosqich shu cheklovni seans ichida ochadi.
    const card = makeCard({ repetitions: 0 })

    const types = SEEDS.map((seed) =>
      pickExerciseType({
        card,
        pool: POOL,
        allowAudio: true,
        stage: 2,
        random: seededRandom(seed),
      }),
    )

    expect(types.every((type) => type === 'recognition')).toBe(false)
  })

  it('bosqich berilmasa xatti-harakat O‘ZGARMAYDI', () => {
    const type = pickExerciseType({
      card: makeCard({ repetitions: 0 }),
      pool: POOL,
      allowAudio: true,
      random: seededRandom(1),
    })

    expect(type).toBe('recognition')
  })
```

Va fayl OXIRIGA, barcha `describe` bloklaridan tashqarida:

```ts
describe('mashq identifikatori', () => {
  it('bosqichni ham o‘z ichiga oladi', () => {
    // Bir karta seansda bir necha marta chiqadi. Id bir xil qolsa,
    // React eski mashqni qayta ishlatib, kiritilgan javob va fokus
    // yangi savolga o'tib ketardi.
    const card = makeCard({ repetitions: 0 })

    const first = generateExercise({
      card,
      pool: POOL,
      allowAudio: false,
      stage: 0,
      random: seededRandom(1),
    })
    const second = generateExercise({
      card,
      pool: POOL,
      allowAudio: false,
      stage: 1,
      random: seededRandom(1),
    })

    expect(first.id).not.toBe(second.id)
  })
})
```

- [ ] **Step 2: Test yiqilishini tasdiqlang**

Run: `npx vitest run src/core/exercises/generate.test.ts`
Expected: FAIL — `stage` maydoni mavjud emas va id lar teng chiqadi

- [ ] **Step 3: `GenerateExerciseOptions` ga maydon qo'shing**

`src/core/exercises/generate.ts` da `GenerateExerciseOptions` ichiga, `random?: RandomSource` dan OLDIN:

```ts
  /**
   * Shu so'z seans ichida nechanchi marta chiqyapti (0 dan).
   *
   * Zinapoya `repetitions + stage` ga qaraydi, ya'ni qiyinlik SEANS
   * ICHIDA ko'tariladi. Kartaning o'z `repetitions` iga tegilmaydi:
   * u SM-2 jadvaliga tegishli va bir necha daqiqalik mashqdan
   * o'zgarmasligi kerak.
   */
  stage?: number
```

- [ ] **Step 4: `pickExerciseType` ni yangilang**

`src/core/exercises/generate.ts` da funksiyani to'liq almashtiring:

```ts
export function pickExerciseType(options: GenerateExerciseOptions): ExerciseType {
  const { card, stage = 0, random = Math.random } = options
  const effectiveRepetitions = card.repetitions + stage

  for (const step of DIFFICULTY_LADDER) {
    if (effectiveRepetitions < step.minRepetitions) continue

    const available = step.types.filter((type) => isTypeAvailable(type, options))
    if (available.length === 0) continue

    return available[Math.floor(random() * available.length)]
  }

  return 'recall'
}
```

- [ ] **Step 5: Mashq identifikatoriga bosqichni qo'shing**

`src/core/exercises/generate.ts` da `generateExercise` ning birinchi uch qatorini almashtiring:

```ts
export function generateExercise(options: GenerateExerciseOptions): Exercise {
  const { card, pool, stage = 0, random = Math.random } = options
  const type = pickExerciseType({ ...options, random })
  // Bosqich ham kiradi: bir karta seansda bir necha marta chiqadi va id
  // takrorlansa React eski mashq holatini yangisiga olib o'tardi
  const id = `${card.id}:${type}:${stage}`
```

- [ ] **Step 6: Testlar o'tishini tasdiqlang**

Run: `npx vitest run src/core/exercises/generate.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/core/exercises/generate.ts src/core/exercises/generate.test.ts
git commit -m "feat: mashq turi seans bosqichiga qarab qiyinlashadi"
```

---

### Task 3: Feedback panelida o'zgarmagan muddatni ko'rsatmaslik

**Files:**
- Modify: `src/features/session/FeedbackBar.tsx`
- Modify: `src/features/session/FeedbackBar.test.tsx`

**Interfaces:**
- Produces: `FeedbackBarProps.nextIntervalDays: number | null` — `null` bo'lsa "Keyingi takrorlash" qatori umuman chizilmaydi

- [ ] **Step 1: Yiqiladigan testni yozing**

Faylda `makeCard`, `exerciseFor` va `renderBar` yordamchilari allaqachon bor. `renderBar` ga uchinchi argument qo'shing:

```ts
function renderBar(
  card: CardRecord,
  verdict: 'correct' | 'wrong' = 'wrong',
  nextIntervalDays: number | null = 1,
) {
  return render(
    <FeedbackBar
      exercise={exerciseFor(card)}
      verdict={verdict}
      nextIntervalDays={nextIntervalDays}
      xpGained={2}
      goalJustCompleted={false}
      onContinue={() => {}}
    />,
  )
}
```

Qolgan qismi (agar `renderBar` da boshqa proplar bo'lsa) O'ZGARMAYDI — faqat `nextIntervalDays` parametrga aylanadi.

So'ng testni qo'shing:

```ts
  it('jadval o‘zgarmaganda "keyingi takrorlash" YOZILMAYDI', () => {
    // So'z shu seansda ikkinchi marta chiqqan — bu mashq, jadval esa
    // birinchi javobda allaqachon belgilangan. "Keyingi takrorlash: 6 kun"
    // deb yozish yolg'on bo'lardi: hech narsa o'zgarmadi.
    renderBar(makeCard(), 'correct', null)

    expect(screen.queryByText(/keyingi takrorlash/i)).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Test yiqilishini tasdiqlang**

Run: `npx vitest run src/features/session/FeedbackBar.test.tsx`
Expected: FAIL — matn hamon ko'rinadi (yoki TS `null` ni qabul qilmaydi)

- [ ] **Step 3: Prop tipini yangilang**

`src/features/session/FeedbackBar.tsx` da `FeedbackBarProps` ichida:

```ts
  /**
   * Javobdan keyingi yangi interval (kunlarda).
   *
   * `null` — jadval bu javobda O'ZGARMADI (so'z shu seansda ikkinchi
   * marta chiqqan). Unda qator umuman chizilmaydi: o'zgarmagan muddatni
   * "keyingi takrorlash" deb ko'rsatish foydalanuvchini chalg'itardi.
   */
  nextIntervalDays: number | null
```

- [ ] **Step 4: Qatorni shartli qiling**

`src/features/session/FeedbackBar.tsx` da:

```tsx
      {nextIntervalDays !== null && (
        <p className="text-xs font-semibold text-ink-600">
          Keyingi takrorlash: {formatInterval(nextIntervalDays)}
        </p>
      )}
```

- [ ] **Step 5: Testlar o'tishini tasdiqlang**

Run: `npx vitest run src/features/session/FeedbackBar.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/session/FeedbackBar.tsx src/features/session/FeedbackBar.test.tsx
git commit -m "feat: jadval o'zgarmaganda muddat ko'rsatilmaydi"
```

---

### Task 4: Seans yurituvchisini bosqichlarga o'tkazish

**Files:**
- Modify: `src/features/session/SessionRunner.tsx`
- Modify: `src/features/session/SessionRunner.test.tsx`

**Interfaces:**
- Consumes: `LessonStep`, `buildLessonQueue`, `MAX_LESSON_STEPS` (Task 1); `stage` (Task 2); `nextIntervalDays: number | null` (Task 3)
- Produces: `SessionRunnerProps` ga `stagesFor?: (card: CardRecord) => number` (sukut — hamma kartaga 1 marta)

- [ ] **Step 1: Yiqiladigan testni yozing**

`src/features/session/SessionRunner.test.tsx` ga qo'shing:

```ts
  it('bir so‘z seansda UCH marta chiqadi, lekin BIR marta baholanadi', async () => {
    await db.cards.clear()
    await addMissingCards([
      { word: 'hello', translation: 'salom', language: 'en', topic: 'Salomlashish', level: 'A1' },
    ])
    const cards = await getAllCards('en')

    render(
      <SessionRunner cards={cards} pool={cards} stagesFor={() => 3} onFinish={() => {}} />,
    )

    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/3')

    for (let step = 0; step < 3; step += 1) {
      const buttons = await screen.findAllByRole('button')
      const choice = buttons.find((button) => button.getAttribute('aria-pressed') !== null)
      if (choice) fireEvent.click(choice)

      const next = await screen.findByRole('button', { name: /davom|keyingi/i })
      fireEvent.click(next)
    }

    // SM-2 jadvali FAQAT birinchi javobda yangilanadi. Aks holda bitta
    // darsdan keyin interval 1 → 6 → 15 kunga sakrardi — holbuki so'z
    // ikki daqiqada uch marta ko'rilgan, bu uzoq xotira dalili emas.
    const saved = await db.cards.get(cards[0].id)
    expect(saved!.totalReviews).toBe(1)
  })
```

Agar shu faylda `db`, `addMissingCards`, `getAllCards`, `fireEvent` hali import qilinmagan bo'lsa, qo'shing:

```ts
import { fireEvent } from '@testing-library/react'
import { addMissingCards, db, getAllCards } from '@/core/db'
```

- [ ] **Step 2: Test yiqilishini tasdiqlang**

Run: `npx vitest run src/features/session/SessionRunner.test.tsx`
Expected: FAIL — `stagesFor` propi mavjud emas

- [ ] **Step 3: Navbatni `LessonStep[]` ga o'tkazing**

`src/features/session/SessionRunner.tsx` ga import qo'shing:

```ts
import { MAX_LESSON_STEPS, buildLessonQueue, type LessonStep } from '@/core/lesson/queue'
```

`SessionRunnerProps` ga maydon qo'shing:

```ts
  /**
   * Har karta seansda necha marta chiqishi. Sukut — bir marta.
   *
   * Dars ekrani yangi so'zlarga 3 beradi (so'z shu darsning O'ZIDA
   * mustahkamlanadi), takrorlash ekrani esa hech nima uzatmaydi — u
   * yerda maqsad o'rgatish emas, tekshirish.
   */
  stagesFor?: (card: CardRecord) => number
```

Funksiya imzosiga `stagesFor` ni qo'shing va holatni almashtiring:

```ts
export function SessionRunner({ cards, pool, stagesFor = () => 1, onFinish }: SessionRunnerProps) {
```

```ts
  const [queue, setQueue] = useState<LessonStep[]>(() => buildLessonQueue(cards, stagesFor))
```

- [ ] **Step 4: Mashq yaratish effektini yangilang**

`src/features/session/SessionRunner.tsx`:

```ts
  useEffect(() => {
    const step = queue[index]
    if (!step) {
      setExercise(null)
      return
    }

    setExercise(generateExercise({ card: step.card, pool, allowAudio, stage: step.stage }))
    setAnswer(EMPTY_ANSWER)
    setVerdict(null)
    setErrorMessage(null)
  }, [queue, index, pool, allowAudio])
```

- [ ] **Step 5: Baholashni birinchi javob bilan cheklang**

`src/features/session/SessionRunner.tsx` da, `finishedRef` e'lonining yonida:

```ts
  /**
   * Shu seansda SM-2 jadvali allaqachon yangilangan kartalar.
   *
   * So'z ikkinchi va uchinchi marta chiqqanda javob XP va aniqlikka
   * kiradi, lekin jadvalga tegmaydi: ikki daqiqa ichida uch marta
   * "esladim" deb hisoblash intervalni asossiz uzaytirardi.
   */
  const gradedRef = useRef(new Set<string>())
```

`nextIntervalDays` holatining tipini yangilang:

```ts
  const [nextIntervalDays, setNextIntervalDays] = useState<number | null>(1)
```

`handleSubmit` ichida `const saved = await gradeCard(exercise.card.id, grade)` qatorini almashtiring:

```ts
      const cardId = exercise.card.id
      const isFirstAnswer = !gradedRef.current.has(cardId)

      const saved = isFirstAnswer ? await gradeCard(cardId, grade) : null
      if (isFirstAnswer) gradedRef.current.add(cardId)
```

va o'sha funksiyadagi ikkita qatorni:

```ts
      setUpdatedCard(saved ?? exercise.card)
      setNextIntervalDays(saved ? saved.interval : null)
```

- [ ] **Step 6: Xato javobda qadamni O'SHA bosqichda qaytaring**

`handleContinue` ni to'liq almashtiring:

```ts
  const handleContinue = useCallback(() => {
    // Xato javob berilgan qadam seans oxiriga qaytariladi: darhol qayta
    // eslab chaqirish (retrieval practice) samaraliroq.
    //
    // Bosqich O'SHANDAYLIGICHA qoladi — foydalanuvchi uni hali o'tmadi,
    // keyingisiga ko'tarish qiyinlikni asossiz oshirardi.
    if (verdict === 'wrong') {
      const failed = queue[index]
      if (failed && queue.length < MAX_LESSON_STEPS) {
        setQueue((current) => [...current, failed])
      }
    }

    setIndex((current) => current + 1)
  }, [verdict, queue, index])
```

- [ ] **Step 7: Juft topishni ham qoidaga bo'ysundiring**

`handleMatchingComplete` ichidagi tsiklning boshini almashtiring:

```ts
      for (const { cardId, verdict } of results) {
        // Juft topish bir mashqda bir nechta kartani baholaydi, ya'ni
        // seansda allaqachon baholangan so'zni ikkinchi marta baholab
        // yuborishi mumkin — shuning uchun shu yerda ham tekshiriladi
        if (!gradedRef.current.has(cardId)) {
          gradedRef.current.add(cardId)
          try {
            await gradeCard(cardId, verdict === 'correct' ? 4 : 2)
          } catch (error) {
            // Bittasi saqlanmasa ham qolganlari yoziladi — butun juftlikni
            // bekor qilish foydalanuvchining mehnatini yo'qqa chiqarardi
            console.error('Juftlik bahosini saqlab bo‘lmadi:', error)
          }
        }
```

`recordAnswer` qismi O'ZGARMAYDI — XP har javob uchun beriladi.

- [ ] **Step 8: Testlar o'tishini tasdiqlang**

Run: `npx vitest run src/features/session`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/features/session/SessionRunner.tsx src/features/session/SessionRunner.test.tsx
git commit -m "feat: so'z bir seansda bir necha bosqichda uchraydi"
```

---

### Task 5: Ekranlarni ulash

**Files:**
- Modify: `src/features/lesson/LessonScreen.tsx`
- Modify: `src/features/lesson/LessonScreen.test.tsx`
- Modify: `src/features/review/ReviewScreen.tsx`

**Interfaces:**
- Consumes: `stagesFor` (Task 4)

- [ ] **Step 1: Mavjud testlarni yangi hajmga moslang**

`src/features/lesson/LessonScreen.test.tsx` da ikkita testni almashtiring:

```ts
  it('faqat o‘sha bo‘lim so‘zlarini beradi', async () => {
    renderLesson('/lesson/a1-oila')

    // "Oila" bo'limida ikkita YANGI so'z bor, har biri uch bosqichda
    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/6')
  })

  it('bo‘limsiz ochilganda butun to‘plamdan tanlaydi', async () => {
    renderLesson('/lesson')

    // Uchala so'z ham yangi: 3 × 3
    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/9')
  })
```

- [ ] **Step 2: Test yiqilishini tasdiqlang**

Run: `npx vitest run src/features/lesson/LessonScreen.test.tsx`
Expected: FAIL — hozircha `0/2` va `0/3`

- [ ] **Step 3: Dars ekranini yangilang**

`src/features/lesson/LessonScreen.tsx` da `const LESSON_SIZE = 5` qatorini almashtiring:

```ts
/**
 * Bir darsdagi TURLI so'zlar soni.
 *
 * 5 emas 4: har so'z endi uch bosqichda chiqadi (4 × 3 = 12 savol).
 * Til tanlash ekranidagi "kuniga 5 daqiqa" va'dasiga shu mos keladi.
 */
const LESSON_SIZE = 4

/**
 * Yangi so'z darsning O'ZIDA mustahkamlanadi — uch marta, har safar
 * qiyinroq turda. Allaqachon ko'rilgan so'z bir marta chiqadi: u
 * takrorlash jadvali bo'yicha baribir qaytadi.
 */
function lessonStages(card: CardRecord): number {
  return card.totalReviews === 0 ? 3 : 1
}
```

`SessionRunner` chaqiruviga `stagesFor={lessonStages}` qo'shing. `CardRecord` tipi shu faylda allaqachon import qilingan.

- [ ] **Step 4: Takrorlash ekraniga izoh qo'shing**

`src/features/review/ReviewScreen.tsx` da `<SessionRunner` qatoridan oldin:

```tsx
      {/*
        `stagesFor` UZATILMAYDI — takrorlashda har so'z bir marta chiqadi.
        Bu yerda maqsad o'rgatish emas, tekshirish: bir so'zni ketma-ket
        uch marta so'rash SM-2 o'lchovini buzardi.
      */}
```

Boshqa o'zgarish yo'q — sukut qiymati aynan shuni beradi.

- [ ] **Step 5: Testlar o'tishini tasdiqlang**

Run: `npx vitest run src/features/lesson src/features/review`
Expected: PASS

- [ ] **Step 6: To'liq tekshiruv**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm test -- --run > /tmp/t.log 2>&1; echo "EXIT=$?"; tail -4 /tmp/t.log
```
Expected: hammasi muvaffaqiyatli, `EXIT=0`

- [ ] **Step 7: Commit va push**

```bash
git add -A
git commit -m "feat: dars 4 ta so'zni uch bosqichda o'rgatadi"
git push
```

---

### Task 6: Jonli tekshiruv

**Files:** yo'q — faqat tekshiruv.

- [ ] **Step 1: Produksiya yangilanishini kuting**

```bash
for i in $(seq 1 9); do curl -s https://yodla-five.vercel.app/ | grep -o 'index-[A-Za-z0-9_-]*\.js'; sleep 20; done
```
Expected: fayl nomi o'zgaradi (yangi build chiqdi).

- [ ] **Step 2: Darsni ochib, savol turlari almashishini ko'ring**

Brauzer panelida `https://yodla-five.vercel.app/lesson` ni oching, har javobdan keyin sahifa matnini o'qing.

Expected: hisoblagich `0/12` dan boshlanadi va savol matni kamida ikki xil bo'ladi (masalan "Bu so'z nimani anglatadi?" va "Nima eshitdingiz?").

- [ ] **Step 3: Natijani hisobot qiling**

Ko'rilgan mashq turlarini va hisoblagichni ayting.

Agar HAMMA savol bir xil chiqsa — bu `stage` ning `generateExercise` ga yetib bormaganini bildiradi: Task 4, Step 4 dagi effektni tekshiring.
