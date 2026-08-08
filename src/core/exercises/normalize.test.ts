import { describe, expect, it } from 'vitest'
import { editDistance, normalizeAnswer, typoTolerance } from './normalize'

describe('normalizeAnswer — umumiy qoidalar', () => {
  it('katta-kichik harf va ortiqcha bo‘shliqlarni tenglashtiradi', () => {
    expect(normalizeAnswer('  Hello   World ', 'en')).toBe('hello world')
  })

  it('gap tinish belgilarini olib tashlaydi', () => {
    expect(normalizeAnswer('Hello, world!', 'en')).toBe('hello world')
    expect(normalizeAnswer('«Привет»...', 'ru')).toBe('привет')
  })

  it('faqat tinish belgisidan iborat javob bo‘sh satrga aylanadi', () => {
    expect(normalizeAnswer('...', 'en')).toBe('')
  })
})

describe('normalizeAnswer — o‘zbekcha tutuq belgisi', () => {
  // Foydalanuvchi klaviaturasiga qarab turli belgi kiritadi — hammasi to'g'ri
  it.each(["do'st", 'do‘st', 'do’st', 'doʻst', 'do`st'])('"%s" bir xil normallashadi', (input) => {
    expect(normalizeAnswer(input, 'en')).toBe("do'st")
  })

  it('tutuq belgisi tinish belgisi sifatida O‘CHIRILMAYDI', () => {
    // "o'q" va "oq" — turli so'zlar, farq saqlanishi kerak
    expect(normalizeAnswer("o'q", 'en')).not.toBe(normalizeAnswer('oq', 'en'))
  })
})

describe('normalizeAnswer — rus tili', () => {
  it('ё va е ni tenglashtiradi', () => {
    expect(normalizeAnswer('ещё', 'ru')).toBe(normalizeAnswer('еще', 'ru'))
  })

  it('boshqa harflarga tegmaydi', () => {
    expect(normalizeAnswer('Дом', 'ru')).toBe('дом')
  })
})

describe('normalizeAnswer — arab tili', () => {
  it('harakalarni (unli belgilarni) tushiradi', () => {
    // مَرْحَبًا (harakalar bilan) va مرحبا (harakasiz) — bir xil so'z
    expect(normalizeAnswer('مَرْحَبًا', 'ar')).toBe(normalizeAnswer('مرحبا', 'ar'))
  })

  it('alif variantlarini birlashtiradi', () => {
    expect(normalizeAnswer('أحمد', 'ar')).toBe(normalizeAnswer('احمد', 'ar'))
    expect(normalizeAnswer('إسلام', 'ar')).toBe(normalizeAnswer('اسلام', 'ar'))
  })

  it('ta marbuta (ة) va he (ه) ni tenglashtiradi', () => {
    expect(normalizeAnswer('مدينة', 'ar')).toBe(normalizeAnswer('مدينه', 'ar'))
  })

  it('cho‘zish belgisini (tatweel) olib tashlaydi', () => {
    expect(normalizeAnswer('كــتــاب', 'ar')).toBe(normalizeAnswer('كتاب', 'ar'))
  })

  it('turli so‘zlarni tenglashtirib yubormaydi', () => {
    expect(normalizeAnswer('كتاب', 'ar')).not.toBe(normalizeAnswer('كلب', 'ar'))
  })
})

describe('editDistance', () => {
  it.each([
    ['', '', 0],
    ['abc', 'abc', 0],
    ['', 'abc', 3],
    ['abc', '', 3],
    ['kitten', 'sitting', 3],
    ['kitob', 'kitab', 1], // almashtirish
    ['kitob', 'kitb', 1], // o'chirish
    ['kitob', 'kittob', 1], // qo'shish
  ])('editDistance("%s", "%s") = %i', (a, b, expected) => {
    expect(editDistance(a, b)).toBe(expected)
  })

  it('qo‘shni harflar o‘rin almashsa — bitta tahrir', () => {
    // Oddiy Levenshtein bularni 2 deb sanardi
    expect(editDistance('sayohta', 'sayohat')).toBe(1)
    expect(editDistance('teh', 'the')).toBe(1)
    expect(editDistance('kitbo', 'kitob')).toBe(1)
  })

  it('uzoq harflarning o‘rin almashuvi bitta tahrir emas', () => {
    // Faqat QO'SHNI harflar uchun chegirma bor
    expect(editDistance('kotib', 'kitob')).toBe(2)
  })

  it('simmetrik', () => {
    expect(editDistance('salom', 'salam')).toBe(editDistance('salam', 'salom'))
  })
})

describe('typoTolerance', () => {
  it('qisqa so‘zlarda bag‘rikenglik yo‘q', () => {
    // "uy" va "ug'" farqi ma'noni butunlay o'zgartiradi
    expect(typoTolerance(2)).toBe(0)
    expect(typoTolerance(3)).toBe(0)
  })

  it('o‘rtacha so‘zlarda bitta xatoga yo‘l qo‘yiladi', () => {
    expect(typoTolerance(4)).toBe(1)
    expect(typoTolerance(7)).toBe(1)
  })

  it('uzun so‘zlarda ikkita', () => {
    expect(typoTolerance(8)).toBe(2)
    expect(typoTolerance(20)).toBe(2)
  })
})
