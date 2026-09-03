import type { AnswerVerdict } from '@/core/exercises'

/**
 * XP (tajriba ballari) va darajalar.
 *
 * Tamoyil: XATO HAM XP BERADI. Foydalanuvchi urinishi uchun taqdirlanadi,
 * chunki xato javob ham o'rganish (TZ 4: "xatoda jazolamay tushuntirish").
 * Farq shundaki, to'g'ri javob sezilarli ko'proq beradi.
 */
export const XP_PER_VERDICT: Record<AnswerVerdict, number> = {
  correct: 10,
  almost: 7,
  wrong: 2,
}

/** Kunlik maqsadga yetganda bir marta beriladigan bonus */
export const DAILY_GOAL_BONUS_XP = 20

/**
 * Seans bitta ham xatosiz tugaganda beriladigan bonus.
 *
 * Kunlik maqsad bonusidan (20) KICHIK: har kuni kelish odati
 * benuqsonlikdan muhimroq. Aks holda foydalanuvchi oson so'zlarni qayta
 * takrorlab, qiyinlaridan qochishga undalardi.
 */
export const PERFECT_SESSION_BONUS_XP = 15

/** Bitta javob uchun XP */
export function xpForAnswer(verdict: AnswerVerdict): number {
  return XP_PER_VERDICT[verdict]
}

/**
 * Daraja egri chizig'i: L darajaga yetish uchun kerakli jami XP.
 *
 *   1-daraja →    0 XP
 *   2-daraja →  100 XP
 *   3-daraja →  300 XP
 *   4-daraja →  600 XP
 *
 * Kvadratik o'sish: boshida darajalar tez ochiladi (motivatsiya),
 * keyinroq sekinlashadi (uzoq muddatli maqsad).
 */
export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0
  return 50 * (level - 1) * level
}

export interface LevelProgress {
  level: number
  /** Joriy darajada to'plangan XP */
  xpIntoLevel: number
  /** Keyingi darajagacha kerakli XP (shu darajaning "kengligi") */
  xpForNextLevel: number
  /** 0…1 oralig'idagi progress */
  ratio: number
}

/**
 * Jami XP'dan daraja va progressni hisoblash.
 * Yopiq formula ishlatiladi — katta XP'da ham sikl aylanmaydi.
 */
export function levelFromXp(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(totalXp))

  // 50·(L−1)·L ≤ xp tengsizligining yechimi
  const level = Math.max(1, Math.floor((1 + Math.sqrt(1 + 0.08 * safeXp)) / 2))

  const currentThreshold = xpToReachLevel(level)
  const nextThreshold = xpToReachLevel(level + 1)
  const xpForNextLevel = nextThreshold - currentThreshold
  const xpIntoLevel = safeXp - currentThreshold

  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    ratio: xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 0,
  }
}

/** Daraja unvonlari — quruq raqam o'rniga mazmunli belgi */
const LEVEL_TITLES: Array<{ minLevel: number; title: string }> = [
  { minLevel: 20, title: 'Ustoz' },
  { minLevel: 12, title: 'Tajribali' },
  { minLevel: 7, title: 'Ishonchli' },
  { minLevel: 3, title: "O'rganuvchi" },
  { minLevel: 1, title: 'Yangi boshlovchi' },
]

export function levelTitle(level: number): string {
  return LEVEL_TITLES.find((entry) => level >= entry.minLevel)?.title ?? 'Yangi boshlovchi'
}
