import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { addMissingCards, db, getCard, type NewCardRecordInput } from '@/core/db'
import { XP_PER_VERDICT } from '@/core/gamification'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { ReviewScreen } from './ReviewScreen'

const EN_WORDS: NewCardRecordInput[] = [
  { word: 'hello', translation: 'salom', language: 'en', topic: 'Salomlashish' },
  { word: 'water', translation: 'suv', language: 'en', topic: 'Ovqat' },
  { word: 'book', translation: 'kitob', language: 'en', topic: 'Maktab' },
]

const PAST = () => Date.now() - 60_000
const FUTURE = () => Date.now() + 86_400_000

/** Kartalarni "muddati yetgan" holatda joylash */
async function seed(words = EN_WORDS) {
  await addMissingCards(words, PAST())
}

/** Faqat bitta karta navbatda qolsin — qolganlari kelajakka suriladi */
async function keepOnly(cardId: string, patch: Partial<Record<string, unknown>> = {}) {
  await db.cards.update(cardId, { dueDate: PAST(), ...patch })

  for (const other of EN_WORDS.map((entry) => `en:${entry.word}`)) {
    if (other !== cardId) await db.cards.update(other, { dueDate: FUTURE() })
  }
}

function renderScreen() {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter>
      <ReviewScreen />
    </MemoryRouter>,
  )
}

/**
 * Tanib olish mashqiga javob berish.
 *
 * Naqshlarda apostrof ishlatilmaydi: o'zbekcha matnlarda turli apostrof
 * belgilari uchraydi, shuning uchun testlar ularsiz qismga tayanadi.
 */
async function answerRecognition(mode: 'correct' | 'wrong') {
  const prompt = (await screen.findByTestId('exercise-prompt')).textContent
  const expected = EN_WORDS.find((entry) => entry.word === prompt)?.translation

  // To'g'ri javobni bilmasak, "xato variant" ni ham tanlay olmaymiz —
  // shuning uchun jimgina davom etmasdan, testni yiqitamiz
  if (!expected) throw new Error(`Kutilmagan so'z ko'rsatildi: ${prompt}`)

  const translations = new Set(EN_WORDS.map((entry) => entry.translation))
  const options = (await screen.findAllByRole('button')).filter((button) =>
    translations.has(button.textContent ?? ''),
  )

  const target =
    mode === 'correct'
      ? options.find((button) => button.textContent === expected)
      : options.find((button) => button.textContent !== expected)

  if (!target) throw new Error(`"${mode}" uchun variant topilmadi`)

  fireEvent.click(target)
  fireEvent.click(screen.getByRole('button', { name: /tekshirish/i }))
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ReviewScreen — mashq oqimi', () => {
  it('muddati yetgan karta uchun mashq korsatadi', async () => {
    await seed()
    renderScreen()

    expect(await screen.findByRole('button', { name: /tekshirish/i })).toBeInTheDocument()
    expect(screen.getByTestId('session-progress')).toHaveTextContent('0/3')
  })

  it('yangi soz eng oson turdan — tanib olishdan boshlanadi', async () => {
    await seed()
    renderScreen()

    expect(await screen.findByText(/bu so.z nimani anglatadi/i)).toBeInTheDocument()
  })

  it('togri javobda ijobiy feedback va SM-2 bahosi saqlanadi', async () => {
    await seed()
    await keepOnly('en:hello')
    renderScreen()

    await screen.findByRole('button', { name: /tekshirish/i })
    await answerRecognition('correct')

    expect(await screen.findByText(/to.g.ri!/i)).toBeInTheDocument()

    await waitFor(async () => {
      const card = await getCard('en:hello')
      // Tanib olish (oson tur) to'g'ri bajarilsa — baho 4
      expect(card?.repetitions).toBe(1)
      expect(card?.easeFactor).toBe(2.5)
      expect(card?.totalReviews).toBe(1)
    })
  })

  it('xato javobda togri javob korsatiladi va jazolanmaydi', async () => {
    await seed()
    renderScreen()

    await screen.findByRole('button', { name: /tekshirish/i })
    await answerRecognition('wrong')

    // Xato javobda ham do'stona ohang: "Keyingi safar bo'ladi"
    expect(await screen.findByText(/keyingi safar/i)).toBeInTheDocument()
    expect(screen.getByTestId('correct-answer')).toBeInTheDocument()
  })

  it('xato javob berilgan karta seans oxiriga qaytariladi', async () => {
    await seed()
    renderScreen()

    await screen.findByRole('button', { name: /tekshirish/i })
    await answerRecognition('wrong')

    fireEvent.click(await screen.findByRole('button', { name: /tushunarli/i }))

    // Navbat 3 tadan 4 taga uzaydi
    await waitFor(() => {
      expect(screen.getByTestId('session-progress')).toHaveTextContent('1/4')
    })
  })

  it('javob berilmagunicha "Tekshirish" ochirilgan', async () => {
    await seed()
    renderScreen()

    expect(await screen.findByRole('button', { name: /tekshirish/i })).toBeDisabled()
  })

  it('takrorlanadigan karta bolmasa, tinch holatni korsatadi', async () => {
    renderScreen()

    expect(await screen.findByText(/hozircha takrorlash uchun/i)).toBeInTheDocument()
  })
})

describe('ReviewScreen — adaptiv qiyinlik', () => {
  it('mustahkamlangan soz uchun yozma mashq beriladi', async () => {
    await seed()
    await keepOnly('en:hello', { repetitions: 3, interval: 15, totalReviews: 3 })
    renderScreen()

    // jsdom'da nutq sintezi yo'q → eshitish turi tanlanmaydi, yozish qoladi
    expect(await screen.findByLabelText(/javob/i)).toBeInTheDocument()
    expect(screen.getByText(/bu so.zni ingliz tilida yozing/i)).toBeInTheDocument()
  })

  it('yozma mashqda imlo xatosi "deyarli" deb baholanadi', async () => {
    await seed()
    await keepOnly('en:hello', { repetitions: 3, interval: 15, totalReviews: 3 })
    renderScreen()

    const input = await screen.findByLabelText(/javob/i)
    fireEvent.change(input, { target: { value: 'helo' } })
    fireEvent.click(screen.getByRole('button', { name: /tekshirish/i }))

    expect(await screen.findByText(/deyarli/i)).toBeInTheDocument()

    await waitFor(async () => {
      const card = await getCard('en:hello')
      // Baho 3 → o'tdi, lekin easeFactor pasaydi (2.5 − 0.14)
      expect(card?.easeFactor).toBe(2.36)
      expect(card?.repetitions).toBe(4)
    })
  })

  it('yozma mashqda butunlay boshqa soz xato hisoblanadi', async () => {
    await seed()
    await keepOnly('en:hello', { repetitions: 3, interval: 15, totalReviews: 3 })
    renderScreen()

    const input = await screen.findByLabelText(/javob/i)
    fireEvent.change(input, { target: { value: 'banana' } })
    fireEvent.click(screen.getByRole('button', { name: /tekshirish/i }))

    expect(await screen.findByText(/keyingi safar/i)).toBeInTheDocument()

    await waitFor(async () => {
      const card = await getCard('en:hello')
      // Baho 0 → takrorlashlar nolga qaytadi, interval 1 kun
      expect(card?.repetitions).toBe(0)
      expect(card?.interval).toBe(1)
      expect(card?.lapses).toBe(1)
    })
  })
})

describe('ReviewScreen — jumla qurish mashqi', () => {
  it('sozlarni tartib bilan tanlab jumla tuziladi', async () => {
    // Math.random qat'iy qilinadi: repetitions 6 da ['recall','construction']
    // ro'yxatidan ikkinchisi (construction) tanlansin
    vi.spyOn(Math, 'random').mockReturnValue(0.9)

    await addMissingCards(
      [
        {
          word: 'house',
          translation: 'uy',
          language: 'en',
          sentence: 'This is my house',
          sentenceTranslation: 'Bu mening uyim',
        },
      ],
      PAST(),
    )
    await db.cards.update('en:house', { repetitions: 6, interval: 40, totalReviews: 6 })

    renderScreen()

    expect(await screen.findByText(/shu jumlani tuzing/i)).toBeInTheDocument()

    // So'zlarni to'g'ri tartibda bosamiz.
    // Tugmalar nomi "so'z — qo'shish" ko'rinishida (ekran o'quvchi uchun
    // "qo'shish" va "olib tashlash" tugmalari farqlanishi kerak).
    for (const token of ['This', 'is', 'my', 'house']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${token} .*qo`) }))
    }

    fireEvent.click(screen.getByRole('button', { name: /tekshirish/i }))

    expect(await screen.findByText(/to.g.ri!/i)).toBeInTheDocument()
  })

  it('xato tartibda tuzilgan jumla xato hisoblanadi', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)

    await addMissingCards(
      [
        {
          word: 'house',
          translation: 'uy',
          language: 'en',
          sentence: 'This is my house',
          sentenceTranslation: 'Bu mening uyim',
        },
      ],
      PAST(),
    )
    await db.cards.update('en:house', { repetitions: 6, interval: 40, totalReviews: 6 })

    renderScreen()
    await screen.findByText(/shu jumlani tuzing/i)

    for (const token of ['house', 'my', 'is', 'This']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${token} .*qo`) }))
    }

    fireEvent.click(screen.getByRole('button', { name: /tekshirish/i }))

    expect(await screen.findByText(/keyingi safar/i)).toBeInTheDocument()
    // To'g'ri javob sifatida butun jumla ko'rsatiladi
    expect(screen.getByTestId('correct-answer')).toHaveTextContent('This is my house')
  })
})

describe('ReviewScreen — geymifikatsiya', () => {
  it('javobdan keyin XP ko‘rsatiladi va profilga yoziladi', async () => {
    await seed()
    await keepOnly('en:hello')
    renderScreen()

    await screen.findByRole('button', { name: /tekshirish/i })
    await answerRecognition('correct')

    const xp = await screen.findByTestId('xp-gained')
    expect(xp).toHaveTextContent(`+${XP_PER_VERDICT.correct} XP`)

    await waitFor(async () => {
      const profile = await db.profile.get('me')
      expect(profile?.totalXp).toBe(XP_PER_VERDICT.correct)
    })
  })

  it('xato javob ham XP beradi — urinish taqdirlanadi', async () => {
    await seed()
    await keepOnly('en:hello')
    renderScreen()

    await screen.findByRole('button', { name: /tekshirish/i })
    await answerRecognition('wrong')

    expect(await screen.findByTestId('xp-gained')).toHaveTextContent(
      `+${XP_PER_VERDICT.wrong} XP`,
    )
  })

  it('seans yakunida jami XP va yangi nishon ko‘rsatiladi', async () => {
    await seed()
    await keepOnly('en:hello')
    renderScreen()

    await screen.findByRole('button', { name: /tekshirish/i })
    await answerRecognition('correct')
    fireEvent.click(await screen.findByRole('button', { name: /davom etish/i }))

    expect(await screen.findByTestId('session-xp')).toHaveTextContent(
      `+${XP_PER_VERDICT.correct} XP`,
    )
    // Birinchi o'rganilgan so'z uchun nishon
    expect(await screen.findByText(/yangi nishon/i)).toBeInTheDocument()
    expect(screen.getByText('Birinchi qadam')).toBeInTheDocument()
  })
})

describe('ReviewScreen — feedback aniqligi', () => {
  it('tanib olishda "To‘g‘ri javob" sifatida TARJIMA ko‘rsatiladi, savol emas', async () => {
    // Nuqson: variantlar tarjimalar edi, lekin javob sifatida so'zning
    // o'zi (ya'ni savol matni) chiqarilardi.
    await seed()
    await keepOnly('en:hello')
    renderScreen()

    await screen.findByRole('button', { name: /tekshirish/i })
    await answerRecognition('wrong')

    const shown = await screen.findByTestId('correct-answer')
    expect(shown).toHaveTextContent('salom')
    expect(shown).not.toHaveTextContent('hello')
  })

  it('yozma mashqda "To‘g‘ri javob" sifatida SO‘Z ko‘rsatiladi', async () => {
    await seed()
    await keepOnly('en:hello', { repetitions: 3, interval: 15, totalReviews: 3 })
    renderScreen()

    const input = await screen.findByLabelText(/javob/i)
    fireEvent.change(input, { target: { value: 'banana' } })
    fireEvent.click(screen.getByRole('button', { name: /tekshirish/i }))

    expect(await screen.findByTestId('correct-answer')).toHaveTextContent('hello')
  })

  it('to‘g‘ri va xato variantlar rangdan tashqari matn bilan ham belgilanadi', async () => {
    // WCAG 1.4.1: ma'no faqat rang orqali berilmasligi kerak
    await seed()
    await keepOnly('en:hello')
    renderScreen()

    await screen.findByRole('button', { name: /tekshirish/i })
    await answerRecognition('wrong')

    await screen.findByText(/keyingi safar/i)
    expect(screen.getByText(/to.g.ri javob$/i)).toBeInTheDocument()
    expect(screen.getByText(/sizning javobingiz, xato/i)).toBeInTheDocument()
  })
})

describe('ReviewScreen — eshitib tushunish mashqi', () => {
  it('nutq sintezi mavjud bolganda audio mashq beriladi', async () => {
    const speak = vi.fn()
    vi.stubGlobal('speechSynthesis', {
      speak,
      cancel: vi.fn(),
      getVoices: () => [{ lang: 'en-US' }],
    })
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = ''
        rate = 1
        text: string
        constructor(text: string) {
          this.text = text
        }
      },
    )
    // repetitions 2 da ['listening','recall'] — birinchisi tanlansin
    vi.spyOn(Math, 'random').mockReturnValue(0)

    await seed()
    await keepOnly('en:hello', { repetitions: 2, interval: 6, totalReviews: 2 })
    renderScreen()

    expect(await screen.findByText(/nima eshitdingiz/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /qayta eshitish/i })).toBeInTheDocument()
    // So'z avtomatik o'qib berilgan
    expect(speak).toHaveBeenCalled()
  })

  it('nutq sintezi yoq bolsa audio mashq umuman berilmaydi', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    await seed()
    await keepOnly('en:hello', { repetitions: 2, interval: 6, totalReviews: 2 })
    renderScreen()

    // Audio o'rniga yozma mashq
    expect(await screen.findByLabelText(/javob/i)).toBeInTheDocument()
    expect(screen.queryByText(/nima eshitdingiz/i)).not.toBeInTheDocument()
  })
})
