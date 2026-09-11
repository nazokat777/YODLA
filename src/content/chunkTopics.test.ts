import { describe, expect, it } from 'vitest'
import type { NewCardRecordInput } from '@/core/db'
import { MAX_UNIT_WORDS, MIN_UNIT_WORDS, chunkLargeTopics, mergeTinyTopics } from './chunkTopics'

function makeCards(topic: string, count: number): NewCardRecordInput[] {
  return Array.from({ length: count }, (_, index) => ({
    word: `w${index}`,
    translation: `t${index}`,
    language: 'en' as const,
    topic,
    level: 'A1' as const,
  }))
}

/** Mavzu → shu mavzudagi kartalar soni */
function sizes(cards: NewCardRecordInput[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const card of cards) counts.set(card.topic!, (counts.get(card.topic!) ?? 0) + 1)
  return counts
}

describe('chunkLargeTopics', () => {
  it('kichik mavzuga TEGMAYDI', () => {
    const cards = makeCards('Oila', MAX_UNIT_WORDS)

    expect(chunkLargeTopics(cards).map((card) => card.topic)).toEqual(
      cards.map(() => 'Oila'),
    )
  })

  it('katta mavzuni qismlarga bo‘ladi', () => {
    const result = sizes(chunkLargeTopics(makeCards('Katta', 269)))

    expect(result.size).toBe(14)
    for (const count of result.values()) {
      expect(count).toBeLessThanOrEqual(MAX_UNIT_WORDS)
    }
  })

  it('qismlar TENG — oxirida kichkina dumcha qolmaydi', () => {
    const counts = [...sizes(chunkLargeTopics(makeCards('Katta', 269))).values()]

    // 14 ta 20 lik bo'linsa oxirgisi 9 ta bo'lardi
    expect(Math.min(...counts)) .toBeGreaterThanOrEqual(Math.max(...counts) - 1)
  })

  it('so‘zlar va tartib saqlanadi', () => {
    const cards = makeCards('Katta', 50)
    const chunked = chunkLargeTopics(cards)

    expect(chunked.map((card) => card.word)).toEqual(cards.map((card) => card.word))
    // Qismlar kitob ketma-ketligida: birinchi karta 1-qismda
    expect(chunked[0].topic).toBe('Katta (1-qism)')
    expect(chunked.at(-1)!.topic).toBe('Katta (3-qism)')
  })

  it('mavzusiz kartani o‘zgartirmaydi', () => {
    const cards: NewCardRecordInput[] = [
      { word: 'a', translation: 'b', language: 'en' },
    ]

    expect(chunkLargeTopics(cards)[0].topic).toBeUndefined()
  })
})

describe('mergeTinyTopics', () => {
  const tagged = (topic: string, count: number, prefix: string) =>
    makeCards(topic, count).map((card) => ({ ...card, word: `${prefix}${card.word}` }))

  it('kichik mavzu KEYINGI mavzuga qo‘shiladi va uning nomini oladi', () => {
    const cards = [...tagged('Maktab', 1, 'm'), ...tagged('Sayohat', 5, 's')]
    const result = sizes(mergeTinyTopics(cards))

    expect(result.get('Maktab')).toBeUndefined()
    expect(result.get('Sayohat')).toBe(6)
  })

  it('zanjir: ikkita 1 so‘zli mavzu ketma-ket qo‘shilib ketadi', () => {
    // Maktab(1) → Vaqt: 2 — hali kichik → Sayohat: 4
    const cards = [
      ...tagged('Maktab', 1, 'm'),
      ...tagged('Vaqt', 1, 'v'),
      ...tagged('Sayohat', 2, 's'),
    ]
    const result = sizes(mergeTinyTopics(cards))

    expect([...result.keys()]).toEqual(['Sayohat'])
    expect(result.get('Sayohat')).toBe(4)
  })

  it('OXIRGI kichik mavzu oldingisiga qo‘shiladi', () => {
    const cards = [...tagged('Oila', 5, 'o'), ...tagged('Dumcha', 2, 'd')]
    const result = sizes(mergeTinyTopics(cards))

    expect(result.get('Oila')).toBe(7)
    expect(result.get('Dumcha')).toBeUndefined()
  })

  it('yetarli mavzularga tegmaydi, so‘zlar tartibi saqlanadi', () => {
    const cards = [...tagged('A', MIN_UNIT_WORDS, 'a'), ...tagged('B', 5, 'b')]
    const merged = mergeTinyTopics(cards)

    expect(merged.map((card) => card.topic)).toEqual(cards.map((card) => card.topic))
    expect(merged.map((card) => card.word)).toEqual(cards.map((card) => card.word))
  })

  it('bitta mavzu bo‘lsa qo‘shadigan qo‘shni yo‘q — o‘zgarmaydi', () => {
    const cards = tagged('Yolg‘iz', 1, 'y')

    expect(mergeTinyTopics(cards)[0].topic).toBe('Yolg‘iz')
  })
})
