import { describe, expect, it } from 'vitest'
import type { CardRecord, DailyStat } from '@/core/db'
import { personalBestDay, tomorrowPreview } from './tomorrow'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date(2026, 8, 12, 15).getTime()

function card(id: string, fields: Partial<CardRecord> = {}): CardRecord {
  return {
    id, word: id, translation: id, language: 'en', interval: 1, repetitions: 1,
    easeFactor: 2.5, dueDate: NOW, createdAt: 0, lastReviewedAt: NOW, totalReviews: 1, lapses: 0,
    ...fields,
  }
}
function day(offset: number, xp: number): DailyStat {
  return { day: NOW + offset * DAY, xp, answered: 1, correct: 1, cardIds: [], goalBonusAwarded: false }
}

describe('tomorrowPreview', () => {
  it('ertaga muddati yetadigan so‘zlarni sanaydi', () => {
    const cards = [
      card('a', { dueDate: NOW + DAY }),
      card('b', { dueDate: NOW + 5 * DAY }),
      card('c', { dueDate: NOW - DAY }),
      card('new', { dueDate: NOW, totalReviews: 0 }),
    ]
    expect(tomorrowPreview(cards, 3, NOW)).toEqual({ dueTomorrow: 2, streakTomorrow: 4 })
  })
})

describe('personalBestDay', () => {
  it('bugun avvalgi eng yaxshi kundan oshsa — rekord', () => {
    expect(personalBestDay([day(-1, 40), day(-2, 90)], day(0, 100))).toEqual({ previousBest: 90 })
  })

  it('oshmasa — rekord emas', () => {
    expect(personalBestDay([day(-1, 120)], day(0, 100))).toBeNull()
  })

  it('birinchi kun rekord deb e’lon qilinmaydi', () => {
    expect(personalBestDay([day(0, 100)], day(0, 100))).toBeNull()
  })
})
