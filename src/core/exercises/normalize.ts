import type { LanguageCode } from '@/core/types'

/**
 * Javoblarni solishtirishdan oldin matnni normallashtirish.
 *
 * Maqsad — o'rganuvchini MAZMUN uchun tekshirish, klaviatura uchun emas.
 * Arab harakalari, rus "ё" harfi va o'zbekcha tutuq belgisining turli
 * ko'rinishlari xato hisoblanmasligi kerak.
 */

/** Gap tinish belgilari (lotin + kirill + arab). Apostrof VA defis saqlanadi. */
const PUNCTUATION = /[.,!?;:"«»“”()[\]{}…،؛؟]/g

/** Arab harakalari (unli belgilar) va cho'zish belgisi (tatweel) */
const ARABIC_MARKS = /[ً-ٰٟـ]/g

/** Alif variantlari: آ أ إ ٱ */
const ARABIC_ALEF_VARIANTS = /[آأإٱ]/g

/**
 * O'zbekcha tutuq belgisining barcha ko'rinishlari.
 * Foydalanuvchi "do'st", "do‘st", "doʻst" yoki "do`st" deb yozishi mumkin —
 * uchalasi ham to'g'ri javob.
 */
const APOSTROPHE_VARIANTS = /[‘’ʻʼ`´′]/g

/** Tilga bog'liq bo'lmagan umumiy tozalash */
function normalizeCommon(text: string): string {
  return text
    .toLowerCase()
    .replace(APOSTROPHE_VARIANTS, "'")
    .replace(PUNCTUATION, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Arab yozuvini soddalashtirish.
 *
 * Boshlovchilar uchun ataylab bag'rikeng: harakalar tushiriladi, alif va
 * "ya"/"alif maqsura" variantlari birlashtiriladi, "ta marbuta" (ة) "he" (ه)
 * ga tenglashtiriladi. Bu MSA imlosidagi eng ko'p uchraydigan
 * chalkashliklarni xato deb hisoblamaslikka imkon beradi.
 */
function normalizeArabic(text: string): string {
  return text
    .replace(ARABIC_MARKS, '')
    .replace(ARABIC_ALEF_VARIANTS, 'ا')
    .replace(/ى/g, 'ي') // ى → ي
    .replace(/ة/g, 'ه') // ة → ه
}

/** Rus tilida "ё" ko'pincha "е" deb yoziladi — bu xato emas */
function normalizeRussian(text: string): string {
  return text.replace(/ё/g, 'е')
}

/**
 * Solishtirish uchun tayyorlangan matn.
 * Bo'sh satr ham qaytishi mumkin (foydalanuvchi faqat tinish belgisi kiritsa).
 */
export function normalizeAnswer(text: string, language: LanguageCode): string {
  const base = normalizeCommon(text)

  switch (language) {
    case 'ar':
      return normalizeArabic(base)
    case 'ru':
      return normalizeRussian(base)
    case 'en':
      return base
  }
}

/**
 * Tahrirlash masofasi (Damerau–Levenshtein, OSA varianti).
 *
 * To'rt amal bittaga teng: qo'shish, o'chirish, almashtirish va
 * QO'SHNI HARFLARNING O'RIN ALMASHUVI.
 *
 * Nega o'rin almashuvi alohida hisoblanadi: klaviaturada eng ko'p
 * uchraydigan xato aynan shu ("sayohat" → "sayohta"). Oddiy Levenshtein
 * uni ikkita xato deb sanaydi va o'rganuvchini nohaq jazolaydi.
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  // So'zlar qisqa — to'liq matritsa o'qilishi osonroq
  const rows = a.length + 1
  const columns = b.length + 1
  const distance: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: columns }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < columns; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1

      let best = Math.min(
        distance[i - 1][j] + 1, // o'chirish
        distance[i][j - 1] + 1, // qo'shish
        distance[i - 1][j - 1] + cost, // almashtirish
      )

      // Qo'shni ikki harf o'rin almashgan bo'lsa — bitta tahrir
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, distance[i - 2][j - 2] + 1)
      }

      distance[i][j] = best
    }
  }

  return distance[a.length][b.length]
}

/**
 * Necha ta tahrir "kichik imlo xatosi" hisoblanadi.
 * Qisqa so'zlarda bitta harf ham ma'noni butunlay o'zgartiradi, shuning
 * uchun ular uchun bag'rikenglik yo'q.
 */
export function typoTolerance(expectedLength: number): number {
  if (expectedLength <= 3) return 0
  if (expectedLength <= 7) return 1
  return 2
}
