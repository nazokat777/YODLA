import type { LanguageCode, LanguageMeta } from '@/core/types'

/**
 * Qo'llab-quvvatlanadigan tillar ro'yxati.
 * Yangi til qo'shish uchun shu yerga bitta yozuv qo'shish kifoya.
 */
export const LANGUAGES: Record<LanguageCode, LanguageMeta> = {
  en: {
    code: 'en',
    name: 'Ingliz tili',
    nativeName: 'English',
    dir: 'ltr',
    script: 'latin',
    speechLocale: 'en-US',
  },
  ru: {
    code: 'ru',
    name: 'Rus tili',
    nativeName: 'Русский',
    dir: 'ltr',
    script: 'cyrillic',
    speechLocale: 'ru-RU',
  },
  ar: {
    code: 'ar',
    name: 'Arab tili',
    nativeName: 'العربية',
    dir: 'rtl',
    script: 'arabic',
    speechLocale: 'ar-SA',
  },
}

/** Tanlash ekranlarida aylanish uchun massiv ko'rinishi */
export const LANGUAGE_LIST: LanguageMeta[] = Object.values(LANGUAGES)

/**
 * Berilgan kod haqiqiy til kodimi? (saqlangan ma'lumotni tekshirish uchun)
 *
 * `in` EMAS, `Object.hasOwn`: `in` prototip zanjirini ham qaraydi, ya'ni
 * `'toString' in LANGUAGES` — rost. Buzilgan sozlama shunday qiymat
 * saqlagan bo'lsa, u tekshiruvdan o'tib ketardi va keyin
 * `LANGUAGES['toString'].dir` `undefined` berib, xato ancha uzoqda
 * chiqardi.
 */
export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && Object.hasOwn(LANGUAGES, value)
}
