import { describe, expect, it } from 'vitest'
import { CHALLENGE_BONUS_XP, challengeProgress, dailyChallenge, isChallengeDone } from './challenge'

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

describe('challengeProgress', () => {
  const sources = { correctToday: 7, speedBest: 12, lessonsToday: 1 }

  it('"to‘g‘ri javob" chaqirig‘i TO‘G‘RI JAVOBLARNI sanaydi', () => {
    /*
     * Ilgari ko'rilgan so'zlar soni olinardi — xato javob berilgan
     * so'z ham hisobga o'tardi.
     */
    const challenge = { kind: 'perfectWords' as const, target: 10, title: '', icon: '' }

    expect(challengeProgress(challenge, sources)).toBe(7)
  })

  it('"vaqtga qarshi" chaqirig‘i rekordni oladi', () => {
    const challenge = { kind: 'speedScore' as const, target: 12, title: '', icon: '' }

    expect(challengeProgress(challenge, sources)).toBe(12)
  })

  it('"darsni tugat" chaqirig‘i TUGATILGAN DARSLARNI sanaydi', () => {
    // Ilgari bitta so'z ko'rilishi bilan bajarilib qolardi
    const challenge = { kind: 'finishLesson' as const, target: 1, title: '', icon: '' }

    expect(challengeProgress(challenge, sources)).toBe(1)
  })
})
