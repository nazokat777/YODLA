import { describe, expect, it } from 'vitest'
import { addDays, startOfDay } from '@/lib/date'
import {
  DAILY_GOAL_BONUS_XP,
  PERFECT_SESSION_BONUS_XP,
  XP_PER_VERDICT,
} from '@/core/gamification'
import { addMissingCards, gradeCard } from './cards.repo'
import { db } from './db'
import {
  ensureProfile,
  finalizeSession,
  getDailyStat,
  getProgressSnapshot,
  getRecentDailyStats,
  recordAnswer,
  recordPerfectSession,
  runDailyMaintenance,
  syncBadges,
} from './progress.repo'

const NOW = new Date(2026, 0, 15, 10, 0, 0).getTime()
const TODAY = startOfDay(NOW)
const dayAgo = (n: number) => addDays(TODAY, -n)

/** Qulaylik: bir nechta javob yozish */
async function answer(cardId: string, verdict: 'correct' | 'almost' | 'wrong', now = NOW) {
  return recordAnswer({ cardId, verdict, dailyGoalWords: 20, now })
}

describe('ensureProfile', () => {
  it('birinchi chaqiruvda profil yaratadi', async () => {
    const profile = await ensureProfile()

    expect(profile.id).toBe('me')
    expect(profile.totalXp).toBe(0)
    // Boshlang'ich sovg'a: bitta muzlatish
    expect(profile.freezesAvailable).toBe(1)
  })

  it('ikkinchi chaqiruvda mavjudini qaytaradi (progressni o‘chirmaydi)', async () => {
    await ensureProfile()
    await answer('en:hello', 'correct')

    const profile = await ensureProfile()

    expect(profile.totalXp).toBe(XP_PER_VERDICT.correct)
  })
})

describe('recordAnswer', () => {
  it('XP beradi va kunlik statistikani yangilaydi', async () => {
    const result = await answer('en:hello', 'correct')

    expect(result.xpGained).toBe(XP_PER_VERDICT.correct)
    expect(result.totalXp).toBe(XP_PER_VERDICT.correct)
    expect(result.daily.answered).toBe(1)
    expect(result.daily.correct).toBe(1)
    expect(result.daily.cardIds).toEqual(['en:hello'])
  })

  it('xato javob ham XP beradi, lekin "correct" ni oshirmaydi', async () => {
    const result = await answer('en:hello', 'wrong')

    expect(result.xpGained).toBe(XP_PER_VERDICT.wrong)
    expect(result.daily.correct).toBe(0)
    expect(result.daily.answered).toBe(1)
  })

  it('kichik imlo xatosi "to‘g‘ri" tomonda sanaladi', async () => {
    const result = await answer('en:hello', 'almost')

    expect(result.daily.correct).toBe(1)
    expect(result.xpGained).toBe(XP_PER_VERDICT.almost)
  })

  it('bir xil karta takroran javob berilsa noyob ro‘yxatga bir marta tushadi', async () => {
    await answer('en:hello', 'wrong')
    const result = await answer('en:hello', 'correct')

    expect(result.daily.answered).toBe(2)
    expect(result.daily.cardIds).toEqual(['en:hello'])
  })

  it('turli kunlar alohida yozuvlarga yoziladi', async () => {
    await answer('en:hello', 'correct', NOW)
    await answer('en:water', 'correct', addDays(NOW, 1))

    expect((await getDailyStat(NOW)).answered).toBe(1)
    expect((await getDailyStat(addDays(NOW, 1))).answered).toBe(1)
    expect(await getRecentDailyStats()).toHaveLength(2)
  })
})

describe('recordAnswer — kunlik maqsad bonusi', () => {
  it('maqsadga yetilganda bir marta bonus beriladi', async () => {
    let last = await recordAnswer({
      cardId: 'card-0',
      verdict: 'correct',
      dailyGoalWords: 3,
      now: NOW,
    })
    expect(last.goalJustCompleted).toBe(false)

    last = await recordAnswer({ cardId: 'card-1', verdict: 'correct', dailyGoalWords: 3, now: NOW })
    expect(last.goalJustCompleted).toBe(false)

    // Uchinchi NOYOB karta — maqsad bajarildi
    last = await recordAnswer({ cardId: 'card-2', verdict: 'correct', dailyGoalWords: 3, now: NOW })
    expect(last.goalJustCompleted).toBe(true)
    expect(last.xpGained).toBe(XP_PER_VERDICT.correct + DAILY_GOAL_BONUS_XP)

    // To'rtinchisi bonus bermaydi
    last = await recordAnswer({ cardId: 'card-3', verdict: 'correct', dailyGoalWords: 3, now: NOW })
    expect(last.goalJustCompleted).toBe(false)
    expect(last.xpGained).toBe(XP_PER_VERDICT.correct)
  })

  it('bitta so‘zni ko‘p marta takrorlash maqsadni bajarmaydi', async () => {
    for (let i = 0; i < 10; i += 1) {
      const result = await recordAnswer({
        cardId: 'en:hello',
        verdict: 'correct',
        dailyGoalWords: 3,
        now: NOW,
      })
      expect(result.goalJustCompleted).toBe(false)
    }

    expect((await getDailyStat(NOW)).goalBonusAwarded).toBe(false)
  })
})

describe('runDailyMaintenance — streak muzlatish', () => {
  it('kecha o‘tkazib yuborilgan bo‘lsa muzlatish sarflaydi', async () => {
    await answer('en:hello', 'correct', dayAgo(2) + 36_000_000)
    await answer('en:water', 'correct', dayAgo(3) + 36_000_000)

    const profile = await runDailyMaintenance(NOW)

    expect(profile.freezesAvailable).toBe(0)
    expect(profile.frozenDays).toContain(dayAgo(1))

    const snapshot = await getProgressSnapshot(NOW)
    expect(snapshot.streak.current).toBe(2)
  })

  it('kecha mashq qilingan bo‘lsa muzlatish sarflanmaydi', async () => {
    await answer('en:hello', 'correct', dayAgo(1) + 36_000_000)

    const profile = await runDailyMaintenance(NOW)

    expect(profile.freezesAvailable).toBe(1)
    expect(profile.frozenDays).toHaveLength(0)
  })

  it('ikki marta chaqirilsa ikkinchi muzlatish sarflanmaydi', async () => {
    await answer('en:hello', 'correct', dayAgo(2) + 36_000_000)

    await runDailyMaintenance(NOW)
    const second = await runDailyMaintenance(NOW)

    expect(second.freezesAvailable).toBe(0)
    expect(second.frozenDays).toHaveLength(1)
  })

  it('7 kunlik streakda yangi muzlatish beradi', async () => {
    for (let i = 0; i <= 6; i += 1) {
      await answer(`card-${i}`, 'correct', dayAgo(i) + 36_000_000)
    }

    const profile = await runDailyMaintenance(NOW)

    // Boshlang'ich 1 ta + bosqich uchun 1 ta
    expect(profile.freezesAvailable).toBe(2)
    expect(profile.lastFreezeAwardedAtStreak).toBe(7)
  })
})

describe('getProgressSnapshot', () => {
  it('bo‘sh bazada xavfsiz qiymatlar qaytaradi', async () => {
    const snapshot = await getProgressSnapshot(NOW)

    expect(snapshot.streak.current).toBe(0)
    expect(snapshot.longestStreak).toBe(0)
    expect(snapshot.level.level).toBe(1)
    expect(snapshot.daily.answered).toBe(0)
  })

  it('XP darajaga aylanadi', async () => {
    // 10 ta to'g'ri javob = 100 XP = 2-daraja
    for (let i = 0; i < 10; i += 1) {
      await answer(`card-${i}`, 'correct')
    }

    const snapshot = await getProgressSnapshot(NOW)

    expect(snapshot.profile.totalXp).toBe(100)
    expect(snapshot.level.level).toBe(2)
  })

  it('faol kunlardan streakni hisoblaydi', async () => {
    await answer('a', 'correct', dayAgo(0) + 36_000_000)
    await answer('b', 'correct', dayAgo(1) + 36_000_000)
    await answer('c', 'correct', dayAgo(2) + 36_000_000)

    const snapshot = await getProgressSnapshot(NOW)

    expect(snapshot.streak.current).toBe(3)
    expect(snapshot.streak.activeToday).toBe(true)
  })
})

describe('syncBadges', () => {
  const baseStats = {
    learnedWords: 0,
    matureWords: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalAnswers: 0,
  }

  it('shart bajarilganda nishon ochiladi va saqlanadi', async () => {
    await ensureProfile()

    const result = await syncBadges({ ...baseStats, learnedWords: 10 }, NOW)

    expect(result.newlyUnlocked).toContain('first-10-words')
    expect((await db.profile.get('me'))?.unlockedBadges).toContain('first-10-words')
  })

  it('ikkinchi chaqiruvda "yangi" deb qaytarmaydi', async () => {
    await ensureProfile()
    await syncBadges({ ...baseStats, learnedWords: 10 }, NOW)

    const second = await syncBadges({ ...baseStats, learnedWords: 10 }, NOW)

    expect(second.newlyUnlocked).toHaveLength(0)
    expect(second.unlocked).toContain('first-10-words')
  })

  it('ochilish vaqtini yozib qo‘yadi', async () => {
    await ensureProfile()
    await syncBadges({ ...baseStats, learnedWords: 1 }, NOW)

    expect((await db.profile.get('me'))?.badgeUnlockedAt['first-steps']).toBe(NOW)
  })

  it('XP nishoni profildagi jami XP dan hisoblanadi', async () => {
    // 100 ta to'g'ri javob = 1000 XP
    for (let i = 0; i < 100; i += 1) {
      await answer(`card-${i}`, 'correct')
    }

    const result = await syncBadges(baseStats, NOW)

    expect(result.unlocked).toContain('xp-1000')
  })

  it('benuqson seans nishoni profil hisoblagichidan olinadi', async () => {
    await ensureProfile()
    await recordPerfectSession()

    const result = await syncBadges(baseStats, NOW)

    expect(result.unlocked).toContain('perfect-session')
  })
})

describe('kombo va benuqson bonusi', () => {
  it('kombo bonusi javob XP siga QO‘SHILADI', async () => {
    const withoutBonus = await recordAnswer({
      cardId: 'en:a',
      verdict: 'correct',
      dailyGoalWords: 999,
    })
    const withBonus = await recordAnswer({
      cardId: 'en:b',
      verdict: 'correct',
      dailyGoalWords: 999,
      bonusXp: 5,
    })

    expect(withBonus.xpGained).toBe(withoutBonus.xpGained + 5)
  })

  it('benuqson seans qo‘shimcha XP beradi', async () => {
    const before = (await getDailyStat()).xp

    const result = await finalizeSession({ answered: 4, wrong: 0 })

    expect(result.perfectBonusXp).toBe(PERFECT_SESSION_BONUS_XP)
    expect((await getDailyStat()).xp).toBe(before + PERFECT_SESSION_BONUS_XP)
  })

  it('bitta xato bo‘lsa bonus YO‘Q', async () => {
    const result = await finalizeSession({ answered: 4, wrong: 1 })

    expect(result.perfectBonusXp).toBe(0)
  })
})

describe('nishonlar seansdan tashqarida ham ochiladi', () => {
  it('shart bajarilgan bo‘lsa ilova ochilishida ochiladi', async () => {
    // Foydalanuvchi darsni YARIM TASHLAB ketgan bo'lishi mumkin —
    // bola ilovani shunchaki yopadi. Unda `finalizeSession` chaqirilmaydi
    // va nishon ochilmasdan qolardi: profilda "1 / 1" to'lgan, lekin
    // kulrang nishon turardi va bu buzuq ko'rinardi.
    // Nishonlar KARTALAR progressidan hisoblanadi, javoblar sonidan emas
    await addMissingCards([{ word: 'hello', translation: 'salom', language: 'en' }])
    await gradeCard('en:hello', 5)

    const before = await ensureProfile()
    expect(before.unlockedBadges).toEqual([])

    await runDailyMaintenance()

    const after = await ensureProfile()
    expect(after.unlockedBadges.length).toBeGreaterThan(0)
  })
})
