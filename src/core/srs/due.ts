import type { CardRecord } from '@/core/db'

/**
 * Takrorlash navbatiga tushadigan kartalar — XOTIRADA.
 *
 * NEGA BAZAGA IKKINCHI SO'ROV EMAS: takrorlash ekrani chalg'ituvchi
 * variantlar uchun BUTUN lug'atni baribir o'qiydi. Navbatni alohida
 * so'rov bilan olish o'sha 4400 yozuvni ikkinchi marta diskdan
 * ko'chirishni anglatardi — o'lchandi: har biri ~50 ms (telefonda ancha
 * ko'p), va natija bir xil.
 *
 * "Muddati yetgan" = ILGARI KO'RILGAN va vaqti kelgan. Hali ko'rilmagan
 * so'z takrorlanmaydi — u avval darsda o'rganiladi.
 */
export function pickDueCards(
  cards: readonly CardRecord[],
  now: number,
  limit?: number,
): CardRecord[] {
  const due = cards
    .filter((card) => card.totalReviews > 0 && card.dueDate <= now)
    // Eng kutib qolgani oldin — bazadagi indeks tartibi ham shunday
    .sort((a, b) => a.dueDate - b.dueDate)

  return limit === undefined ? due : due.slice(0, limit)
}
