import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { CardRecord } from '@/core/db'
import { WordIntro } from './WordIntro'

const CARD: CardRecord = {
  id: 'en:hello',
  word: 'hello',
  translation: 'salom',
  language: 'en',
  level: 'A1',
  topic: 'Salomlashish',
  interval: 0,
  repetitions: 0,
  easeFactor: 2.5,
  dueDate: 0,
  createdAt: 0,
  lastReviewedAt: null,
  totalReviews: 0,
  lapses: 0,
}

describe('WordIntro', () => {
  it('so‘zni VA tarjimasini birga ko‘rsatadi', () => {
    render(<WordIntro card={CARD} onContinue={() => {}} />)

    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText('salom')).toBeInTheDocument()
  })

  it('“yangi so‘z” ekani aytiladi', () => {
    render(<WordIntro card={CARD} onContinue={() => {}} />)

    expect(screen.getByText(/yangi so‘z|yangi so'z/i)).toBeInTheDocument()
  })

  it('davom etish tugmasi bosilganda onContinue chaqiriladi', () => {
    const onContinue = vi.fn()
    render(<WordIntro card={CARD} onContinue={onContinue} />)

    fireEvent.click(screen.getByRole('button', { name: /tushundim/i }))

    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('so‘z o‘rganilayotgan til yo‘nalishida chiziladi', () => {
    render(<WordIntro card={{ ...CARD, language: 'ar', word: 'سَلَام' }} onContinue={() => {}} />)

    expect(screen.getByText('سَلَام').closest('[dir]')).toHaveAttribute('dir', 'rtl')
  })
})

it('tarjima ekran o‘quvchi uchun BELGILANADI', () => {
  /*
   * Chiziq faqat ko'z uchun: ekran o'quvchi kartani "вода, voda, suv"
   * deb o'qiydi va oxirgisi tarjima ekani hech nimadan bilinmaydi.
   */
  render(<WordIntro card={CARD} onContinue={() => {}} />)

  expect(screen.getByText(/ma.nosi:/i)).toBeInTheDocument()
})
