import { describe, expect, it } from 'vitest'
import type { DailyStat } from '@/core/db'
import { addDays, startOfDay } from '@/lib/date'
import {
  activeDaysThisWeek,
  claimableMilestones,
  startOfWeek,
  weekDays,
  weekKey,
} from './weeklyQuest'

// 2026-09-10 — payshanba
const THU = new Date(2026, 8, 10, 14).getTime()

function day(ts: number, answered = 1): DailyStat {
  return { day: startOfDay(ts), xp: 10, answered, correct: 1, cardIds: [], goalBonusAwarded: false }
}

describe('haftalik sayohat', () => {
  it('hafta DUSHANBADAN boshlanadi', () => {
    expect(new Date(startOfWeek(THU)).getDay()).toBe(1)
    expect(new Date(startOfWeek(THU)).getDate()).toBe(7)
    // Yakshanba ham o'sha haftaga kiradi
    expect(startOfWeek(addDays(THU, 3))).toBe(startOfWeek(THU))
    expect(weekKey(THU)).toBe('2026-09-07')
  })

  it('faol kunlar shu hafta ichida sanaladi, o‘tgan hafta emas', () => {
    const stats = [day(THU), day(addDays(THU, -1)), day(addDays(THU, -10)), day(addDays(THU, 1), 0)]

    expect(activeDaysThisWeek(stats, THU)).toBe(2)
    expect(weekDays(stats, THU)).toEqual([false, false, true, true, false, false, false])
  })

  it('yetilgan va olinmagan pog‘onalar', () => {
    expect(claimableMilestones(3, []).map((m) => m.days)).toEqual([3])
    expect(claimableMilestones(5, [3]).map((m) => m.days)).toEqual([5])
    expect(claimableMilestones(7, [3, 5, 7])).toEqual([])
    expect(claimableMilestones(2, [])).toEqual([])
  })
})
