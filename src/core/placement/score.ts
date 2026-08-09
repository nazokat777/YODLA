import { LEVEL_ORDER } from '@/core/config/levels'
import type { LevelCode } from '@/core/types'

/** Har daraja uchun beriladigan savollar soni */
export const QUESTIONS_PER_LEVEL = 3

/** Daraja "o'tilgan" hisoblanishi uchun kerakli to'g'ri javoblar soni */
export const PASSING_ANSWERS = 2

/**
 * Test natijasidan boshlang'ich darajani aniqlaydi.
 *
 * Qoida: daraja o'tilgan bo'lsa keyingisiga o'tiladi; birinchi
 * O'TILMAGAN daraja — foydalanuvchi shu yerdan boshlaydi.
 *
 * Nega past daraja yiqilganda yuqorilari hisobga olinmaydi: bilim
 * zinapoyasi uzluksiz deb qaraladi. A2 ni bilmay turib B1 ni bilish —
 * ko'pincha tasodifiy to'g'ri javob, uni "bilim" deb qabul qilsak,
 * foydalanuvchi tushunmaydigan so'zlar bilan boshlanardi.
 */
export function scorePlacement(correctByLevel: Record<LevelCode, number>): LevelCode {
  for (const level of LEVEL_ORDER) {
    if ((correctByLevel[level] ?? 0) < PASSING_ANSWERS) return level
  }

  // Hammasi o'tildi — eng yuqori mavjud daraja
  return LEVEL_ORDER[LEVEL_ORDER.length - 1]
}
