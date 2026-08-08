import { describe, expect, it } from 'vitest'
import { addDays, startOfDay } from '@/lib/date'
import {
  applyStreakFreeze,
  awardFreezes,
  computeLongestStreak,
  computeStreak,
  MAX_STREAK_FREEZES,
} from './streak'

/** 15-yanvar 2026, soat 10:00 (lokal) */
const NOW = new Date(2026, 0, 15, 10, 0, 0).getTime()
const TODAY = startOfDay(NOW)

/** `daysAgo` kun oldingi kun boshi */
const dayAgo = (daysAgo: number) => addDays(TODAY, -daysAgo)

describe('computeStreak', () => {
  it('faoliyat bo‘lmasa streak nol', () => {
    expect(computeStreak({ activeDays: [], frozenDays: [], now: NOW })).toEqual({
      current: 0,
      activeToday: false,
      atRisk: false,
    })
  })

  it('faqat bugun mashq qilinsa — 1 kun', () => {
    const result = computeStreak({ activeDays: [dayAgo(0)], frozenDays: [], now: NOW })

    expect(result.current).toBe(1)
    expect(result.activeToday).toBe(true)
    expect(result.atRisk).toBe(false)
  })

  it('ketma-ket kunlarni sanaydi', () => {
    const result = computeStreak({
      activeDays: [dayAgo(0), dayAgo(1), dayAgo(2), dayAgo(3)],
      frozenDays: [],
      now: NOW,
    })

    expect(result.current).toBe(4)
  })

  it('bugun hali mashq qilinmagan bo‘lsa, streak tirik lekin xavf ostida', () => {
    const result = computeStreak({
      activeDays: [dayAgo(1), dayAgo(2), dayAgo(3)],
      frozenDays: [],
      now: NOW,
    })

    expect(result.current).toBe(3)
    expect(result.activeToday).toBe(false)
    expect(result.atRisk).toBe(true)
  })

  it('kecha ham, bugun ham bo‘lmasa — streak uzilgan', () => {
    const result = computeStreak({
      activeDays: [dayAgo(2), dayAgo(3), dayAgo(4)],
      frozenDays: [],
      now: NOW,
    })

    expect(result.current).toBe(0)
    expect(result.atRisk).toBe(false)
  })

  it('muzlatilgan kun ketma-ketlikni uzmaydi', () => {
    const result = computeStreak({
      activeDays: [dayAgo(0), dayAgo(2), dayAgo(3)],
      frozenDays: [dayAgo(1)],
      now: NOW,
    })

    // 3 ta HAQIQIY faol kun; muzlatilgan kun ko'prik vazifasini bajaradi
    expect(result.current).toBe(3)
  })

  it('muzlatilgan kun streak uzunligiga QO‘SHILMAYDI', () => {
    // Foydalanuvchi o'sha kuni mashq qilmagan — uni "faol kun" deb
    // ko'rsatish yolg'on bo'lardi
    const withFreeze = computeStreak({
      activeDays: [dayAgo(0), dayAgo(2)],
      frozenDays: [dayAgo(1)],
      now: NOW,
    })
    const withoutGap = computeStreak({
      activeDays: [dayAgo(0), dayAgo(1), dayAgo(2)],
      frozenDays: [],
      now: NOW,
    })

    expect(withFreeze.current).toBe(2)
    expect(withoutGap.current).toBe(3)
  })

  it('bir kun ichida bir necha vaqt bir marta sanaladi', () => {
    const morning = new Date(2026, 0, 15, 8, 0).getTime()
    const evening = new Date(2026, 0, 15, 22, 0).getTime()

    const result = computeStreak({ activeDays: [morning, evening], frozenDays: [], now: NOW })

    expect(result.current).toBe(1)
  })

  it('kunlar tartibsiz kelsa ham to‘g‘ri ishlaydi', () => {
    const result = computeStreak({
      activeDays: [dayAgo(2), dayAgo(0), dayAgo(1)],
      frozenDays: [],
      now: NOW,
    })

    expect(result.current).toBe(3)
  })
})

describe('computeLongestStreak', () => {
  it('faoliyat bo‘lmasa nol', () => {
    expect(computeLongestStreak([])).toBe(0)
  })

  it('eng uzun ketma-ketlikni topadi', () => {
    // 5 kunlik ketma-ketlik, keyin uzilish, keyin 2 kunlik
    const days = [
      dayAgo(20), dayAgo(19), dayAgo(18), dayAgo(17), dayAgo(16),
      dayAgo(5), dayAgo(4),
    ]

    expect(computeLongestStreak(days)).toBe(5)
  })

  it('joriy ketma-ketlik eng uzun bo‘lsa ham topadi', () => {
    expect(computeLongestStreak([dayAgo(2), dayAgo(1), dayAgo(0)])).toBe(3)
  })

  it('muzlatilgan kunlar ketma-ketlikni birlashtiradi', () => {
    const days = [dayAgo(4), dayAgo(3), dayAgo(1), dayAgo(0)]

    expect(computeLongestStreak(days)).toBe(2)
    expect(computeLongestStreak(days, [dayAgo(2)])).toBe(4)
  })
})

describe('applyStreakFreeze', () => {
  it('kecha mashq qilingan bo‘lsa muzlatish ishlatilmaydi', () => {
    const result = applyStreakFreeze({
      activeDays: [dayAgo(1)],
      frozenDays: [],
      freezesAvailable: 1,
      now: NOW,
    })

    expect(result.used).toBe(false)
    expect(result.freezesAvailable).toBe(1)
  })

  it('kecha o‘tkazib yuborilgan bo‘lsa streakni saqlaydi', () => {
    const result = applyStreakFreeze({
      activeDays: [dayAgo(2), dayAgo(3)],
      frozenDays: [],
      freezesAvailable: 1,
      now: NOW,
    })

    expect(result.used).toBe(true)
    expect(result.freezesAvailable).toBe(0)
    expect(result.frozenDays).toContain(dayAgo(1))

    // Streak haqiqatan saqlanib qoldi
    expect(
      computeStreak({ activeDays: [dayAgo(2), dayAgo(3)], frozenDays: result.frozenDays, now: NOW })
        .current,
    ).toBe(2)
  })

  it('muzlatish qolmagan bo‘lsa hech narsa qilmaydi', () => {
    const result = applyStreakFreeze({
      activeDays: [dayAgo(2)],
      frozenDays: [],
      freezesAvailable: 0,
      now: NOW,
    })

    expect(result.used).toBe(false)
    expect(result.frozenDays).toHaveLength(0)
  })

  it('ikki kun o‘tkazib yuborilsa saqlamaydi', () => {
    // Aks holda muzlatish "cheksiz kechikish" imkonini berardi
    const result = applyStreakFreeze({
      activeDays: [dayAgo(3), dayAgo(4)],
      frozenDays: [],
      freezesAvailable: 1,
      now: NOW,
    })

    expect(result.used).toBe(false)
  })

  it('umuman faoliyat bo‘lmagan foydalanuvchida muzlatish sarflanmaydi', () => {
    const result = applyStreakFreeze({
      activeDays: [],
      frozenDays: [],
      freezesAvailable: 2,
      now: NOW,
    })

    expect(result.used).toBe(false)
    expect(result.freezesAvailable).toBe(2)
  })

  it('bir kun uchun ikki marta muzlatilmaydi', () => {
    const first = applyStreakFreeze({
      activeDays: [dayAgo(2)],
      frozenDays: [],
      freezesAvailable: 2,
      now: NOW,
    })
    const second = applyStreakFreeze({
      activeDays: [dayAgo(2)],
      frozenDays: first.frozenDays,
      freezesAvailable: first.freezesAvailable,
      now: NOW,
    })

    expect(first.used).toBe(true)
    expect(second.used).toBe(false)
    expect(second.freezesAvailable).toBe(1)
  })
})

describe('awardFreezes', () => {
  it('7 kunlik bosqichda muzlatish beriladi', () => {
    const result = awardFreezes(7, 0, 0)

    expect(result.freezesAvailable).toBe(1)
    expect(result.lastAwardedAtStreak).toBe(7)
  })

  it('bir bosqich uchun ikki marta bermaydi', () => {
    const first = awardFreezes(7, 0, 0)
    const second = awardFreezes(8, first.freezesAvailable, first.lastAwardedAtStreak)

    expect(second.freezesAvailable).toBe(1)
  })

  it('keyingi bosqichda yana beradi', () => {
    const result = awardFreezes(14, 0, 7)

    expect(result.freezesAvailable).toBe(1)
    expect(result.lastAwardedAtStreak).toBe(14)
  })

  it('yuqori chegaradan oshmaydi', () => {
    const result = awardFreezes(21, MAX_STREAK_FREEZES, 14)

    expect(result.freezesAvailable).toBe(MAX_STREAK_FREEZES)
  })

  it('7 kundan kam streakda bermaydi', () => {
    expect(awardFreezes(6, 0, 0).freezesAvailable).toBe(0)
    expect(awardFreezes(0, 0, 0).freezesAvailable).toBe(0)
  })
})
