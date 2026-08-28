import { describe, expect, it } from 'vitest'
import type { NewCardRecordInput } from '@/core/db'
import { MAX_UNIT_WORDS, chunkLargeTopics } from './chunkTopics'

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
