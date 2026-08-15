import { describe, expect, it } from 'vitest'
import { addDays, startOfDay } from '@/lib/date'
import { db } from './db'
import {
  addMissingCards,
  clearAllCards,
  countDueCards,
  getAllCards,
  getCard,
  getDueCards,
  getLanguageStats,
  getMnemonicCards,
  getNextDueDate,
  gradeCard,
  pruneRemovedCards,
  setMnemonic,
  syncCardContent,
  type NewCardRecordInput,
} from './cards.repo'

const NOW = new Date(2026, 0, 15, 10, 0, 0).getTime()

const EN_WORDS: NewCardRecordInput[] = [
  { word: 'hello', translation: 'salom', language: 'en', topic: 'Salomlashish' },
  { word: 'water', translation: 'suv', language: 'en', topic: 'Ovqat' },
  { word: 'book', translation: 'kitob', language: 'en', topic: 'Maktab' },
]

const RU_WORDS: NewCardRecordInput[] = [
  { word: 'привет', translation: 'salom', language: 'ru', topic: 'Salomlashish' },
]

describe('addMissingCards', () => {
  it('kartalarni qo‘shadi va qo‘shilganlar sonini qaytaradi', async () => {
    const added = await addMissingCards(EN_WORDS, NOW)

    expect(added).toBe(3)
    expect(await getAllCards('en')).toHaveLength(3)
  })

  it('idempotent: qayta chaqirilganda dublikat yaratmaydi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    const secondRun = await addMissingCards(EN_WORDS, NOW)

    expect(secondRun).toBe(0)
    expect(await getAllCards('en')).toHaveLength(3)
  })

  it('mavjud kartaning progressini o‘chirib yubormaydi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    const graded = await gradeCard('en:hello', 4, NOW)
    expect(graded.repetitions).toBe(1)

    // Kontent qayta yuklandi (masalan, ilova yangilangandan keyin)
    await addMissingCards(EN_WORDS, NOW)

    const after = await getCard('en:hello')
    expect(after?.repetitions).toBe(1)
    expect(after?.interval).toBe(1)
  })

  it('faqat yangi so‘zlarni qo‘shadi', async () => {
    await addMissingCards(EN_WORDS, NOW)

    const added = await addMissingCards(
      [...EN_WORDS, { word: 'bread', translation: 'non', language: 'en' }],
      NOW,
    )

    expect(added).toBe(1)
    expect(await getAllCards('en')).toHaveLength(4)
  })

  it('bo‘sh ro‘yxat bilan chaqirilsa hech narsa qilmaydi', async () => {
    expect(await addMissingCards([], NOW)).toBe(0)
  })

  it('bitta chaqiruv ichidagi takroriy so‘zni bir marta sanaydi', async () => {
    // "Hello" va "hello" bir xil id beradi (til:so‘z, kichik harflarda)
    const added = await addMissingCards(
      [
        { word: 'hello', translation: 'salom', language: 'en' },
        { word: 'Hello', translation: 'salom (takror)', language: 'en' },
      ],
      NOW,
    )

    expect(added).toBe(1)
    expect(await getAllCards('en')).toHaveLength(1)
    // Birinchi yozuv saqlanadi, ikkinchisi tashlab yuboriladi
    expect((await getCard('en:hello'))?.translation).toBe('salom')
  })

  it('id `til:so‘z` ko‘rinishida va katta-kichik harfga bog‘liq emas', async () => {
    await addMissingCards([{ word: 'Hello', translation: 'salom', language: 'en' }], NOW)

    expect(await getCard('en:hello')).toBeDefined()
  })
})

describe('getDueCards / countDueCards', () => {
  it('yangi kartalar darhol takrorlashga tayyor', async () => {
    await addMissingCards(EN_WORDS, NOW)

    expect(await countDueCards('en', NOW)).toBe(3)
    expect(await getDueCards('en', NOW)).toHaveLength(3)
  })

  it('baholangan karta navbatdan chiqadi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    await gradeCard('en:hello', 4, NOW)

    const due = await getDueCards('en', NOW)

    expect(due).toHaveLength(2)
    expect(due.map((card) => card.id)).not.toContain('en:hello')
  })

  it('ertasi kuni karta yana navbatga qaytadi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    await gradeCard('en:hello', 4, NOW)

    const tomorrow = addDays(startOfDay(NOW), 1)

    expect(await countDueCards('en', tomorrow)).toBe(3)
  })

  it('faqat tanlangan tildagi kartalarni qaytaradi', async () => {
    await addMissingCards([...EN_WORDS, ...RU_WORDS], NOW)

    expect(await countDueCards('en', NOW)).toBe(3)
    expect(await countDueCards('ru', NOW)).toBe(1)
    expect(await countDueCards('ar', NOW)).toBe(0)
  })

  it('eng kechikkan karta birinchi bo‘lib keladi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    // "hello" ni uzoq muddatga, "water" ni qisqa muddatga surib qo'yamiz
    await gradeCard('en:hello', 5, NOW) // 1 kun
    await gradeCard('en:water', 5, NOW) // 1 kun
    await gradeCard('en:water', 5, addDays(NOW, 1)) // 6 kun

    const due = await getDueCards('en', addDays(NOW, 30))

    expect(due.map((card) => card.id)).toEqual(['en:book', 'en:hello', 'en:water'])
  })

  it('limit natijani cheklaydi', async () => {
    await addMissingCards(EN_WORDS, NOW)

    expect(await getDueCards('en', NOW, 2)).toHaveLength(2)
  })
})

describe('gradeCard', () => {
  it('SM-2 natijasini saqlaydi', async () => {
    await addMissingCards(EN_WORDS, NOW)

    const updated = await gradeCard('en:hello', 4, NOW)

    expect(updated.repetitions).toBe(1)
    expect(updated.interval).toBe(1)
    expect(updated.easeFactor).toBe(2.5)
    expect(updated.dueDate).toBe(addDays(startOfDay(NOW), 1))

    // Bazadagi yozuv ham yangilangan
    expect(await getCard('en:hello')).toEqual(updated)
  })

  it('statistika maydonlarini yangilaydi', async () => {
    await addMissingCards(EN_WORDS, NOW)

    await gradeCard('en:hello', 4, NOW)
    const afterFail = await gradeCard('en:hello', 1, addDays(NOW, 1))

    expect(afterFail.totalReviews).toBe(2)
    expect(afterFail.lapses).toBe(1)
    expect(afterFail.lastReviewedAt).toBe(addDays(NOW, 1))
    expect(afterFail.repetitions).toBe(0)
  })

  it('to‘g‘ri javobda lapses o‘smaydi', async () => {
    await addMissingCards(EN_WORDS, NOW)

    const updated = await gradeCard('en:hello', 3, NOW)

    expect(updated.lapses).toBe(0)
    expect(updated.totalReviews).toBe(1)
  })

  it('mavjud bo‘lmagan karta uchun xato tashlaydi', async () => {
    await expect(gradeCard('en:yoq', 4, NOW)).rejects.toThrow(/topilmadi/)
  })

  it('kontent maydonlariga tegmaydi', async () => {
    await addMissingCards(EN_WORDS, NOW)

    const updated = await gradeCard('en:hello', 4, NOW)

    expect(updated.word).toBe('hello')
    expect(updated.translation).toBe('salom')
    expect(updated.topic).toBe('Salomlashish')
    expect(updated.createdAt).toBe(NOW)
  })
})

describe('getLanguageStats', () => {
  it('bo‘sh bazada barcha ko‘rsatkichlar nol', async () => {
    expect(await getLanguageStats('en', NOW)).toEqual({
      total: 0,
      due: 0,
      fresh: 0,
      learning: 0,
      mature: 0,
    })
  })

  it('kartalarni holati bo‘yicha ajratadi', async () => {
    await addMissingCards(EN_WORDS, NOW)

    // "hello" ni 21 kundan uzun intervalgacha olib chiqamiz:
    // 1 → 6 → 15 → 38 kun
    let at = NOW
    for (let i = 0; i < 4; i += 1) {
      const card = await gradeCard('en:hello', 4, at)
      at = card.dueDate
    }
    // "water" — o'rganilmoqda (interval 1 kun)
    await gradeCard('en:water', 4, NOW)
    // "book" — hali teginilmagan

    const stats = await getLanguageStats('en', NOW)

    expect(stats.total).toBe(3)
    expect(stats.mature).toBe(1) // hello (38 kun)
    expect(stats.learning).toBe(1) // water
    expect(stats.fresh).toBe(1) // book
    expect(stats.due).toBe(1) // faqat book hozir tayyor
  })
})

describe('getNextDueDate', () => {
  it('kartalar yo‘q bo‘lsa null', async () => {
    expect(await getNextDueDate('en', NOW)).toBeNull()
  })

  it('barcha kartalar hozir muddatli bo‘lsa null — bu KELAJAKDAGI eng yaqin vaqt', async () => {
    await addMissingCards(EN_WORDS, NOW)

    expect(await getNextDueDate('en', NOW)).toBeNull()
  })

  it('baholangandan keyin ertangi kunni qaytaradi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    await gradeCard('en:hello', 4, NOW)
    await gradeCard('en:water', 4, NOW)
    await gradeCard('en:book', 4, NOW)

    expect(await getNextDueDate('en', NOW)).toBe(addDays(startOfDay(NOW), 1))
  })

  it('eng yaqin kelajakdagi muddatni tanlaydi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    await db.cards.update('en:book', { dueDate: addDays(startOfDay(NOW), 5) })
    await db.cards.update('en:hello', { dueDate: addDays(startOfDay(NOW), 2) })
    await db.cards.update('en:water', { dueDate: addDays(startOfDay(NOW), 9) })

    expect(await getNextDueDate('en', NOW)).toBe(addDays(startOfDay(NOW), 2))
  })

  it('boshqa tilning kartalarini hisobga olmaydi', async () => {
    await addMissingCards(RU_WORDS, NOW)
    await db.cards.update('ru:привет', { dueDate: addDays(startOfDay(NOW), 3) })

    expect(await getNextDueDate('en', NOW)).toBeNull()
    expect(await getNextDueDate('ru', NOW)).toBe(addDays(startOfDay(NOW), 3))
  })
})

describe('getLanguageStats — chegara holatlari', () => {
  it('interval roppa-rosa 21 kun bo‘lsa — "mustahkam"', async () => {
    await addMissingCards(EN_WORDS, NOW)
    await db.cards.update('en:hello', { interval: 21, repetitions: 3, totalReviews: 3 })
    await db.cards.update('en:water', { interval: 20, repetitions: 3, totalReviews: 3 })

    const stats = await getLanguageStats('en', NOW)

    expect(stats.mature).toBe(1) // hello (21 kun)
    expect(stats.learning).toBe(1) // water (20 kun)
  })

  it('unutilgan karta "yangi" emas — u o‘rganilmoqda', async () => {
    await addMissingCards(EN_WORDS, NOW)
    // Bir marta to'g'ri, keyin xato → repetitions 0 ga qaytadi
    await gradeCard('en:hello', 4, NOW)
    const lapsed = await gradeCard('en:hello', 0, addDays(NOW, 1))

    expect(lapsed.repetitions).toBe(0) // repetitions bo'yicha "yangi"ga o'xshaydi
    expect(lapsed.totalReviews).toBe(2) // lekin karta allaqachon ko'rilgan

    const stats = await getLanguageStats('en', NOW)

    expect(stats.fresh).toBe(2) // faqat water va book
    expect(stats.learning).toBe(1) // hello
  })
})

describe('clearAllCards', () => {
  it('barcha tillardagi kartalarni o‘chiradi', async () => {
    await addMissingCards([...EN_WORDS, ...RU_WORDS], NOW)

    await clearAllCards()

    expect(await getAllCards('en')).toHaveLength(0)
    expect(await getAllCards('ru')).toHaveLength(0)
  })
})

describe('syncCardContent', () => {
  it('mavjud kartaga yangi jumlani qo‘shadi', async () => {
    // Kontent yangilanganda ("gap ichida" mashqi uchun jumla qo'shildi)
    // u ALLAQACHON o'rnatilgan foydalanuvchilarga ham yetib borishi kerak
    await addMissingCards([{ word: 'hello', translation: 'salom', language: 'en' }], NOW)

    const updated = await syncCardContent([
      { word: 'hello', translation: 'salom', language: 'en', sentence: 'Say hello to her' },
    ])

    expect(updated).toBe(1)
    expect((await getCard('en:hello'))?.sentence).toBe('Say hello to her')
  })

  it('o‘RGANISH PROGRESSINI buzmaydi', async () => {
    await addMissingCards([{ word: 'hello', translation: 'salom', language: 'en' }], NOW)
    await gradeCard('en:hello', 5)

    const before = await getCard('en:hello')

    await syncCardContent([
      { word: 'hello', translation: 'salom', language: 'en', sentence: 'Say hello to her' },
    ])

    const after = await getCard('en:hello')
    // SM-2 holati daxlsiz qolishi SHART — aks holda kontent yangilanishi
    // foydalanuvchining oylar davomidagi mehnatini nolga qaytarardi
    expect(after?.interval).toBe(before?.interval)
    expect(after?.repetitions).toBe(before?.repetitions)
    expect(after?.easeFactor).toBe(before?.easeFactor)
    expect(after?.dueDate).toBe(before?.dueDate)
    expect(after?.totalReviews).toBe(before?.totalReviews)
  })

  it('o‘zgarmagan kartaga tegmaydi', async () => {
    await addMissingCards(
      [{ word: 'hello', translation: 'salom', language: 'en', sentence: 'Say hello to her' }],
      NOW,
    )

    const updated = await syncCardContent([
      { word: 'hello', translation: 'salom', language: 'en', sentence: 'Say hello to her' },
    ])

    // Har ochilishda bazani behuda yozish shart emas
    expect(updated).toBe(0)
  })

  it('bazada yo‘q kartani yaratmaydi', async () => {
    const updated = await syncCardContent([
      { word: 'ghost', translation: 'arvoh', language: 'en', sentence: 'A ghost appeared' },
    ])

    expect(updated).toBe(0)
    expect(await getCard('en:ghost')).toBeUndefined()
  })
})

describe('pruneRemovedCards', () => {
  it('kontentdan chiqarilgan, hech qachon takrorlanmagan kartani o‘chiradi', async () => {
    // Darslikdagi shaxs ismlari lug'atdan chiqarildi — eski o'rnatishlarda
    // ular baribir qolib ketardi
    await addMissingCards(
      [
        { word: 'hello', translation: 'salom', language: 'en' },
        { word: 'chris', translation: 'Kris', language: 'en' },
      ],
      NOW,
    )

    const removed = await pruneRemovedCards('en', [
      { word: 'hello', translation: 'salom', language: 'en' },
    ])

    expect(removed).toBe(1)
    expect(await getCard('en:chris')).toBeUndefined()
    expect(await getCard('en:hello')).toBeDefined()
  })

  it('TAKRORLANGAN kartaga tegmaydi — mehnat yo‘qolmaydi', async () => {
    await addMissingCards([{ word: 'chris', translation: 'Kris', language: 'en' }], NOW)
    await gradeCard('en:chris', 4)

    const removed = await pruneRemovedCards('en', [])

    // Foydalanuvchi bu so'zni o'rgangan bo'lsa, uni jimgina o'chirish
    // uning progressini yo'q qilish bo'lardi
    expect(removed).toBe(0)
    expect(await getCard('en:chris')).toBeDefined()
  })

  it('boshqa tilning kartalariga tegmaydi', async () => {
    await addMissingCards(RU_WORDS, NOW)

    const removed = await pruneRemovedCards('en', [])

    expect(removed).toBe(0)
    expect(await getCard('ru:привет')).toBeDefined()
  })
})

describe('getMnemonicCards', () => {
  it('faqat mnemonikasi BOR kartalarni qaytaradi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    await setMnemonic('en:water', 'vatanimda suv toza')

    const cards = await getMnemonicCards('en')

    expect(cards.map((card) => card.id)).toEqual(['en:water'])
  })

  it('boshqa tilning kartalarini aralashtirmaydi', async () => {
    await addMissingCards([...EN_WORDS, ...RU_WORDS], NOW)
    await setMnemonic('en:water', 'suv haqida')
    await setMnemonic('ru:привет', 'salom haqida')

    expect((await getMnemonicCards('ru')).map((card) => card.id)).toEqual(['ru:привет'])
  })

  it('so‘z bo‘yicha alifbo tartibida keladi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    await setMnemonic('en:water', 'b')
    await setMnemonic('en:book', 'a')

    expect((await getMnemonicCards('en')).map((card) => card.word)).toEqual(['book', 'water'])
  })

  it('mnemonika o‘chirilgach ro‘yxatdan chiqadi', async () => {
    await addMissingCards(EN_WORDS, NOW)
    await setMnemonic('en:water', 'vaqtinchalik')
    await setMnemonic('en:water', '')

    expect(await getMnemonicCards('en')).toEqual([])
  })
})
