import type { RandomSource } from '@/lib/random'

/**
 * SIRLI SANDIQ — seans yakunidagi o'zgaruvchan mukofot.
 *
 * PSIXOLOGIYA: doimiy mukofot tez odatga aylanadi va his qilinmay
 * qoladi; O'ZGARUVCHAN mukofot (Skinner: variable ratio) esa har safar
 * kutish hissini qaytaradi. Sandiq shu uchun: nima chiqishi oldindan
 * noma'lum, ochish esa foydalanuvchining o'z harakati (bosish) —
 * kutish → harakat → natija zanjiri.
 *
 * O'LCHOVLI: mukofotlar kichik. Sandiq o'yinning maqsadi emas, darsning
 * yakuniga qo'shilgan iliq nuqta. Katta yutuqlar kam, lekin bor —
 * "balki shu safar" hissi uchun.
 *
 * PEDAGOGIKA: mukofotlarning bir qismi MODDIY EMAS — maqtov. Maqtov
 * HARAKATGA qaratilgan ("mehnat qilding"), "aqllisan" emas: Dweck —
 * o'sish tafakkuri. Bola natijani emas, jarayonni qadrlashni o'rganadi.
 */
export type ChestReward =
  | { kind: 'xp'; amount: number }
  | { kind: 'freeze' }
  | { kind: 'praise'; text: string }

/** Sandiq chiqishi uchun seansda kamida shuncha javob bo'lishi kerak */
export const CHEST_MIN_ANSWERS = 5

/** Oddiy XP mukofotlari — teng ehtimol bilan */
const XP_REWARDS = [10, 15, 20, 25] as const

/** Katta yutuq — kam, lekin bor */
export const CHEST_JACKPOT_XP = 50

/** Harakatga qaratilgan maqtovlar */
export const PRAISES = [
  'Bugun qiyin so‘zlardan qochmading — mana shu kuch.',
  'Har xato seni bir qadam oldinga surdi. Davom et!',
  'Sen o‘tirib mashq qilding — natija shundan keladi.',
  'Miyang bugun yangi yo‘llar ochdi. Ertaga yana!',
  'Sekin, lekin to‘xtamasdan — eng ishonchli yo‘l.',
] as const

/** Ehtimollar (jami 1) */
const P_JACKPOT = 0.08
const P_FREEZE = 0.17
const P_PRAISE = 0.2

/**
 * Sandiqdan nima chiqadi.
 *
 * @param canFreeze muzlatish zaxirasi to'lmagan bo'lsa `true` — to'lgan
 *   bo'lsa muzlatish o'rniga XP chiqadi (foydasiz mukofot xafa qiladi)
 */
export function rollChest(canFreeze: boolean, random: RandomSource = Math.random): ChestReward {
  const roll = random()

  if (roll < P_JACKPOT) return { kind: 'xp', amount: CHEST_JACKPOT_XP }
  if (roll < P_JACKPOT + P_FREEZE) {
    if (canFreeze) return { kind: 'freeze' }
    // Muzlatish sig'maydi — o'rniga o'rtacha XP
    return { kind: 'xp', amount: XP_REWARDS[XP_REWARDS.length - 1]! }
  }
  if (roll < P_JACKPOT + P_FREEZE + P_PRAISE) {
    return { kind: 'praise', text: PRAISES[Math.floor(random() * PRAISES.length)]! }
  }

  return { kind: 'xp', amount: XP_REWARDS[Math.floor(random() * XP_REWARDS.length)]! }
}
