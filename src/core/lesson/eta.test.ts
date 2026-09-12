import { describe, expect, it } from 'vitest'
import { estimateMinutes } from './eta'

describe('estimateMinutes', () => {
  it('4 so‘z ≈ 2 daqiqa, 12 so‘z ≈ 6 daqiqa', () => {
    expect(estimateMinutes(4)).toBe(2)
    expect(estimateMinutes(12)).toBe(6)
  })

  it('oxirgi so‘zda ham kamida 1 daqiqa — "0 daqiqa" yolg‘on bo‘lardi', () => {
    expect(estimateMinutes(1)).toBe(1)
    expect(estimateMinutes(0)).toBe(1)
  })
})
