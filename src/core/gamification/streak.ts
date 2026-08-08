import { addDays, startOfDay } from '@/lib/date'

/**
 * Streak — ketma-ket faol kunlar.
 *
 * Nega streak SAQLANGAN raqam emas, balki HISOBLANADI: saqlangan hisoblagich
 * eskirib qoladi (ilova ochilmagan kunlarda hech kim uni kamaytirmaydi) va
 * soat/vaqt mintaqasi o'zgarganda buziladi. Faol kunlar ro'yxatidan
 * hisoblash esa har doim haqiqatga mos bo'ladi.
 */

/** Bir vaqtda saqlanadigan muzlatishlar soni */
export const MAX_STREAK_FREEZES = 2

/** Nechta kunlik streakdan keyin yangi muzlatish beriladi */
export const FREEZE_AWARD_INTERVAL = 7

export interface StreakInput {
  /** Mashq qilingan kunlar (kun boshi timestamp'lari, tartibsiz bo'lishi mumkin) */
  activeDays: readonly number[]
  /** Muzlatish bilan saqlangan kunlar */
  frozenDays: readonly number[]
  /** Hozirgi vaqt */
  now: number
}

export interface StreakResult {
  /** Joriy ketma-ketlik uzunligi (kun) */
  current: number
  /** Bugun mashq qilinganmi */
  activeToday: boolean
  /** Streak bugun uzilib qolish arafasidami (bugun hali mashq qilinmagan) */
  atRisk: boolean
}

/**
 * Joriy streakni hisoblash.
 *
 * Qoidalar:
 *  - bugun mashq qilingan bo'lsa, sanoq bugundan boshlanadi;
 *  - bugun hali qilinmagan bo'lsa, kechagi kundan boshlanadi (streak hali tirik,
 *    lekin xavf ostida — kun tugagunicha ulgurish kerak);
 *  - muzlatilgan kun ham "faol" kabi ketma-ketlikni uzmaydi.
 */
export function computeStreak({ activeDays, frozenDays, now }: StreakInput): StreakResult {
  const active = new Set(activeDays.map(startOfDay))
  const frozen = new Set(frozenDays.map(startOfDay))
  const today = startOfDay(now)

  const activeToday = active.has(today)

  // Bugun bo'sh bo'lsa, sanoqni kechadan boshlaymiz
  let cursor = activeToday ? today : addDays(today, -1)
  let current = 0

  while (active.has(cursor) || frozen.has(cursor)) {
    // Muzlatilgan kun ketma-ketlikni saqlaydi, lekin uzunlikka qo'shilmaydi:
    // foydalanuvchi o'sha kuni haqiqatan mashq qilmagan
    if (active.has(cursor)) current += 1
    cursor = addDays(cursor, -1)
  }

  return {
    current,
    activeToday,
    atRisk: !activeToday && current > 0,
  }
}

/** Eng uzun streak — tarixdagi rekord */
export function computeLongestStreak(
  activeDays: readonly number[],
  frozenDays: readonly number[] = [],
): number {
  const days = [...new Set(activeDays.map(startOfDay))].sort((a, b) => a - b)
  if (days.length === 0) return 0

  const frozen = new Set(frozenDays.map(startOfDay))

  let longest = 1
  let run = 1

  for (let i = 1; i < days.length; i += 1) {
    // Oldingi kundan hozirgisigacha bo'lgan bo'shliq muzlatish bilan
    // to'ldirilganmi?
    let gapBridged = true
    for (let day = addDays(days[i - 1], 1); day < days[i]; day = addDays(day, 1)) {
      if (!frozen.has(day)) {
        gapBridged = false
        break
      }
    }

    run = gapBridged ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  return longest
}

export interface FreezeInput {
  activeDays: readonly number[]
  frozenDays: readonly number[]
  freezesAvailable: number
  now: number
}

export interface FreezeResult {
  /** Yangilangan muzlatilgan kunlar ro'yxati */
  frozenDays: number[]
  freezesAvailable: number
  /** Shu chaqiruvda muzlatish ishlatildimi */
  used: boolean
}

/**
 * "Streak Freeze" — bir kun o'tkazib yuborilsa avtomatik saqlaydi (TZ 4).
 *
 * Ilova ochilganda chaqiriladi. Faqat KECHAGI bo'sh kun uchun ishlaydi:
 * ikki va undan ko'p kun o'tkazib yuborilgan bo'lsa, streak baribir uziladi
 * (aks holda muzlatish "cheksiz kechikish" imkonini berardi va loss-aversion
 * mexanizmi ma'nosini yo'qotardi).
 */
export function applyStreakFreeze({
  activeDays,
  frozenDays,
  freezesAvailable,
  now,
}: FreezeInput): FreezeResult {
  const unchanged: FreezeResult = {
    frozenDays: [...frozenDays],
    freezesAvailable,
    used: false,
  }

  if (freezesAvailable <= 0) return unchanged

  const active = new Set(activeDays.map(startOfDay))
  const frozen = new Set(frozenDays.map(startOfDay))
  const today = startOfDay(now)
  const yesterday = addDays(today, -1)

  // Kecha mashq qilingan yoki allaqachon muzlatilgan bo'lsa — kerak emas
  if (active.has(yesterday) || frozen.has(yesterday)) return unchanged

  // Muzlatish faqat TIRIK streakni saqlaydi: undan oldingi kun faol
  // (yoki muzlatilgan) bo'lishi kerak
  const dayBefore = addDays(yesterday, -1)
  if (!active.has(dayBefore) && !frozen.has(dayBefore)) return unchanged

  return {
    frozenDays: [...frozenDays, yesterday],
    freezesAvailable: freezesAvailable - 1,
    used: true,
  }
}

/**
 * Streak muvaffaqiyati uchun yangi muzlatish berish.
 * Har 7 kunlik ketma-ketlikda bittadan, jami 2 tagacha.
 */
export function awardFreezes(
  currentStreak: number,
  freezesAvailable: number,
  lastAwardedAtStreak: number,
): { freezesAvailable: number; lastAwardedAtStreak: number } {
  const milestone = Math.floor(currentStreak / FREEZE_AWARD_INTERVAL) * FREEZE_AWARD_INTERVAL

  if (milestone <= lastAwardedAtStreak || milestone === 0) {
    return { freezesAvailable, lastAwardedAtStreak }
  }

  return {
    freezesAvailable: Math.min(MAX_STREAK_FREEZES, freezesAvailable + 1),
    lastAwardedAtStreak: milestone,
  }
}
