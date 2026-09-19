import { describe, expect, it } from 'vitest'
import { memoryTip } from './memoryTip'

describe('memoryTip', () => {
  it('bir so‘z har safar BIR XIL usul oladi', () => {
    const input = { id: 'en:apple', word: 'apple', translation: 'olma', hasSentence: false }
    expect(memoryTip(input)).toEqual(memoryTip(input))
  })

  it('so‘z yoki tarjima ko‘rsatmaga qo‘yiladi', () => {
    const tip = memoryTip({ id: 'en:apple', word: 'apple', translation: 'olma', hasSentence: false })
    expect(tip.text.includes('apple') || tip.text.includes('olma')).toBe(true)
    expect(tip.method).toBeTruthy()
  })

  it('"gapda" usuli faqat jumlasi bor so‘zga beriladi', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `en:w${i}`)
    const without = ids.map((id) => memoryTip({ id, word: id, translation: 't', hasSentence: false }))
    expect(without.some((tip) => tip.method === 'Gapda')).toBe(false)

    const withSentence = ids.map((id) => memoryTip({ id, word: id, translation: 't', hasSentence: true }))
    expect(withSentence.some((tip) => tip.method === 'Gapda')).toBe(true)
  })

  it('turli so‘zlar turli usullar oladi', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `en:w${i}`)
    const methods = new Set(ids.map((id) => memoryTip({ id, word: id, translation: 't', hasSentence: false }).method))
    expect(methods.size).toBeGreaterThan(3)
  })
})

describe('memoryTip — mavhum so‘z', () => {
  it('rasmsiz (mavhum) so‘zga obraz usullari berilmaydi', () => {
    const ids = Array.from({ length: 60 }, (_, i) => `en:abs${i}`)
    const methods = ids.map(
      (id) => memoryTip({ id, word: 'should', translation: 'kerak', hasSentence: false, isConcrete: false }).method,
    )
    expect(methods).not.toContain('Obraz')
    expect(methods).not.toContain('G‘alati obraz')
    expect(methods).not.toContain('Harakat')
    expect(new Set(methods).size).toBeGreaterThan(1)
  })
})
