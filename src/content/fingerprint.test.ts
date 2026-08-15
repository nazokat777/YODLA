import { describe, expect, it } from 'vitest'
import type { NewCardRecordInput } from '@/core/db'
import { deckFingerprint } from './fingerprint'

const CARD: NewCardRecordInput = {
  word: 'water',
  translation: 'suv',
  language: 'en',
  topic: 'Ovqat',
  level: 'A1',
}

describe('deckFingerprint', () => {
  it('bir xil lug‘at uchun bir xil qiymat', () => {
    expect(deckFingerprint([CARD])).toBe(deckFingerprint([{ ...CARD }]))
  })

  it('tarjima o‘zgarsa — qiymat ham o‘zgaradi', () => {
    expect(deckFingerprint([CARD])).not.toBe(
      deckFingerprint([{ ...CARD, translation: 'suvlik' }]),
    )
  })

  it('JUMLA qo‘shilsa — qiymat o‘zgaradi', () => {
    // Aynan shu narsa uchun kerak: kontentga jumla biriktirilganda
    // mavjud kartalar yangilanishi shart
    expect(deckFingerprint([CARD])).not.toBe(
      deckFingerprint([{ ...CARD, sentence: 'I drink water' }]),
    )
  })

  it('DARAJA yoki MAVZU o‘zgarsa — qiymat o‘zgaradi', () => {
    expect(deckFingerprint([CARD])).not.toBe(deckFingerprint([{ ...CARD, level: 'B1' }]))
    expect(deckFingerprint([CARD])).not.toBe(deckFingerprint([{ ...CARD, topic: 'Maktab' }]))
  })

  it('so‘z qo‘shilsa yoki olib tashlansa — qiymat o‘zgaradi', () => {
    const two = [CARD, { ...CARD, word: 'bread', translation: 'non' }]

    expect(deckFingerprint(two)).not.toBe(deckFingerprint([CARD]))
  })

  it('tartib o‘zgarsa — qiymat ham o‘zgaradi', () => {
    // Tartib darajaga ta'sir qiladi (A1/A2/B1 o'rin bo'yicha bo'linadi),
    // shuning uchun uni ham hisobga olish to'g'ri
    const a = { ...CARD }
    const b = { ...CARD, word: 'bread', translation: 'non' }

    expect(deckFingerprint([a, b])).not.toBe(deckFingerprint([b, a]))
  })

  it('SM-2 holati qiymatga TA’SIR QILMAYDI', () => {
    // Foydalanuvchining progressi lug'at o'zgarishi emas — aks holda
    // har javobdan keyin butun lug'at qayta sinxronlanardi
    const withProgress = { ...CARD, interval: 30, easeFactor: 2.1 } as NewCardRecordInput

    expect(deckFingerprint([withProgress])).toBe(deckFingerprint([CARD]))
  })
})
