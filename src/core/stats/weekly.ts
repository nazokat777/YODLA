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
