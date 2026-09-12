import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { db, ensureProfile } from '@/core/db'
import { CHEST_JACKPOT_XP } from '@/core/gamification'
import { SessionChest } from './SessionChest'
import { SessionSummaryPanel } from './SessionSummaryPanel'
import type { SessionSummary } from './SessionRunner'

vi.mock('@/lib/sound', () => ({
  playChestSound: vi.fn(),
  playCorrectSound: vi.fn(),
  playWrongSound: vi.fn(),
}))

const SUMMARY: SessionSummary = {
  answered: 10,
  correct: 7,
  almost: 2,
  wrong: 1,
  perfectBonusXp: 0,
  xpEarned: 84,
  newBadges: [],
  masteredWords: 0,
  pendingWords: 0,
}

describe('SessionChest', () => {
  beforeEach(async () => {
    await db.profile.clear()
    await db.dailyStats.clear()
  })

  afterEach(() => vi.restoreAllMocks())

  it('yopiq turadi — mukofot faqat foydalanuvchi BOSGANDA tashlanadi', async () => {
    render(<SessionChest />)

    expect(screen.getByTestId('chest-closed')).toBeInTheDocument()
    expect(screen.queryByTestId('chest-open')).not.toBeInTheDocument()
    // Bosilmaguncha hech nima yozilmaydi
    expect((await ensureProfile()).totalXp).toBe(0)
  })

  it('ochilganda XP HAQIQATAN yoziladi va shundan keyin ko‘rsatiladi', async () => {
    // 0.01 → jackpot
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    render(<SessionChest />)

    fireEvent.click(screen.getByTestId('chest-closed'))

    expect(await screen.findByTestId('chest-open')).toHaveTextContent(`+${CHEST_JACKPOT_XP} XP`)
    expect((await ensureProfile()).totalXp).toBe(CHEST_JACKPOT_XP)
  })

  it('ikki marta ochib bo‘lmaydi', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    render(<SessionChest />)

    fireEvent.click(screen.getByTestId('chest-closed'))
    await screen.findByTestId('chest-open')

    expect(screen.queryByTestId('chest-closed')).not.toBeInTheDocument()
  })

  it('muzlatish mukofoti zaxiraga tushadi', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.15)
    await ensureProfile()
    await db.profile.update('me', { freezesAvailable: 0 })
    render(<SessionChest />)

    fireEvent.click(screen.getByTestId('chest-closed'))

    expect(await screen.findByTestId('chest-open')).toHaveTextContent(/streak freeze/i)
    await waitFor(async () => {
      expect((await ensureProfile()).freezesAvailable).toBe(1)
    })
  })

  it('yozib bo‘lmasa sandiq YOPIQ qoladi — yolg‘on mukofot yo‘q', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    vi.spyOn(db.profile, 'get').mockRejectedValueOnce(new Error('baza yopiq'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<SessionChest />)

    fireEvent.click(screen.getByTestId('chest-closed'))

    await waitFor(() => {
      expect(screen.getByTestId('chest-closed')).not.toBeDisabled()
    })
    expect(screen.queryByTestId('chest-open')).not.toBeInTheDocument()
  })
})

describe('SessionSummaryPanel — sandiq', () => {
  it('yetarli javobli seansdan keyin chiqadi', () => {
    render(<SessionSummaryPanel summary={SUMMARY} />)

    expect(screen.getByTestId('chest-closed')).toBeInTheDocument()
  })

  it('juda qisqa seansda chiqmaydi — mukofot yig‘ish uchun emas', () => {
    render(<SessionSummaryPanel summary={{ ...SUMMARY, answered: 2 }} />)

    expect(screen.queryByTestId('chest-closed')).not.toBeInTheDocument()
  })
})
