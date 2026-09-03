import type { AnswerVerdict } from '@/core/exercises'

/**
 * Kombo — SEANS ichidagi ketma-ket to'g'ri javoblar sanog'i.
 *
 * TAMOYIL: yutish mumkin, yutqazish mumkin emas. Kombo o'sganda XP
 * qo'shiladi, uzilganda esa HECH NIMA olib qo'yilmaydi. Loyihaning
 * qoidasi shu: "xatoda jazolamay tushuntirish" (`xp.ts`).
 *
 * Kombo BAZAGA YOZILMAYDI: u seans ichidagi holat. Uni saqlash streak
 * bilan chalkashtirardi — streak kunlar bilan o'lchanadi, kombo
 * javoblar bilan.
 */

/** Necha ketma-ket to'g'ri javobda bonus beriladi */
export const COMBO_BONUS_EVERY = 5

/** Har bonus qadamida beriladigan XP */
export const COMBO_BONUS_XP = 5

/**
 * Javobdan keyingi yangi kombo.
 *
 * `almost` komboni BUZMAYDI: u imlo xatosi bilan berilgan to'g'ri javob
 * (`typoTolerance`). O'nlik komboni bitta harf uchun yo'qotish
 * adolatsiz bo'lardi va foydalanuvchini yozishdan qo'rqitardi.
 */
export function nextCombo(combo: number, verdict: AnswerVerdict): number {
  if (verdict === 'correct') return combo + 1
  if (verdict === 'almost') return combo

  return 0
}

/**
 * Shu kombo uchun qo'shimcha XP.
 *
 * Nol alohida tekshiriladi: `0 % 5 === 0` bo'lgani uchun aks holda har
 * xato javobdan keyin bonus berilardi.
 */
export function comboBonusXp(combo: number): number {
  if (combo <= 0) return 0

  return combo % COMBO_BONUS_EVERY === 0 ? COMBO_BONUS_XP : 0
}
