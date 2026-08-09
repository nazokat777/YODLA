import { describe, expect, it } from 'vitest'
import { seededRandom } from '@/lib/random'
import { generateCode, leagueTier, rankEntries } from './index'

describe('leagueTier', () => {
  it('chegaralarni to‘g‘ri ajratadi', () => {
    expect(leagueTier(0)).toBe('bronze')
    expect(leagueTier(199)).toBe('bronze')
    expect(leagueTier(200)).toBe('silver')
    expect(leagueTier(499)).toBe('silver')
    expect(leagueTier(500)).toBe('gold')
    expect(leagueTier(999)).toBe('gold')
    expect(leagueTier(1000)).toBe('diamond')
  })

  it('manfiy qiymatda ham yiqilmaydi', () => {
    expect(leagueTier(-5)).toBe('bronze')
  })
})

describe('rankEntries', () => {
  const rows = [
    { code: 'AAA111', name: 'Ali', xp: 120 },
    { code: 'BBB222', name: 'Vali', xp: 300 },
    { code: 'CCC333', name: 'Guli', xp: 300 },
  ]

  it('XP bo‘yicha kamayish tartibida', () => {
    expect(rankEntries(rows, null).map((e) => e.xp)).toEqual([300, 300, 120])
  })

  it('teng XP da ism bo‘yicha tartiblanadi', () => {
    expect(rankEntries(rows, null).map((e) => e.name)).toEqual(['Guli', 'Vali', 'Ali'])
  })

  it('o‘rin raqami 1 dan boshlanadi', () => {
    expect(rankEntries(rows, null).map((e) => e.rank)).toEqual([1, 2, 3])
  })

  it('o‘zini belgilaydi', () => {
    const ranked = rankEntries(rows, 'AAA111')

    expect(ranked.find((e) => e.isMe)?.name).toBe('Ali')
    expect(ranked.filter((e) => e.isMe)).toHaveLength(1)
  })

  it('bo‘sh ro‘yxatda bo‘sh natija', () => {
    expect(rankEntries([], 'AAA111')).toEqual([])
  })
})

describe('generateCode', () => {
  it('6 belgidan iborat', () => {
    expect(generateCode(seededRandom(1))).toHaveLength(6)
  })

  it('chalkash belgilar ishlatilmaydi', () => {
    // 0/O va 1/I bir-biriga o'xshaydi — kod og'zaki aytiladi
    for (let seed = 1; seed < 40; seed += 1) {
      expect(generateCode(seededRandom(seed))).not.toMatch(/[01OI]/)
    }
  })

  it('faqat katta harf va raqam', () => {
    expect(generateCode(seededRandom(5))).toMatch(/^[A-Z2-9]{6}$/)
  })

  it('bir xil urug‘ — bir xil kod', () => {
    expect(generateCode(seededRandom(9))).toBe(generateCode(seededRandom(9)))
  })
})
