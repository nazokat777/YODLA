import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { CardRecord } from '@/core/db'
import { WordPreview } from './WordPreview'

function card(id: string, partial: Partial<CardRecord>): CardRecord {
  return {
    id,
    word: id,
    translation: id,
    language: 'ar',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    ...partial,
  }
}

describe('WordPreview — dars oldidan so‘zlar ro‘yxati', () => {
  const cards = [
    card('ar:kitab', {
      word: 'كِتَاب',
      translation: 'kitob',
      sentence: 'هَذَا كِتَابٌ',
      sentenceTranslation: 'Bu kitob',
    }),
    card('ar:qalam', { word: 'قَلَمٌ', translation: 'qalam' }),
  ]

  it('har so‘z: yozilishi, o‘qilishi, tarjimasi va jumlasi', () => {
    render(<WordPreview cards={cards} onStart={() => {}} />)

    expect(screen.getByText('Bugungi 2 ta so‘z')).toBeInTheDocument()
    const first = screen.getByTestId('preview-ar:kitab')
    expect(first).toHaveTextContent('كِتَاب')
    expect(first).toHaveTextContent('[kitab]')
    expect(first).toHaveTextContent('kitob')
    expect(first).toHaveTextContent('Bu kitob')
    expect(screen.getByTestId('preview-ar:qalam')).toHaveTextContent('qalam')
  })

  it('"Yodlashni boshlash" darsni boshlaydi', () => {
    const onStart = vi.fn()
    render(<WordPreview cards={cards} onStart={onStart} />)

    fireEvent.click(screen.getByTestId('preview-start'))
    expect(onStart).toHaveBeenCalledOnce()
  })
})
