import { calendarDaysBetween } from './date'

/**
 * Interval (kunlarda) → o'zbekcha o'qiladigan matn.
 * Uzoq intervallar oy/yilga aylantiriladi, chunki "365 kun" o'qilmaydi.
 */
export function formatInterval(days: number): string {
  if (days < 1) return 'bugun'
  if (days === 1) return '1 kun'
  if (days < 30) return `${days} kun`
  if (days < 365) return `${Math.round(days / 30)} oy`
  return `${Math.round((days / 365) * 10) / 10} yil`
}

/**
 * Kelajakdagi vaqtgacha qolgan muddat.
 * Kalendar kunlari bo'yicha hisoblanadi — "ertaga" haqiqatan ertangi kun.
 */
export function formatTimeUntil(target: number, now: number = Date.now()): string {
  const days = calendarDaysBetween(now, target)

  if (days <= 0) return 'hozir'
  if (days === 1) return 'ertaga'
  return `${days} kundan keyin`
}

/** O'zbekcha oy nomlari */
const UZ_MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
]

/**
 * "27-oktabr" — kun va oy.
 *
 * `toLocaleDateString('uz-UZ')` ga TAYANIB BO'LMAYDI: ba'zi brauzerlarda
 * o'zbek tili ma'lumotlari yo'q va natija "M10 27" bo'lib chiqadi
 * (o'lchandi — Chromium'ning ixcham qurilmasida).
 */
export function formatDayMonth(at: number): string {
  const date = new Date(at)
  return `${date.getDate()}-${UZ_MONTHS[date.getMonth()]}`
}
