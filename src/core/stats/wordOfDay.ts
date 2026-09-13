import type { CardRecord } from '@/core/db'
import { startOfDay } from '@/lib/date'
import { hashString } from './sky'

/**
 * KUNNING SO'ZI — har kuni bitta HALI KO'RILMAGAN so'z.
 *
 * PSIXOLOGIYA (qiziquvchanlik bo'shlig'i, Loewenstein): so'z ko'rinadi,
 * ma'nosi yopiq — bilmaslik hissi bosishga undaydi. Har kuni yangi
 * so'z — bosh ekranga qaytish uchun kichik, doimiy sabab. So'z A1 dan,
 * shu tilda, va foydalanuvchining KELGUSI darslaridan (ko'rilmagan)
 * — ya'ni "oldindan tanishtiruv", keyin darsda "buni bilaman!" hissi.
 *
 * Tanlov SANADAN deterministik: sahifa yangilanganda so'z o'zgarmaydi.
 */
export function wordOfDay(
  cards: readonly CardRecord[],
  now: number,
  /**
   * Afzal so'zlar (masalan, rasmi borlar — "hers" emas, "olma"). `core`
   * kontentni bilmaydi, shuning uchun mezon tashqaridan beriladi;
   * afzallar bo'lmasa oddiy A1 so'zlar.
   */
  prefer: (card: CardRecord) => boolean = () => true,
): CardRecord | null {
  const unseen = cards.filter((card) => card.totalReviews === 0)
  const a1 = unseen.filter((card) => card.level === 'A1')
  const preferred = a1.filter(prefer)
  const pool = preferred.length > 0 ? preferred : a1.length > 0 ? a1 : unseen
  if (pool.length === 0) return null

  // Barqaror tartib: id bo'yicha; kun soni → indeks
  const sorted = [...pool].sort((a, b) => (a.id < b.id ? -1 : 1))
  const day = Math.floor(startOfDay(now) / (24 * 60 * 60 * 1000))
  return sorted[hashString(String(day)) % sorted.length] ?? null
}
