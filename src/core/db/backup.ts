import type { CardRecord, DailyStat, ProfileRecord } from './schema'
import { db } from './db'

/**
 * ZAXIRA NUSXA — progress faqat shu qurilmadagi IndexedDB'da yashaydi.
 *
 * Telefon almashsa, brauzer tozalansa yoki ilova o'chirilsa — hamma
 * narsa yo'qoladi va server yo'q. Zaxira — foydalanuvchining o'z
 * qo'lidagi fayl: yuklab oladi, keyin boshqa qurilmada tiklaydi.
 *
 * FAQAT PROGRESS saqlanadi (lug'atning o'zi emas): kartalarning so'zi va
 * tarjimasi kontentdan qayta keladi, fayl esa kichik bo'ladi. Tiklashda
 * karta bazada bo'lmasa (kontent o'zgargan) — o'sha yozuv o'tkazib
 * yuboriladi, qolganlari tiklanadi.
 */
export const BACKUP_VERSION = 1

/** Kartaning faqat o'rganish holati — kontent maydonlarisiz */
export type CardProgress = Pick<
  CardRecord,
  | 'id'
  | 'interval'
  | 'repetitions'
  | 'easeFactor'
  | 'dueDate'
  | 'lastReviewedAt'
  | 'totalReviews'
  | 'lapses'
  | 'mnemonic'
  | 'typeStats'
>

export interface Backup {
  version: number
  exportedAt: number
  cards: CardProgress[]
  dailyStats: DailyStat[]
  profile: ProfileRecord | null
  /** Zustand sozlamalari (til, maqsad, ovoz…) — JSON satr */
  settings: string | null
}

const PROGRESS_FIELDS = [
  'id',
  'interval',
  'repetitions',
  'easeFactor',
  'dueDate',
  'lastReviewedAt',
  'totalReviews',
  'lapses',
  'mnemonic',
  'typeStats',
] as const satisfies readonly (keyof CardProgress)[]

function toProgress(card: CardRecord): CardProgress {
  const out = {} as Record<string, unknown>
  for (const key of PROGRESS_FIELDS) if (card[key] !== undefined) out[key] = card[key]
  return out as CardProgress
}

/** Zaxira ob'ekti. Faqat KO'RILGAN kartalar — ko'rilmaganida saqlaydigan narsa yo'q */
export async function createBackup(settings: string | null, now: number = Date.now()): Promise<Backup> {
  const [cards, dailyStats, profile] = await Promise.all([
    db.cards.filter((card) => card.totalReviews > 0 || Boolean(card.mnemonic)).toArray(),
    db.dailyStats.toArray(),
    db.profile.get('me'),
  ])

  return {
    version: BACKUP_VERSION,
    exportedAt: now,
    cards: cards.map(toProgress),
    dailyStats,
    profile: profile ?? null,
    settings,
  }
}

/** Fayl mazmuni to'g'ri zaxirami — tashqi ma'lumot, ishonib bo'lmaydi */
export function parseBackup(text: string): Backup | null {
  try {
    const data = JSON.parse(text) as Partial<Backup>
    if (!data || typeof data !== 'object') return null
    if (data.version !== BACKUP_VERSION) return null
    if (!Array.isArray(data.cards) || !Array.isArray(data.dailyStats)) return null
    if (!data.cards.every((card) => typeof card?.id === 'string')) return null

    return {
      version: BACKUP_VERSION,
      exportedAt: typeof data.exportedAt === 'number' ? data.exportedAt : 0,
      cards: data.cards,
      dailyStats: data.dailyStats,
      profile: data.profile ?? null,
      settings: typeof data.settings === 'string' ? data.settings : null,
    }
  } catch {
    return null
  }
}

export interface RestoreResult {
  /** Tiklangan kartalar */
  restored: number
  /** Bazada topilmagan (kontent o'zgargan) kartalar */
  skipped: number
}

/**
 * Zaxirani BAZA USTIGA yozadi.
 *
 * Kartalar: mavjud yozuvning kontent maydonlari saqlanadi, progress
 * fayldan olinadi. Kunlik statistika va profil to'liq almashtiriladi —
 * "ikki qurilma progressini qo'shish" emas, "shu qurilmani o'sha
 * holatga keltirish". Bitta tranzaksiya: yarim tiklangan holat yo'q.
 */
export async function restoreBackup(backup: Backup): Promise<RestoreResult> {
  return db.transaction('rw', db.cards, db.dailyStats, db.profile, async () => {
    let restored = 0
    let skipped = 0

    const existing = await db.cards.bulkGet(backup.cards.map((card) => card.id))
    const updates: CardRecord[] = []
    backup.cards.forEach((progress, index) => {
      const current = existing[index]
      if (!current) {
        skipped += 1
        return
      }
      updates.push({ ...current, ...progress })
      restored += 1
    })
    if (updates.length > 0) await db.cards.bulkPut(updates)

    await db.dailyStats.clear()
    if (backup.dailyStats.length > 0) await db.dailyStats.bulkPut(backup.dailyStats)

    if (backup.profile) await db.profile.put({ ...backup.profile, id: 'me' })

    return { restored, skipped }
  })
}
