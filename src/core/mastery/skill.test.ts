import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { EXERCISE_TYPE_NAMES, errorRate, skillSummary, weakestType } from './skill'

const ALL = ['recognition', 'recall', 'spelling'] as const

function card(typeStats?: CardRecord['typeStats']): CardRecord {
  return {
    id: 'en:apple',
    word: 'apple',
    translation: 'olma',
    language: 'en',
    interval: 1,
    repetitions: 1,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    typeStats,
  }
}

describe('errorRate', () => {
  it('namuna yo‘q bo‘lsa 0', () => {
    expect(errorRate(undefined)).toBe(0)
    expect(errorRate({ seen: 0, wrong: 0 })).toBe(0)
  })

  it('xato ulushini hisoblaydi', () => {
    expect(errorRate({ seen: 4, wrong: 1 })).toBe(0.25)
  })
})

describe('weakestType', () => {
  it('statistikasi yo‘q kartada null', () => {
    expect(weakestType(card(), ALL)).toBeNull()
  })

  it('namuna KAM bo‘lsa baholanmaydi', () => {
    /*
     * Bitta xato javobdan "bu ko'nikma zaif" degan xulosa chiqarish
     * statistik shovqin: bola chalg'igan yoki tugmani noto'g'ri
     * bosgan bo'lishi mumkin.
     */
    expect(weakestType(card({ spelling: { seen: 2, wrong: 2 } }), ALL)).toBeNull()
  })

  it('eng ko‘p xato qilingan turni tanlaydi', () => {
    const subject = card({
      recognition: { seen: 10, wrong: 1 },
      spelling: { seen: 6, wrong: 4 },
    })

    expect(weakestType(subject, ALL)).toBe('spelling')
  })

  it('MAVJUD bo‘lmagan tur tanlanmaydi', () => {
    // Kartada jumla yo'q bo'lsa "jumla tuzish" yaratilmaydi — uni
    // tavsiya qilish mashqni umuman bermaslikka olib kelardi
    const subject = card({
      recall: { seen: 5, wrong: 1 },
      spelling: { seen: 5, wrong: 5 },
    })

    expect(weakestType(subject, ['recognition', 'recall'])).toBe('recall')
  })

  it('hech qayerda xato bo‘lmasa null', () => {
    const subject = card({ recognition: { seen: 8, wrong: 0 } })

    expect(weakestType(subject, ALL)).toBeNull()
  })
})

describe('skillSummary', () => {
  it('kartalar bo‘ylab yig‘adi va eng yomonini oldinga qo‘yadi', () => {
    const cards = [
      card({ recognition: { seen: 5, wrong: 0 }, recall: { seen: 3, wrong: 2 } }),
      card({ recognition: { seen: 5, wrong: 1 }, recall: { seen: 3, wrong: 1 } }),
    ]

    const result = skillSummary(cards)

    expect(result[0]).toEqual({ type: 'recall', seen: 6, wrong: 3 })
    expect(result[1]).toEqual({ type: 'recognition', seen: 10, wrong: 1 })
  })

  it('namunasi kam turlar CHIQMAYDI', () => {
    expect(skillSummary([card({ spelling: { seen: 1, wrong: 1 } })])).toEqual([])
  })

  it('statistikasiz kartalarda bo‘sh', () => {
    expect(skillSummary([card()])).toEqual([])
  })
})

describe('EXERCISE_TYPE_NAMES', () => {
  it('har tur uchun o‘zbekcha nom bor', () => {
    // Foydalanuvchiga `spelling` deb ko'rsatish mumkin emas
    expect(Object.values(EXERCISE_TYPE_NAMES).every((name) => name.length > 0)).toBe(true)
    expect(Object.keys(EXERCISE_TYPE_NAMES)).toHaveLength(7)
  })
})
