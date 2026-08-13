import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '@/core/config/languages'
import { LEVEL_ORDER } from '@/core/config/levels'
import { transliterate } from '@/core/text/transliterate'
import { normalizeAnswer } from '@/core/exercises/normalize'
import { makeCardId } from '@/core/srs'
import type { LanguageCode } from '@/core/types'
import { flatten, loadLanguageDeck } from './starterDecks'

const LANGUAGE_CODES: LanguageCode[] = ['en', 'ru', 'ar']

// Lug'at endi dangasa yuklanadi — testda barchasini oldindan olamiz
const DECKS = {
  en: await loadLanguageDeck('en'),
  ru: await loadLanguageDeck('ru'),
  ar: await loadLanguageDeck('ar'),
}
const STARTER_DECKS = {
  en: flatten(DECKS.en),
  ru: flatten(DECKS.ru),
  ar: flatten(DECKS.ar),
}

describe.each(LANGUAGE_CODES)('%s to‘plami', (language) => {
  const deck = DECKS[language]
  const all = LEVEL_ORDER.flatMap((level) => deck[level])

  it('har darajada kamida bitta so‘z bor', () => {
    LEVEL_ORDER.forEach((level) => {
      expect(deck[level].length).toBeGreaterThan(0)
    })
  })

  it('takrorlanuvchi so‘z yo‘q', () => {
    const ids = all.map((card) => makeCardId(card.language, card.word))

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ikki so‘zning tarjimasi bir xil emas', () => {
    // Mashq generatori chalg'ituvchi variantlarni shu tildagi boshqa
    // so'zlardan oladi. Ikki so'z bir xil tarjimaga ega bo'lsa, savolda
    // ikkita "to'g'ri" variant paydo bo'lardi.
    const translations = all.map((card) => card.translation)
    const duplicates = translations.filter(
      (value, index) => translations.indexOf(value) !== index,
    )

    expect(duplicates).toEqual([])
  })

  it('so‘zlar normallashtirilgandan keyin ham farqlanadi', () => {
    // Javob tekshirishda arab harakalari tushiriladi, rus `ё` → `е` bo'ladi.
    // Ikki so'z shundan keyin bir xil bo'lib qolsa, foydalanuvchi to'g'ri
    // yozsa ham "xato" olishi mumkin edi (masalan مَطَار va مَطَر).
    const normalized = all.map((card) => normalizeAnswer(card.word, language))
    const duplicates = normalized.filter((value, index) => normalized.indexOf(value) !== index)

    expect(duplicates).toEqual([])
  })

  it('lotin bo‘lmagan yozuvdagi har so‘z o‘qilishini beradi', () => {
    // Transliteratsiya hisoblab chiqariladi. Agar biror belgi jadvalga
    // kiritilmagan bo'lsa, natijada o'sha belgi o'zgarmasdan qolib ketardi —
    // foydalanuvchi "o'qishga yordam" o'rniga yana o'sha yozuvni ko'rardi.
    const { script } = LANGUAGES[language]
    if (script === 'latin') return

    all.forEach((card) => {
      const reading = transliterate(card.word, script)

      expect(reading).toBeTruthy()
      expect(reading).toMatch(/^[a-z' -]+$/i)
    })
  })

  it('majburiy maydonlar to‘ldirilgan', () => {
    all.forEach((card) => {
      expect(card.word.trim()).not.toBe('')
      expect(card.translation.trim()).not.toBe('')
      expect(card.topic?.trim()).toBeTruthy()
    })
  })

  it('jumla tarjimasi jumlasiz qolmaydi', () => {
    // Jumla IXTIYORIY. Tarjimasiz jumla ham HAQIQIY holat: import qilingan
    // arab so'zlariga dars matnidan jumla biriktirilgan, lekin uning
    // o'zbekcha tarjimasi yo'q. Bunday kartada "gap ichida" mashqi ishlaydi
    // (u faqat jumlaning O'ZINI ko'rsatadi), "jumla qurish" esa berilmaydi —
    // uning savoli aynan o'zbekcha jumla bo'lardi.
    //
    // Teskarisi esa xato: tarjima bor, jumla yo'q — bu ma'nosiz yozuv.
    all.forEach((card) => {
      if (card.sentenceTranslation?.trim()) {
        expect(card.sentence?.trim()).toBeTruthy()
      }
    })
  })

  it('tarjimasiz jumla o‘z so‘zini albatta ichiga oladi', () => {
    // Tarjimali jumla "jumla qurish" uchun ham xizmat qiladi, shuning uchun
    // unda so'z TURLANGAN shaklda kelishi mumkin ("eye" → "Close your eyes").
    // Bunday jumlada "gap ichida" mashqi berilmaydi, xolos.
    //
    // Tarjimasiz jumla esa FAQAT "gap ichida" uchun qo'shilgan (import
    // qilingan arab so'zlari). So'z unda topilmasa, u shunchaki foydasiz
    // yuk — import filtri buzilganini bildiradi.
    //
    // Chegara `\b` bilan emas: u faqat ASCII harflar bilan ishlaydi va
    // arab/kirill yozuvida hech qachon mos kelmasdi.
    // Har karta uchun yangi `RegExp` yasash minglab jumlada juda sekin —
    // shuning uchun oddiy qidiruv va bitta umumiy harf tekshiruvi
    const isLetter = /[\p{L}\p{M}]/u
    const standalone = (sentence: string, word: string): boolean => {
      const haystack = sentence.toLowerCase()
      const needle = word.toLowerCase()

      for (let at = haystack.indexOf(needle); at >= 0; at = haystack.indexOf(needle, at + 1)) {
        const before = at > 0 ? haystack[at - 1] : ''
        const after = haystack[at + needle.length] ?? ''
        if (!isLetter.test(before) && !isLetter.test(after)) return true
      }

      return false
    }

    all.forEach((card) => {
      const sentence = card.sentence?.trim()
      if (!sentence || card.sentenceTranslation?.trim()) return

      expect(
        standalone(sentence, card.word),
        `"${card.word}" so'zi o'z jumlasida topilmadi: "${sentence}"`,
      ).toBe(true)
    })
  })

  it('har kartaning tili va darajasi o‘z guruhiga mos', () => {
    LEVEL_ORDER.forEach((level) => {
      deck[level].forEach((card) => {
        expect(card.language).toBe(language)
        expect(card.level).toBe(level)
      })
    })
  })

  it('STARTER_DECKS daraja tartibida yig‘ilgan', () => {
    const ranks = STARTER_DECKS[language].map((card) => LEVEL_ORDER.indexOf(card.level!))
    const sorted = [...ranks].sort((a, b) => a - b)

    expect(ranks).toEqual(sorted)
    expect(STARTER_DECKS[language]).toHaveLength(all.length)
  })
})
