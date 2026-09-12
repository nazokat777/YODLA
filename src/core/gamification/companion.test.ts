import { describe, expect, it } from 'vitest'
import { companionProgress, companionStage, nextCompanionStage } from './companion'

describe('yo‘ldosh', () => {
  it('birinchi o‘zgarish birinchi darsdan keyin — bog‘lanish tez boshlanadi', () => {
    expect(companionStage(0).name).toBe('Tuxum')
    expect(companionStage(4).name).toBe('Jo‘ja')
    expect(companionStage(999).name).toBe('Ajdar')
  })

  it('keyingi bosqich va progress', () => {
    expect(nextCompanionStage(4)?.minWords).toBe(20)
    expect(companionProgress(12)).toBeCloseTo(0.5)
    expect(nextCompanionStage(500)).toBeNull()
    expect(companionProgress(500)).toBe(1)
  })
})
