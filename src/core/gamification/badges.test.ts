import { describe, expect, it } from 'vitest'
import { BADGES, newlyUnlockedBadgeIds, unlockedBadgeIds, type BadgeStats } from './badges'

function makeStats(overrides: Partial<BadgeStats> = {}): BadgeStats {
  return {
    learnedWords: 0,
    matureWords: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalXp: 0,
    level: 1,
    totalAnswers: 0,
    perfectSessions: 0,
    ...overrides,
  }
}

describe('BADGES ro‘yxati', () => {
  it('id lar takrorlanmaydi', () => {
    const ids = BADGES.map((badge) => badge.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('har nishonda sarlavha, tavsif va ikonka bor', () => {
    for (const badge of BADGES) {
      expect(badge.title.length).toBeGreaterThan(0)
      expect(badge.description.length).toBeGreaterThan(0)
      expect(badge.icon.length).toBeGreaterThan(0)
    }
  })

  it('TZ da nomlangan uchta nishon mavjud', () => {
    const ids = BADGES.map((badge) => badge.id)
    expect(ids).toContain('first-10-words')
    expect(ids).toContain('streak-7')
    expect(ids).toContain('hundred-words')
  })

  it('bo‘sh statistikada hech biri ochilmagan', () => {
    expect(unlockedBadgeIds(makeStats())).toHaveLength(0)
  })

  it('progress har doim maqsaddan oshmaydi', () => {
    const huge = makeStats({
      learnedWords: 10_000,
      matureWords: 10_000,
      longestStreak: 10_000,
      totalXp: 10_000_000,
      perfectSessions: 500,
    })

    for (const badge of BADGES) {
      const { value, target } = badge.progress(huge)
      expect(value).toBeLessThanOrEqual(target)
      expect(target).toBeGreaterThan(0)
    }
  })
})

describe('nishon shartlari', () => {
  it('"Birinchi 10 so‘z" aynan 10 tada ochiladi', () => {
    expect(unlockedBadgeIds(makeStats({ learnedWords: 9 }))).not.toContain('first-10-words')
    expect(unlockedBadgeIds(makeStats({ learnedWords: 10 }))).toContain('first-10-words')
  })

  it('"7 kunlik streak" ENG UZUN streakka qarab beriladi', () => {
    // Streak uzilgan bo'lsa ham, qo'lga kiritilgan yutuq yo'qolmaydi
    const stats = makeStats({ currentStreak: 0, longestStreak: 7 })

    expect(unlockedBadgeIds(stats)).toContain('streak-7')
  })

  it('kichik yutuq katta yutuq bilan birga ochiladi', () => {
    const unlocked = unlockedBadgeIds(makeStats({ learnedWords: 100 }))

    expect(unlocked).toContain('first-steps')
    expect(unlocked).toContain('first-10-words')
    expect(unlocked).toContain('hundred-words')
  })

  it('"Benuqson seans" bitta xatosiz seansdan keyin ochiladi', () => {
    expect(unlockedBadgeIds(makeStats({ perfectSessions: 1 }))).toContain('perfect-session')
  })
})

describe('newlyUnlockedBadgeIds', () => {
  it('faqat YANGI ochilganlarni qaytaradi', () => {
    const stats = makeStats({ learnedWords: 10 })

    const newly = newlyUnlockedBadgeIds(stats, ['first-steps'])

    expect(newly).toContain('first-10-words')
    expect(newly).not.toContain('first-steps')
  })

  it('yangi yutuq bo‘lmasa bo‘sh massiv', () => {
    const stats = makeStats({ learnedWords: 1 })

    expect(newlyUnlockedBadgeIds(stats, ['first-steps'])).toHaveLength(0)
  })

  it('keyinchalik qo‘shilgan nishon eski yutuq uchun ham ochiladi', () => {
    // Shart har safar qayta hisoblanadi — saqlangan ro'yxatga tayanmaydi
    const stats = makeStats({ learnedWords: 100, longestStreak: 30 })

    const newly = newlyUnlockedBadgeIds(stats, [])

    expect(newly).toContain('hundred-words')
    expect(newly).toContain('streak-30')
  })
})
