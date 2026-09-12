import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { wordOfDay } from './wordOfDay'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date(2026, 8, 12, 12).getTime()

function card(id: string, fields: Partial<CardRecord> = {}): CardRecord {
  return {
    id, word: id, translation: id + '-uz', language: 'en', level: 'A1', interval: 0, repetitions: 0,
    easeFactor: 2.5, dueDate: 0, createdAt: 0, lastReviewedAt: null, totalReviews: 0, lapses: 0, ...fields,
  }
}

describe('wordOfDay', () => {
  it('faqat KO‘RILMAGAN so‘zlardan, kun ichida barqaror, ertaga boshqa bo‘lishi mumkin', () => {
    const cards = Array.from({ length: 30 }, (_, i) => card(`w${i}`))
    cards.push(card('seen', { totalReviews: 3 }))

    const today = wordOfDay(cards, NOW)
    expect(today).not.toBeNull()
    expect(today!.totalReviews).toBe(0)
    expect(wordOfDay(cards, NOW + 3600_000)?.id).toBe(today!.id)

    const week = new Set(Array.from({ length: 7 }, (_, i) => wordOfDay(cards, NOW + i * DAY)?.id))
    expect(week.size).toBeGreaterThan(1)
  })

  it('hamma so‘z ko‘rilgan bo‘lsa null', () => {
    expect(wordOfDay([card('a', { totalReviews: 1 })], NOW)).toBeNull()
  })
})
