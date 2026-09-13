import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { CardRecord } from '@/core/db'
import { MemoryRouter } from 'react-router-dom'
import { WordOfDay } from './WordOfDay'

vi.mock('@/lib/speech', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/speech')>()),
  speak: vi.fn(),
}))

function card(id: string, fields: Partial<CardRecord> = {}): CardRecord {
  return {
    id, word: id, translation: id + '-uz', language: 'en', level: 'A1', interval: 0, repetitions: 0,
    easeFactor: 2.5, dueDate: 0, createdAt: 0, lastReviewedAt: null, totalReviews: 0, lapses: 0, ...fields,
  }
}

describe('WordOfDay', () => {
  it('ma’no YOPIQ turadi, bosilganda ochiladi', () => {
    render(
      <MemoryRouter>
        <WordOfDay cards={[card('apple', { topic: 'Ovqat' })]} />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('word-of-day')).toHaveTextContent('apple')
    expect(screen.queryByTestId('word-of-day-meaning')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /ma.nosini ko.rish/i }))

    expect(screen.getByTestId('word-of-day-meaning')).toHaveTextContent('apple-uz')
    expect(screen.getByTestId('word-of-day-lesson')).toHaveAttribute('href', '/lesson/a1-ovqat')
  })

  it('ko‘rilmagan so‘z qolmasa karta yo‘q', () => {
    const { container } = render(
      <MemoryRouter>
        <WordOfDay cards={[card('a', { totalReviews: 2 })]} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('joriy bo‘limning rasmli so‘zi afzal — keyingi darsda uchraydi', () => {
    const cards = [
      card('apple', { topic: 'Ovqat', translation: 'olma' }),
      card('mother', { topic: 'Oila', translation: 'ona' }),
    ]
    render(
      <MemoryRouter>
        <WordOfDay cards={cards} unitId="a1-oila" />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('word-of-day')).toHaveTextContent('mother')
  })
})
