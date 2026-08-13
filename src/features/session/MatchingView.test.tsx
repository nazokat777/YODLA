import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { CardRecord } from '@/core/db'
import type { MatchingExercise } from '@/core/exercises'
import { MatchingView, type MatchingResult } from './MatchingView'

function makeCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    id: 'en:water',
    word: 'water',
    translation: 'suv',
    language: 'en',
    topic: 'Ovqat',
    interval: 0,
    repetitions: 1,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    ...overrides,
  }
}

const EXERCISE: MatchingExercise = {
  id: 'en:water:matching',
  type: 'matching',
  card: makeCard(),
  pairs: [
    { cardId: 'en:water', word: 'water', translation: 'suv' },
    { cardId: 'en:bread', word: 'bread', translation: 'non' },
    { cardId: 'en:tea', word: 'tea', translation: 'choy' },
  ],
}

/** So'z tugmasi (chap ustun) */
const word = (text: string) => screen.getByRole('button', { name: `${text} — so'z` })
/** Tarjima tugmasi (o'ng ustun) */
const translation = (text: string) => screen.getByRole('button', { name: `${text} — tarjima` })

function renderView() {
  const onComplete = vi.fn<(results: MatchingResult[]) => void>()
  render(<MatchingView exercise={EXERCISE} onComplete={onComplete} />)

  return { onComplete }
}

describe('MatchingView', () => {
  it('barcha so‘z va tarjimalar ko‘rinadi', () => {
    renderView()

    for (const pair of EXERCISE.pairs) {
      expect(word(pair.word)).toBeInTheDocument()
      expect(translation(pair.translation)).toBeInTheDocument()
    }
  })

  it('hamma juft to‘g‘ri topilsa onComplete hammasini correct bilan chaqiradi', () => {
    const { onComplete } = renderView()

    for (const pair of EXERCISE.pairs) {
      fireEvent.click(word(pair.word))
      fireEvent.click(translation(pair.translation))
    }

    expect(onComplete).toHaveBeenCalledTimes(1)

    const results = onComplete.mock.calls[0][0]
    expect(results).toHaveLength(3)
    expect(results.every((result) => result.verdict === 'correct')).toBe(true)
  })

  it('yakun barcha juft topilmaguncha chaqirilmaydi', () => {
    const { onComplete } = renderView()

    fireEvent.click(word('water'))
    fireEvent.click(translation('suv'))

    expect(onComplete).not.toHaveBeenCalled()
  })

  it('xato juftlangan karta wrong sifatida yoziladi', () => {
    const { onComplete } = renderView()

    // "water" ni "non" ga noto'g'ri juftlaymiz
    fireEvent.click(word('water'))
    fireEvent.click(translation('non'))

    // So'ng hammasini to'g'ri yakunlaymiz
    for (const pair of EXERCISE.pairs) {
      fireEvent.click(word(pair.word))
      fireEvent.click(translation(pair.translation))
    }

    const results = onComplete.mock.calls[0][0]
    const water = results.find((result) => result.cardId === 'en:water')

    expect(water?.verdict).toBe('wrong')
    // Boshqalari jazolanmaydi
    expect(results.find((result) => result.cardId === 'en:tea')?.verdict).toBe('correct')
  })

  it('xato juftdan keyin ham qayta urinish mumkin (jazolamaydi)', () => {
    const { onComplete } = renderView()

    fireEvent.click(word('water'))
    fireEvent.click(translation('choy'))

    // Tugmalar hali ham faol
    expect(word('water')).not.toBeDisabled()
    expect(translation('choy')).not.toBeDisabled()

    for (const pair of EXERCISE.pairs) {
      fireEvent.click(word(pair.word))
      fireEvent.click(translation(pair.translation))
    }

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('topilgan juft tugmalari o‘chiriladi', () => {
    renderView()

    fireEvent.click(word('bread'))
    fireEvent.click(translation('non'))

    expect(word('bread')).toBeDisabled()
    expect(translation('non')).toBeDisabled()
  })
})
