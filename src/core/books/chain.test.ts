import { describe, expect, it } from 'vitest'
import { addDays, startOfDay } from '@/lib/date'
import { plankChain } from './chain'

const NOW = new Date(2026, 9, 4, 15, 0).getTime()
const day = (offset: number) => addDays(startOfDay(NOW), -offset)
const ids = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`)

describe('plankChain', () => {
  it('oxirgi N kun, eskisidan yangisiga', () => {
    const chain = plankChain([], 5, NOW, 7)
    expect(chain.days).toHaveLength(7)
    expect(chain.days[6]).toMatchObject({ day: day(0), today: true, met: false })
    expect(chain.days[0]!.day).toBe(day(6))
  })

  it('bugun hali bajarilmagan bo‘lsa zanjir UZILMAYDI', () => {
    const chain = plankChain(
      [
        { day: day(1), cardIds: ids(5) },
        { day: day(2), cardIds: ids(6) },
        { day: day(3), cardIds: ids(2) },
      ],
      5,
      NOW,
    )
    // Kecha va oldingi kun — 2 kun; bugun hali kun tugamagan
    expect(chain.current).toBe(2)
  })

  it('bugun bajarilsa zanjirga qo‘shiladi', () => {
    const chain = plankChain(
      [
        { day: day(0), cardIds: ids(5) },
        { day: day(1), cardIds: ids(5) },
      ],
      5,
      NOW,
    )
    expect(chain.current).toBe(2)
  })

  it('kecha o‘tkazib yuborilgan bo‘lsa zanjir 0 dan', () => {
    const chain = plankChain([{ day: day(2), cardIds: ids(9) }], 5, NOW)
    expect(chain.current).toBe(0)
    expect(chain.best).toBe(1)
  })

  it('eng uzun zanjir oraliq ichida', () => {
    const chain = plankChain(
      [5, 6, 7, 9, 10].map((offset) => ({ day: day(offset), cardIds: ids(5) })),
      5,
      NOW,
    )
    // 5-6-7 uzluksiz (3), 9-10 (2)
    expect(chain.best).toBe(3)
  })
})
