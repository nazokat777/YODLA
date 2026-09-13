import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { db } from '@/core/db'
import { startOfDay } from '@/lib/date'
import { ActivityGrid } from './ActivityGrid'

describe('ActivityGrid', () => {
  beforeEach(() => db.dailyStats.clear())

  it('56 katak, faol kunlar sanaladi, bugun belgilangan', async () => {
    const today = startOfDay(Date.now())
    await db.dailyStats.put({ day: today, xp: 80, answered: 5, correct: 5, cardIds: [], goalBonusAwarded: false })

    render(<ActivityGrid />)

    expect(await screen.findByTestId('activity-grid')).toHaveTextContent('1 faol kun')
    const cells = screen.getAllByTestId('activity-cell')
    expect(cells).toHaveLength(56)
    expect(cells.filter((cell) => cell.dataset.level === '2')).toHaveLength(1)
  })
})
