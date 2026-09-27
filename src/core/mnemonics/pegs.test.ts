import { describe, expect, it } from 'vitest'
import { growthText, PEGS, pegHint, ROUND_A, ROUND_B, scoreRecall } from './pegs'

describe('qarmoq usuli', () => {
  it('1 dan 10 gacha qarmoqlar, har biri bitta', () => {
    expect(PEGS.map((peg) => peg.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('ikki sinov so‘zlari 10 tadan va bir-biriga aralashmaydi', () => {
    expect(ROUND_A).toHaveLength(10)
    expect(ROUND_B).toHaveLength(10)
    expect(ROUND_A.some((word) => ROUND_B.includes(word))).toBe(false)
  })

  it('faqat O‘Z O‘RNIDAGI so‘z sanaladi', () => {
    const expected = ['a', 'b', 'c']
    expect(scoreRecall(expected, ['a', 'b', 'c'])).toBe(3)
    expect(scoreRecall(expected, ['b', 'a', 'c'])).toBe(1)
    expect(scoreRecall(expected, [null, null, null])).toBe(0)
  })

  it('o‘sish matni', () => {
    expect(growthText(2, 8)).toContain('4 barobar')
    expect(growthText(0, 5)).toContain('0 dan 5')
    expect(growthText(4, 5)).toContain('+1')
    expect(growthText(5, 4)).toContain('mashq bilan')
  })

  it('sahna maslahati qarmoq va so‘zni birlashtiradi', () => {
    expect(pegHint(PEGS[2]!, 'jirafa')).toContain('svetofor')
    expect(pegHint(PEGS[2]!, 'jirafa')).toContain('jirafa')
  })
})
