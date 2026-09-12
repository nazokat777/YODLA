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
  // O'nlik pog'ona ikki baravar: 10, 20, 30… — "to'xtamas" zarbasi
  if (combo % (COMBO_BONUS_EVERY * 2) === 0) return COMBO_BONUS_XP * 2

  return combo % COMBO_BONUS_EVERY === 0 ? COMBO_BONUS_XP : 0
}

/**
 * Kombo POG'ONALARI — aynan shu sonlarda kichik bayram bo'ladi.
 *
 * NEYROBIOLOGIYA: dofamin mukofotning o'zidan ko'ra uni KUTISHDA
 * ko'proq ajraladi. Shuning uchun pog'ona oldindan ko'rinib turadi
 * ("×5 gacha 2 ta") va unga yetganda alohida nishonlanadi. Pog'onalar
 * oraliqlari o'sib boradi — har safar biroz ko'proq harakat, biroz
 * kattaroq quvonch.
 */
export const COMBO_MILESTONES = [3, 5, 10, 15, 20, 30, 50] as const

/** Pog'onaga yetilgan bo'lsa uning bayram matni, aks holda `null` */
export function comboMilestone(combo: number): { title: string; emoji: string } | null {
  switch (combo) {
    case 3:
      return { title: 'Combo ×3', emoji: '🔥' }
    case 5:
      return { title: 'On fire! ×5', emoji: '⚡' }
    case 10:
      return { title: 'Unstoppable! ×10', emoji: '🌟' }
    case 15:
      return { title: 'Legendary ×15', emoji: '💎' }
    case 20:
      return { title: 'Godlike ×20', emoji: '👑' }
    case 30:
      return { title: 'Mythic ×30', emoji: '🚀' }
    case 50:
      return { title: 'Infinity ×50', emoji: '🌌' }
    default:
      return null
  }
}

/** Keyingi pog'ona — kutish uchun. Oxirgisidan o'tilgan bo'lsa `null` */
export function nextComboMilestone(combo: number): number | null {
  return COMBO_MILESTONES.find((milestone) => milestone > combo) ?? null
}
