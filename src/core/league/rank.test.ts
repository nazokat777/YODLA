import { describe, expect, it } from 'vitest'
import { rankEntries } from './rank'
import { leagueTier, tierTitle } from './tier'

const rows = [
  { code: 'AAA111', name: 'Bobur', xp: 100 },
  { code: 'BBB222', name: 'Aziza', xp: 300 },
  { code: 'CCC333', name: 'Vali', xp: 100 },
]

describe('rankEntries', () => {
  it('XP bo‘yicha kamayish tartibida', () => {
    expect(rankEntries(rows, null).map((entry) => entry.name)).toEqual([
      'Aziza',
      'Bobur',
      'Vali',
    ])
  })

  it('o‘rin 1 dan boshlanadi', () => {
    expect(rankEntries(rows, null).map((entry) => entry.rank)).toEqual([1, 2, 3])
  })

  it('TENG XP da tartib BARQAROR', () => {
    // Ism bo'yicha tartiblanadi: aks holda ro'yxat har yuklanishda
    // o'rin almashib, foydalanuvchi "meni tushirishdi" deb o'ylardi
    const shuffled = [rows[2], rows[0], rows[1]]

    expect(rankEntries(shuffled, null).map((entry) => entry.name)).toEqual(
      rankEntries(rows, null).map((entry) => entry.name),
    )
  })

  it('o‘zini belgilaydi', () => {
    const ranked = rankEntries(rows, 'CCC333')

    expect(ranked.filter((entry) => entry.isMe).map((entry) => entry.name)).toEqual(['Vali'])
  })

  it('kod berilmasa hech kim "men" emas', () => {
    expect(rankEntries(rows, null).some((entry) => entry.isMe)).toBe(false)
  })

  it('kiruvchi ro‘yxatni O‘ZGARTIRMAYDI', () => {
    const input = [...rows]
    rankEntries(input, null)

    expect(input.map((entry) => entry.name)).toEqual(['Bobur', 'Aziza', 'Vali'])
  })

  it('bo‘sh ro‘yxat', () => {
    expect(rankEntries([], 'AAA111')).toEqual([])
  })
})

describe('leagueTier', () => {
  it('chegaralar', () => {
    expect(leagueTier(0)).toBe('bronze')
    expect(leagueTier(199)).toBe('bronze')
    expect(leagueTier(200)).toBe('silver')
    expect(leagueTier(499)).toBe('silver')
    expect(leagueTier(500)).toBe('gold')
    expect(leagueTier(999)).toBe('gold')
    expect(leagueTier(1000)).toBe('diamond')
  })

  it('juda katta XP da ham eng yuqori daraja', () => {
    expect(leagueTier(999_999)).toBe('diamond')
  })

  it('manfiy XP da bronza — tushirish YO‘Q', () => {
    // Daraja joriy haftaning ko'rsatkichi, jazo emas. Kutilmagan
    // qiymatda ham eng past darajaga tushadi, xato bermaydi.
    expect(leagueTier(-50)).toBe('bronze')
  })
})

describe('tierTitle', () => {
  it('har daraja uchun nom bor', () => {
    expect(tierTitle('bronze')).toBe('Bronza')
    expect(tierTitle('silver')).toBe('Kumush')
    expect(tierTitle('gold')).toBe('Oltin')
    expect(tierTitle('diamond')).toBe('Olmos')
  })
})
