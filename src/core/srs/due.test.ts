import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { pickDueCards } from './due'

const NOW = 1_700_000_000_000

function card(overrides: Partial<CardRecord>): CardRecord {
  return {
    id: 'en:x',
    word: 'x',
    translation: 'x',
    language: 'en',
    interval: 1,
    repetitions: 1,
    easeFactor: 2.5,
    dueDate: NOW,
    createdAt: 0,
    lastReviewedAt: NOW,
    totalReviews: 1,
    lapses: 0,
    ...overrides,
  }
}

describe('pickDueCards', () => {
  it('hali KO‘RILMAGAN so‘z navbatga tushmaydi', () => {
    const fresh = card({ id: 'en:new', totalReviews: 0, dueDate: NOW - 1000 })

    // Yangi so'z darsda o'rganiladi; uni takrorlash navbatiga qo'yish
    // "takrorlash" tushunchasini ma'nosiz qilardi
    expect(pickDueCards([fresh], NOW)).toEqual([])
  })

  it('muddati yetmaganini olmaydi', () => {
    expect(pickDueCards([card({ dueDate: NOW + 1 })], NOW)).toEqual([])
  })

  it('eng kutib qolgani BIRINCHI', () => {
    const late = card({ id: 'en:late', dueDate: NOW - 5000 })
    const soon = card({ id: 'en:soon', dueDate: NOW - 10 })

    expect(pickDueCards([soon, late], NOW).map((c) => c.id)).toEqual(['en:late', 'en:soon'])
  })

  it('chegaradan ortig‘ini kesadi', () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      card({ id: `en:${i}`, dueDate: NOW - i }),
    )

    expect(pickDueCards(many, NOW, 2)).toHaveLength(2)
  })
})
