import { describe, expect, it } from 'vitest'
import { buildInviteUrl, filterFriends, normalizeCode } from './friends'

describe('normalizeCode', () => {
  it('kichik harf va bo‘shliqni tozalaydi', () => {
    expect(normalizeCode(' n2n aws ')).toBe('N2NAWS')
  })

  it('noto‘g‘ri uzunlikda null', () => {
    expect(normalizeCode('N2NAW')).toBeNull()
    expect(normalizeCode('N2NAWSX')).toBeNull()
  })

  it('chalkash belgilar qabul qilinmaydi', () => {
    // Alifboda 0/O va 1/I yo'q — ular kiritilsa bu xato
    expect(normalizeCode('N0NAWS')).toBeNull()
    expect(normalizeCode('N1NAWS')).toBeNull()
    expect(normalizeCode('NONAWS')).toBeNull()
  })

  it('bo‘sh satrda null', () => {
    expect(normalizeCode('')).toBeNull()
  })
})

describe('filterFriends', () => {
  const rows = [
    { code: 'AAAAAA', name: 'Men', xp: 100 },
    { code: 'BBBBBB', name: 'Ali', xp: 200 },
    { code: 'CCCCCC', name: 'Begona', xp: 300 },
  ]

  it('o‘zim va do‘stlarim qoladi', () => {
    const result = filterFriends(rows, 'AAAAAA', ['BBBBBB'])

    expect(result.map((r) => r.name)).toEqual(['Men', 'Ali'])
  })

  it('o‘zim do‘st bo‘lmasa ham ro‘yxatda', () => {
    const result = filterFriends(rows, 'AAAAAA', [])

    expect(result.map((r) => r.name)).toEqual(['Men'])
  })

  it('noma’lum kod tushib qoladi', () => {
    const result = filterFriends(rows, 'AAAAAA', ['ZZZZZZ'])

    expect(result).toHaveLength(1)
  })
})

describe('buildInviteUrl', () => {
  it('kod parametrini qo‘shadi', () => {
    expect(buildInviteUrl('https://yodla.app', 'N2NAWS')).toBe(
      'https://yodla.app/league?add=N2NAWS',
    )
  })
})
