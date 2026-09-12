import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { hashString, skyStars } from './sky'

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

describe('skyStars', () => {
  it('faqat ko‘rilgan so‘zlar yulduz bo‘ladi', () => {
    const { stars, total } = skyStars([card('a'), card('b', { totalReviews: 0 })])

    expect(stars.map((s) => s.id)).toEqual(['a'])
    expect(total).toBe(1)
  })

  it('yulduz o‘rni BARQAROR — so‘zdan hisoblanadi', () => {
    const first = skyStars([card('apple')]).stars[0]!
    const second = skyStars([card('apple')]).stars[0]!

    expect(first.x).toBe(second.x)
    expect(first.y).toBe(second.y)
    expect(hashString('apple')).toBe(hashString('apple'))
    expect(hashString('apple')).not.toBe(hashString('bread'))
  })

  it('yulduzlar chetlarga yopishmaydi', () => {
    const cards = Array.from({ length: 300 }, (_, i) => card(`w${i}`))
    for (const star of skyStars(cards, 300).stars) {
      expect(star.x).toBeGreaterThanOrEqual(4)
      expect(star.x).toBeLessThanOrEqual(96)
      expect(star.y).toBeGreaterThanOrEqual(4)
      expect(star.y).toBeLessThanOrEqual(96)
    }
  })

  it('chegara oshsa eng KUCHLI so‘zlar qoladi, jami son saqlanadi', () => {
    const cards = [
      card('weak', { interval: 1 }),
      card('mature', { interval: 40, repetitions: 5 }),
      card('mid', { interval: 10, repetitions: 3 }),
    ]
    const { stars, total } = skyStars(cards, 2)

    expect(stars.map((s) => s.id)).toEqual(['mature', 'mid'])
    expect(total).toBe(3)
  })
})
