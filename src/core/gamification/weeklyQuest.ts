import type { DailyStat } from '@/core/db'
import { addDays, startOfDay } from '@/lib/date'

/**
 * HAFTALIK SAYOHAT — dushanbadan yakshanbagacha 7 ta qadam, yo'lda
 * uchta sandiq.
 *
 * PSIXOLOGIYA: kunlik streak "yo'qotmaslik" hissi beradi, haftalik
 * xarita esa "yetib borish" hissini — ikkalasi boshqa-boshqa motivlar.
 * Sandiqlar ORALIQ pog'onalarda (3, 5, 7 kun): birinchi mukofot tez
 * keladi (boshlash oson), oxirgisi eng katta (tugatish qimmat).
 * Hafta o'tgach xarita yangilanadi — "bu hafta bo'lmadi, keyingisida"
 * — yo'qotish qaytmas emas, bu bolalar uchun muhim.
 *
 * Hisob FAOL KUNLAR bo'yicha (kamida bitta javob), ketma-ket bo'lishi
 * shart emas: seshanba va juma faol bo'lsa — 2 kun.
 */
export interface WeeklyMilestone {
  days: number
  xp: number
  icon: string
}

export const WEEKLY_MILESTONES: readonly WeeklyMilestone[] = [
  { days: 3, xp: 30, icon: '🎁' },
  { days: 5, xp: 60, icon: '💎' },
  { days: 7, xp: 120, icon: '👑' },
]

/** Hafta boshi — DUSHANBA (lokal vaqt) */
export function startOfWeek(now: number): number {
  const day = startOfDay(now)
  // getDay: 0 = yakshanba … 6 = shanba → dushanbadan necha kun o'tgan
  const sinceMonday = (new Date(day).getDay() + 6) % 7
  return addDays(day, -sinceMonday)
}

/** Haftaning barqaror kaliti — da'volarni saqlash uchun */
export function weekKey(now: number): string {
  const monday = new Date(startOfWeek(now))
  const mm = String(monday.getMonth() + 1).padStart(2, '0')
  const dd = String(monday.getDate()).padStart(2, '0')
  return `${monday.getFullYear()}-${mm}-${dd}`
}

/** Shu haftaning 7 kuni: faol bo'lganmi */
export function weekDays(stats: readonly DailyStat[], now: number): boolean[] {
  const monday = startOfWeek(now)
  const active = new Set(stats.filter((stat) => stat.answered > 0).map((stat) => stat.day))

  return Array.from({ length: 7 }, (_, index) => active.has(addDays(monday, index)))
}

/** Shu haftada nechta kun faol */
export function activeDaysThisWeek(stats: readonly DailyStat[], now: number): number {
  return weekDays(stats, now).filter(Boolean).length
}

/**
 * Yetilgan, lekin hali OLINMAGAN pog'onalar — "Ochish" tugmasi uchun.
 * Mukofot foydalanuvchining o'z harakati bilan keladi (agentlik).
 */
export function claimableMilestones(
  activeDays: number,
  claimedDays: readonly number[],
): WeeklyMilestone[] {
  return WEEKLY_MILESTONES.filter(
    (milestone) => activeDays >= milestone.days && !claimedDays.includes(milestone.days),
  )
}
