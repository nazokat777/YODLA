import type { AnswerVerdict } from '@/core/exercises'
import {
  applyStreakFreeze,
  awardFreezes,
  computeLongestStreak,
  computeStreak,
  DAILY_GOAL_BONUS_XP,
  levelFromXp,
  newlyUnlockedBadgeIds,
  xpForAnswer,
  type BadgeStats,
  type StreakResult,
} from '@/core/gamification'
import { startOfDay } from '@/lib/date'
import { getGlobalCardStats } from './cards.repo'
import { db } from './db'
import { createProfile, type DailyStat, type ProfileRecord } from './schema'

/** Bo'sh kunlik yozuv */
function createDailyStat(day: number): DailyStat {
  return { day, xp: 0, answered: 0, correct: 0, cardIds: [], goalBonusAwarded: false }
}

/**
 * Profilni o'qish; bo'lmasa yaratish.
 * Barcha o'zgartirishlar shu funksiyadan boshlanadi.
 */
export async function ensureProfile(): Promise<ProfileRecord> {
  return db.transaction('rw', db.profile, async () => {
    const existing = await db.profile.get('me')
    if (existing) return existing

    const fresh = createProfile()
    await db.profile.put(fresh)
    return fresh
  })
}

/** Bugungi kunlik yozuv (bo'lmasa — bo'sh nusxa, bazaga yozilmaydi) */
export async function getDailyStat(now: number = Date.now()): Promise<DailyStat> {
  const day = startOfDay(now)
  return (await db.dailyStats.get(day)) ?? createDailyStat(day)
}

/** Oxirgi N kunlik yozuvlar — grafik va statistika uchun */
export function getRecentDailyStats(count = 30): Promise<DailyStat[]> {
  return db.dailyStats.orderBy('day').reverse().limit(count).toArray()
}

/** Barcha faol kunlar (streak hisoblash uchun) */
async function getActiveDays(): Promise<number[]> {
  const stats = await db.dailyStats.toArray()
  // "Faol kun" — kamida bitta javob berilgan kun
  return stats.filter((stat) => stat.answered > 0).map((stat) => stat.day)
}

export interface RecordAnswerInput {
  cardId: string
  verdict: AnswerVerdict
  /** Foydalanuvchi tanlagan kunlik maqsad (so'z) */
  dailyGoalWords: number
  now?: number
}

export interface RecordAnswerResult {
  /** Shu javob uchun berilgan XP (bonus bilan) */
  xpGained: number
  /** Kunlik maqsad AYNAN shu javob bilan bajarildimi */
  goalJustCompleted: boolean
  daily: DailyStat
  totalXp: number
}

/**
 * Bitta javobni yozib qo'yish: XP, kunlik statistika, maqsad bonusi.
 *
 * `gradeCard` dan KEYIN chaqiriladi. Ikkalasi bitta tranzaksiyada emas,
 * chunki ular turli jadvallar va turli mas'uliyat: SRS jadvali buzilmasligi
 * geymifikatsiyadan muhimroq. Bu yozuv muvaffaqiyatsiz bo'lsa, foydalanuvchi
 * XP yo'qotadi, lekin takrorlash progressi saqlanib qoladi.
 */
export async function recordAnswer({
  cardId,
  verdict,
  dailyGoalWords,
  now = Date.now(),
}: RecordAnswerInput): Promise<RecordAnswerResult> {
  const day = startOfDay(now)

  return db.transaction('rw', db.dailyStats, db.profile, async () => {
    const daily = (await db.dailyStats.get(day)) ?? createDailyStat(day)
    const profile = (await db.profile.get('me')) ?? createProfile()

    const baseXp = xpForAnswer(verdict)
    const wasGoalReached = daily.cardIds.length >= dailyGoalWords

    daily.answered += 1
    if (verdict !== 'wrong') daily.correct += 1
    if (!daily.cardIds.includes(cardId)) daily.cardIds.push(cardId)

    // Kunlik maqsad bonusi bir marta beriladi
    const goalJustCompleted =
      !wasGoalReached && !daily.goalBonusAwarded && daily.cardIds.length >= dailyGoalWords

    const xpGained = baseXp + (goalJustCompleted ? DAILY_GOAL_BONUS_XP : 0)
    if (goalJustCompleted) daily.goalBonusAwarded = true

    daily.xp += xpGained
    profile.totalXp += xpGained

    await db.dailyStats.put(daily)
    await db.profile.put(profile)

    return { xpGained, goalJustCompleted, daily, totalXp: profile.totalXp }
  })
}

/**
 * Kunlik xizmat ko'rsatish — ilova ochilganda bir marta.
 *
 * Ikki ish qiladi:
 *  1. Kecha o'tkazib yuborilgan bo'lsa, muzlatish sarflab streakni saqlaydi.
 *  2. Streak 7 kunlik bosqichga yetgan bo'lsa, yangi muzlatish beradi.
 */
export async function runDailyMaintenance(now: number = Date.now()): Promise<ProfileRecord> {
  await ensureProfile()
  const activeDays = await getActiveDays()

  return db.transaction('rw', db.profile, async () => {
    const profile = (await db.profile.get('me')) ?? createProfile()

    const freeze = applyStreakFreeze({
      activeDays,
      frozenDays: profile.frozenDays,
      freezesAvailable: profile.freezesAvailable,
      now,
    })

    const streak = computeStreak({
      activeDays,
      frozenDays: freeze.frozenDays,
      now,
    })

    const award = awardFreezes(
      streak.current,
      freeze.freezesAvailable,
      profile.lastFreezeAwardedAtStreak,
    )

    const updated: ProfileRecord = {
      ...profile,
      frozenDays: freeze.frozenDays,
      freezesAvailable: award.freezesAvailable,
      lastFreezeAwardedAtStreak: award.lastAwardedAtStreak,
    }

    await db.profile.put(updated)
    return updated
  })
}

/** Seans bitta ham xatosiz tugadi — nishon uchun sanaladi */
export async function recordPerfectSession(): Promise<void> {
  await db.transaction('rw', db.profile, async () => {
    const profile = (await db.profile.get('me')) ?? createProfile()
    await db.profile.put({ ...profile, perfectSessions: profile.perfectSessions + 1 })
  })
}

/**
 * Nishonlarni qayta hisoblash va yangi ochilganlarini qaytarish.
 *
 * Nishonlar SAQLANADI (`unlockedBadges`), lekin shart har safar qayta
 * tekshiriladi — shuning uchun keyinchalik qo'shilgan nishon ham eski
 * yutuqlar uchun ochiladi.
 */
export async function syncBadges(
  stats: Omit<BadgeStats, 'totalXp' | 'level' | 'perfectSessions'>,
  now: number = Date.now(),
): Promise<{ unlocked: string[]; newlyUnlocked: string[] }> {
  return db.transaction('rw', db.profile, async () => {
    const profile = (await db.profile.get('me')) ?? createProfile()

    const full: BadgeStats = {
      ...stats,
      totalXp: profile.totalXp,
      level: levelFromXp(profile.totalXp).level,
      perfectSessions: profile.perfectSessions,
    }

    const newly = newlyUnlockedBadgeIds(full, profile.unlockedBadges)
    if (newly.length === 0) {
      return { unlocked: profile.unlockedBadges, newlyUnlocked: [] }
    }

    const unlocked = [...profile.unlockedBadges, ...newly]
    const badgeUnlockedAt = { ...profile.badgeUnlockedAt }
    for (const id of newly) badgeUnlockedAt[id] = now

    await db.profile.put({ ...profile, unlockedBadges: unlocked, badgeUnlockedAt })
    return { unlocked, newlyUnlocked: newly }
  })
}

export interface FinalizeSessionInput {
  /** Seansda berilgan javoblar soni */
  answered: number
  /** Xato javoblar soni */
  wrong: number
  now?: number
}

/**
 * Seans yakuni: benuqson seansni belgilash va nishonlarni qayta hisoblash.
 *
 * Komponent o'rniga shu yerda yig'ilgan, chunki bu bir necha manbadan
 * (kartalar, kunlik statistika, profil) ma'lumot talab qiladi va UI ularning
 * hammasini bilishi shart emas.
 */
export async function finalizeSession({
  answered,
  wrong,
  now = Date.now(),
}: FinalizeSessionInput): Promise<{ newlyUnlocked: string[] }> {
  if (answered > 0 && wrong === 0) {
    await recordPerfectSession()
  }

  const cards = await getGlobalCardStats()
  const snapshot = await getProgressSnapshot(now)

  const { newlyUnlocked } = await syncBadges(
    {
      learnedWords: cards.learned,
      matureWords: cards.mature,
      currentStreak: snapshot.streak.current,
      longestStreak: snapshot.longestStreak,
      totalAnswers: snapshot.daily.answered,
    },
    now,
  )

  return { newlyUnlocked }
}

/** Bosh ekran va profil uchun yig'ma ko'rsatkichlar */
/**
 * Berilgan kundan boshlab kunlik statistikalar.
 *
 * Haftalik diagramma va liga uchun: `ProgressSnapshot` faqat BUGUNGI
 * kunni beradi, diagramma esa oxirgi 7 kunni talab qiladi.
 */
export async function getDailyStatsSince(from: number): Promise<DailyStat[]> {
  return db.dailyStats.where('day').aboveOrEqual(from).toArray()
}

export interface ProgressSnapshot {
  profile: ProfileRecord
  daily: DailyStat
  streak: StreakResult
  longestStreak: number
  level: ReturnType<typeof levelFromXp>
}

export async function getProgressSnapshot(now: number = Date.now()): Promise<ProgressSnapshot> {
  const profile = (await db.profile.get('me')) ?? createProfile()
  const daily = await getDailyStat(now)
  const activeDays = await getActiveDays()

  return {
    profile,
    daily,
    streak: computeStreak({ activeDays, frozenDays: profile.frozenDays, now }),
    longestStreak: computeLongestStreak(activeDays, profile.frozenDays),
    level: levelFromXp(profile.totalXp),
  }
}

/** Testlar va "progressni tozalash" uchun */
export async function clearProgress(): Promise<void> {
  await db.dailyStats.clear()
  await db.profile.clear()
}
