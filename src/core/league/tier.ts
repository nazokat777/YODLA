export type TierCode = 'bronze' | 'silver' | 'gold' | 'diamond'

/**
 * Liga darajalari — haftalik XP bo'yicha.
 *
 * Duolingo'dan farqi: TUSHIRISH YO'Q. Daraja — joriy haftaning
 * ko'rsatkichi, jazo emas. Ilovaning "xatoda jazolamaslik" tamoyili
 * reytingda ham amal qiladi.
 */
export const TIERS: { code: TierCode; title: string; minXp: number }[] = [
  { code: 'diamond', title: 'Olmos', minXp: 1000 },
  { code: 'gold', title: 'Oltin', minXp: 500 },
  { code: 'silver', title: 'Kumush', minXp: 200 },
  { code: 'bronze', title: 'Bronza', minXp: 0 },
]

export function leagueTier(weeklyXp: number): TierCode {
  const tier = TIERS.find((candidate) => weeklyXp >= candidate.minXp)

  return tier?.code ?? 'bronze'
}

/** Daraja nomi (UI uchun) */
export function tierTitle(code: TierCode): string {
  return TIERS.find((tier) => tier.code === code)?.title ?? 'Bronza'
}
