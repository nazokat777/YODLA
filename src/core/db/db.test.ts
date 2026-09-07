import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { PolyglotDatabase, db } from './db'

const OLD_NAME = 'polyglotpro-migratsiya-testi'

afterEach(async () => {
  await Dexie.delete(OLD_NAME)
})

describe('sxema', () => {
  it('joriy versiya — 4', () => {
    expect(db.verno).toBe(4)
  })

  it('kerakli indekslar mavjud', () => {
    const indexes = db.cards.schema.indexes.map((index) => index.name)

    /*
     * `[language+dueDate]` — "shu tildagi, muddati yetgan kartalar"
     * so'rovi bitta indeks skani bilan bajariladi.
     * `interval` va `totalReviews` — nishonlar uchun sonlar yozuvlarni
     * o'qimasdan sanaladi.
     */
    expect(indexes).toContain('language')
    expect(indexes).toContain('dueDate')
    expect(indexes).toContain('interval')
    expect(indexes).toContain('totalReviews')
    expect(indexes).toContain('[language+dueDate]')
  })

  it('birlamchi kalit — id', () => {
    expect(db.cards.schema.primKey.keyPath).toBe('id')
  })
})

describe('migratsiya', () => {
  it('ESKI versiyadagi kartalar va progress SAQLANADI', async () => {
    /*
     * Foydalanuvchi oylab to'plagan takrorlash progressi faqat shu
     * bazada yashaydi va zaxirasi yo'q. Migratsiya uni yo'qotsa,
     * hech narsa qaytarib bo'lmaydi.
     *
     * Shuning uchun eski (1-versiya) baza yaratib, joriy sxema bilan
     * qayta ochamiz va yozuv o'z SM-2 holati bilan turganini
     * tekshiramiz.
     */
    const old = new Dexie(OLD_NAME)
    old.version(1).stores({ cards: 'id, language, dueDate, [language+dueDate]' })
    await old.open()

    await old.table('cards').put({
      id: 'en:hello',
      word: 'hello',
      translation: 'salom',
      language: 'en',
      interval: 21,
      repetitions: 5,
      easeFactor: 2.6,
      dueDate: 1_700_000_000_000,
      createdAt: 1,
      lastReviewedAt: 2,
      totalReviews: 9,
      lapses: 1,
    })
    old.close()

    // Joriy sxema bilan qayta ochish — Dexie 3-versiyaga ko'chiradi
    const upgraded = new PolyglotDatabase(OLD_NAME)
    await upgraded.open()

    const card = await upgraded.cards.get('en:hello')

    expect(card?.repetitions).toBe(5)
    expect(card?.interval).toBe(21)
    expect(card?.easeFactor).toBe(2.6)
    expect(card?.totalReviews).toBe(9)

    // Yangi jadvallar ham paydo bo'lgan
    expect(await upgraded.dailyStats.count()).toBe(0)
    expect(await upgraded.profile.count()).toBe(0)

    upgraded.close()
  })

  it('eski kartalar YANGI indeks bo‘yicha topiladi', async () => {
    const old = new Dexie(OLD_NAME)
    old.version(1).stores({ cards: 'id, language, dueDate, [language+dueDate]' })
    await old.open()
    await old.table('cards').put({
      id: 'en:water',
      word: 'water',
      translation: 'suv',
      language: 'en',
      interval: 6,
      repetitions: 3,
      easeFactor: 2.5,
      dueDate: 0,
      createdAt: 0,
      lastReviewedAt: null,
      totalReviews: 4,
      lapses: 0,
    })
    old.close()

    const upgraded = new PolyglotDatabase(OLD_NAME)
    await upgraded.open()

    // `totalReviews` indeksi 3-versiyada qo'shilgan — Dexie mavjud
    // yozuvlarni qayta indekslashi kerak
    const seen = await upgraded.cards.where('totalReviews').above(0).count()

    expect(seen).toBe(1)

    upgraded.close()
  })
})

describe('4-versiya — ko‘nikma statistikasi', () => {
  it('ESKI kartalar progressi bilan ochiladi va typeStats yozilaveradi', async () => {
    /*
     * `typeStats` ixtiyoriy maydon: eski kartalarda u yo'q. Migratsiya
     * SM-2 holatiga TEGMASLIGI kerak — foydalanuvchining oylab
     * to'plagan progressi faqat shu bazada yashaydi.
     */
    const old = new Dexie(OLD_NAME)
    old.version(1).stores({ cards: 'id, language, dueDate, [language+dueDate]' })
    await old.open()
    await old.table('cards').put({
      id: 'en:apple',
      word: 'apple',
      translation: 'olma',
      language: 'en',
      interval: 15,
      repetitions: 4,
      easeFactor: 2.3,
      dueDate: 5,
      createdAt: 1,
      lastReviewedAt: 2,
      totalReviews: 7,
      lapses: 2,
    })
    old.close()

    const upgraded = new PolyglotDatabase(OLD_NAME)
    await upgraded.open()

    const card = await upgraded.cards.get('en:apple')

    expect(card?.repetitions).toBe(4)
    expect(card?.easeFactor).toBe(2.3)
    expect(card?.typeStats).toBeUndefined()

    upgraded.close()
  })
})
