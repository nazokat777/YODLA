import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { isStillStruggling, pickWeakest, weakness } from './weakness'

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_700_000_000_000

function card(id: string, fields: Partial<CardRecord> = {}): CardRecord {
  return {
    id,
    word: id,
    translation: id,
    language: 'en',
    interval: 6,
    repetitions: 2,
    easeFactor: 2.5,
    dueDate: NOW,
    createdAt: 0,
    lastReviewedAt: NOW,
    totalReviews: 3,
    lapses: 0,
    ...fields,
  }
}

describe('weakness', () => {
  it('ko‘p xato qilingan so‘z zaifroq', () => {
    expect(weakness(card('a', { lapses: 3 }), NOW)).toBeGreaterThan(
      weakness(card('b', { lapses: 0 }), NOW),
    )
  })

  it('yengilligi past so‘z zaifroq', () => {
    // `easeFactor` SM-2 da so'zning qiyinligini ko'rsatadi: past qiymat
    // — foydalanuvchi u bilan ko'p qiynalgan
    expect(weakness(card('a', { easeFactor: 1.4 }), NOW)).toBeGreaterThan(
      weakness(card('b', { easeFactor: 2.5 }), NOW),
    )
  })

  it('ko‘pdan beri ko‘rilmagan so‘z zaifroq', () => {
    expect(weakness(card('a', { lastReviewedAt: NOW - 30 * DAY }), NOW)).toBeGreaterThan(
      weakness(card('b', { lastReviewedAt: NOW }), NOW),
    )
  })

  it('hech qachon ko‘rilmagan YANGI so‘z eng zaif deb hisoblanmaydi', () => {
    /*
     * `lastReviewedAt: null` — karta bazaga yozilgan, lekin hali bir
     * marta ham so'ralmagan. Uni to'g'ridan-to'g'ri songa aylantirsa
     * `null` NOL bo'lib, "1970-yildan beri ko'rilmagan" degan ma'noni
     * berardi: baho ~2800 ga chiqib, HAR QANDAY haqiqiy qiyin so'zni
     * ro'yxatdan surib chiqarardi.
     *
     * Shuning uchun hisob karta YARATILGAN vaqtdan boshlanadi.
     */
    const fresh = weakness(
      card('yangi', { lastReviewedAt: null, totalReviews: 0, createdAt: NOW - 2 * DAY }),
      NOW,
    )
    const struggled = weakness(card('qiyin', { lapses: 4, easeFactor: 1.5 }), NOW)

    expect(fresh).toBeLessThan(struggled)
  })
})

describe('pickWeakest', () => {
  it('eng zaif N ta so‘zni qaytaradi', () => {
    const cards = [
      card('oson', { lapses: 0 }),
      card('qiyin', { lapses: 5 }),
      card('ortacha', { lapses: 2 }),
    ]

    expect(pickWeakest(cards, 2, NOW).map((item) => item.id)).toEqual(['qiyin', 'ortacha'])
  })

  it('so‘rovdan kam karta bo‘lsa hammasi qaytadi', () => {
    expect(pickWeakest([card('a')], 12, NOW)).toHaveLength(1)
  })

  it('bo‘sh ro‘yxatda bo‘sh natija', () => {
    expect(pickWeakest([], 12, NOW)).toEqual([])
  })

  it('kirish massivi O‘ZGARTIRILMAYDI', () => {
    const cards = [card('a', { lapses: 0 }), card('b', { lapses: 9 })]

    pickWeakest(cards, 2, NOW)

    expect(cards.map((item) => item.id)).toEqual(['a', 'b'])
  })
})

describe('isStillStruggling', () => {
  it('ko‘p unutilgan va hali mustahkam bo‘lmagan so‘z — qiyin', () => {
    expect(isStillStruggling(card('a', { lapses: 4, interval: 3 }), 2)).toBe(true)
  })

  it('kam unutilgan so‘z — qiyin emas', () => {
    expect(isStillStruggling(card('a', { lapses: 1, interval: 3 }), 2)).toBe(false)
  })

  it('ko‘p unutilgan, lekin ENDI yodlangan so‘z — qiyin EMAS', () => {
    /*
     * `lapses` tarixiy son va hech qachon kamaymaydi. Bola so'zni
     * mashq qilib mustahkam o'rgangan bo'lsa ham, u ro'yxatdan hech
     * qachon chiqmasdi — mashqning ma'nosi yo'qolardi.
     */
    expect(isStillStruggling(card('a', { lapses: 6, interval: 30, repetitions: 6 }), 2)).toBe(
      false,
    )
  })
})
