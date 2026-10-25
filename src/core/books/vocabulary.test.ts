import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { countEntries, vocabularyGroups } from './vocabulary'

function card(id: string, partial: Partial<CardRecord> = {}): CardRecord {
  return {
    id,
    word: id,
    translation: `${id}-uz`,
    language: 'en',
    level: 'A1',
    topic: 'Oila',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 1,
    lapses: 0,
    ...partial,
  }
}

const UNITS = [
  { id: 'a1-salomlashish', title: 'Salomlashish' },
  { id: 'a1-oila', title: 'Oila' },
]

describe('vocabularyGroups — Lug‘atim', () => {
  const cards = [
    card('mother', { interval: 30, repetitions: 4 }),
    card('father', { lapses: 3, interval: 1, repetitions: 1 }),
    card('hello', { topic: 'Salomlashish', interval: 2, repetitions: 1 }),
    card('unseen', { totalReviews: 0 }),
  ]

  it('faqat ko‘rilgan so‘zlar, o‘quv yo‘li tartibida guruhlangan', () => {
    const groups = vocabularyGroups(cards, { unitOrder: UNITS })

    expect(groups.map((group) => group.title)).toEqual(['Salomlashish', 'Oila'])
    expect(countEntries(groups)).toBe(3)
    expect(groups.flatMap((g) => g.entries.map((e) => e.card.id))).not.toContain('unseen')
  })

  it('guruh ichida eng zaifi birinchi', () => {
    const oila = vocabularyGroups(cards, { unitOrder: UNITS })[1]!
    expect(oila.entries.map((entry) => entry.card.id)).toEqual(['father', 'mother'])
    expect(oila.entries[0]!.hard).toBe(true)
  })

  it('filtrlar: qiyin va mustahkam', () => {
    const hard = vocabularyGroups(cards, { unitOrder: UNITS, filter: 'hard' })
    expect(hard.flatMap((g) => g.entries.map((e) => e.card.id))).toEqual(['father'])

    const strong = vocabularyGroups(cards, { unitOrder: UNITS, filter: 'strong' })
    expect(strong.flatMap((g) => g.entries.map((e) => e.card.id))).toEqual(['mother'])
  })

  it('qidiruv so‘zda, tarjimada va O‘QILISHDA', () => {
    const byWord = vocabularyGroups(cards, { unitOrder: UNITS, query: 'MOTH' })
    expect(countEntries(byWord)).toBe(1)

    const byTranslation = vocabularyGroups(cards, { unitOrder: UNITS, query: 'hello-uz' })
    expect(countEntries(byTranslation)).toBe(1)

    const byReading = vocabularyGroups(cards, {
      unitOrder: UNITS,
      query: 'ota',
      readingOf: (c) => (c.id === 'father' ? 'ota-oqilishi' : null),
    })
    expect(byReading.flatMap((g) => g.entries.map((e) => e.card.id))).toEqual(['father'])
  })
})
