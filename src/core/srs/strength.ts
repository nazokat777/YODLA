import { MATURE_INTERVAL_DAYS } from '@/core/db/schema'
import type { Card } from '@/core/types'

/** So'z qanchalik mustahkam yodlanganini bildiruvchi bosqich */
export type WordStrength = 0 | 1 | 2 | 3

/** Har bosqichning o'zbekcha nomi */
export const STRENGTH_NAMES: Record<WordStrength, string> = {
  0: 'Yangi',
  1: 'O‘rganilmoqda',
  2: 'Mustahkam',
  3: 'Yodlangan',
}

/** 2-bosqich uchun eng kam interval (kun) */
const STRONG_INTERVAL_DAYS = 7

/**
 * So'zning KUCHI — 0 dan 3 gacha.
 *
 * NEGA KERAK: SM-2 ning `interval` i son sifatida foydalanuvchiga
 * hech nima aytmaydi ("6 kun" — bu yaxshimi?). To'rt bosqich esa
 * o'sishni KO'RSATADI: bola bugun qilgan ishi so'zni oldinga
 * surganini ko'radi.
 *
 * Ko'rinadigan progress motivatsiyaning asosiy manbalaridan biri;
 * ko'rinmaydigani esa umuman ishlamaydi.
 *
 * Bosqichlar SM-2 intervalidan olinadi, chunki aynan u "qachon
 * unutiladi" degan bahoni saqlaydi:
 *  - 0 — hali so'ralmagan
 *  - 1 — o'rganilmoqda (bir haftadan kam)
 *  - 2 — mustahkam (bir haftadan uch haftagacha)
 *  - 3 — yodlangan (uch haftadan ko'p — uzoq muddatli xotira)
 */
export function wordStrength(card: Pick<Card, 'interval' | 'repetitions'>): WordStrength {
  if (card.repetitions === 0 || card.interval <= 0) return 0
  if (card.interval < STRONG_INTERVAL_DAYS) return 1
  if (card.interval < MATURE_INTERVAL_DAYS) return 2

  return 3
}
