import type { Card, LevelCode } from '@/core/types'

/**
 * Bazada saqlanadigan karta.
 *
 * `Card` — TZ'dagi yadro model (algoritm uchun zarur maydonlar).
 * Bu yerdagi qo'shimcha maydonlar statistika va kontentni tartiblash uchun:
 * algoritm ularga tegmaydi.
 */
export interface CardRecord extends Card {
  /** Karta birinchi marta qo'shilgan vaqt */
  createdAt: number
  /** Oxirgi takrorlash vaqti (hali takrorlanmagan bo'lsa null) */
  lastReviewedAt: number | null
  /** Jami takrorlashlar soni (to'g'ri + xato) */
  totalReviews: number
  /** Necha marta unutilgan (baho < 3) — "qiyin so'zlar" ro'yxati uchun */
  lapses: number
  /** Mavzu, masalan "Salomlashish" */
  topic?: string
  /** CEFR darajasi */
  level?: LevelCode
  /**
   * So'z ishlatilgan qisqa jumla — "jumla qurish" mashqi va kontekstli
   * kirish (Krashen, i+1) uchun. Bo'lmasa, o'sha mashq turi o'tkazib
   * yuboriladi.
   */
  sentence?: string
  /** Jumlaning o'zbekcha tarjimasi */
  sentenceTranslation?: string
}

/**
 * Karta "yetuk" (mustahkam yodlangan) hisoblanadigan interval chegarasi.
 * 21 kun — o'rta muddatli xotiradan uzoq muddatlisiga o'tish belgisi.
 */
export const MATURE_INTERVAL_DAYS = 21

/**
 * Bir kunlik faoliyat (geymifikatsiya uchun).
 *
 * Kalit — lokal kun boshi timestamp'i. Tillar bo'yicha AJRATILMAYDI:
 * streak va kunlik maqsad odat haqida, foydalanuvchi qaysi tilni
 * mashq qilgani muhim emas.
 */
export interface DailyStat {
  /** Kun boshi (lokal vaqt), birlamchi kalit */
  day: number
  /** Shu kuni to'plangan XP */
  xp: number
  /** Berilgan javoblar soni (takroran chiqqan kartalar ham sanaladi) */
  answered: number
  /** To'g'ri javoblar (kichik imlo xatosi ham shu yerga kiradi) */
  correct: number
  /**
   * Shu kuni mashq qilingan NOYOB kartalar.
   * Kunlik maqsad "20 so'z" shu ro'yxat uzunligi bilan o'lchanadi —
   * bitta so'zni 20 marta takrorlash maqsadni bajarmaydi.
   */
  cardIds: string[]
  /** Kunlik maqsad bonusi berilganmi (ikki marta berilmasligi uchun) */
  goalBonusAwarded: boolean
}

/** Foydalanuvchi profili — bazada bitta yozuv */
export interface ProfileRecord {
  /** Har doim 'me' — MVP'da bitta foydalanuvchi */
  id: 'me'
  totalXp: number
  /** Qo'lda ishlatiladigan "streak muzlatish"lar zaxirasi */
  freezesAvailable: number
  /** Muzlatish bilan saqlangan kunlar (kun boshi timestamp'lari) */
  frozenDays: number[]
  /** Oxirgi marta muzlatish berilgan streak qiymati */
  lastFreezeAwardedAtStreak: number
  /** Ochilgan nishonlar id lari */
  unlockedBadges: string[]
  /** Nishon qachon ochilgani */
  badgeUnlockedAt: Record<string, number>
  /** Bitta ham xatosiz tugatilgan seanslar soni */
  perfectSessions: number
}

/** Yangi foydalanuvchi profili */
export function createProfile(): ProfileRecord {
  return {
    id: 'me',
    totalXp: 0,
    // Bitta muzlatish sovg'a: birinchi xatoda streak yo'qolib, foydalanuvchi
    // ilovadan butunlay voz kechmasligi uchun
    freezesAvailable: 1,
    frozenDays: [],
    lastFreezeAwardedAtStreak: 0,
    unlockedBadges: [],
    badgeUnlockedAt: {},
    perfectSessions: 0,
  }
}
