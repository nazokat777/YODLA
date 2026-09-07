import { describe, expect, it } from 'vitest'
import { LUCKY_CHANCE, LUCKY_MULTIPLIER, applyLuck, isLucky } from './luck'

describe('isLucky', () => {
  it('chegaradan KICHIK tasodifda omadli', () => {
    expect(isLucky(() => LUCKY_CHANCE - 0.01)).toBe(true)
  })

  it('chegaraning O‘ZIDA omadli EMAS', () => {
    expect(isLucky(() => LUCKY_CHANCE)).toBe(false)
  })

  it('katta tasodifda omadli emas', () => {
    expect(isLucky(() => 0.9)).toBe(false)
  })

  it('ehtimol taxminan 8% — na juda tez-tez, na sezilmas', () => {
    /*
     * Har savolda bo'lsa mukofot bo'lmay qoladi (kutish yo'qoladi),
     * juda kam bo'lsa umuman sezilmaydi.
     */
    expect(LUCKY_CHANCE).toBeGreaterThan(0.03)
    expect(LUCKY_CHANCE).toBeLessThan(0.15)
  })
})

describe('applyLuck', () => {
  it('omadli bo‘lsa ko‘paytiradi', () => {
    expect(applyLuck(10, true)).toBe(10 * LUCKY_MULTIPLIER)
  })

  it('oddiy holatda o‘zgarishsiz', () => {
    expect(applyLuck(10, false)).toBe(10)
  })
})
