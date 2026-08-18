import { normalizeAnswer } from '@/core/exercises'
import type { LanguageCode } from '@/core/types'

/** Oxiridagi qo'shimchaga yo'l qo'yiladigan eng qisqa so'z uzunligi */
const MIN_LENGTH_FOR_SUFFIX = 4

/** Oxiridan nechta ortiqcha harf kechiriladi */
const MAX_SUFFIX_DIFFERENCE = 2

/**
 * Ikki so'z faqat OXIRGI qo'shimcha bilan farq qiladimi.
 *
 * Nutqni tanish tizimi so'zni ko'pincha ko'plikda yoki qo'shimcha bilan
 * qaytaradi ("brother" → "brothers"). Bu talaffuz xatosi emas.
 */
function differsOnlyBySuffix(a: string, b: string): boolean {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]

  if (shorter.length < MIN_LENGTH_FOR_SUFFIX) return false
  if (longer.length - shorter.length > MAX_SUFFIX_DIFFERENCE) return false

  return longer.startsWith(shorter)
}

/**
 * Aytilgan so'z kutilganiga mos keldimi.
 *
 * Brauzer bir nechta variant qaytaradi va ularning BIRORTASI mos kelsa
 * yetarli — maqsad gapirishga jur'at berish, imtihon olish emas.
 *
 * NEGA `typoTolerance` ISHLATILMAYDI: u KLAVIATURA xatolari uchun
 * mo'ljallangan va besh harfli so'zda bitta tahrirga yo'l qo'yadi. Talaffuz
 * uchun bu juda bo'sh: "waiter" ↔ "water" bir tahrir masofasida turadi,
 * lekin aynan shu farq bu mashq tutishi kerak bo'lgan xato. Shuning uchun
 * faqat SO'Z OXIRIDAGI qo'shimcha kechiriladi — u yerda farq talaffuz
 * xatosi emas, tanish tizimining grammatik tanlovi bo'ladi.
 */
export function matchesSpoken(
  expected: string,
  alternatives: string[],
  language: LanguageCode,
): boolean {
  const target = normalizeAnswer(expected, language)
  if (target.length === 0) return false

  return alternatives.some((alternative) => {
    const heard = normalizeAnswer(alternative, language)
    if (heard.length === 0) return false

    return heard === target || differsOnlyBySuffix(heard, target)
  })
}
