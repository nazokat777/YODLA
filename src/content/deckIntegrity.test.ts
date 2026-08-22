import { describe, expect, it } from 'vitest'
import { LEVEL_ORDER } from '@/core/config/levels'
import { makeCardId } from '@/core/srs'
import { loadLanguageDeck } from './starterDecks'
import type { LanguageCode } from '@/core/types'

/**
 * Lug'at yaxlitligi.
 *
 * Kontentning katta qismi SKRIPT bilan import qilingan (Mabdaul qiroat,
 * Enterprise app, ru.db, Tatoeba). Skript o'zgarganda yoki manba
 * yangilanganda buzilgan yozuvlar jimgina kirib kelishi mumkin — ularni
 * faqat foydalanuvchi mashq paytida ko'rardi.
 *
 * Bu testlar aynan shu jimgina buzilishlarni tutadi.
 */

const LANGUAGES: LanguageCode[] = ['en', 'ru', 'ar']

/** Bir tildagi barcha kartalar, daraja bo'yicha yassilangan */
async function allCards(language: LanguageCode) {
  const deck = await loadLanguageDeck(language)

  return LEVEL_ORDER.flatMap((level) => deck[level])
}

describe.each(LANGUAGES)('lug‘at yaxlitligi — %s', (language) => {
  it('so‘z va tarjima bo‘sh emas', async () => {
    const cards = await allCards(language)
    const broken = cards.filter(
      (card) => card.word.trim().length === 0 || card.translation.trim().length === 0,
    )

    expect(broken).toEqual([])
  })

  it('so‘z tarjimasiga teng emas', async () => {
    const cards = await allCards(language)

    // Bunday karta mashqda ma'nosiz: savol ham, javob ham bir xil
    const same = cards.filter(
      (card) => card.word.trim().toLowerCase() === card.translation.trim().toLowerCase(),
    )

    expect(same.map((card) => card.word)).toEqual([])
  })

  it('karta id‘lari takrorlanmaydi', async () => {
    const cards = await allCards(language)

    const seen = new Set<string>()
    const duplicates: string[] = []

    for (const card of cards) {
      const id = card.id ?? makeCardId(card.language, card.word)
      if (seen.has(id)) duplicates.push(id)
      else seen.add(id)
    }

    // Takroriy id `addMissingCards` da yutiladi, lekin u YO'QOTILGAN
    // kontent belgisi: ikkinchi yozuvning tarjimasi hech qachon ko'rinmaydi
    expect(duplicates).toEqual([])
  })

  it('hamma karta shu tilga tegishli', async () => {
    const cards = await allCards(language)
    const foreign = cards.filter((card) => card.language !== language)

    expect(foreign.map((card) => card.word)).toEqual([])
  })

  it('daraja belgisi to‘g‘ri', async () => {
    const deck = await loadLanguageDeck(language)

    for (const level of LEVEL_ORDER) {
      const wrong = deck[level].filter((card) => card.level !== undefined && card.level !== level)
      expect(wrong.map((card) => card.word)).toEqual([])
    }
  })
})
