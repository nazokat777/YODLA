import Dexie, { type Table } from 'dexie'
import type { CardRecord, DailyStat, ProfileRecord } from './schema'

/**
 * IndexedDB sxemasi (Dexie orqali).
 *
 * `cards` indekslari:
 *   id                 — birlamchi kalit ("en:hello" ko'rinishida)
 *   language           — til bo'yicha filtrlash
 *   dueDate            — takrorlash navbati
 *   [language+dueDate] — qo'shma indeks: eng ko'p ishlatiladigan so'rov —
 *                        "shu tildagi, muddati yetgan kartalar" — bitta
 *                        indeks skani bilan bajariladi.
 */
export class PolyglotDatabase extends Dexie {
  // Dexie maydonlarni konstruktorda o'zi to'ldiradi
  cards!: Table<CardRecord, string>
  dailyStats!: Table<DailyStat, number>
  profile!: Table<ProfileRecord, string>

  constructor(name = 'polyglotpro') {
    super(name)

    this.version(1).stores({
      cards: 'id, language, dueDate, [language+dueDate]',
    })

    // Faza 4: geymifikatsiya jadvallari.
    // Dexie yangi store'larni avtomatik qo'shadi — mavjud kartalar saqlanadi.
    this.version(2).stores({
      cards: 'id, language, dueDate, [language+dueDate]',
      dailyStats: 'day',
      profile: 'id',
    })

    /*
     * `interval` va `totalReviews` uchun indekslar.
     *
     * Nishonlar uchun kerakli uchta son ("o'rganilgan", "mustahkam",
     * "jami") ilgari BUTUN jadvalni xotiraga ko'chirib hisoblanardi — va
     * bu har seans oxirida bajarilardi. Indeks bilan ular yozuvlarni
     * o'qimasdan sanaladi.
     *
     * Dexie mavjud ma'lumotni bir marta qayta indekslaydi; kartalar va
     * takrorlash progressi saqlanib qoladi.
     */
    this.version(3).stores({
      cards: 'id, language, dueDate, interval, totalReviews, [language+dueDate]',
      dailyStats: 'day',
      profile: 'id',
    })
  }
}

/** Ilova bo'ylab yagona baza nusxasi */
export const db = new PolyglotDatabase()
