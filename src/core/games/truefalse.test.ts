import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { checkTrueFalse, makeTrueFalsePair } from './truefalse'

function card(id: string, word: string, translation: string): CardRecord {
  return {
    id,
    word,
    translation,
    language: 'en',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
  }
}

const APPLE = card('en:apple', 'apple', 'olma')
const POOL = [APPLE, card('en:bread', 'bread', 'non')]

describe('makeTrueFalsePair', () => {
  it('tasodif yarmidan kichik — TO‘G‘RI juft', () => {
    const pair = makeTrueFalsePair(APPLE, POOL, () => 0.1)

    expect(pair).toMatchObject({ shown: 'olma', isTrue: true })
  })

  it('tasodif yarmidan katta — ALMASHTIRILGAN juft', () => {
    const pair = makeTrueFalsePair(APPLE, POOL, () => 0.9)

    expect(pair.isTrue).toBe(false)
    expect(pair.shown).toBe('non')
  })

  it('boshqa karta bo‘lmasa TO‘G‘RI juft beriladi', () => {
    // Bitta kartadan yolg'on juft yasab bo'lmaydi
    const pair = makeTrueFalsePair(APPLE, [APPLE], () => 0.9)

    expect(pair).toMatchObject({ shown: 'olma', isTrue: true })
  })

  it('BIR XIL tarjimali karta almashtirishga olinmaydi', () => {
    /*
     * "olma" ni "olma" ga almashtirish yolg'on juft emas — javob
     * "to'g'ri" bo'lardi, lekin o'yin uni xato deb hisoblardi.
     */
    const twin = card('en:apple2', 'apple tree', 'olma')
    const pair = makeTrueFalsePair(APPLE, [APPLE, twin], () => 0.9)

    expect(pair.isTrue).toBe(true)
  })
})

describe('checkTrueFalse', () => {
  it('to‘g‘ri juftga "ha" — to‘g‘ri javob', () => {
    expect(checkTrueFalse({ card: APPLE, shown: 'olma', isTrue: true }, true)).toBe(true)
  })

  it('yolg‘on juftga "ha" — xato javob', () => {
    expect(checkTrueFalse({ card: APPLE, shown: 'non', isTrue: false }, true)).toBe(false)
  })

  it('yolg‘on juftga "yo‘q" — to‘g‘ri javob', () => {
    expect(checkTrueFalse({ card: APPLE, shown: 'non', isTrue: false }, false)).toBe(true)
  })
})
