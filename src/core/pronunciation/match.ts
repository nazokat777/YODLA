import { editDistance, normalizeAnswer, typoTolerance } from '@/core/exercises'
import type { LanguageCode } from '@/core/types'

/**
 * Aytilgan so'z kutilganiga mos keldimi.
 *
 * QOIDA ATAYLAB YUMSHOQ. Brauzer bir nechta variant qaytaradi va ularning
 * BIRORTASI mos kelsa yetarli, ustiga kichik imlo farqi ham kechiriladi.
 *
 * Nega: bu mashqning maqsadi — gapirishga jur'at berish, imtihon olish
 * emas. Nohaq ❌ foydalanuvchini mikrofondan butunlay voz kechishga
 * majbur qiladi; ortiqcha ✅ esa hech kimga ziyon qilmaydi, chunki natija
 * na SM-2 jadvaliga, na XP ga ta'sir qilmaydi.
 *
 * Taqqoslash uchun MAVJUD `normalizeAnswer` ishlatiladi — u arab
 * harakatlarini va rus "ё" harfini allaqachon to'g'ri tozalaydi.
 */
export function matchesSpoken(
  expected: string,
  alternatives: string[],
  language: LanguageCode,
): boolean {
  const target = normalizeAnswer(expected, language)
  if (target.length === 0) return false

  const tolerance = typoTolerance(target.length)

  return alternatives.some((alternative) => {
    const heard = normalizeAnswer(alternative, language)
    if (heard.length === 0) return false
    if (heard === target) return true

    return editDistance(heard, target) <= tolerance
  })
}
