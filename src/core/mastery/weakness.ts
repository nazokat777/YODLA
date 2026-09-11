import type { CardRecord } from '@/core/db'
import { DEFAULT_EASE_FACTOR, wordStrength } from '@/core/srs'

const DAY_MS = 24 * 60 * 60 * 1000

/** Xato og'irligi — eng kuchli signal */
const LAPSE_WEIGHT = 3
/** Yengillik og'irligi */
const EASE_WEIGHT = 2
/** Ko'rilmagan kunlar necha kunda bir ball beradi */
const DAYS_PER_POINT = 7

/**
 * So'zning ZAIFLIK bahosi — qanchalik yuqori bo'lsa, shunchalik tez
 * takrorlash kerak.
 *
 * Uch signal qo'shiladi:
 *  - `lapses` — foydalanuvchi bu so'zni necha marta unutgan. Eng ishonchli
 *    dalil: u shu so'z bilan aniq qiynalgan.
 *  - `easeFactor` — SM-2 ning qiyinlik o'lchovi. Past qiymat "har safar
 *    zo'rg'a esladi" degani.
 *  - oxirgi takrordan o'tgan vaqt — unutish egri chizig'i: vaqt o'tgani
 *    sari eslash ehtimoli tushadi.
 *
 * HECH QACHON KO'RILMAGAN karta (`lastReviewedAt === null`) yaratilgan
 * vaqtidan hisoblanadi. `null` ni songa aylantirmasa `NaN` chiqib,
 * saralash tartibi butunlay buzilardi.
 */
export function weakness(card: CardRecord, now: number): number {
  const since = card.lastReviewedAt ?? card.createdAt
  const days = Math.max(0, (now - since) / DAY_MS)

  return (
    card.lapses * LAPSE_WEIGHT +
    (DEFAULT_EASE_FACTOR - card.easeFactor) * EASE_WEIGHT +
    days / DAYS_PER_POINT
  )
}

/**
 * Eng zaif `size` ta kartani qaytaradi.
 *
 * Aralash takror bosqichi uchun: oldingi darslardagi barcha so'zlarni
 * har safar so'rash mumkin emas (20-darsda 250+ so'z bo'ladi va seans
 * yarim soatga cho'ziladi), shuning uchun eng ko'p e'tibor talab
 * qiladiganlari tanlanadi.
 */
export function pickWeakest(
  cards: readonly CardRecord[],
  size: number,
  now: number,
): CardRecord[] {
  // Nusxa: chaqiruvchi bergan massiv o'zgarmasligi kerak
  return [...cards].sort((a, b) => weakness(b, now) - weakness(a, now)).slice(0, size)
}

/**
 * So'z HOZIR ham qiyinmi.
 *
 * `lapses` tarixiy son — u hech qachon kamaymaydi. Bola so'zni olti
 * marta unutib, keyin mashq qilib mustahkam o'rgangan bo'lsa ham, u
 * "6 marta unutilgan" bo'lib qolaverardi va "Ustida ishlash kerak"
 * ro'yxatidan hech qachon chiqmasdi — bu esa mashqning ma'nosini
 * yo'qqa chiqaradi.
 *
 * Yechim: uzoq muddatli xotiraga o'tgan so'z (kuchi 3, ya'ni interval
 * 21 kundan oshgan) qiyin hisoblanmaydi — tarixi qanday bo'lmasin.
 */
export function isStillStruggling(card: CardRecord, minLapses: number): boolean {
  return card.lapses >= minLapses && wordStrength(card) < 3
}
