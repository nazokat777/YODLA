# Talaffuzni tekshirish (mikrofon) — implementatsiya rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Foydalanuvchi so'zni mikrofonga aytadi, ilova uni tanidimi yoki yo'qmi darhol ko'rsatadi.

**Architecture:** Uch mustaqil qatlam — brauzer API qobig'i (`src/lib/recognition.ts`, Reactsiz), sof taqqoslash (`src/core/pronunciation/match.ts`, brauzersiz sinaladi) va ko'rinish (`PronounceButton.tsx`). Tugma mavjud 🔊 `SpeakButton` yonida turadi.

**Tech Stack:** Web Speech API (`SpeechRecognition`), React 19, TypeScript, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-18-pronunciation-design.md`

## Global Constraints

- **Yangi npm paketi QO'SHILMAYDI.** `@types/dom-speech-recognition` ham yo'q — kerakli interfeys `recognition.ts` ichida e'lon qilinadi.
- **SM-2 bahosiga ta'sir qilmaydi** (`gradeCard` chaqirilmaydi) va **XP berilmaydi** (`recordAnswer` chaqirilmaydi).
- **Izohlar o'zbek tilida**, mavjud uslubda: NIMA qilishini emas, NEGA shundayligini yozing.
- **`npm test | grep` ISHLATMANG** — quvur chiqish kodini yashiradi va qizil testlar bilan commit qilingan holat uch marta takrorlangan. Har doim: `npm test -- --run > /dev/null 2>&1; echo "TEST_EXIT=$?"`
- **`tsc --noEmit` yetarli emas** — `npm run build` (`tsc -b`) qo'shimcha qoidalarni (`erasableSyntaxOnly`, switch to'liqligi) qo'llaydi. Yakunda ikkalasi ham ishlatiladi.
- Til tegi `LANGUAGES[code].speechLocale` dan olinadi (`en-US`, `ru-RU`, `ar-SA`).

## File Structure

| Fayl | Mas'uliyat |
|---|---|
| `src/lib/recognition.ts` (yangi) | Brauzer `SpeechRecognition` qobig'i + mikrofon rad javobi bayrog'i |
| `src/lib/recognition.test.ts` (yangi) | Soxta `SpeechRecognition` bilan har bir natija turi |
| `src/core/pronunciation/match.ts` (yangi) | Sof taqqoslash |
| `src/core/pronunciation/index.ts` (yangi) | Re-eksport |
| `src/core/pronunciation/match.test.ts` (yangi) | Birlik testlari |
| `src/components/ui/PronounceButton.tsx` (yangi) | 🎤 tugma va uning holatlari |
| `src/components/ui/PronounceButton.test.tsx` (yangi) | Ko'rinish testlari |
| `src/features/session/ExerciseView.tsx` (o'zg.) | `recognition` mashqi prompti yoniga 🎤 |
| `src/features/session/FeedbackBar.tsx` (o'zg.) | Javobdan keyin to'g'ri so'z yoniga 🎤 |
| `README.md` (o'zg.) | Papka tuzilmasi |

---

### Task 1: `recognition.ts` — brauzer qobig'i

**Files:**
- Create: `src/lib/recognition.ts`
- Test: `src/lib/recognition.test.ts`

**Interfaces:**
- Consumes: hech nima
- Produces:
  ```ts
  isRecognitionSupported(): boolean
  type RecognitionOutcome =
    | { status: 'heard'; alternatives: string[] }
    | { status: 'no-speech' }
    | { status: 'denied' }
    | { status: 'failed' }
  listenOnce(locale: string, timeoutMs?: number): Promise<RecognitionOutcome>
  isMicBlocked(): boolean
  resetMicBlock(): void
  ```

- [ ] **Step 1: Failing testni yozish**

`src/lib/recognition.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  isMicBlocked,
  isRecognitionSupported,
  listenOnce,
  resetMicBlock,
} from './recognition'

/** Soxta SpeechRecognition — testlar uni qo'lda boshqaradi */
class FakeRecognition {
  static last: FakeRecognition | null = null

  lang = ''
  maxAlternatives = 1
  interimResults = false
  continuous = false
  onresult: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onend: (() => void) | null = null

  constructor() {
    FakeRecognition.last = this
  }

  start() {}

  abort() {
    this.onend?.()
  }

  /** Brauzer natija qaytargandek qilish */
  emitResult(transcripts: string[]) {
    const alternatives = transcripts.map((transcript) => ({ transcript }))
    this.onresult?.({
      results: [Object.assign(alternatives, { length: alternatives.length })],
    })
    this.onend?.()
  }

  emitError(error: string) {
    this.onerror?.({ error })
    this.onend?.()
  }
}

declare global {
  interface Window {
    SpeechRecognition?: unknown
  }
}

beforeEach(() => {
  resetMicBlock()
  FakeRecognition.last = null
  window.SpeechRecognition = FakeRecognition
})

afterEach(() => {
  delete window.SpeechRecognition
})

describe('isRecognitionSupported', () => {
  it('konstruktor bor bo‘lsa true', () => {
    expect(isRecognitionSupported()).toBe(true)
  })

  it('konstruktor yo‘q bo‘lsa false', () => {
    delete window.SpeechRecognition
    expect(isRecognitionSupported()).toBe(false)
  })
})

describe('listenOnce', () => {
  it('eshitilgan variantlarni qaytaradi', async () => {
    const promise = listenOnce('en-US')
    FakeRecognition.last?.emitResult(['water', 'waiter'])

    await expect(promise).resolves.toEqual({
      status: 'heard',
      alternatives: ['water', 'waiter'],
    })
  })

  it('berilgan lokalni o‘rnatadi va bir nechta variant so‘raydi', async () => {
    const promise = listenOnce('ar-SA')

    expect(FakeRecognition.last?.lang).toBe('ar-SA')
    expect(FakeRecognition.last?.maxAlternatives).toBeGreaterThan(1)

    FakeRecognition.last?.emitResult(['ماء'])
    await promise
  })

  it('ruxsat berilmasa denied qaytaradi va bayroqni yoqadi', async () => {
    const promise = listenOnce('en-US')
    FakeRecognition.last?.emitError('not-allowed')

    await expect(promise).resolves.toEqual({ status: 'denied' })
    expect(isMicBlocked()).toBe(true)
  })

  it('ovoz eshitilmasa no-speech qaytaradi', async () => {
    const promise = listenOnce('en-US')
    FakeRecognition.last?.emitError('no-speech')

    await expect(promise).resolves.toEqual({ status: 'no-speech' })
    expect(isMicBlocked()).toBe(false)
  })

  it('tarmoq xatosida failed qaytaradi', async () => {
    const promise = listenOnce('en-US')
    FakeRecognition.last?.emitError('network')

    await expect(promise).resolves.toEqual({ status: 'failed' })
  })

  it('natijasiz tugasa no-speech qaytaradi', async () => {
    const promise = listenOnce('en-US')
    FakeRecognition.last?.onend?.()

    await expect(promise).resolves.toEqual({ status: 'no-speech' })
  })

  it('qo‘llab-quvvatlanmasa failed qaytaradi', async () => {
    delete window.SpeechRecognition
    await expect(listenOnce('en-US')).resolves.toEqual({ status: 'failed' })
  })
})
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishiga ishonch hosil qilish**

Run: `npx vitest run src/lib/recognition.test.ts`
Expected: FAIL — `Failed to resolve import "./recognition"`

- [ ] **Step 3: Implementatsiyani yozish**

`src/lib/recognition.ts`:

```ts
/**
 * Nutqni tanish (Web Speech API — SpeechRecognition).
 *
 * DIQQAT — bu SpeechSynthesis EMAS. Chrome/Edge da audio Google serveriga
 * yuboriladi, ya'ni INTERNET SHART. Firefox da API umuman yo'q. Shuning
 * uchun bu yerda "qo'llab-quvvatlanmasa jim yiqilish" emas, ochiq holat
 * qaytariladi: chaqiruvchi tugmani umuman ko'rsatmasligi kerak.
 */

/* --- Brauzer tiplari ---------------------------------------------------
 * `@types/dom-speech-recognition` paketini qo'shmaymiz: bizga interfeysning
 * arzimas qismi kerak, loyihaning bog'liqliklari esa yengil qolgani ma'qul.
 */

interface SpeechAlternativeLike {
  transcript: string
}

interface SpeechResultLike {
  readonly length: number
  [index: number]: SpeechAlternativeLike
}

interface SpeechResultListLike {
  readonly length: number
  [index: number]: SpeechResultLike
}

interface SpeechResultEventLike {
  results: SpeechResultListLike
}

interface SpeechErrorEventLike {
  error: string
}

interface RecognitionLike {
  lang: string
  maxAlternatives: number
  interimResults: boolean
  continuous: boolean
  start(): void
  abort(): void
  onresult: ((event: SpeechResultEventLike) => void) | null
  onerror: ((event: SpeechErrorEventLike) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => RecognitionLike

/** Nechta variant so'raladi — "yumshoq" taqqoslash uchun bittasi kam */
const MAX_ALTERNATIVES = 5

/** Tinglash shuncha vaqtdan keyin majburan to'xtaydi */
const DEFAULT_TIMEOUT_MS = 5000

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null

  const scope = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }

  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

/** Brauzerda nutqni tanish bormi */
export function isRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null
}

/**
 * Mikrofonga ruxsat rad etilganmi.
 *
 * NEGA MODUL DARAJASIDA: rad javobidan keyin har bosishda tizim oynasini
 * qayta ochishga urinish bezor qiladi va baribir natija bermaydi —
 * brauzer taqiqni eslab qoladi. Bayroq shu seans davomida yashaydi.
 */
let micBlocked = false

export function isMicBlocked(): boolean {
  return micBlocked
}

/** Testlar uchun boshlang'ich holatga qaytarish */
export function resetMicBlock(): void {
  micBlocked = false
}

export type RecognitionOutcome =
  | { status: 'heard'; alternatives: string[] }
  | { status: 'no-speech' }
  | { status: 'denied' }
  | { status: 'failed' }

/**
 * Bir marta tinglab, eshitilgan variantlarni qaytarish.
 *
 * Natija HECH QACHON istisno tashlamaydi — har bir nosozlik alohida holat
 * bo'lib qaytadi, chunki foydalanuvchiga "mikrofonga ruxsat bering" va
 * "internet yo'q" butunlay boshqa xabarlar bo'lishi kerak.
 */
export function listenOnce(
  locale: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<RecognitionOutcome> {
  const Ctor = getRecognitionCtor()
  if (!Ctor) return Promise.resolve({ status: 'failed' })

  return new Promise<RecognitionOutcome>((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    /** Birinchi natija g'olib: `onend` har doim `onresult`dan keyin keladi */
    function finish(outcome: RecognitionOutcome) {
      if (settled) return
      settled = true
      if (timer !== undefined) clearTimeout(timer)
      resolve(outcome)
    }

    let recognition: RecognitionLike
    try {
      recognition = new Ctor()
    } catch (error) {
      console.error('Nutqni tanishni boshlab bo‘lmadi:', error)
      finish({ status: 'failed' })
      return
    }

    recognition.lang = locale
    recognition.maxAlternatives = MAX_ALTERNATIVES
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (event) => {
      const result = event.results[0]
      if (!result) {
        finish({ status: 'no-speech' })
        return
      }

      const alternatives: string[] = []
      for (let index = 0; index < result.length; index += 1) {
        const transcript = result[index]?.transcript
        if (transcript) alternatives.push(transcript)
      }

      finish(
        alternatives.length > 0
          ? { status: 'heard', alternatives }
          : { status: 'no-speech' },
      )
    }

    recognition.onerror = (event) => {
      // Ruxsat rad etilishi — yagona QAYTMAYDIGAN xato, qolganlari vaqtinchalik
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        micBlocked = true
        finish({ status: 'denied' })
        return
      }

      if (event.error === 'no-speech' || event.error === 'aborted') {
        finish({ status: 'no-speech' })
        return
      }

      finish({ status: 'failed' })
    }

    // Natijasiz tugadi — odatda foydalanuvchi indamadi
    recognition.onend = () => finish({ status: 'no-speech' })

    timer = setTimeout(() => {
      recognition.abort()
      finish({ status: 'no-speech' })
    }, timeoutMs)

    try {
      recognition.start()
    } catch (error) {
      console.error('Tinglashni boshlab bo‘lmadi:', error)
      finish({ status: 'failed' })
    }
  })
}
```

- [ ] **Step 4: Testlar o'tishini tekshirish**

Run: `npx vitest run src/lib/recognition.test.ts`
Expected: PASS (9 test)

- [ ] **Step 5: Commit**

```bash
git add src/lib/recognition.ts src/lib/recognition.test.ts
git commit -m "feat: nutqni tanish qobig'i (Web Speech API)"
```

---

### Task 2: `match.ts` — sof taqqoslash

**Files:**
- Create: `src/core/pronunciation/match.ts`, `src/core/pronunciation/index.ts`
- Test: `src/core/pronunciation/match.test.ts`

**Interfaces:**
- Consumes: `normalizeAnswer`, `editDistance`, `typoTolerance` — `@/core/exercises`
- Produces: `matchesSpoken(expected: string, alternatives: string[], language: LanguageCode): boolean`

**Kontekst:** `typoTolerance` qisqa so'zlarda 0 qaytaradi (≤3 harf), 4–7 harfda 1, undan uzunda 2. Ya'ni qisqa so'z aniq mos kelishi kerak — bu ataylab.

- [ ] **Step 1: Failing testni yozish**

`src/core/pronunciation/match.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { matchesSpoken } from './match'

describe('matchesSpoken', () => {
  it('aniq mos kelganda true', () => {
    expect(matchesSpoken('water', ['water'], 'en')).toBe(true)
  })

  it('katta harf va nuqtani hisobga olmaydi', () => {
    expect(matchesSpoken('water', ['Water.'], 'en')).toBe(true)
  })

  it('birinchisi noto‘g‘ri, keyingisi to‘g‘ri bo‘lsa ham true', () => {
    expect(matchesSpoken('water', ['waiter', 'water'], 'en')).toBe(true)
  })

  it('uzun so‘zda bitta harf farqiga yo‘l qo‘yadi', () => {
    expect(matchesSpoken('brother', ['brothers'], 'en')).toBe(true)
  })

  it('mutlaqo boshqa so‘zda false', () => {
    expect(matchesSpoken('water', ['bread'], 'en')).toBe(false)
  })

  it('bo‘sh ro‘yxatda false', () => {
    expect(matchesSpoken('water', [], 'en')).toBe(false)
  })

  it('bo‘sh matnli variantda false', () => {
    expect(matchesSpoken('water', ['   '], 'en')).toBe(false)
  })

  it('arab harakatlari farq qilsa ham true', () => {
    expect(matchesSpoken('كِتَاب', ['كتاب'], 'ar')).toBe(true)
  })

  it('ruscha ё va е farqini kechiradi', () => {
    expect(matchesSpoken('ёлка', ['елка'], 'ru')).toBe(true)
  })

  it('qisqa so‘zda bitta harf farqi yetarli emas', () => {
    // typoTolerance(3) === 0 — qisqa so'zda har harf ma'noni o'zgartiradi
    expect(matchesSpoken('cat', ['cut'], 'en')).toBe(false)
  })
})
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishiga ishonch hosil qilish**

Run: `npx vitest run src/core/pronunciation/match.test.ts`
Expected: FAIL — `Failed to resolve import "./match"`

- [ ] **Step 3: Implementatsiyani yozish**

`src/core/pronunciation/match.ts`:

```ts
import { editDistance, normalizeAnswer, typoTolerance } from '@/core/exercises'
import type { LanguageCode } from '@/core/types'

/**
 * Aytilgan so'z kutilganiga mos keldimi.
 *
 * QOIDA ATAYLAB YUMSHOQ. Brauzer bir nechta variant qaytaradi va ularning
 * BIRORTASI mos kelsa yetarli, ustiga kichik imlo farqi ham kechiriladi.
 *
 * Nega: bu mashqning maqsadi — gapirishga jur'at berish, imtihon olish
 * emas. Nohaq ❌ foydalanuvchini mikrofondan butunlay voz kechishga
 * majbur qiladi; ortiqcha ✅ esa hech kimga ziyon qilmaydi, chunki natija
 * na SM-2 jadvaliga, na XP ga ta'sir qilmaydi.
 *
 * Taqqoslash uchun MAVJUD `normalizeAnswer` ishlatiladi — u arab
 * harakatlarini va rus "ё" harfini allaqachon to'g'ri tozalaydi.
 */
export function matchesSpoken(
  expected: string,
  alternatives: string[],
  language: LanguageCode,
): boolean {
  const target = normalizeAnswer(expected, language)
  if (target.length === 0) return false

  const tolerance = typoTolerance(target.length)

  return alternatives.some((alternative) => {
    const heard = normalizeAnswer(alternative, language)
    if (heard.length === 0) return false
    if (heard === target) return true

    return editDistance(heard, target) <= tolerance
  })
}
```

`src/core/pronunciation/index.ts`:

```ts
export * from './match'
```

- [ ] **Step 4: Testlar o'tishini tekshirish**

Run: `npx vitest run src/core/pronunciation/match.test.ts`
Expected: PASS (10 test)

Agar `ёлка` testi yiqilsa — `normalizeRussian` ni tekshiring (`src/core/exercises/normalize.ts`), testni emas: bu haqiqiy talab.

- [ ] **Step 5: Commit**

```bash
git add src/core/pronunciation
git commit -m "feat: aytilgan so'zni kutilgani bilan solishtirish"
```

---

### Task 3: `PronounceButton` — ko'rinish

**Files:**
- Create: `src/components/ui/PronounceButton.tsx`
- Test: `src/components/ui/PronounceButton.test.tsx`

**Interfaces:**
- Consumes: `listenOnce`, `isRecognitionSupported`, `isMicBlocked`, `resetMicBlock` (Task 1); `matchesSpoken` (Task 2)
- Produces: `<PronounceButton text={string} locale={string} language={LanguageCode} className?={string} />`

- [ ] **Step 1: Failing testni yozish**

`src/components/ui/PronounceButton.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PronounceButton } from './PronounceButton'
import * as recognition from '@/lib/recognition'

function renderButton() {
  return render(<PronounceButton text="water" locale="en-US" language="en" />)
}

function micButton() {
  return screen.getByRole('button', { name: /talaffuzni tekshirish/i })
}

beforeEach(() => {
  recognition.resetMicBlock()
  vi.spyOn(recognition, 'isRecognitionSupported').mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PronounceButton', () => {
  it('brauzer qo‘llab-quvvatlamasa umuman chizilmaydi', () => {
    vi.spyOn(recognition, 'isRecognitionSupported').mockReturnValue(false)
    const { container } = renderButton()

    expect(container).toBeEmptyDOMElement()
  })

  it('to‘g‘ri aytilganda tasdiq ko‘rsatiladi', async () => {
    vi.spyOn(recognition, 'listenOnce').mockResolvedValue({
      status: 'heard',
      alternatives: ['water'],
    })

    renderButton()
    await userEvent.click(micButton())

    expect(await screen.findByText(/to‘g‘ri talaffuz/i)).toBeInTheDocument()
  })

  it('noto‘g‘ri aytilganda eshitilgan so‘z ko‘rsatiladi', async () => {
    vi.spyOn(recognition, 'listenOnce').mockResolvedValue({
      status: 'heard',
      alternatives: ['waiter'],
    })

    renderButton()
    await userEvent.click(micButton())

    expect(await screen.findByText(/waiter/)).toBeInTheDocument()
  })

  it('ruxsat rad etilsa tushuntirish chiqadi va tugma o‘chadi', async () => {
    vi.spyOn(recognition, 'listenOnce').mockResolvedValue({ status: 'denied' })

    renderButton()
    await userEvent.click(micButton())

    expect(await screen.findByText(/ruxsat/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(micButton()).toBeDisabled()
    })
  })

  it('ovoz eshitilmasa qayta urinishga chaqiradi', async () => {
    vi.spyOn(recognition, 'listenOnce').mockResolvedValue({ status: 'no-speech' })

    renderButton()
    await userEvent.click(micButton())

    expect(await screen.findByText(/eshitilmadi/i)).toBeInTheDocument()
  })

  it('xatolikda internet haqida ogohlantiradi', async () => {
    vi.spyOn(recognition, 'listenOnce').mockResolvedValue({ status: 'failed' })

    renderButton()
    await userEvent.click(micButton())

    expect(await screen.findByText(/internet/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishiga ishonch hosil qilish**

Run: `npx vitest run src/components/ui/PronounceButton.test.tsx`
Expected: FAIL — `Failed to resolve import "./PronounceButton"`

- [ ] **Step 3: Implementatsiyani yozish**

`src/components/ui/PronounceButton.tsx`:

```tsx
import { useState } from 'react'
import { matchesSpoken } from '@/core/pronunciation'
import type { LanguageCode } from '@/core/types'
import { cn } from '@/lib/cn'
import { isMicBlocked, isRecognitionSupported, listenOnce } from '@/lib/recognition'

interface PronounceButtonProps {
  /** Aytilishi kutilayotgan so'z — o'rganilayotgan tilda */
  text: string
  /** Web Speech API til tegi, masalan "ar-SA" */
  locale: string
  language: LanguageCode
  className?: string
}

/** Bosilgandan keyingi holat */
type Feedback =
  | { kind: 'ok' }
  | { kind: 'miss'; heard: string }
  | { kind: 'no-speech' }
  | { kind: 'denied' }
  | { kind: 'failed' }

const MESSAGE: Record<Exclude<Feedback['kind'], 'miss'>, string> = {
  ok: '✅ To‘g‘ri talaffuz!',
  'no-speech': 'Ovoz eshitilmadi — yana urinib ko‘ring.',
  denied: 'Mikrofonga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering.',
  failed: 'Tekshirib bo‘lmadi — internet aloqasini tekshiring.',
}

/**
 * Talaffuzni mikrofon orqali tekshirish.
 *
 * Natija SM-2 jadvaliga ham, XP ga ham TA'SIR QILMAYDI: nutq tanish xatosi
 * (shovqin, aksent, sekin internet) o'rganish rejasini buzmasligi kerak.
 *
 * Tugma qo'llab-quvvatlanmagan brauzerda va oflaynda UMUMAN chizilmaydi —
 * bosilganda hech nima qilmaydigan tugma foydalanuvchini chalg'itadi
 * (`SpeakButton` dagi qoidaning aynan o'zi).
 */
export function PronounceButton({
  text,
  locale,
  language,
  className,
}: PronounceButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [blocked, setBlocked] = useState(() => isMicBlocked())

  // Bir marta hisoblanadi: brauzer imkoniyati seans davomida o'zgarmaydi.
  // Oflayn holat esa o'zgarishi mumkin — lekin unda `listenOnce` "failed"
  // qaytaradi va foydalanuvchi sababini o'qiydi.
  const [supported] = useState(
    () =>
      isRecognitionSupported() &&
      (typeof navigator === 'undefined' || navigator.onLine),
  )

  async function handleClick() {
    if (isListening || blocked) return

    setFeedback(null)
    setIsListening(true)

    const outcome = await listenOnce(locale)

    setIsListening(false)

    switch (outcome.status) {
      case 'heard':
        setFeedback(
          matchesSpoken(text, outcome.alternatives, language)
            ? { kind: 'ok' }
            : { kind: 'miss', heard: outcome.alternatives[0] },
        )
        break
      case 'denied':
        // Tugma shu seansda o'chadi: har bosishda tizim oynasini qayta
        // ochishga urinish bezor qiladi va baribir natija bermaydi
        setBlocked(true)
        setFeedback({ kind: 'denied' })
        break
      default:
        setFeedback({ kind: outcome.status })
    }
  }

  if (!supported) return null

  return (
    <span className={cn('flex flex-col items-start gap-1', className)}>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={blocked}
        aria-label="Talaffuzni tekshirish"
        className={cn(
          'tap-highlight-none flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl transition-colors',
          isListening
            ? 'animate-pulse bg-flame-500/20 text-flame-600'
            : 'text-ink-600 hover:bg-brand-50 hover:text-brand-700',
          blocked && 'opacity-40',
        )}
      >
        <span aria-hidden="true">🎤</span>
      </button>

      {isListening && (
        <span className="text-xs font-semibold text-flame-600">Tinglayapman…</span>
      )}

      {/*
        Natija `role="status"` bilan e'lon qilinadi: fokus tugmada qoladi,
        matn esa pastda paydo bo'ladi va ekran o'quvchi uni o'qiydi.
      */}
      {!isListening && feedback && (
        <span
          role="status"
          className={cn(
            'text-xs font-semibold',
            feedback.kind === 'ok' ? 'text-brand-700' : 'text-ink-600',
          )}
        >
          {feedback.kind === 'miss'
            ? `“${feedback.heard}” deb eshitildi`
            : MESSAGE[feedback.kind]}
        </span>
      )}
    </span>
  )
}
```

**Diqqat:** `if (!supported) return null` hook'lardan KEYIN turadi — React
hook'lari shartli chaqirilmasligi kerak (`react-hooks/rules-of-hooks`).

- [ ] **Step 4: Testlar o'tishini tekshirish**

Run: `npx vitest run src/components/ui/PronounceButton.test.tsx`
Expected: PASS (6 test)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/PronounceButton.tsx src/components/ui/PronounceButton.test.tsx
git commit -m "feat: talaffuzni mikrofon orqali tekshirish tugmasi"
```

---

### Task 4: Seansga ulash + yakuniy tekshiruv

**Files:**
- Modify: `src/features/session/ExerciseView.tsx` (`recognition` tarmog'i, ~40–46-qator)
- Modify: `src/features/session/FeedbackBar.tsx` (`speakButton` yordamchisi, ~137-qator)
- Modify: `README.md`
- Test: `src/features/session/FeedbackBar.test.tsx` (mavjud faylga qo'shiladi)

**Interfaces:**
- Consumes: `<PronounceButton>` (Task 3)

**MUHIM kontekst — nega IKKI joy:** `FeedbackBar` to'g'ri javobdan keyin **900 ms** da yopiladi (`AUTO_ADVANCE_MS`, `SessionRunner.tsx`) va to'g'ri javobda so'zning o'zi umuman ko'rsatilmaydi. Ya'ni faqat `FeedbackBar` ga qo'yilsa, mikrofon faqat XATO javobdan keyin ishlardi. Shuning uchun tugma `recognition` mashqining prompti yoniga ham qo'yiladi — u yerda so'z javob berilishidan oldin ham ko'rinadi va hech narsani oshkor qilmaydi (savol "bu so'z nimani anglatadi?", javob esa tarjima).

Boshqa mashq turlarining promptiga QO'YILMAYDI: `recall` da so'zning o'zi javob, `listening` da esa uni ko'rsatish mashqni buzadi.

- [ ] **Step 1: Failing testni yozish**

`src/features/session/FeedbackBar.test.tsx` fayli boshiga qo'shing (agar `vi` allaqachon import qilingan bo'lsa, ikkinchi marta qo'shmang):

```tsx
import { vi } from 'vitest'
import * as recognition from '@/lib/recognition'
```

Fayl oxiriga qo'shing:

```tsx
it('xato javobdan keyin talaffuzni tekshirish tugmasi chiqadi', () => {
  vi.spyOn(recognition, 'isRecognitionSupported').mockReturnValue(true)

  render(
    <FeedbackBar
      exercise={recallExercise}
      verdict="wrong"
      nextIntervalDays={1}
      xpGained={2}
      goalJustCompleted={false}
      onContinue={() => {}}
    />,
  )

  expect(
    screen.getByRole('button', { name: /talaffuzni tekshirish/i }),
  ).toBeInTheDocument()
})
```

`recallExercise` — shu fayldagi mavjud yordamchi mashq obyekti. Agar nomi boshqacha bo'lsa, `recall` turidagi mavjudini ishlating: uning javobi o'rganilayotgan tilda bo'ladi (`answer.isTarget === true`), tugma esa faqat o'sha holatda chiziladi.

- [ ] **Step 2: Testni ishga tushirib, yiqilishiga ishonch hosil qilish**

Run: `npx vitest run src/features/session/FeedbackBar.test.tsx`
Expected: FAIL — "Unable to find an accessible element with the role button and name /talaffuzni tekshirish/i"

- [ ] **Step 3: `FeedbackBar` ga ulash**

Importlarga qo'shing:

```tsx
import { PronounceButton } from '@/components/ui/PronounceButton'
```

`speakButton` yordamchisini quyidagi bilan ALMASHTIRING (eskisini o'chirmang — pastda kontekst satri uchun kerak; ikkalasi ham qoladi):

```tsx
  /** Talaffuz tugmasi — faqat o'rganilayotgan tildagi matn uchun */
  const speakButton = (text: string) => (
    <SpeakButton text={text} locale={language.speechLocale} />
  )

  /**
   * Javob satri uchun ikkala ovoz tugmasi.
   *
   * Tartib ataylab shunday: avval NAMUNANI eshitish, keyin O'ZI aytib
   * ko'rish. Teskarisi mantiqsiz bo'lardi.
   *
   * Faqat javob satrida ishlatiladi: bitta panelda ikkita mikrofon tugmasi
   * "qaysi birini aytishim kerak?" degan savolni tug'dirardi.
   */
  const audioButtons = (text: string) => (
    <>
      {speakButton(text)}
      <PronounceButton
        text={text}
        locale={language.speechLocale}
        language={language.code}
      />
    </>
  )
```

Javob satridagi chaqiruvni almashtiring:

```tsx
            {answer.isTarget && audioButtons(answer.text)}
```

Kontekst satridagi `{context.isTarget && speakButton(context.text)}` **o'zgarishsiz qoladi**.

- [ ] **Step 4: `ExerciseView` ga ulash**

Importlarga qo'shing:

```tsx
import { PronounceButton } from '@/components/ui/PronounceButton'
```

`recognition` tarmog'idagi `<SpeakButton …size="lg" />` qatorini quyidagi bilan almashtiring:

```tsx
            <div className="flex items-center gap-2">
              <SpeakButton
                text={exercise.prompt}
                locale={language.speechLocale}
                size="lg"
              />
              {/*
                So'z bu yerda savolning O'ZI — uni aytib ko'rish javobni
                (tarjimani) oshkor qilmaydi. Boshqa mashq turlarida bunday
                emas, shuning uchun tugma faqat shu yerda.
              */}
              <PronounceButton
                text={exercise.prompt}
                locale={language.speechLocale}
                language={language.code}
              />
            </div>
```

- [ ] **Step 5: Testlar o'tishini tekshirish**

```bash
npm test -- --run > /dev/null 2>&1; echo "TEST_EXIT=$?"
```
Expected: `TEST_EXIT=0`

- [ ] **Step 6: README yangilash**

`README.md` dagi papka tuzilmasida `core/` bo'limiga qo'shing:

```
│   ├── pronunciation/    # aytilgan so'zni kutilgani bilan solishtirish
```

- [ ] **Step 7: Yakuniy tekshiruv**

```bash
npm run lint
npx tsc --noEmit && echo "tsc ok"
npm test -- --run > /dev/null 2>&1; echo "TEST_EXIT=$?"
npm run build > /dev/null 2>&1; echo "BUILD_EXIT=$?"
```
Expected: lint toza, `tsc ok`, `TEST_EXIT=0`, `BUILD_EXIT=0`

- [ ] **Step 8: Brauzerda tirik tekshiruv**

`preview_start` bilan dev serverni oching va tasdiqlang:
1. `/review` da tanib olish mashqida so'z yonida 🔊 bilan birga 🎤 bor.
2. 🎤 bosing — brauzer mikrofon so'raydi, "Tinglayapman…" chiqadi.
3. Ruxsatni RAD ETING — "Mikrofonga ruxsat berilmadi" chiqadi va tugma o'chadi.
4. Xato javob bering — feedback panelida ham 🎤 bor.
5. Konsolda kutilmagan xato yo'q.

**Tekshirib bo'lmaydi:** haqiqiy ovoz bilan tanish aniqligi — buni foydalanuvchi sinaydi.

- [ ] **Step 9: Commit va push**

```bash
git add -A
git commit -m "feat: seansda talaffuzni mikrofon orqali tekshirish"
git push
```
