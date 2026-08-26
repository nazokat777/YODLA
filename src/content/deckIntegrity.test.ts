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

const ARABIC = /\p{Script=Arabic}/u
const CYRILLIC = /\p{Script=Cyrillic}/u
const LATIN = /\p{Script=Latin}/u

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

  it('tarjima o‘rniga transkripsiya tushmagan', async () => {
    const cards = await allCards(language)

    // Manbada ba'zi so'zlarga ma'no o'rniga talaffuz qo'yilgan
    // (`you'll → "/juːl/"`). Bunday karta hech nima o'rgatmaydi va eng
    // yomoni — boshqa savollarda chalg'ituvchi variant bo'lib chiqadi.
    const ipa = /[ˈˌːɪəʊæʌɜɒθðʃʒŋ]/
    const bad = cards.filter((card) => {
      const text = card.translation.trim()
      return (text.startsWith('/') && text.endsWith('/')) || ipa.test(text)
    })

    expect(bad.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it('tarjima butunlay bosh harfda emas', async () => {
    const cards = await allCards(language)

    // Grammatika jadvallarining ustun yorlig'i tarjima maydoniga tushib
    // qolardi: `wish to → "RASMIY"`, `skidded → "D IKKILANADI"`.
    // O'zbekcha tarjima hech qachon butunlay bosh harfda yozilmaydi.
    const bad = cards.filter((card) => {
      const letters = card.translation.replace(/[^\p{L}]/gu, '')
      return letters.length >= 3 && letters === letters.toUpperCase()
    })

    expect(bad.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it("so'z o'rganilayotgan tilning yozuvida", async () => {
    const cards = await allCards(language)

    const expected =
      language === 'ar' ? ARABIC : language === 'ru' ? CYRILLIC : LATIN

    const wrong = cards.filter((card) => !expected.test(card.word))

    expect(wrong.map((card) => card.word)).toEqual([])
  })

  it('tarjimada begona yozuv qolmagan', async () => {
    const cards = await allCards(language)

    // Tarjima o'zbekcha — lotin yozuvida. Arab yoki kirill harfi manba
    // chalkashganini bildiradi: darslikdagi havola tarjima maydoniga
    // tushib qolardi (`كَذَاكَ → "= كَذَلِكَ shuningdek"`) va "eslab yozish"
    // mashqida foydalanuvchidan uni ham yozish talab qilinardi.
    const wrong = cards.filter(
      (card) => ARABIC.test(card.translation) || CYRILLIC.test(card.translation),
    )

    expect(wrong.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it('jumla tarjimasi ishonchli ko‘rinadi', async () => {
    const cards = await allCards(language)
    const pairs = cards.filter((card) => card.sentence && card.sentenceTranslation)

    // Tarjimada arab yoki kirill harfi — juftlash siljib ketgani belgisi
    const foreign = pairs.filter(
      (card) =>
        ARABIC.test(card.sentenceTranslation ?? '') ||
        CYRILLIC.test(card.sentenceTranslation ?? ''),
    )
    expect(foreign.map((card) => card.word)).toEqual([])

    // Uzunliklar nisbati aqlli chegarada: besh barobar farq juftlash
    // xatosidan boshqa narsa emas
    const skewed = pairs.filter((card) => {
      const ratio = (card.sentenceTranslation ?? '').length / (card.sentence ?? '').length
      return ratio < 0.2 || ratio > 5
    })
    expect(
      skewed.map((card) => `${card.sentence} → ${card.sentenceTranslation}`),
    ).toEqual([])
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
