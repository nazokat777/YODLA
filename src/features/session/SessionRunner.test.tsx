import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { CardRecord } from '@/core/db'

// Baza va nishonlar mock qilinadi — bu test faqat SEANS OQIMINI tekshiradi
vi.mock('@/core/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core/db')>()

  return {
    ...actual,
    gradeCard: vi.fn(async (id: string) => ({ id, interval: 1 }) as CardRecord),
    recordAnswer: vi.fn(async () => ({ xpGained: 5, goalJustCompleted: false })),
    finalizeSession: vi.fn(async () => ({ newlyUnlocked: [] })),
  }
})

import { gradeCard, recordAnswer } from '@/core/db'
import { SessionRunner } from './SessionRunner'

function makeCard(word: string, translation: string): CardRecord {
  return {
    id: `en:${word}`,
    word,
    translation,
    language: 'en',
    topic: 'Ovqat',
    // rep 1 → ladder pog'onasi ['recognition', 'listening', 'matching']
    interval: 1,
    repetitions: 1,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 1,
    lapses: 0,
  }
}

const CARDS = [
  makeCard('water', 'suv'),
  makeCard('bread', 'non'),
  makeCard('tea', 'choy'),
  makeCard('salt', 'tuz'),
  makeCard('milk', 'sut'),
]

const word = (text: string) => screen.getByRole('button', { name: `${text} — so'z` })
const translation = (text: string) => screen.getByRole('button', { name: `${text} — tarjima` })

beforeEach(() => {
  vi.clearAllMocks()
  // jsdom'da nutq sintezi yo'q → eshitish tushib qoladi va shu pog'onada
  // ['recognition', 'matching'] qoladi; 0.9 ikkinchisini tanlaydi
  vi.spyOn(Math, 'random').mockReturnValue(0.9)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SessionRunner — juft topish', () => {
  it('bir mashqda barcha juftlangan kartalar baholanadi', async () => {
    render(<SessionRunner cards={[CARDS[0]]} pool={CARDS} onFinish={() => {}} />)

    expect(await screen.findByText(/so.z va tarjimasini juftlang/i)).toBeInTheDocument()

    for (const card of CARDS) {
      fireEvent.click(word(card.word))
      fireEvent.click(translation(card.translation))
    }

    await waitFor(() => {
      expect(gradeCard).toHaveBeenCalledTimes(CARDS.length)
      expect(recordAnswer).toHaveBeenCalledTimes(CARDS.length)
    })

    // To'g'ri juft — baho 4 (tanib olishga yaqin passiv tur)
    for (const call of vi.mocked(gradeCard).mock.calls) {
      expect(call[1]).toBe(4)
    }
  })

  it('xato juftlangan karta jazolanmaydi — baho 2, nol emas', async () => {
    render(<SessionRunner cards={[CARDS[0]]} pool={CARDS} onFinish={() => {}} />)

    await screen.findByText(/so.z va tarjimasini juftlang/i)

    // Avval bitta xato juft
    fireEvent.click(word('water'))
    fireEvent.click(translation('non'))

    for (const card of CARDS) {
      fireEvent.click(word(card.word))
      fireEvent.click(translation(card.translation))
    }

    await waitFor(() => {
      expect(gradeCard).toHaveBeenCalledTimes(CARDS.length)
    })

    expect(vi.mocked(gradeCard)).toHaveBeenCalledWith('en:water', 2)
    expect(vi.mocked(gradeCard)).toHaveBeenCalledWith('en:tea', 4)
  })

  it('juft topish seans hisobiga hamma kartani qo‘shadi', async () => {
    const onFinish = vi.fn()
    render(<SessionRunner cards={[CARDS[0]]} pool={CARDS} onFinish={onFinish} />)

    await screen.findByText(/so.z va tarjimasini juftlang/i)

    for (const card of CARDS) {
      fireEvent.click(word(card.word))
      fireEvent.click(translation(card.translation))
    }

    // Navbatda bitta karta bor edi — juftlik yakunlangach seans tugaydi
    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledWith(
        expect.objectContaining({ answered: CARDS.length, correct: CARDS.length }),
      )
    })
  })
})

describe('SessionRunner — audio mashqlari', () => {
  beforeEach(() => vi.clearAllMocks())

  it('tilda ovoz bo‘lmasa "eshitib tushunish" mashqi BERILMAYDI', async () => {
    // Foydalanuvchining tizimidagi holat: faqat ruscha ovoz bor.
    // Ovozlar ro'yxati kechikib yuklanadi — birinchi tekshiruvda bo'sh.
    let calls = 0
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => {
        calls += 1
        return calls > 1 ? [{ name: 'Irina', lang: 'ru-RU' } as SpeechSynthesisVoice] : []
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      cancel: () => {},
      speak: () => {},
    })
    vi.stubGlobal('SpeechSynthesisUtterance', class {})

    const cards = [
      makeCard('water', 'suv'),
      makeCard('bread', 'non'),
      makeCard('tea', 'choy'),
    ]

    render(<SessionRunner cards={[cards[0]]} pool={cards} onFinish={() => {}} />)

    // Ovozsiz "Nima eshitdingiz?" mashqi javob berib bo'lmaydigan mashq —
    // ro'yxat yuklangach u yo'qolishi kerak
    await waitFor(() => {
      expect(screen.queryByText(/nima eshitdingiz/i)).not.toBeInTheDocument()
    })

    vi.unstubAllGlobals()
  })
})

describe('SessionRunner — bosqichlar', () => {
  /**
   * Ekrandagi mashqqa javob beradi.
   *
   * Tur oldindan noma'lum — aynan shu sinovning MAQSADI mashq turining
   * o'zgarishi. Shuning uchun ikkala shakl ham qo'llab-quvvatlanadi:
   * variantli (tanlash o'zi javob) va matnli ("Tekshirish" tugmasi).
   */
  async function answerCurrent(): Promise<void> {
    const choices = screen.queryAllByRole('button', { pressed: false })
    if (choices.length > 0) {
      fireEvent.click(choices[0])
      return
    }

    const input = screen.getByRole('textbox', { name: /javob/i })
    fireEvent.change(input, { target: { value: 'javob' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tekshirish' }))
  }

  it('bir so‘z UCH marta chiqadi, lekin BIR marta baholanadi', async () => {
    // `Math.random` 0.9 juft topishni tanlardi; bu yerda oddiy mashqlar kerak
    vi.spyOn(Math, 'random').mockReturnValue(0)

    render(
      <SessionRunner
        cards={[CARDS[0]]}
        pool={CARDS}
        stagesFor={() => 3}
        onFinish={() => {}}
      />,
    )

    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/3')

    for (let step = 0; step < 3; step += 1) {
      await answerCurrent()

      // Javob to'g'ri bo'lsa "Davom etish", xato bo'lsa "Tushunarli"
      const next = await screen.findByRole('button', {
        name: /davom etish|tushunarli/i,
      })
      fireEvent.click(next)
    }

    // SM-2 jadvali FAQAT birinchi javobda yangilanadi. Aks holda bitta
    // darsdan keyin interval 1 → 6 → 15 kunga sakrardi — holbuki so'z
    // ikki daqiqada uch marta ko'rilgan, bu uzoq xotira dalili emas.
    expect(gradeCard).toHaveBeenCalledTimes(1)

    // XP esa har javob uchun beriladi — mashq ham mehnat
    expect(recordAnswer).toHaveBeenCalledTimes(3)
  })

  it('bosqich oshgani sayin mashq TURI o‘zgaradi', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    render(
      <SessionRunner
        cards={[CARDS[0]]}
        pool={CARDS}
        stagesFor={() => 3}
        onFinish={() => {}}
      />,
    )

    await screen.findByTestId('session-progress')

    const seen = new Set<string>()

    for (let step = 0; step < 3; step += 1) {
      // Variantli mashqda tugmalar, matnlida kiritish maydoni bo'ladi —
      // shakl o'zi turni ajratib beradi
      seen.add(screen.queryAllByRole('button', { pressed: false }).length > 0 ? 'tanlash' : 'yozish')

      await answerCurrent()
      fireEvent.click(
        await screen.findByRole('button', { name: /davom etish|tushunarli/i }),
      )
    }

    // Ilgari uchala savol ham bir xil edi: yangi so'zning `repetitions` i
    // 0 bo'lgani uchun zinapoyada faqat "tanib olish" ochiq edi
    expect(seen.size).toBeGreaterThan(1)
  })
})
