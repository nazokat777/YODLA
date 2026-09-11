import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { CardRecord } from '@/core/db'
import type { Exercise } from '@/core/exercises'
import * as recognition from '@/lib/recognition'
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

describe('FeedbackBar — talaffuz', () => {
  it('xato javobdan keyin talaffuzni tekshirish tugmasi chiqadi', () => {
    vi.spyOn(recognition, 'isRecognitionSupported').mockReturnValue(true)

    renderBar(makeCard())

    expect(
      screen.getByRole('button', { name: /talaffuzni tekshirish/i }),
    ).toBeInTheDocument()
  })
})

describe('jadval o‘zgarmagan javob', () => {
  it('"keyingi takrorlash" YOZILMAYDI', () => {
    // So'z shu seansda ikkinchi marta chiqqan — bu mashq, jadval esa
    // birinchi javobda allaqachon belgilangan. "Keyingi takrorlash: 6 kun"
    // deb yozish yolg'on bo'lardi: hech narsa o'zgarmadi.
    renderBar(makeCard(), 'correct', null)

    expect(screen.queryByText(/keyingi takrorlash/i)).not.toBeInTheDocument()
  })
})

describe('FeedbackBar — so‘z kuchi', () => {
  it('BAHOLANGAN kartaning kuchi ko‘rsatiladi, mashqdagi eski karta emas', () => {
    /*
     * `exercise.card` javobdan OLDINGI holat. Indikator uni o'qisa,
     * bola bugun qilgan ishi so'zni oldinga surganini ko'rmasdi.
     */
    const stale = makeCard({ interval: 0, repetitions: 0 })
    const graded = { ...stale, interval: 6, repetitions: 2 }

    render(
      <FeedbackBar
        exercise={exerciseFor(stale)}
        verdict="correct"
        nextIntervalDays={6}
        gradedCard={graded}
        xpGained={2}
        goalJustCompleted={false}
        onContinue={() => {}}
      />,
    )

    expect(screen.getByTestId('word-strength')).toHaveTextContent('O‘rganilmoqda')
  })

  it('baholanmagan (takroriy) javobda mashq kartasi ishlatiladi', () => {
    const card = makeCard({ interval: 30, repetitions: 5 })

    renderBar(card, 'correct', null)

    expect(screen.getByTestId('word-strength')).toHaveTextContent('Yodlangan')
  })
})
