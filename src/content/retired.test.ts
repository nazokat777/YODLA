import { describe, expect, it } from 'vitest'
import { addMissingCards, db, gradeCard, getAllCards } from '@/core/db'
import type { LanguageCode } from '@/core/types'
import { makeCardId } from '@/core/srs'
import { flatten, loadLanguageDeck } from './starterDecks'
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

describe('ro‘yxat lug‘at bilan ZID EMAS', () => {
  it.each(['en', 'ru', 'ar'] as LanguageCode[])(
    '%s — chiqarilgan so‘z lug‘atga qaytmagan',
    async (language) => {
      /*
       * Agar chiqarilgan so'z lug'atga qaytarilsa, ilova uni har
       * ochilishda qo'shib, darhol o'chirardi — foydalanuvchi so'zni
       * hech qachon ko'rmasdi va sababi hech qayerda ko'rinmasdi.
       *
       * Bu test ikkisidan birini tanlashga majbur qiladi: yo so'z
       * lug'atda, yo ro'yxatda.
       */
      const cards = flatten(await loadLanguageDeck(language))
      const retired = new Set(RETIRED_CARD_IDS)

      const conflicts = cards.filter((card) =>
        retired.has(makeCardId(card.language, card.word)),
      )

      expect(conflicts.map((card) => card.word)).toEqual([])
    },
  )
})
