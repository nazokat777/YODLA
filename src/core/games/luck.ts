import type { RandomSource } from '@/lib/random'

/**
 * "Omadli karta" chiqish ehtimoli.
 *
 * NEGA 8%: har savolda bo'lsa u mukofot bo'lmay qoladi — kutish
 * yo'qoladi va u shunchaki fon shovqiniga aylanadi. Juda kam bo'lsa
 * (1-2%) umuman sezilmaydi va hech qanday ta'sir bermaydi.
 *
 * 12-13 savolda bir marta — seansda bir-ikki marta uchraydi, ya'ni
 * kutilmagan bo'lib qoladi.
 */
export const LUCKY_CHANCE = 0.08

/** Omadli kartada XP necha barobar bo'ladi */
export const LUCKY_MULTIPLIER = 2

/**
 * Shu savol "omadli" bo'ladimi.
 *
 * O'ZGARUVCHAN MUKOFOT: mukofot HAR SAFAR emas, tasodifiy kelganda
 * kuchliroq ta'sir qiladi. Bu o'lchangan hodisa (variable-ratio
 * reinforcement) va aynan shu narsa "yana bir marta" degan hissni
 * beradi.
 *
 * Javobdan OLDIN e'lon qilinadi: dofaminning asosiy manbai mukofotning
 * o'zi emas, uni KUTISH.
 */
export function isLucky(random: RandomSource = Math.random): boolean {
  return random() < LUCKY_CHANCE
}

/** Omadli bo'lsa XP ni ko'paytiradi */
export function applyLuck(xp: number, lucky: boolean): number {
  return lucky ? xp * LUCKY_MULTIPLIER : xp
}
