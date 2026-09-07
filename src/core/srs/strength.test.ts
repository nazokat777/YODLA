import { describe, expect, it } from 'vitest'
import { STRENGTH_NAMES, wordStrength } from './strength'

const card = (interval: number, repetitions = 2) => ({ interval, repetitions })

describe('wordStrength', () => {
  it('hali so‘ralmagan so‘z — 0', () => {
    expect(wordStrength(card(0, 0))).toBe(0)
  })

  it('takrorlangan, lekin intervali nol — 0', () => {
    // Xato javobdan keyin interval nolga tushishi mumkin
    expect(wordStrength(card(0, 3))).toBe(0)
  })

  it('bir haftadan kam — o‘rganilmoqda', () => {
    expect(wordStrength(card(1))).toBe(1)
    expect(wordStrength(card(6))).toBe(1)
  })

  it('bir haftadan uch haftagacha — mustahkam', () => {
    expect(wordStrength(card(7))).toBe(2)
    expect(wordStrength(card(20))).toBe(2)
  })

  it('uch haftadan ko‘p — yodlangan', () => {
    // 21 kun: o'rta muddatli xotiradan uzoq muddatlisiga o'tish belgisi
    expect(wordStrength(card(21))).toBe(3)
    expect(wordStrength(card(120))).toBe(3)
  })

  it('har bosqichning o‘zbekcha nomi bor', () => {
    expect(Object.values(STRENGTH_NAMES).filter(Boolean)).toHaveLength(4)
  })
})
