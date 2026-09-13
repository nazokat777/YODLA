import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { db, ensureProfile } from '@/core/db'
import { Companion } from './Companion'

vi.mock('@/lib/sound', () => ({ playMasteredSound: vi.fn() }))

describe('Companion', () => {
  beforeEach(async () => {
    await db.profile.clear()
    await ensureProfile()
  })

  it('bosqich, gap va keyingi bosqichgacha so‘zlar', () => {
    render(<Companion seenWords={12} />)

    expect(screen.getByTestId('companion-emoji')).toHaveTextContent('🐣')
    expect(screen.getByText('Jo‘ja')).toBeInTheDocument()
    expect(screen.getByTestId('companion-next')).toHaveTextContent('Polapon — yana 8 so‘z')
  })

  it('yangi bosqich BIR marta nishonlanadi', async () => {
    const first = render(<Companion seenWords={4} />)
    expect(await screen.findByText(/yangi bosqich/i)).toBeInTheDocument()
    first.unmount()

    render(<Companion seenWords={4} />)
    await waitFor(async () => {
      expect((await ensureProfile()).celebratedCompanionStages).toEqual([4])
    })
    expect(screen.queryByText(/yangi bosqich/i)).not.toBeInTheDocument()
  })

  it('tuxum bosqichi nishonlanmaydi', async () => {
    render(<Companion seenWords={0} />)
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(screen.queryByText(/yangi bosqich/i)).not.toBeInTheDocument()
  })

  it('bezaklar eng uzun streak bilan', () => {
    render(<Companion seenWords={12} longestStreak={7} />)
    expect(screen.getByTestId('companion-accessories')).toHaveTextContent('✨🎀')
  })
})
