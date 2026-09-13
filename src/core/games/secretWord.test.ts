import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { secretWordId } from './secretWord'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date(2026, 8, 13, 12).getTime()

function card(id: string, fields: Partial<CardRecord> = {}): CardRecord {
  return {
    id, word: id, translation: id, language: 'en', interval: 0, repetitions: 0, easeFactor: 2.5,
    dueDate: 0, createdAt: 0, lastReviewedAt: null, totalReviews: 0, lapses: 0, ...fields,
  }
}

describe('sehrli so‘z', () => {
  it('hafta ichida barqaror, keyingi haftada boshqa bo‘lishi mumkin, mustahkam so‘z emas', () => {
    const cards = [...Array.from({ length: 40 }, (_, i) => card(`w${i}`)), card('mature', { interval: 40 })]
    const id = secretWordId(cards, NOW)
    expect(id).not.toBe('mature')
    // 13-sentabr 2026 — yakshanba; shanba o'sha hafta
    expect(secretWordId(cards, NOW - DAY)).toBe(id)
    const weeks = new Set(Array.from({ length: 6 }, (_, i) => secretWordId(cards, NOW + i * 7 * DAY)))
    expect(weeks.size).toBeGreaterThan(1)
  })
})
