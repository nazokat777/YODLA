import { describe, expect, it } from 'vitest'
import { CHALLENGE_BONUS_XP, dailyChallenge, isChallengeDone } from './challenge'

const DAY = 24 * 60 * 60 * 1000

describe('dailyChallenge', () => {
  it('bir kun ichida BARQAROR', () => {
    /*
     * Tasodifiy tanlansa, foydalanuvchi sahifani yangilaganda vazifa
     * o'zgarib turardi va uni bajarish mumkin bo'lmasdi.
     */
    /*
     * MAHALLIY vaqt: kun chegarasi foydalanuvchining kunidan
     * hisoblanadi (`startOfDay`), UTC dan emas — aks holda kechqurun
     * boshlangan vazifa yarim tunda o'zgarib ketardi.
     */
    const morning = new Date(2026, 8, 7, 6, 0).getTime()
    const evening = new Date(2026, 8, 7, 21, 30).getTime()

    expect(dailyChallenge(morning)).toEqual(dailyChallenge(evening))
  })

  it('kun o‘zgarganda vazifa ham o‘zgaradi', () => {
    const today = new Date(2026, 8, 7, 10, 0).getTime()

    const kinds = new Set([0, 1, 2].map((offset) => dailyChallenge(today + offset * DAY).kind))

    expect(kinds.size).toBeGreaterThan(1)
  })

  it('har vazifada matn, nishon va maqsad bor', () => {
    const challenge = dailyChallenge(Date.now())

    expect(challenge.title.length).toBeGreaterThan(0)
    expect(challenge.icon.length).toBeGreaterThan(0)
    expect(challenge.target).toBeGreaterThan(0)
  })

  it('bonus sezilarli', () => {
    // Kichik bonus har kuni qaytish uchun sabab bo'lmaydi
    expect(CHALLENGE_BONUS_XP).toBeGreaterThanOrEqual(25)
  })
})

describe('isChallengeDone', () => {
  const challenge = dailyChallenge(0)

  it('maqsadga yetganda bajarilgan', () => {
    expect(isChallengeDone(challenge, challenge.target)).toBe(true)
  })

  it('kam bo‘lsa hali bajarilmagan', () => {
    expect(isChallengeDone(challenge, challenge.target - 1)).toBe(false)
  })
})
