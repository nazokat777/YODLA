import type { CardRecord, DailyStat } from '@/core/db'
import { addDays, startOfDay } from '@/lib/date'

/**
 * ERTANGI KUN KO'RINISHI — seans yakunida "keyin nima bo'ladi".
 *
 * PSIXOLOGIYA (Zeigarnik effekti): tugallanmagan ish diqqatni ushlab
 * turadi. Seans "tamom" deb tugasa, halqa yopiladi va ertaga qaytish
 * uchun ichki sabab qolmaydi. "Ertaga 7 ta so'z seni kutadi" — halqani
 * ataylab OCHIQ qoldiradi: bola ertangi kunni bugun tasavvur qiladi.
 *
 * Raqamlar HAQIQIY manbalardan: ertaga muddati yetadigan kartalar soni
 * va bugungi streak + 1. Taxminiy va'da berilmaydi.
 */
export interface TomorrowPreview {
  /** Ertaga (kun oxirigacha) takrorlashga chiqadigan so'zlar */
  dueTomorrow: number
  /** Ertaga mashq qilinsa streak necha bo'ladi */
  streakTomorrow: number
}

export function tomorrowPreview(
  cards: readonly CardRecord[],
  currentStreak: number,
  now: number,
): TomorrowPreview {
  const endOfTomorrow = addDays(startOfDay(now), 2)
  const dueTomorrow = cards.filter(
    (card) => card.totalReviews > 0 && card.dueDate < endOfTomorrow,
  ).length

  return { dueTomorrow, streakTomorrow: currentStreak + 1 }
}

/**
 * BUGUN — REKORD KUNMI. Shaxsiy rekordni yangilash: raqib boshqa odam
 * emas, kechagi o'zing. Bu bolalar uchun eng xavfsiz musobaqa.
 *
 * `null` — rekord emas yoki solishtirishga tarix yo'q (birinchi kun
 * "rekord" deb e'lon qilinmaydi — u hech nimani anglatmasdi).
 */
export function personalBestDay(
  history: readonly DailyStat[],
  today: DailyStat,
): { previousBest: number } | null {
  const others = history.filter((day) => day.day !== today.day)
  if (others.length === 0) return null

  const previousBest = Math.max(...others.map((day) => day.xp))
  return today.xp > previousBest ? { previousBest } : null
}
