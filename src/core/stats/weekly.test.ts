import { describe, expect, it } from 'vitest'
import type { DailyStat } from '@/core/db'
import { addDays, startOfDay } from '@/lib/date'
import { buildWeeklySeries } from './weekly'

const NOW = new Date(2026, 0, 15, 10, 0, 0).getTime()
const day = (offset: number) => addDays(startOfDay(NOW), offset)

function stat(offset: number, xp: number, cards: string[] = []): DailyStat {
  return { day: day(offset), xp, answered: 0, correct: 0, cardIds: cards, goalBonusAwarded: false }
}

describe('buildWeeklySeries', () => {
  it('har doim 7 kun qaytaradi', () => {
    expect(buildWeeklySeries([], NOW)).toHaveLength(7)
  })

  it('oxirgi element — bugun', () => {
    const series = buildWeeklySeries([], NOW)

    expect(series[6].day).toBe(startOfDay(NOW))
  })

  it('bo‘sh kunlar nol bilan to‘ldiriladi', () => {
    const series = buildWeeklySeries([stat(0, 50)], NOW)

    expect(series[6].xp).toBe(50)
    expect(series[0].xp).toBe(0)
  })

  it('noyob so‘zlar sanaladi', () => {
    const series = buildWeeklySeries([stat(0, 10, ['a', 'b', 'c'])], NOW)

    expect(series[6].words).toBe(3)
  })

  it('haftadan tashqaridagi kunlar hisobga olinmaydi', () => {
    const series = buildWeeklySeries([stat(-10, 999)], NOW)

    expect(series.reduce((sum, point) => sum + point.xp, 0)).toBe(0)
  })
})
