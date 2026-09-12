import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { CardRecord } from '@/core/db'
import { WordSky } from './WordSky'

function card(id: string, fields: Partial<CardRecord> = {}): CardRecord {
  return {
    id,
    word: id,
    translation: `${id}-uz`,
    language: 'en',
    interval: 1,
    repetitions: 1,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: 0,
    totalReviews: 1,
    lapses: 0,
    ...fields,
  }
}

describe('WordSky', () => {
  it('har o‘rganilgan so‘z — yulduz, soni ko‘rsatiladi', () => {
    render(<WordSky cards={[card('apple'), card('bread'), card('new', { totalReviews: 0 })]} />)

    expect(screen.getAllByTestId('sky-star')).toHaveLength(2)
    expect(screen.getByTestId('sky-count')).toHaveTextContent('2 yulduz')
  })

  it('bo‘sh osmon undovchi matn bilan', () => {
    render(<WordSky cards={[card('new', { totalReviews: 0 })]} />)

    expect(screen.getByText(/birinchi darsdan keyin/i)).toBeInTheDocument()
  })

  it('yulduzga bosilsa so‘z va tarjimasi chiqadi — osmon foydalanuvchining lug‘ati', () => {
    render(<WordSky cards={[card('apple')]} />)

    fireEvent.click(screen.getByTestId('sky-star'))

    expect(screen.getByTestId('sky-picked')).toHaveTextContent('apple — apple-uz')
  })
})
