import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { db, ensureProfile } from '@/core/db'
import { StreakTierToast } from './StreakTierToast'

vi.mock('@/lib/sound', () => ({ playMilestoneSound: vi.fn() }))

describe('StreakTierToast', () => {
  beforeEach(async () => {
    await db.profile.clear()
    await ensureProfile()
  })

  it('yangi darajada bir marta chiqadi, keyin chiqmaydi', async () => {
    const first = render(<StreakTierToast streak={3} />)
    expect(await screen.findByTestId('streak-tier-toast')).toHaveTextContent(/uchqun/i)
    first.unmount()

    render(<StreakTierToast streak={3} />)
    await waitFor(async () => {
      expect((await ensureProfile()).celebratedStreakTiers).toEqual([3])
    })
    expect(screen.queryByTestId('streak-tier-toast')).not.toBeInTheDocument()
  })

  it('boshlang‘ich daraja nishonlanmaydi', async () => {
    render(<StreakTierToast streak={1} />)
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(screen.queryByTestId('streak-tier-toast')).not.toBeInTheDocument()
  })
})
