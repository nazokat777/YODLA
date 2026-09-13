import { describe, expect, it } from 'vitest'
import { companionLine, companionProgress, companionStage, nextCompanionStage } from './companion'

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

  it('gap holatga qarab: xavf → takrorlash → maqsad → bosqich', () => {
    const chick = companionStage(4)
    const base = { streakAtRisk: false, goalDone: false, dueCount: 0 }
    expect(companionLine(chick, { ...base, streakAtRisk: true, dueCount: 3 })).toMatch(/ketdikmi/)
    expect(companionLine(chick, { ...base, dueCount: 3 })).toMatch(/3 ta so‘z/)
    expect(companionLine(chick, { ...base, goalDone: true })).toMatch(/to‘ydim/)
    expect(companionLine(chick, base)).toBe(chick.line)
    // Tuxum gapirmaydi — holatdan qat'i nazar o'z gapi
    expect(companionLine(companionStage(0), { ...base, streakAtRisk: true })).toBe(companionStage(0).line)
  })
})
