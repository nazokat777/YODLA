import type { DailyStat } from '@/core/db'
import { addDays, startOfDay } from '@/lib/date'

export interface DayPoint {
  /** Kun boshi (lokal vaqt) */
  day: number
  xp: number
  /** Shu kuni mashq qilingan noyob so'zlar */
  words: number
}

/** Diagrammada ko'rsatiladigan kunlar soni */
const DAYS = 7

/**
 * Oxirgi 7 kunning qatori — bugun oxirida.
 *
 * Bo'sh kunlar NOL bilan to'ldiriladi: diagramma kunlarni o'tkazib
 * yuborsa, "har kuni mashq qildim" degan yolg'on taassurot qolardi.
 */
export function buildWeeklySeries(stats: DailyStat[], now: number): DayPoint[] {
  const byDay = new Map(stats.map((stat) => [stat.day, stat]))
  const today = startOfDay(now)

  return Array.from({ length: DAYS }, (_, index) => {
    const day = addDays(today, index - (DAYS - 1))
    const stat = byDay.get(day)

    return {
      day,
      xp: stat?.xp ?? 0,
      words: stat?.cardIds.length ?? 0,
    }
  })
}

export interface WeekTotals {
  xp: number
  words: number
}

/**
 * Ikki haftaning yig'indisi: joriy (oxirgi 7 kun) va oldingi (undan
 * avvalgi 7 kun).
 *
 * Taqqoslash O'ZI bilan bo'ladi — begonalar bilan emas. Bu ilovaning
 * "halol statistika" tamoyiliga mos: o'z o'sishini ko'rish reytingdagi
 * o'rindan ko'ra ishonchli motivatsiya.
 */
export function buildWeekComparison(
  stats: DailyStat[],
  now: number,
): { current: WeekTotals; previous: WeekTotals } {
  const today = startOfDay(now)
  const currentFrom = addDays(today, -(DAYS - 1))
  const previousFrom = addDays(today, -(DAYS * 2 - 1))

  const sum = (from: number, to: number): WeekTotals =>
    stats
      .filter((stat) => stat.day >= from && stat.day <= to)
      .reduce(
        (totals, stat) => ({
          xp: totals.xp + stat.xp,
          words: totals.words + stat.cardIds.length,
        }),
        { xp: 0, words: 0 },
      )

  return {
    current: sum(currentFrom, today),
    previous: sum(previousFrom, addDays(currentFrom, -1)),
  }
}
