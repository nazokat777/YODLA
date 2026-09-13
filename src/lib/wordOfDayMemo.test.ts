import { describe, expect, it } from 'vitest'
import { rememberRevealedWord, revealedWordToday } from './wordOfDayMemo'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date(2026, 8, 13, 10).getTime()

describe('kunning so‘zi xotirasi', () => {
  it('bugun ochilgan so‘z bugun eslanadi, ertaga emas', () => {
    rememberRevealedWord('en:apple', NOW)
    expect(revealedWordToday(NOW + 3600_000)).toBe('en:apple')
    expect(revealedWordToday(NOW + DAY)).toBeNull()
  })
})
