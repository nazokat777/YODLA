import { describe, expect, it } from 'vitest'
import { levelFromXp, levelTitle, xpForAnswer, xpToReachLevel } from './xp'

describe('xpForAnswer', () => {
  it('to‘g‘ri javob eng ko‘p XP beradi', () => {
    expect(xpForAnswer('correct')).toBeGreaterThan(xpForAnswer('almost'))
    expect(xpForAnswer('almost')).toBeGreaterThan(xpForAnswer('wrong'))
  })

  it('xato javob ham XP beradi — urinish taqdirlanadi', () => {
    // TZ 4: xatoda jazolamaslik tamoyili
    expect(xpForAnswer('wrong')).toBeGreaterThan(0)
  })
})

describe('xpToReachLevel', () => {
  it.each([
    [1, 0],
    [2, 100],
    [3, 300],
    [4, 600],
    [5, 1000],
  ])('%i-daraja uchun %i XP kerak', (level, expected) => {
    expect(xpToReachLevel(level)).toBe(expected)
  })

  it('0 va manfiy darajalar uchun 0', () => {
    expect(xpToReachLevel(0)).toBe(0)
    expect(xpToReachLevel(-5)).toBe(0)
  })

  it('har daraja oldingisidan qimmatroq (o‘sish sekinlashadi)', () => {
    const widths = [2, 3, 4, 5, 6].map((l) => xpToReachLevel(l) - xpToReachLevel(l - 1))

    for (let i = 1; i < widths.length; i += 1) {
      expect(widths[i]).toBeGreaterThan(widths[i - 1])
    }
  })
})

describe('levelFromXp', () => {
  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [299, 2],
    [300, 3],
    [599, 3],
    [600, 4],
    [1000, 5],
  ])('%i XP → %i-daraja', (xp, expected) => {
    expect(levelFromXp(xp).level).toBe(expected)
  })

  it('chegara qiymatlari xpToReachLevel bilan mos', () => {
    // Formula va teskari formula bir-biriga zid bo‘lmasligi kerak
    for (let level = 1; level <= 30; level += 1) {
      const threshold = xpToReachLevel(level)
      expect(levelFromXp(threshold).level).toBe(level)
      if (threshold > 0) expect(levelFromXp(threshold - 1).level).toBe(level - 1)
    }
  })

  it('daraja ichidagi progressni to‘g‘ri hisoblaydi', () => {
    // 2-daraja 100 dan 300 gacha, ya'ni kengligi 200
    const progress = levelFromXp(200)

    expect(progress.level).toBe(2)
    expect(progress.xpIntoLevel).toBe(100)
    expect(progress.xpForNextLevel).toBe(200)
    expect(progress.ratio).toBeCloseTo(0.5)
  })

  it('manfiy yoki kasr XP xavfsiz ishlanadi', () => {
    expect(levelFromXp(-100).level).toBe(1)
    expect(levelFromXp(150.7).level).toBe(2)
  })
})

describe('levelTitle', () => {
  it('daraja oshgani sari unvon o‘zgaradi', () => {
    expect(levelTitle(1)).toBe('Yangi boshlovchi')
    expect(levelTitle(3)).toBe("O'rganuvchi")
    expect(levelTitle(7)).toBe('Ishonchli')
    expect(levelTitle(20)).toBe('Ustoz')
  })

  it('juda katta daraja uchun ham unvon bor', () => {
    expect(levelTitle(999)).toBe('Ustoz')
  })
})
