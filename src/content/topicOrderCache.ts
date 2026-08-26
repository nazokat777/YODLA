import type { LanguageCode } from '@/core/types'

/**
 * Mavzular tartibining KESHI.
 *
 * O'quv yo'li bo'limlarni lug'atdagi tartibda ko'rsatishi kerak, lekin
 * bu tartib uchun butun lug'at (inglizchada ~700 kB JS) yuklanardi —
 * bosh ekran har ochilganda. O'lchov: bu ish har safar ~200 ms olardi
 * (telefonda ancha ko'p) va natijasi hech qachon o'zgarmasdi.
 *
 * Tartib lug'atdan bir marta olinadi va shu yerda saqlanadi. Kalit BUILD
 * belgisini o'z ichiga oladi: yangi versiya chiqqanda kesh o'z-o'zidan
 * eskiradi va tartib qaytadan hisoblanadi.
 */
const cacheKey = (language: LanguageCode) =>
  `polyglotpro:topic-order:${language}:${__DECK_BUILD_ID__}`

export function readTopicOrder(language: LanguageCode): string[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(language))
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)

    // Boshqa versiyadan qolgan buzuq qiymat butun ekranni yiqitmasligi kerak
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')
      ? parsed
      : null
  } catch {
    return null
  }
}

export function saveTopicOrder(language: LanguageCode, order: string[]): void {
  try {
    localStorage.setItem(cacheKey(language), JSON.stringify(order))
  } catch {
    // Xotira to'lgan bo'lsa ham ilova ishlashda davom etadi — tartib
    // shunchaki har safar lug'atdan hisoblanadi
  }
}
