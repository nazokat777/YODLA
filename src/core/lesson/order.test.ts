import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { pickLessonCards } from './order'

/** Test uchun minimal karta; kerakli maydonlar ustidan yoziladi */
function card(id: string, partial: Partial<CardRecord> = {}): CardRecord {
  return {
    id,
    word: id,
    translation: id,
    language: 'en',
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

describe('pickLessonCards', () => {
  it('A1 kartalarni A2 va B1 dan oldin qaytaradi', () => {
    const cards = [
      card('b1', { level: 'B1' }),
      card('a2', { level: 'A2' }),
      card('a1', { level: 'A1' }),
    ]

    expect(pickLessonCards(cards, 3).map((c) => c.id)).toEqual(['a1', 'a2', 'b1'])
  })

  it('daraja ichida ko‘rilmagan karta ko‘rilganidan oldin turadi', () => {
    const cards = [
      card('seen', { level: 'A1', totalReviews: 4 }),
      card('fresh', { level: 'A1', totalReviews: 0 }),
    ]

    expect(pickLessonCards(cards, 2).map((c) => c.id)).toEqual(['fresh', 'seen'])
  })

  it('bir xil ko‘rilganda eng kam mustahkam karta oldin turadi', () => {
    const cards = [
      card('strong', { level: 'A1', totalReviews: 2, interval: 21 }),
      card('weak', { level: 'A1', totalReviews: 2, interval: 1 }),
    ]

    expect(pickLessonCards(cards, 2).map((c) => c.id)).toEqual(['weak', 'strong'])
  })

  it('A1 tugallangach A2 kartasi darsga chiqadi', () => {
    // A1 so'zlari allaqachon ko'rilgan, A2 hali yangi.
    // "Ko'rilmagan" mezoni darajadan ustun — aks holda dars A1 da
    // abadiy qolib ketardi va A2 hech qachon ochilmasdi.
    const cards = [
      card('a1', { level: 'A1', totalReviews: 3 }),
      card('a2', { level: 'A2', totalReviews: 0 }),
    ]

    expect(pickLessonCards(cards, 1).map((c) => c.id)).toEqual(['a2'])
    expect(pickLessonCards(cards, 2).map((c) => c.id)).toEqual(['a2', 'a1'])
  })

  it('ko‘rilmaganlar orasida past daraja oldin turadi', () => {
    const cards = [
      card('b1', { level: 'B1', totalReviews: 0 }),
      card('a1', { level: 'A1', totalReviews: 0 }),
      card('a2', { level: 'A2', totalReviews: 0 }),
    ]

    expect(pickLessonCards(cards, 3).map((c) => c.id)).toEqual(['a1', 'a2', 'b1'])
  })

  it('darajasi yo‘q kartalar oxirida turadi', () => {
    const cards = [card('none'), card('b1', { level: 'B1' })]

    expect(pickLessonCards(cards, 2).map((c) => c.id)).toEqual(['b1', 'none'])
  })

  it('so‘ralgan hajmdan ko‘p qaytarmaydi va bo‘sh ro‘yxatni qo‘llaydi', () => {
    const cards = [card('a', { level: 'A1' }), card('b', { level: 'A1' })]

    expect(pickLessonCards(cards, 1)).toHaveLength(1)
    expect(pickLessonCards([], 5)).toEqual([])
  })

  it('kiruvchi massivni o‘zgartirmaydi', () => {
    const cards = [card('b', { level: 'B1' }), card('a', { level: 'A1' })]

    pickLessonCards(cards, 2)

    expect(cards.map((c) => c.id)).toEqual(['b', 'a'])
  })
})

describe('pickLessonCards — boshlang‘ich daraja', () => {
  it('past darajadagi ko‘rilmagan so‘z oxirga suriladi', () => {
    const cards = [
      card('a1', { level: 'A1', totalReviews: 0 }),
      card('a2', { level: 'A2', totalReviews: 0 }),
    ]

    expect(pickLessonCards(cards, 2, 'A2').map((c) => c.id)).toEqual(['a2', 'a1'])
  })

  it('ko‘rilgan kartalar past darajadagi yangi so‘zdan oldin turadi', () => {
    // Mustahkamlash "bilaman" deb belgilangan darajadagi so'zdan muhimroq
    const cards = [
      card('a1', { level: 'A1', totalReviews: 0 }),
      card('b1seen', { level: 'B1', totalReviews: 5 }),
    ]

    expect(pickLessonCards(cards, 2, 'A2').map((c) => c.id)).toEqual(['b1seen', 'a1'])
  })

  it('boshqa hech narsa qolmasa past daraja baribir qaytadi', () => {
    // Dars hech qachon bo'sh qaytmaydi
    const cards = [card('a1', { level: 'A1', totalReviews: 0 })]

    expect(pickLessonCards(cards, 5, 'B1').map((c) => c.id)).toEqual(['a1'])
  })

  it('minLevel berilmasa tartib o‘zgarmaydi', () => {
    const cards = [
      card('a2', { level: 'A2', totalReviews: 0 }),
      card('a1', { level: 'A1', totalReviews: 0 }),
    ]

    expect(pickLessonCards(cards, 2).map((c) => c.id)).toEqual(['a1', 'a2'])
  })

  it('minLevel A1 bo‘lsa hech narsa surilmaydi', () => {
    const cards = [
      card('a2', { level: 'A2', totalReviews: 0 }),
      card('a1', { level: 'A1', totalReviews: 0 }),
    ]

    expect(pickLessonCards(cards, 2, 'A1').map((c) => c.id)).toEqual(['a1', 'a2'])
  })
})
