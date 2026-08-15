# Mnemonika: yozish, tahrirlash, boshqarish — amalga oshirish rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mnemonikani istalgan paytda yozish, tahrirlash va o'chirish imkonini berish.

**Architecture:** Ma'lumot qatlamiga bitta so'rov qo'shiladi (`getMnemonicCards`). `FeedbackBar` dagi bitta shart olib tashlanib, tahrirlash ochiladi. Yangi `/mnemonics` ekrani barcha assotsiatsiyalarni ro'yxat qilib, qidiruv orqali istalgan so'zga yangisini qo'shishga ruxsat beradi.

**Tech Stack:** React 19 + TypeScript, Dexie (IndexedDB), React Router v7, Vitest + Testing Library, Tailwind v4.

**Spec:** [docs/superpowers/specs/2026-08-15-mnemonics-design.md](../specs/2026-08-15-mnemonics-design.md)

## Global Constraints

- **Yangi npm bog'liqligi qo'shilmaydi.**
- Kod izohlari va UI matni — **o'zbek tilida**.
- TDD: har task tushadigan test bilan boshlanadi; commit oldidan `npm test` to'liq o'tishi shart (**bazaviy holat: 519 test**).
- `setMnemonic` **o'zgarmaydi** — bo'sh satr mnemonikani o'chiradi, bu allaqachon shunday.
- Mnemonika **mashq paytida ko'rsatilmaydi** (javobni oshkor qilardi) va **to'g'ri javob oqimiga tegilmaydi** (`AUTO_ADVANCE_MS = 900`).
- Qidiruv **xotirada** bajariladi; natijalar **50 ta** bilan cheklanadi va cheklov foydalanuvchiga ochiq yoziladi.
- Chiqish kodini quvur (`|`) yashiradi — tekshiruvda `${PIPESTATUS[0]}` ishlating yoki chiqishni faylga yo'naltiring.

## Fayl xaritasi

| Fayl | Mas'uliyati |
| ---- | ----------- |
| `src/core/db/cards.repo.ts` | `getMnemonicCards(language)` so'rovi |
| `src/app/paths.ts` | `mnemonics: '/mnemonics'` |
| `src/app/App.tsx` | marshrutni `AppShell` ichiga ulash |
| `src/features/session/FeedbackBar.tsx` | tahrirlash tugmasi + `initialValue` |
| `src/features/mnemonics/MnemonicRow.tsx` | bitta qator: ko'rsatish ↔ tahrirlash |
| `src/features/mnemonics/MnemonicsScreen.tsx` | ro'yxat + qidiruv |
| `src/features/profile/ProfileScreen.tsx` | ekranga havola |

---

### Task 1: `getMnemonicCards` so'rovi

**Files:**
- Modify: `src/core/db/cards.repo.ts` (`getAllCards` dan keyin, ~210-qator)
- Test: `src/core/db/cards.repo.test.ts`

**Interfaces:**
- Consumes: `db.cards`, `CardRecord`, `LanguageCode` (fayl boshida allaqachon import qilingan)
- Produces: `getMnemonicCards(language: LanguageCode): Promise<CardRecord[]>` — mnemonikasi bor kartalar, `word` bo'yicha alifbo tartibida

- [ ] **Step 1: Tushadigan testni yozish**

`src/core/db/cards.repo.test.ts` oxiriga qo'shing:

```ts
describe('getMnemonicCards', () => {
  it('faqat mnemonikasi BOR kartalarni qaytaradi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    await setMnemonic('en:water', 'vatanimda suv toza')

    const cards = await getMnemonicCards('en')

    expect(cards.map((card) => card.id)).toEqual(['en:water'])
  })

  it('boshqa tilning kartalarini aralashtirmaydi', async () => {
    await addMissingCards([...EN_WORDS, ...RU_WORDS], NOW)
    await setMnemonic('en:water', 'suv haqida')
    await setMnemonic('ru:привет', 'salom haqida')

    expect((await getMnemonicCards('ru')).map((card) => card.id)).toEqual(['ru:привет'])
  })

  it('so‘z bo‘yicha alifbo tartibida keladi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    await setMnemonic('en:water', 'b')
    await setMnemonic('en:book', 'a')

    expect((await getMnemonicCards('en')).map((card) => card.word)).toEqual(['book', 'water'])
  })

  it('mnemonika o‘chirilgach ro‘yxatdan chiqadi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    await setMnemonic('en:water', 'vaqtinchalik')
    await setMnemonic('en:water', '')

    expect(await getMnemonicCards('en')).toEqual([])
  })
})
```

Test fayli boshidagi import ro'yxatiga `getMnemonicCards` va `setMnemonic` ni qo'shing (alifbo tartibida, `getLanguageStats` va `gradeCard` orasiga):

```ts
  getMnemonicCards,
  setMnemonic,
```

- [ ] **Step 2: Testni yugurtirib, tushishini tekshirish**

```bash
npx vitest run src/core/db/cards.repo.test.ts
```

Expected: FAIL — `getMnemonicCards is not a function`.

- [ ] **Step 3: So'rovni yozish**

`src/core/db/cards.repo.ts` da `getAllCards` funksiyasidan keyin:

```ts
/**
 * Mnemonikasi bor kartalar — "Assotsiatsiyalarim" ekrani uchun.
 *
 * Tartib so'z bo'yicha: ro'yxat barqaror bo'lishi kerak, aks holda har
 * ochilishda qatorlar joyini almashtirib, o'qishni qiyinlashtirardi.
 */
export async function getMnemonicCards(language: LanguageCode): Promise<CardRecord[]> {
  const cards = await db.cards
    .where('language')
    .equals(language)
    .filter((card) => Boolean(card.mnemonic?.trim()))
    .toArray()

  return cards.sort((a, b) => a.word.localeCompare(b.word))
}
```

- [ ] **Step 4: Testni yugurtirish**

```bash
npx vitest run src/core/db/cards.repo.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/db/cards.repo.ts src/core/db/cards.repo.test.ts
git commit -m "feat: mnemonikasi bor kartalar so'rovi"
```

---

### Task 2: `FeedbackBar` — mavjud mnemonikani tahrirlash

**Files:**
- Modify: `src/features/session/FeedbackBar.tsx` (~214-221 va `MnemonicEditor`)
- Test: `src/features/session/FeedbackBar.test.tsx` (yangi fayl)

**Interfaces:**
- Consumes: `setMnemonic(cardId, text)` (mavjud), `Exercise`, `AnswerVerdict`
- Produces: `MnemonicEditor` endi `initialValue?: string` va `onSaved?: (text: string) => void` proplarini oladi

- [ ] **Step 1: Tushadigan testni yozish**

`src/features/session/FeedbackBar.test.tsx` yarating:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { CardRecord } from '@/core/db'
import type { Exercise } from '@/core/exercises'
import { FeedbackBar } from './FeedbackBar'

const setMnemonic = vi.fn()
vi.mock('@/core/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/core/db')>()),
  setMnemonic: (...args: unknown[]) => setMnemonic(...args),
}))

function makeCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    id: 'en:water',
    word: 'water',
    translation: 'suv',
    language: 'en',
    topic: 'Ovqat',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    ...overrides,
  }
}

function exerciseFor(card: CardRecord): Exercise {
  return { id: 'x', type: 'recall', card, prompt: card.translation, answer: card.word }
}

function renderBar(card: CardRecord, verdict: 'correct' | 'wrong' = 'wrong') {
  return render(
    <FeedbackBar
      exercise={exerciseFor(card)}
      verdict={verdict}
      nextIntervalDays={1}
      xpGained={2}
      goalJustCompleted={false}
      onContinue={() => {}}
    />,
  )
}

describe('FeedbackBar — mnemonika', () => {
  it('mnemonika bor bo‘lsa TAHRIRLASH tugmasi chiqadi', () => {
    renderBar(makeCard({ mnemonic: 'birodar non olib keldi' }))

    expect(screen.getByText(/birodar non olib keldi/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tahrirlash/i })).toBeInTheDocument()
  })

  it('tahrirlash bosilganda maydon MAVJUD matn bilan to‘ladi', () => {
    renderBar(makeCard({ mnemonic: 'eski matn' }))

    fireEvent.click(screen.getByRole('button', { name: /tahrirlash/i }))

    expect(screen.getByLabelText(/nimaga o.xshaydi/i)).toHaveValue('eski matn')
  })

  it('o‘zgartirilgan matn saqlanadi', async () => {
    renderBar(makeCard({ mnemonic: 'eski matn' }))

    fireEvent.click(screen.getByRole('button', { name: /tahrirlash/i }))
    fireEvent.change(screen.getByLabelText(/nimaga o.xshaydi/i), {
      target: { value: 'yangi matn' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^saqlash$/i }))

    await waitFor(() => {
      expect(setMnemonic).toHaveBeenCalledWith('en:water', 'yangi matn')
    })
  })

  it('TO‘G‘RI javobda mnemonika oynasi umuman chiqmaydi', () => {
    // To'g'ri javob 900 ms da avtomatik o'tadi — u yerda oyna ko'rinmasdi
    renderBar(makeCard(), 'correct')

    expect(screen.queryByText(/assotsiatsiya yozish/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /tahrirlash/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Testni yugurtirib, tushishini tekshirish**

```bash
npx vitest run src/features/session/FeedbackBar.test.tsx
```

Expected: FAIL — "Tahrirlash" tugmasi topilmaydi.

- [ ] **Step 3: Ko'rsatish qismini o'zgartirish**

`src/features/session/FeedbackBar.tsx` da quyidagi ikki blokni:

```tsx
      {exercise.card.mnemonic && (
        <p className="rounded-xl bg-white/70 px-3 py-2 text-sm text-ink-600 italic">
          💡 {exercise.card.mnemonic}
        </p>
      )}

      {verdict !== 'correct' && !exercise.card.mnemonic && (
        <MnemonicEditor cardId={exercise.card.id} word={exercise.card.word} />
      )}
```

shunga almashtiring:

```tsx
      {/*
        Mnemonika faqat javobdan KEYIN ko'rinadi — mashq paytida u javobni
        oshkor qilardi. To'g'ri javobda esa ekran 900 ms da o'tib ketadi,
        shuning uchun u yerda tahrirlash taklif qilinmaydi.
      */}
      {verdict === 'correct' ? (
        exercise.card.mnemonic && (
          <p className="rounded-xl bg-white/70 px-3 py-2 text-sm text-ink-600 italic">
            💡 {exercise.card.mnemonic}
          </p>
        )
      ) : (
        <MnemonicEditor
          cardId={exercise.card.id}
          word={exercise.card.word}
          initialValue={exercise.card.mnemonic}
        />
      )}
```

- [ ] **Step 4: `MnemonicEditor` ni tahrirlashga moslashtirish**

`MnemonicEditor` funksiyasini to'liq shunga almashtiring:

```tsx
/**
 * Mnemonika yozish va tahrirlash (TZ 3.3 — Keyword Method).
 * "Bu so'zni nimaga o'xshatasan?" — o'zbekcha ohangdosh so'z + assotsiatsiya.
 */
function MnemonicEditor({
  cardId,
  word,
  initialValue,
}: {
  cardId: string
  word: string
  initialValue?: string
}) {
  const [saved, setSaved] = useState(initialValue ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(initialValue ?? '')

  async function handleSave() {
    const trimmed = value.trim()
    if (trimmed.length === 0) return

    try {
      await setMnemonic(cardId, trimmed)
      setSaved(trimmed)
      setIsOpen(false)
    } catch (error) {
      console.error('Mnemonikani saqlab bo‘lmadi:', error)
    }
  }

  if (!isOpen) {
    // Yozilgani bo'lsa — ko'rsatiladi va yoniga tahrirlash taklif qilinadi
    if (saved) {
      return (
        <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
          <p className="flex-1 text-sm text-ink-600 italic">💡 {saved}</p>
          <button
            type="button"
            onClick={() => {
              setValue(saved)
              setIsOpen(true)
            }}
            className="tap-highlight-none min-h-11 shrink-0 text-sm font-semibold text-brand-700 underline underline-offset-4"
          >
            Tahrirlash
          </button>
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="tap-highlight-none min-h-11 text-start text-sm font-semibold text-brand-700 underline underline-offset-4"
      >
        Esda qolishi uchun assotsiatsiya yozish
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="mnemonic-input" className="text-sm text-ink-600">
        «{word}» nimaga o'xshaydi? Kulgili bo'lsa — yaxshiroq esda qoladi.
      </label>
      <input
        id="mnemonic-input"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') void handleSave()
        }}
        placeholder="masalan: «bread» — «birodar non olib keldi»"
        className="h-12 w-full rounded-xl border-2 border-ink-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
      />
      <Button size="sm" onClick={() => void handleSave()} disabled={value.trim().length === 0}>
        Saqlash
      </Button>
    </div>
  )
}
```

- [ ] **Step 5: Testni yugurtirish**

```bash
npx vitest run src/features/session/FeedbackBar.test.tsx
```

Expected: PASS (4 test).

- [ ] **Step 6: Butun to'plamni tekshirish va commit**

```bash
npm test -- --run > /dev/null 2>&1; echo "EXIT=$?"
```

Expected: `EXIT=0`.

```bash
git add src/features/session/FeedbackBar.tsx src/features/session/FeedbackBar.test.tsx
git commit -m "feat: mnemonikani mashq ekranida tahrirlash mumkin"
```

---

### Task 3: `MnemonicRow` — bitta qator

**Files:**
- Create: `src/features/mnemonics/MnemonicRow.tsx`
- Test: `src/features/mnemonics/MnemonicRow.test.tsx`

**Interfaces:**
- Consumes: `CardRecord`
- Produces:
  ```ts
  interface MnemonicRowProps {
    card: CardRecord
    onSave: (cardId: string, text: string) => void
    onDelete: (cardId: string) => void
  }
  export function MnemonicRow(props: MnemonicRowProps): JSX.Element
  ```
  Qator o'zi bazaga yozmaydi — ota komponent yozadi. Sabab: ro'yxatni
  yangilash ham o'sha yerda bo'ladi, ikki joyda yozish holatni ikkiga bo'lardi.

- [ ] **Step 1: Tushadigan testni yozish**

`src/features/mnemonics/MnemonicRow.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { CardRecord } from '@/core/db'
import { MnemonicRow } from './MnemonicRow'

function makeCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    id: 'en:water',
    word: 'water',
    translation: 'suv',
    language: 'en',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    ...overrides,
  }
}

describe('MnemonicRow', () => {
  it('so‘z, tarjima va mnemonikani ko‘rsatadi', () => {
    render(
      <MnemonicRow card={makeCard({ mnemonic: 'vatanimda suv' })} onSave={() => {}} onDelete={() => {}} />,
    )

    expect(screen.getByText(/water/)).toBeInTheDocument()
    expect(screen.getByText(/suv/)).toBeInTheDocument()
    expect(screen.getByText(/vatanimda suv/)).toBeInTheDocument()
  })

  it('mnemonikasi yo‘q kartada "qo‘shish" taklif qilinadi', () => {
    render(<MnemonicRow card={makeCard()} onSave={() => {}} onDelete={() => {}} />)

    expect(screen.getByRole('button', { name: /assotsiatsiya qo.shish/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /o.chirish/i })).not.toBeInTheDocument()
  })

  it('saqlash ota komponentga matnni uzatadi', () => {
    const onSave = vi.fn()
    render(<MnemonicRow card={makeCard()} onSave={onSave} onDelete={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /assotsiatsiya qo.shish/i }))
    fireEvent.change(screen.getByLabelText(/assotsiatsiya/i), { target: { value: 'yangi' } })
    fireEvent.click(screen.getByRole('button', { name: /^saqlash$/i }))

    expect(onSave).toHaveBeenCalledWith('en:water', 'yangi')
  })

  it('o‘chirish ota komponentga xabar beradi', () => {
    const onDelete = vi.fn()
    render(<MnemonicRow card={makeCard({ mnemonic: 'bor' })} onSave={() => {}} onDelete={onDelete} />)

    fireEvent.click(screen.getByRole('button', { name: /o.chirish/i }))

    expect(onDelete).toHaveBeenCalledWith('en:water')
  })

  it('bo‘sh matn saqlanmaydi', () => {
    const onSave = vi.fn()
    render(<MnemonicRow card={makeCard()} onSave={onSave} onDelete={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /assotsiatsiya qo.shish/i }))

    expect(screen.getByRole('button', { name: /^saqlash$/i })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Testni yugurtirib, tushishini tekshirish**

```bash
npx vitest run src/features/mnemonics/MnemonicRow.test.tsx
```

Expected: FAIL — modul topilmaydi.

- [ ] **Step 3: Komponentni yozish**

`src/features/mnemonics/MnemonicRow.tsx`:

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { LANGUAGES } from '@/core/config/languages'
import type { CardRecord } from '@/core/db'

interface MnemonicRowProps {
  card: CardRecord
  onSave: (cardId: string, text: string) => void
  onDelete: (cardId: string) => void
}

/**
 * Ro'yxatdagi bitta so'z: mnemonikani ko'rsatadi yoki tahrirlaydi.
 *
 * Bazaga O'ZI yozmaydi — ota komponent yozadi. Sabab: ro'yxatni yangilash
 * ham o'sha yerda bo'ladi, ikki joyda yozish holatni ikkiga bo'lardi.
 */
export function MnemonicRow({ card, onSave, onDelete }: MnemonicRowProps) {
  const language = LANGUAGES[card.language]
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(card.mnemonic ?? '')

  function handleSave() {
    const trimmed = value.trim()
    if (trimmed.length === 0) return

    onSave(card.id, trimmed)
    setIsEditing(false)
  }

  return (
    <li className="flex flex-col gap-2 rounded-2xl border-2 border-ink-300 bg-white p-3">
      <p className="flex flex-wrap items-baseline gap-2">
        <span dir={language.dir} lang={language.code} className="font-bold">
          {card.word}
        </span>
        <span className="text-sm text-ink-600">— {card.translation}</span>
      </p>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`mn-${card.id}`} className="text-sm text-ink-600">
            Assotsiatsiya
          </label>
          <input
            id={`mn-${card.id}`}
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSave()
            }}
            placeholder="masalan: «birodar non olib keldi»"
            className="h-12 w-full rounded-xl border-2 border-ink-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={value.trim().length === 0}>
              Saqlash
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setValue(card.mnemonic ?? '')
                setIsEditing(false)
              }}
            >
              Bekor qilish
            </Button>
          </div>
        </div>
      ) : card.mnemonic ? (
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm text-ink-600 italic">💡 {card.mnemonic}</p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`${card.word} — tahrirlash`}
            className="tap-highlight-none flex h-11 w-11 items-center justify-center rounded-full hover:bg-brand-50"
          >
            <span aria-hidden="true">✏️</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            aria-label={`${card.word} — o'chirish`}
            className="tap-highlight-none flex h-11 w-11 items-center justify-center rounded-full hover:bg-wrong-500/10"
          >
            <span aria-hidden="true">🗑️</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="tap-highlight-none min-h-11 text-start text-sm font-semibold text-brand-700 underline underline-offset-4"
        >
          Assotsiatsiya qo'shish
        </button>
      )}
    </li>
  )
}
```

> `variant="ghost"` mavjud (`src/components/ui/buttonStyles.ts:12`) — qo'shimcha
> ish talab qilmaydi.

- [ ] **Step 4: Testni yugurtirish**

```bash
npx vitest run src/features/mnemonics/MnemonicRow.test.tsx
```

Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add src/features/mnemonics/MnemonicRow.tsx src/features/mnemonics/MnemonicRow.test.tsx
git commit -m "feat: mnemonika qatori komponenti"
```

---

### Task 4: `MnemonicsScreen` — ro'yxat va qidiruv

**Files:**
- Create: `src/features/mnemonics/MnemonicsScreen.tsx`
- Test: `src/features/mnemonics/MnemonicsScreen.test.tsx`

**Interfaces:**
- Consumes: `getMnemonicCards(language)` (Task 1), `getAllCards(language)`, `setMnemonic(cardId, text)`, `MnemonicRow` (Task 3), `useSettingsStore`
- Produces: `MnemonicsScreen()` — proplarsiz ekran

- [ ] **Step 1: Tushadigan testni yozish**

`src/features/mnemonics/MnemonicsScreen.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { addMissingCards, db, getCard, setMnemonic, type NewCardRecordInput } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { MnemonicsScreen } from './MnemonicsScreen'

const WORDS: NewCardRecordInput[] = [
  { word: 'water', translation: 'suv', language: 'en' },
  { word: 'bread', translation: 'non', language: 'en' },
  { word: 'book', translation: 'kitob', language: 'en' },
]

function renderScreen() {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(<MnemonicsScreen />)
}

beforeEach(async () => {
  await db.cards.clear()
})

describe('MnemonicsScreen', () => {
  it('ochilganda faqat MNEMONIKASI BOR kartalar ko‘rinadi', async () => {
    await addMissingCards(WORDS)
    await setMnemonic('en:water', 'vatanimda suv')
    renderScreen()

    expect(await screen.findByText(/vatanimda suv/)).toBeInTheDocument()
    expect(screen.queryByText('bread')).not.toBeInTheDocument()
  })

  it('hech narsa yozilmagan bo‘lsa yo‘l ko‘rsatiladi', async () => {
    await addMissingCards(WORDS)
    renderScreen()

    expect(await screen.findByText(/hali assotsiatsiya yozmagansiz/i)).toBeInTheDocument()
  })

  it('qidiruv MNEMONIKASIZ so‘zni ham topadi', async () => {
    await addMissingCards(WORDS)
    renderScreen()
    await screen.findByText(/hali assotsiatsiya yozmagansiz/i)

    fireEvent.change(screen.getByLabelText(/so.z qidirish/i), { target: { value: 'bre' } })

    expect(await screen.findByText('bread')).toBeInTheDocument()
  })

  it('qidiruv TARJIMA bo‘yicha ham ishlaydi', async () => {
    await addMissingCards(WORDS)
    renderScreen()
    await screen.findByText(/hali assotsiatsiya yozmagansiz/i)

    fireEvent.change(screen.getByLabelText(/so.z qidirish/i), { target: { value: 'kitob' } })

    expect(await screen.findByText('book')).toBeInTheDocument()
  })

  it('yangi assotsiatsiya saqlanadi', async () => {
    await addMissingCards(WORDS)
    renderScreen()
    await screen.findByText(/hali assotsiatsiya yozmagansiz/i)

    fireEvent.change(screen.getByLabelText(/so.z qidirish/i), { target: { value: 'bread' } })
    fireEvent.click(await screen.findByRole('button', { name: /assotsiatsiya qo.shish/i }))
    fireEvent.change(screen.getByLabelText(/^assotsiatsiya$/i), {
      target: { value: 'birodar non' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^saqlash$/i }))

    await waitFor(async () => {
      expect((await getCard('en:bread'))?.mnemonic).toBe('birodar non')
    })
  })

  it('o‘chirish bazadan ham olib tashlaydi', async () => {
    await addMissingCards(WORDS)
    await setMnemonic('en:water', 'vaqtinchalik')
    renderScreen()

    fireEvent.click(await screen.findByRole('button', { name: /water — o.chirish/i }))

    await waitFor(async () => {
      expect((await getCard('en:water'))?.mnemonic).toBeUndefined()
    })
  })
})
```

- [ ] **Step 2: Testni yugurtirib, tushishini tekshirish**

```bash
npx vitest run src/features/mnemonics/MnemonicsScreen.test.tsx
```

Expected: FAIL — modul topilmaydi.

- [ ] **Step 3: Ekranni yozish**

`src/features/mnemonics/MnemonicsScreen.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { getAllCards, getMnemonicCards, setMnemonic, type CardRecord } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { MnemonicRow } from './MnemonicRow'

/**
 * Qidiruv natijalari chegarasi.
 *
 * Lug'atda ~10 000 karta bor; hammasini chizish telefonni qotirardi.
 * Chegara foydalanuvchidan yashirilmaydi — pastda ochiq yoziladi.
 */
const MAX_RESULTS = 50

/**
 * "Assotsiatsiyalarim" — mnemonikalarni bir joyda boshqarish.
 *
 * Ochilganda faqat yozilganlari ko'rinadi; qidiruv esa BUTUN lug'at bo'ylab
 * ishlaydi, shu tariqa istalgan so'zga yangi assotsiatsiya qo'shiladi.
 *
 * Qidiruv XOTIRADA bajariladi: har harfda bazaga so'rov yuborish minglab
 * kartada ortiqcha yuk bo'lardi.
 */
export function MnemonicsScreen() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)

  const [withMnemonic, setWithMnemonic] = useState<CardRecord[] | null>(null)
  const [allCards, setAllCards] = useState<CardRecord[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!learningLanguage) return

    let cancelled = false

    void Promise.all([getMnemonicCards(learningLanguage), getAllCards(learningLanguage)])
      .then(([mine, all]) => {
        if (cancelled) return
        setWithMnemonic(mine)
        setAllCards(all)
      })
      .catch((error: unknown) => {
        console.error('Assotsiatsiyalarni yuklab bo‘lmadi:', error)
        if (!cancelled) setWithMnemonic([])
      })

    return () => {
      cancelled = true
    }
  }, [learningLanguage])

  const trimmed = query.trim().toLowerCase()

  const matches = useMemo(() => {
    if (!trimmed) return []

    return allCards.filter(
      (card) =>
        card.word.toLowerCase().includes(trimmed) ||
        card.translation.toLowerCase().includes(trimmed),
    )
  }, [allCards, trimmed])

  /** Bazaga yozib, ekrandagi ro'yxatni ham yangilaydi */
  async function persist(cardId: string, text: string) {
    try {
      await setMnemonic(cardId, text)
    } catch (error) {
      console.error('Assotsiatsiyani saqlab bo‘lmadi:', error)
      return
    }

    const apply = (card: CardRecord): CardRecord =>
      card.id === cardId ? { ...card, mnemonic: text || undefined } : card

    setAllCards((current) => current.map(apply))
    setWithMnemonic((current) => {
      const next = (current ?? []).map(apply).filter((card) => card.mnemonic)
      const isNew = text && !next.some((card) => card.id === cardId)
      const added = isNew ? [...next, ...allCards.filter((c) => c.id === cardId).map(apply)] : next

      return added.sort((a, b) => a.word.localeCompare(b.word))
    })
  }

  const shown = trimmed ? matches.slice(0, MAX_RESULTS) : (withMnemonic ?? [])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Assotsiatsiyalarim</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="mnemonic-search" className="text-sm font-semibold text-ink-600">
          So'z qidirish
        </label>
        <input
          id="mnemonic-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="so'z yoki tarjima…"
          autoComplete="off"
          className="h-12 w-full rounded-2xl border-2 border-ink-300 bg-white px-4 focus:border-brand-500 focus:outline-none"
        />
      </div>

      {withMnemonic === null && <Panel className="text-ink-600">Yuklanmoqda…</Panel>}

      {withMnemonic !== null && shown.length === 0 && (
        <Panel className="text-sm text-ink-600">
          {trimmed
            ? 'Bunday so‘z topilmadi.'
            : 'Hali assotsiatsiya yozmagansiz. Takrorlash paytida xato qilganingizda yoki shu yerda qidirib qo‘shing.'}
        </Panel>
      )}

      <ul className="flex flex-col gap-2">
        {shown.map((card) => (
          <MnemonicRow
            key={card.id}
            card={card}
            onSave={(cardId, text) => void persist(cardId, text)}
            onDelete={(cardId) => void persist(cardId, '')}
          />
        ))}
      </ul>

      {trimmed && matches.length > MAX_RESULTS && (
        <p className="text-center text-xs text-ink-600">
          Yana {matches.length - MAX_RESULTS} ta — qidiruvni aniqlashtiring.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Testni yugurtirish**

```bash
npx vitest run src/features/mnemonics/MnemonicsScreen.test.tsx
```

Expected: PASS (6 test).

- [ ] **Step 5: Commit**

```bash
git add src/features/mnemonics/MnemonicsScreen.tsx src/features/mnemonics/MnemonicsScreen.test.tsx
git commit -m "feat: Assotsiatsiyalarim ekrani (ro'yxat va qidiruv)"
```

---

### Task 5: Marshrut va Profil havolasi

**Files:**
- Modify: `src/app/paths.ts` (PATHS obyekti)
- Modify: `src/app/App.tsx` (import va `AppShell` ichidagi marshrutlar)
- Modify: `src/features/profile/ProfileScreen.tsx` ("Javob tovushlari" panelidan keyin)
- Create: `src/features/profile/ProfileScreen.test.tsx` (bu fayl hali **yo'q**)

**Interfaces:**
- Consumes: `MnemonicsScreen` (Task 4), `PATHS`
- Produces: `PATHS.mnemonics === '/mnemonics'`

- [ ] **Step 1: Tushadigan testni yozish**

`src/features/profile/ProfileScreen.test.tsx` faylini YARATING (u hali yo'q).
Ekran `<Link>` ishlatgani uchun `MemoryRouter` shart:

```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { db } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { ProfileScreen } from './ProfileScreen'

function renderScreen() {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter>
      <ProfileScreen />
    </MemoryRouter>,
  )
}

beforeEach(async () => {
  await Promise.all([db.cards.clear(), db.profile.clear(), db.dailyStats.clear()])
})

describe('ProfileScreen — assotsiatsiyalar', () => {
  it('Assotsiatsiyalarim ekraniga havola bor', async () => {
    renderScreen()

    const link = await screen.findByRole('link', { name: /assotsiatsiyalarim/i })
    expect(link).toHaveAttribute('href', '/mnemonics')
  })
})
```

- [ ] **Step 2: Testni yugurtirib, tushishini tekshirish**

```bash
npx vitest run src/features/profile/ProfileScreen.test.tsx
```

Expected: FAIL — havola topilmaydi.

- [ ] **Step 3: Marshrut manzilini qo'shish**

`src/app/paths.ts` da `profile` qatoridan keyin:

```ts
  mnemonics: '/mnemonics',
```

- [ ] **Step 4: Marshrutni ulash**

`src/app/App.tsx` import bo'limiga (boshqa ekran importlari yoniga):

```tsx
import { MnemonicsScreen } from '@/features/mnemonics/MnemonicsScreen'
```

va `AppShell` ichidagi ro'yxatga, `profile` qatoridan keyin:

```tsx
          <Route path={PATHS.mnemonics} element={<MnemonicsScreen />} />
```

- [ ] **Step 5: Profil havolasini qo'shish**

`src/features/profile/ProfileScreen.tsx` da "Javob tovushlari" `</Panel>` idan keyin:

```tsx
      <Panel>
        <Link
          to={PATHS.mnemonics}
          className="tap-highlight-none flex min-h-11 items-center justify-between gap-4"
        >
          <span>
            <span className="block font-bold">Assotsiatsiyalarim</span>
            <span className="text-sm text-ink-600">
              Esda saqlash uchun yozgan mnemonikalaringiz
            </span>
          </span>
          <span aria-hidden="true">💡</span>
        </Link>
      </Panel>
```

Fayl boshiga kerakli importlarni qo'shing (agar hali bo'lmasa):

```tsx
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
```

- [ ] **Step 6: Testni yugurtirish**

```bash
npx vitest run src/features/profile/ProfileScreen.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/paths.ts src/app/App.tsx src/features/profile/ProfileScreen.tsx src/features/profile/ProfileScreen.test.tsx
git commit -m "feat: Assotsiatsiyalarim ekraniga marshrut va havola"
```

---

### Task 6: Yakuniy tekshiruv va deploy

**Files:** (yo'q — faqat tekshiruv)

- [ ] **Step 1: To'liq sifat tekshiruvi**

```bash
npm run lint 2>&1 | tail -3
npx tsc --noEmit && echo "tsc ok"
npm test -- --run > /dev/null 2>&1; echo "TEST_EXIT=$?"
npm run build > /dev/null 2>&1; echo "BUILD_EXIT=$?"
```

Expected: lint toza, `tsc ok`, `TEST_EXIT=0`, `BUILD_EXIT=0`.

> `${PIPESTATUS[0]}` yoki `> /dev/null` ishlating — quvur chiqish kodini
> yashiradi va qizil testlar bilan commit qilib yuborish oson.

- [ ] **Step 2: Brauzerda qo'lda tekshirish**

Dev serverni ishga tushiring va tekshiring:

1. Profil → **Assotsiatsiyalarim** havolasi ochiladi
2. Bo'sh holatda yo'l ko'rsatuvchi matn chiqadi
3. Qidiruvga so'z yozilsa, mnemonikasiz kartalar ham topiladi
4. Assotsiatsiya qo'shiladi, tahrirlanadi, o'chiriladi
5. Takrorlashda **xato** javob berilganda tahrirlash tugmasi chiqadi
6. **To'g'ri** javobda ekran avvalgidek 900 ms da o'tib ketadi

- [ ] **Step 3: README'ni yangilash**

`README.md` dagi papka strukturasiga qo'shing (`features/` ro'yxatida,
`league/` dan keyin):

```
│   ├── mnemonics/           # assotsiatsiyalarni boshqarish
```

va "Marshrutlar" jadvaliga (`/profile` qatoridan keyin) qo'shing:

```
| `/mnemonics`         | Assotsiatsiyalar | AppShell | onboarding kerak  |
```

- [ ] **Step 4: Commit va push**

```bash
git add -A
git commit -m "docs: mnemonika ekrani hujjatlandi"
git push
```

---

## Self-Review

**1. Spec qamrovi:**
- `getMnemonicCards` → Task 1 ✓
- Mavjud mnemonikani tahrirlash → Task 2 ✓
- To'g'ri javob oqimiga tegilmasligi → Task 2, test bilan qulflangan ✓
- Qator: ko'rsatish/tahrirlash/o'chirish → Task 3 ✓
- Ekran: ro'yxat, qidiruv (so'z va tarjima bo'yicha), 50 ta chegara, bo'sh holat → Task 4 ✓
- Marshrut va Profil havolasi → Task 5 ✓
- Mnemonika mashq paytida ko'rsatilmasligi → mavjud xulq, o'zgartirilmaydi ✓
- Testlar (repo, FeedbackBar, ekran) → Task 1–5 ✓

**2. Placeholder tekshiruvi:** har qadamda to'liq kod bor, taxminiy ko'rsatma yo'q.

**Kodga solishtirib tekshirilgan ikki taxmin:**
- `variant="ghost"` haqiqatan mavjud (`buttonStyles.ts:12`) — shartli muqobil olib tashlandi.
- `ProfileScreen.test.tsx` **yo'q** ekan — Task 5 endi uni yaratadi (`MemoryRouter` bilan, chunki ekran `<Link>` ishlatadi).

**3. Tip izchilligi:**
- `getMnemonicCards(language): Promise<CardRecord[]>` — Task 1 da e'lon qilinib, Task 4 da shu nom bilan ishlatiladi ✓
- `MnemonicRowProps { card, onSave(cardId, text), onDelete(cardId) }` — Task 3 da e'lon, Task 4 da shu imzo bilan chaqiriladi ✓
- `setMnemonic(cardId, text)` — mavjud imzo o'zgarmaydi; o'chirish bo'sh satr orqali ✓
- `PATHS.mnemonics` — Task 5 da e'lon, o'sha taskda ishlatiladi ✓
