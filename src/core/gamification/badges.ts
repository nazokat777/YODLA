/**
 * Nishonlar (badges) — uzoq muddatli maqsadlar.
 *
 * Har nishon SOF FUNKSIYA bilan aniqlanadi: shart faqat statistikaga
 * bog'liq, shuning uchun nishonlar istalgan vaqtda qayta hisoblanishi mumkin
 * (masalan yangi nishon qo'shilganda eskilari ham to'g'ri ochiladi).
 */

/** Nishon shartini tekshirish uchun kerakli ko'rsatkichlar */
export interface BadgeStats {
  /** Kamida bir marta to'g'ri javob berilgan so'zlar */
  learnedWords: number
  /** Mustahkam yodlangan so'zlar (interval ≥ 21 kun) */
  matureWords: number
  /** Joriy streak */
  currentStreak: number
  /** Eng uzun streak */
  longestStreak: number
  totalXp: number
  level: number
  /** Jami berilgan javoblar */
  totalAnswers: number
  /** Bir seansda hech xato qilmagan holatlar soni */
  perfectSessions: number
}

export interface BadgeDefinition {
  id: string
  title: string
  description: string
  icon: string
  /** Shart bajarildimi */
  isUnlocked: (stats: BadgeStats) => boolean
  /** Progressni ko'rsatish uchun: joriy qiymat va maqsad */
  progress: (stats: BadgeStats) => { value: number; target: number }
}

/** Takrorlanuvchi naqsh: "N ta X to'plang" */
function threshold(
  id: string,
  title: string,
  description: string,
  icon: string,
  target: number,
  pick: (stats: BadgeStats) => number,
): BadgeDefinition {
  return {
    id,
    title,
    description,
    icon,
    isUnlocked: (stats) => pick(stats) >= target,
    progress: (stats) => ({ value: Math.min(pick(stats), target), target }),
  }
}

/**
 * Nishonlar ro'yxati.
 * TZ 4'da nomlangan uchtasi: "Birinchi 10 so'z", "7 kunlik streak",
 * "100 so'z yodlandi" — qolganlari oraliq maqsad sifatida qo'shilgan.
 */
export const BADGES: BadgeDefinition[] = [
  threshold(
    'first-steps',
    'Birinchi qadam',
    'Birinchi so‘zni o‘rganing',
    '🌱',
    1,
    (s) => s.learnedWords,
  ),
  threshold(
    'first-10-words',
    'Birinchi 10 so‘z',
    '10 ta so‘zni o‘rganing',
    '📗',
    10,
    (s) => s.learnedWords,
  ),
  threshold(
    'hundred-words',
    '100 so‘z yodlandi',
    '100 ta so‘zni o‘rganing',
    '📚',
    100,
    (s) => s.learnedWords,
  ),
  threshold(
    'streak-7',
    '7 kunlik streak',
    'Ketma-ket 7 kun mashq qiling',
    '🔥',
    7,
    (s) => s.longestStreak,
  ),
  threshold(
    'streak-30',
    '30 kunlik streak',
    'Ketma-ket 30 kun mashq qiling',
    '🏔️',
    30,
    (s) => s.longestStreak,
  ),
  threshold(
    'mature-25',
    'Mustahkam bilim',
    '25 ta so‘zni uzoq muddatli xotiraga o‘tkazing',
    '🧠',
    25,
    (s) => s.matureWords,
  ),
  threshold('xp-1000', '1000 XP', '1000 XP to‘plang', '⭐', 1000, (s) => s.totalXp),
  threshold(
    'perfect-session',
    'Benuqson seans',
    'Bir seansni bitta ham xatosiz tugating',
    '🎯',
    1,
    (s) => s.perfectSessions,
  ),
]

/** Id bo'yicha tez qidirish */
export const BADGE_BY_ID = new Map(BADGES.map((badge) => [badge.id, badge]))

/** Statistikaga ko'ra ochilishi kerak bo'lgan barcha nishonlar */
export function unlockedBadgeIds(stats: BadgeStats): string[] {
  return BADGES.filter((badge) => badge.isUnlocked(stats)).map((badge) => badge.id)
}

/**
 * Shu safar YANGI ochilgan nishonlar.
 * Seans oxirida "sizga nishon berildi" deb ko'rsatish uchun.
 */
export function newlyUnlockedBadgeIds(
  stats: BadgeStats,
  alreadyUnlocked: readonly string[],
): string[] {
  const known = new Set(alreadyUnlocked)
  return unlockedBadgeIds(stats).filter((id) => !known.has(id))
}
