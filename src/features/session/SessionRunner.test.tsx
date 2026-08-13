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
