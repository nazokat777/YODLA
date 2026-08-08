import type { Card, Grade, LanguageCode } from '@/core/types'
import { initialSrsState, reviewSrsState } from './sm2'

/** Yangi karta yaratish uchun minimal ma'lumot */
export interface NewCardInput {
  word: string
  translation: string
  language: LanguageCode
  /** Berilmasa, so'z va tildan avtomatik yasaladi */
  id?: string
  mnemonic?: string
  imageUrl?: string
}

/**
 * Karta identifikatori: `til:so'z` ko'rinishida.
 *
 * Nega tasodifiy UUID emas: identifikator aniq bo'lsa, bir xil so'zni
 * qayta yuklash (seed) takroriy karta yaratmaydi va foydalanuvchining
 * mavjud progressi buzilmaydi.
 */
export function makeCardId(language: LanguageCode, word: string): string {
  return `${language}:${word.trim().toLowerCase()}`
}

/** Yangi kartani boshlang'ich SRS holati bilan yaratadi (darhol takrorlashga tayyor) */
export function createCard(input: NewCardInput, now: number): Card {
  return {
    id: input.id ?? makeCardId(input.language, input.word),
    word: input.word,
    translation: input.translation,
    language: input.language,
    mnemonic: input.mnemonic,
    imageUrl: input.imageUrl,
    ...initialSrsState(now),
  }
}

/**
 * Kartani baholash: SM-2 qadamini butun kartaga qo'llaydi.
 * Sof funksiya — yangi obyekt qaytaradi.
 */
export function reviewCard(card: Card, grade: Grade, now: number): Card {
  return { ...card, ...reviewSrsState(card, grade, now) }
}
