import type { CardRecord } from '@/core/db'
import { weekKey } from '@/core/gamification'
import { hashString } from '@/core/stats'

/**
 * SEHRLI SO'Z — haftada bitta, YASHIRIN. Hech qayerda e'lon qilinmaydi.
 *
 * PSIXOLOGIYA (Easter egg, kutilmagan mukofot): eng kuchli dofamin
 * signali — kutilmagan, tushuntirilmagan yaxshilik. Bola oddiy dars
 * qilayotganda birdan "🪄 Sehrli so'zni topding!" — va bundan keyin har
 * so'z "balki shu?" degan kichik sir bilan keladi. Haftada bir marta:
 * tez-tez bo'lsa sir bo'lmay qoladi.
 *
 * So'z HAFTA KALITIDAN deterministik, ko'rilmagan (yoki hali mustahkam
 * bo'lmagan) so'zlar orasidan — foydalanuvchi uni darsda uchratishi
 * mumkin bo'lsin.
 */
export const SECRET_WORD_XP = 30

export function secretWordId(cards: readonly CardRecord[], now: number): string | null {
  const pool = cards.filter((card) => card.interval < 21)
  if (pool.length === 0) return null
  const sorted = [...pool].sort((a, b) => (a.id < b.id ? -1 : 1))
  return sorted[hashString(`secret:${weekKey(now)}`) % sorted.length]!.id
}
