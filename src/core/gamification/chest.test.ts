import { describe, expect, it } from 'vitest'
import { CHEST_JACKPOT_XP, PRAISES, rollChest } from './chest'

/** Ketma-ket qiymatlar qaytaradigan soxta tasodif */
function fixed(...values: number[]) {
  let index = 0
  return () => values[Math.min(index++, values.length - 1)]!
}

describe('rollChest', () => {
  it('kichik ehtimol bilan katta yutuq', () => {
    expect(rollChest(true, fixed(0.01))).toEqual({ kind: 'xp', amount: CHEST_JACKPOT_XP })
  })

  it('muzlatish — faqat zaxira to‘lmagan bo‘lsa', () => {
    expect(rollChest(true, fixed(0.15))).toEqual({ kind: 'freeze' })
    // To'lgan bo'lsa foydasiz mukofot o'rniga XP
    expect(rollChest(false, fixed(0.15)).kind).toBe('xp')
  })

  it('maqtov HARAKATGA qaratilgan', () => {
    const reward = rollChest(true, fixed(0.3, 0))
    expect(reward).toEqual({ kind: 'praise', text: PRAISES[0] })
    // "aqllisan" degan natija-maqtov yo'q (Dweck)
    for (const text of PRAISES) expect(text.toLowerCase()).not.toMatch(/aqlli/)
  })

  it('odatda o‘rtacha XP', () => {
    const reward = rollChest(true, fixed(0.9, 0.5))
    expect(reward.kind).toBe('xp')
    if (reward.kind === 'xp') expect(reward.amount).toBeGreaterThanOrEqual(10)
  })

  it('taqsimot: XP ko‘pchilik, jackpot kamchilik', () => {
    let jackpot = 0
    let xp = 0
    for (let i = 0; i < 2000; i += 1) {
      const reward = rollChest(true)
      if (reward.kind === 'xp') {
        xp += 1
        if (reward.amount === CHEST_JACKPOT_XP) jackpot += 1
      }
    }
    expect(xp).toBeGreaterThan(1000)
    expect(jackpot).toBeLessThan(400)
  })
})
