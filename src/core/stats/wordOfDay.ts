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
export function wordOfDay(cards: readonly CardRecord[], now: number): CardRecord | null {
  const fresh = cards.filter((card) => card.totalReviews === 0 && card.level === 'A1')
  const pool = fresh.length > 0 ? fresh : cards.filter((card) => card.totalReviews === 0)
  if (pool.length === 0) return null

  // Barqaror tartib: id bo'yicha; kun soni → indeks
  const sorted = [...pool].sort((a, b) => (a.id < b.id ? -1 : 1))
  const day = Math.floor(startOfDay(now) / (24 * 60 * 60 * 1000))
  return sorted[hashString(String(day)) % sorted.length] ?? null
}
