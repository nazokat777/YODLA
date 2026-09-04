import { describe, expect, it } from 'vitest'
import { addMissingCards, db, gradeCard, getAllCards } from '@/core/db'
import { RETIRED_CARD_IDS, removeRetiredCards } from './retired'

describe('removeRetiredCards', () => {
  it('O‘RGANILGAN bo‘lsa ham o‘chiradi', async () => {
    await db.cards.clear()
    await addMissingCards([
      { word: 'gun', translation: 'qurol', language: 'en' },
      { word: 'water', translation: 'suv', language: 'en' },
    ])
    // Foydalanuvchi uni allaqachon mashq qilgan
    await gradeCard('en:gun', 5)

    await removeRetiredCards()

    // `pruneRemovedCards` o'rganilgan kartaga TEGMAYDI — progressni
    // saqlaydi. Lekin nomaqbul kontent uchun bu qoida teskari ishlaydi:
    // bola so'zni bir marta ko'rgani uni abadiy qoldirish sababi emas.
    const left = (await getAllCards('en')).map((card) => card.id)
    expect(left).toEqual(['en:water'])
  })

  it('ro‘yxat bo‘sh emas va id lar to‘g‘ri shaklda', () => {
    expect(RETIRED_CARD_IDS.length).toBeGreaterThan(0)
    for (const id of RETIRED_CARD_IDS) {
      expect(id).toMatch(/^(en|ru|ar):.+$/)
      expect(id).toBe(id.toLowerCase())
    }
  })
})
