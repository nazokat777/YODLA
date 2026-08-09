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
    speechLocale: 'en-US',
  },
  ru: {
    code: 'ru',
    name: 'Rus tili',
    nativeName: 'Русский',
    dir: 'ltr',
    speechLocale: 'ru-RU',
  },
  ar: {
    code: 'ar',
    name: 'Arab tili',
    nativeName: 'العربية',
    dir: 'rtl',
    speechLocale: 'ar-SA',
  },
}

/** Tanlash ekranlarida aylanish uchun massiv ko'rinishi */
export const LANGUAGE_LIST: LanguageMeta[] = Object.values(LANGUAGES)

/** Berilgan kod haqiqiy til kodimi? (saqlangan ma'lumotni tekshirish uchun) */
export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && value in LANGUAGES
}
