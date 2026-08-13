import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { CardRecord } from '@/core/db'
import type { Exercise } from '@/core/exercises'
import { ExerciseView } from './ExerciseView'
import { EMPTY_ANSWER, type ExerciseAnswerState } from './answerState'

function makeCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    id: 'en:water',
    word: 'water',
    translation: 'suv',
    language: 'en',
    topic: 'Ovqat',
    interval: 0,
    repetitions: 2,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    ...overrides,
  }
}

/** Javob holatini ushlab turadigan minimal o'ram */
function renderExercise(exercise: Exercise, answer: ExerciseAnswerState = EMPTY_ANSWER) {
  const onSubmit = vi.fn()
  const onAnswerChange = vi.fn()

  render(
    <ExerciseView
      exercise={exercise}
      answer={answer}
      onAnswerChange={onAnswerChange}
      revealed={false}
      onSubmit={onSubmit}
    />,
  )

  return { onSubmit, onAnswerChange }
}

describe('ExerciseView — gap ichida (cloze)', () => {
  const cloze: Exercise = {
    id: 'en:water:cloze',
    type: 'cloze',
    card: makeCard(),
    prompt: 'I drink ___ every morning',
    options: ['water', 'bread', 'tea', 'salt'],
    correctIndex: 0,
  }

  it('jumla bo‘sh joy bilan ko‘rsatiladi', () => {
    renderExercise(cloze)

    expect(screen.getByText(/I drink ___ every morning/)).toBeInTheDocument()
  })

  it('variantni bosish javobni darhol yuboradi', () => {
    const { onSubmit, onAnswerChange } = renderExercise(cloze)

    fireEvent.click(screen.getByRole('button', { name: /water/i }))

    expect(onAnswerChange).toHaveBeenCalledWith(expect.objectContaining({ choiceIndex: 0 }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ choiceIndex: 0 }))
  })
})

describe('ExerciseView — harfma-harf (spelling)', () => {
  const spelling: Exercise = {
    id: 'en:water:spelling',
    type: 'spelling',
    card: makeCard(),
    prompt: 'suv',
    letters: ['t', 'a', 'w', 'e', 'r'],
    answer: 'water',
  }

  it('tarjima va barcha harflar ko‘rinadi', () => {
    renderExercise(spelling)

    expect(screen.getByText('suv')).toBeInTheDocument()

    for (const letter of spelling.type === 'spelling' ? spelling.letters : []) {
      expect(screen.getByRole('button', { name: new RegExp(`^${letter} .*qo`) })).toBeInTheDocument()
    }
  })

  it('harf bosilganda javob tartibiga qo‘shiladi', () => {
    const { onAnswerChange } = renderExercise(spelling)

    // Uchinchi harf — "w"
    fireEvent.click(screen.getByRole('button', { name: /^w .*qo/ }))

    expect(onAnswerChange).toHaveBeenCalledWith(expect.objectContaining({ tokenOrder: [2] }))
  })

  it('tanlangan harfni qayta bosib olib tashlash mumkin', () => {
    const { onAnswerChange } = renderExercise(spelling, { ...EMPTY_ANSWER, tokenOrder: [2, 1] })

    fireEvent.click(screen.getByRole('button', { name: /^a .*olib tashlash/ }))

    expect(onAnswerChange).toHaveBeenCalledWith(expect.objectContaining({ tokenOrder: [2] }))
  })
})
