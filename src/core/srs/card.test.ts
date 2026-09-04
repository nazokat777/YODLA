import { describe, expect, it } from 'vitest'
import { createCard, makeCardId, reviewCard } from './card'
import { DEFAULT_EASE_FACTOR } from './constants'

const NOW = 1_700_000_000_000

describe('makeCardId', () => {
  it('til va so‘zdan yasaladi', () => {
    expect(makeCardId('en', 'hello')).toBe('en:hello')
  })

  it('katta-kichik harf va bo‘sh joy AHAMIYATSIZ', () => {
    /*
     * Id ataylab aniq (tasodifiy UUID emas): lug'at qayta yuklanganda
     * bir xil so'z bir xil id oladi va foydalanuvchining progressi
     * buzilmaydi.
     *
     * Shuning uchun kontentda `Book` deb yozilgan so'z `book` bilan
     * BITTA kartaga tushishi kerak — aks holda bazada ikkita nusxa
     * paydo bo'lardi.
     */
    expect(makeCardId('en', '  Book ')).toBe('en:book')
    expect(makeCardId('en', 'BOOK')).toBe(makeCardId('en', 'book'))
  })

  it('turli tillar TO‘QNASHMAYDI', () => {
    // Ruscha va inglizcha lug'atda bir xil yozilgan so'z bo'lishi mumkin
    expect(makeCardId('en', 'test')).not.toBe(makeCardId('ru', 'test'))
  })
})

describe('createCard', () => {
  it('id berilmasa o‘zi yasaydi', () => {
    const card = createCard({ word: 'water', translation: 'suv', language: 'en' }, NOW)

    expect(card.id).toBe('en:water')
  })

  it('berilgan id USTUN', () => {
    // Import skriptlari id ni o'zi hisoblaydi va shu bilan uzatadi
    const card = createCard(
      { id: 'en:custom', word: 'water', translation: 'suv', language: 'en' },
      NOW,
    )

    expect(card.id).toBe('en:custom')
  })

  it('darhol takrorlashga tayyor', () => {
    const card = createCard({ word: 'water', translation: 'suv', language: 'en' }, NOW)

    expect(card.dueDate).toBe(NOW)
    expect(card.interval).toBe(0)
    expect(card.repetitions).toBe(0)
    expect(card.easeFactor).toBe(DEFAULT_EASE_FACTOR)
  })

  it('so‘zning ASL yozilishi saqlanadi', () => {
    // Id kichik harfga tushadi, ekranda esa so'z asl ko'rinishida
    // ko'rsatilishi kerak
    const card = createCard({ word: 'London', translation: 'London', language: 'en' }, NOW)

    expect(card.word).toBe('London')
    expect(card.id).toBe('en:london')
  })
})

describe('reviewCard', () => {
  it('kartani O‘ZGARTIRMAYDI, yangisini qaytaradi', () => {
    const card = createCard({ word: 'water', translation: 'suv', language: 'en' }, NOW)

    const reviewed = reviewCard(card, 5, NOW)

    expect(card.repetitions).toBe(0)
    expect(reviewed.repetitions).toBe(1)
    expect(reviewed).not.toBe(card)
  })

  it('kontent maydonlari saqlanadi', () => {
    // SM-2 faqat jadvalga tegadi; so'z, tarjima va assotsiatsiya qoladi
    const card = createCard(
      { word: 'water', translation: 'suv', language: 'en', mnemonic: 'vatan' },
      NOW,
    )

    const reviewed = reviewCard(card, 2, NOW)

    expect(reviewed.word).toBe('water')
    expect(reviewed.translation).toBe('suv')
    expect(reviewed.mnemonic).toBe('vatan')
    expect(reviewed.id).toBe(card.id)
  })
})
