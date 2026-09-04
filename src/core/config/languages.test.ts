import { describe, expect, it } from 'vitest'
import { isLanguageCode, LANGUAGE_LIST, LANGUAGES } from './languages'

describe('LANGUAGES', () => {
  it('uchala til ham ro‘yxatda', () => {
    expect(Object.keys(LANGUAGES).sort()).toEqual(['ar', 'en', 'ru'])
  })

  it('kalit va ichkaridagi kod MOS keladi', () => {
    // Ular ajralsa, `LANGUAGES[card.language]` boshqa tilning
    // sozlamalarini qaytarardi — masalan arabcha so'z inglizcha ovoz
    // bilan o'qilardi
    for (const [key, meta] of Object.entries(LANGUAGES)) {
      expect(meta.code).toBe(key)
    }
  })

  it('faqat arabcha o‘ngdan chapga', () => {
    expect(LANGUAGES.ar.dir).toBe('rtl')
    expect(LANGUAGES.en.dir).toBe('ltr')
    expect(LANGUAGES.ru.dir).toBe('ltr')
  })

  it('nutq lokali TO‘LIQ ko‘rinishda', () => {
    /*
     * `speechLocale` `SpeechSynthesis` ga uzatiladi va ovoz aynan shu
     * bo'yicha tanlanadi. Faqat til kodi berilsa (`ar`), brauzer mos
     * ovoz topolmay JIM qolardi — xato ham bermasdan.
     */
    for (const meta of LANGUAGE_LIST) {
      expect(meta.speechLocale, meta.code).toMatch(/^[a-z]{2}-[A-Z]{2}$/)
      expect(meta.speechLocale.startsWith(meta.code)).toBe(true)
    }
  })

  it('har tilda nom va o‘z nomi bor', () => {
    for (const meta of LANGUAGE_LIST) {
      expect(meta.name.trim()).not.toBe('')
      expect(meta.nativeName.trim()).not.toBe('')
    }
  })

  it('yozuv turlari takrorlanmaydi', () => {
    // Transliteratsiya shu maydonga qarab ishlaydi
    const scripts = LANGUAGE_LIST.map((meta) => meta.script)

    expect(new Set(scripts).size).toBe(scripts.length)
  })

  it('LANGUAGE_LIST obyekt bilan bir xil', () => {
    expect(LANGUAGE_LIST).toHaveLength(Object.keys(LANGUAGES).length)
  })
})

describe('isLanguageCode', () => {
  it('haqiqiy kodlarni tanidi', () => {
    expect(isLanguageCode('en')).toBe(true)
    expect(isLanguageCode('ar')).toBe(true)
  })

  it('boshqa qiymatlarni rad etadi', () => {
    // Saqlangan ma'lumot buzilgan bo'lishi mumkin — bu funksiya aynan
    // shuni tekshirish uchun
    expect(isLanguageCode('uz')).toBe(false)
    expect(isLanguageCode('')).toBe(false)
    expect(isLanguageCode(null)).toBe(false)
    expect(isLanguageCode(undefined)).toBe(false)
    expect(isLanguageCode(42)).toBe(false)
    expect(isLanguageCode({ code: 'en' })).toBe(false)
  })

  it('obyekt prototipidagi nom kod deb qabul QILINMAYDI', () => {
    // `'toString' in LANGUAGES` — rost. Prototip a'zolari kod emas.
    expect(isLanguageCode('toString')).toBe(false)
    expect(isLanguageCode('constructor')).toBe(false)
  })
})
