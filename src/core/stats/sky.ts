import type { CardRecord } from '@/core/db'
import { wordStrength } from '@/core/srs'

/**
 * SO'Z OSMONI — har o'rganilgan so'z bitta yulduz.
 *
 * PSIXOLOGIYA: raqam ("128 so'z") his qilinmaydi, TASVIR his qilinadi.
 * O'z qo'li bilan yoqilgan yulduzlar osmoni — egalik hissi ("bu mening
 * osmonim") va endowed progress: bo'sh osmon to'ldirishga undaydi,
 * to'lgan osmonni esa tashlab ketish og'ir.
 *
 * Har yulduzning O'RNI so'zdan hisoblanadi (hash) — ya'ni yulduz har
 * ochilishda o'sha joyda turadi. Tasodifiy joylashsa osmon har safar
 * boshqacha bo'lar va "meniki" degan his yo'qolardi.
 *
 * Yorqinlik — so'zning kuchi: yangi o'rganilgan so'z xira, uzoq
 * muddatli xotiraga o'tgan so'z yorqin. Osmon vaqt o'tgani sari
 * "yonadi" — bu takrorlash uchun ko'rinadigan sabab.
 */
export interface SkyStar {
  id: string
  word: string
  translation: string
  /** 0..100 — foizda, SVG viewBox ga nisbatan */
  x: number
  y: number
  /** 0..3 — so'z kuchi (yorqinlik) */
  strength: number
}

/** Ekranga chiziladigan yulduzlarning yuqori chegarasi — 4400 ta DOM tuguni og'ir */
export const SKY_STAR_LIMIT = 160

/** Barqaror 32-bitli hash (FNV-1a) — bir so'z har doim bir joyda */
export function hashString(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

/**
 * Kartalardan osmon yulduzlari.
 *
 * Faqat KO'RILGAN so'zlar (`totalReviews > 0`). Chegara oshsa eng KUCHLI
 * so'zlar qoladi (ular osmonning "doimiy" qismi), qolganlari `total`
 * sonida hisoblanadi.
 */
export function skyStars(
  cards: readonly CardRecord[],
  limit: number = SKY_STAR_LIMIT,
): { stars: SkyStar[]; total: number } {
  const learned = cards.filter((card) => card.totalReviews > 0)

  const stars = learned
    .map((card) => {
      const h = hashString(card.id)
      return {
        id: card.id,
        word: card.word,
        translation: card.translation,
        // Chetlarga yopishmasin: 4..96
        x: 4 + (h % 1000) / 1000 * 92,
        y: 4 + ((h >>> 10) % 1000) / 1000 * 92,
        strength: wordStrength(card),
      }
    })
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit)

  return { stars, total: learned.length }
}
