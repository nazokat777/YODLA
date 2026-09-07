import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import {
  MEMORY_PAIRS,
  isMemoryComplete,
  isRevealed,
  openTile,
  resolveMemory,
  startMemory,
} from './memory'

function card(id: string, word: string, translation: string): CardRecord {
  return {
    id,
    word,
    translation,
    language: 'en',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
  }
}

const CARDS = [
  card('en:apple', 'apple', 'olma'),
  card('en:bread', 'bread', 'non'),
  card('en:water', 'water', 'suv'),
]

/** Aralashtirishni o'chirish uchun barqaror tasodif */
const NO_SHUFFLE = () => 0

describe('startMemory', () => {
  it('har karta IKKI katak beradi', () => {
    const state = startMemory(CARDS, 3, NO_SHUFFLE)

    expect(state.tiles).toHaveLength(6)
    expect(state.tiles.filter((tile) => tile.side === 'word')).toHaveLength(3)
  })

  it('so‘rovdan ko‘p karta berilsa keragicha olinadi', () => {
    expect(startMemory(CARDS, 2, NO_SHUFFLE).tiles).toHaveLength(4)
  })

  it('sukut bo‘yicha olti juft', () => {
    expect(MEMORY_PAIRS).toBe(6)
  })
})

describe('openTile', () => {
  it('katak ochiladi', () => {
    const state = openTile(startMemory(CARDS, 3, NO_SHUFFLE), 'en:apple:w')

    expect(isRevealed(state, 'en:apple:w')).toBe(true)
  })

  it('UCHINCHI katak ochilmaydi', () => {
    /*
     * Ikkitasi ochiqligida uchinchisiga ruxsat berilsa, bola tez-tez
     * bosib butun taxtani ko'rib olardi va o'yin xotirani talab
     * qilmasdi.
     */
    let state = startMemory(CARDS, 3, NO_SHUFFLE)
    state = openTile(state, 'en:apple:w')
    state = openTile(state, 'en:bread:w')
    state = openTile(state, 'en:water:w')

    expect(state.opened).toHaveLength(2)
  })

  it('allaqachon ochiq katak qayta ochilmaydi', () => {
    let state = startMemory(CARDS, 3, NO_SHUFFLE)
    state = openTile(state, 'en:apple:w')
    state = openTile(state, 'en:apple:w')

    expect(state.opened).toEqual(['en:apple:w'])
  })
})

describe('resolveMemory', () => {
  it('JUFT bo‘lsa kataklar ochiq qoladi', () => {
    let state = startMemory(CARDS, 3, NO_SHUFFLE)
    state = openTile(state, 'en:apple:w')
    state = openTile(state, 'en:apple:t')
    state = resolveMemory(state)

    expect(state.matched).toHaveLength(2)
    expect(state.opened).toEqual([])
    expect(state.attempts).toBe(1)
  })

  it('juft BO‘LMASA kataklar yopiladi', () => {
    let state = startMemory(CARDS, 3, NO_SHUFFLE)
    state = openTile(state, 'en:apple:w')
    state = openTile(state, 'en:bread:t')
    state = resolveMemory(state)

    expect(state.matched).toEqual([])
    expect(state.opened).toEqual([])
    // Xato urinish ham sanaladi — natija shundan hisoblanadi
    expect(state.attempts).toBe(1)
  })

  it('bitta katak ochiqligida hech nima qilmaydi', () => {
    const state = openTile(startMemory(CARDS, 3, NO_SHUFFLE), 'en:apple:w')

    expect(resolveMemory(state)).toEqual(state)
  })
})

describe('isMemoryComplete', () => {
  it('hamma juft topilganda true', () => {
    let state = startMemory(CARDS, 1, NO_SHUFFLE)
    state = openTile(state, 'en:apple:w')
    state = openTile(state, 'en:apple:t')
    state = resolveMemory(state)

    expect(isMemoryComplete(state)).toBe(true)
  })

  it('boshida false', () => {
    expect(isMemoryComplete(startMemory(CARDS, 3, NO_SHUFFLE))).toBe(false)
  })

  it('bo‘sh taxtada false', () => {
    // Aks holda kartasiz o'yin darhol "yutuq" deb hisoblanardi
    expect(isMemoryComplete(startMemory([], 3, NO_SHUFFLE))).toBe(false)
  })
})
