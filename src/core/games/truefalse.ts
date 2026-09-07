import type { CardRecord } from '@/core/db'
import type { RandomSource } from '@/lib/random'

/** Ko'rsatiladigan juft */
export interface TrueFalsePair {
  card: CardRecord
  /** Ekranda ko'rsatiladigan tarjima */
  shown: string
  /** Shu tarjima HAQIQATAN shu so'zniki mi */
  isTrue: boolean
}

/**
 * "apple = olma. To'g'rimi?" juftini yaratadi.
 *
 * Yarmi to'g'ri, yarmi boshqa kartaning tarjimasi bilan almashtirilgan.
 * Almashtirish uchun BOSHQA karta kerak: bitta kartadan yolg'on juft
 * yasab bo'lmaydi.
 *
 * O'ZLASHTIRISHGA HISOBGA O'TMAYDI (chaqiruvchi shuni ta'minlaydi):
 * ikki variantdan bittasini tanlash 50% ehtimol bilan to'g'ri chiqadi
 * va buni "bildi" deb hisoblash o'zlashtirish qoidasining butun
 * maqsadini buzardi.
 */
export function makeTrueFalsePair(
  card: CardRecord,
  pool: readonly CardRecord[],
  random: RandomSource = Math.random,
): TrueFalsePair {
  const others = pool.filter((item) => item.id !== card.id && item.translation !== card.translation)

  // Boshqa karta yo'q — yolg'on juft yasab bo'lmaydi, to'g'risi beriladi
  if (others.length === 0 || random() < 0.5) {
    return { card, shown: card.translation, isTrue: true }
  }

  const other = others[Math.floor(random() * others.length)]!

  return { card, shown: other.translation, isTrue: false }
}

/** Foydalanuvchi javobi to'g'rimi */
export function checkTrueFalse(pair: TrueFalsePair, saidTrue: boolean): boolean {
  return pair.isTrue === saidTrue
}
