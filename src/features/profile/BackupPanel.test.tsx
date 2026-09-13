import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { addMissingCards, db, gradeCard } from '@/core/db'
import { BackupPanel } from './BackupPanel'
import { shouldNudgeBackup } from './backupNudge'

describe('BackupPanel', () => {
  beforeEach(async () => {
    await db.cards.clear()
    await db.dailyStats.clear()
    await db.profile.clear()
    await addMissingCards([{ word: 'apple', translation: 'olma', language: 'en' }])
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() })
  })

  it('yuklab olish faylni yaratadi va nechta so‘z saqlanganini aytadi', async () => {
    await gradeCard('en:apple', 4)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<BackupPanel />)

    fireEvent.click(screen.getByRole('button', { name: /yuklab olish/i }))

    expect(await screen.findByTestId('backup-message')).toHaveTextContent('1 ta so‘z')
    expect(click).toHaveBeenCalled()
  })

  it('tiklash TASDIQ so‘raydi va tasdiqdan keyingina yozadi', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    render(<BackupPanel />)

    const backup = {
      version: 1,
      exportedAt: 0,
      cards: [{ id: 'en:apple', interval: 6, repetitions: 2, easeFactor: 2.5, dueDate: 0, lastReviewedAt: 0, totalReviews: 3, lapses: 0 }],
      dailyStats: [],
      profile: null,
      settings: null,
    }
    const file = new File([JSON.stringify(backup)], 'z.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText(/zaxira faylini tanlash/i), { target: { files: [file] } })

    expect(await screen.findByRole('dialog')).toHaveTextContent(/1 ta so‘z/)
    // Hali yozilmagan
    expect((await db.cards.get('en:apple'))?.totalReviews).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: /ha, tiklash/i }))

    await waitFor(async () => {
      expect((await db.cards.get('en:apple'))?.totalReviews).toBe(3)
    })
    expect(await screen.findByTestId('backup-message')).toHaveTextContent('Tiklandi: 1 ta so‘z')
  })

  it('buzuq fayl rad etiladi', async () => {
    render(<BackupPanel />)
    const file = new File(['{"version":9}'], 'z.json', { type: 'application/json' })

    fireEvent.change(screen.getByLabelText(/zaxira faylini tanlash/i), { target: { files: [file] } })

    expect(await screen.findByTestId('backup-message')).toHaveTextContent(/emas yoki buzilgan/i)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('eslatma: 30+ so‘z va 14 kundan beri zaxira yo‘q', () => {
    const DAY = 24 * 60 * 60 * 1000
    const now = 1_800_000_000_000
    expect(shouldNudgeBackup(null, 10, now)).toBe(false)
    expect(shouldNudgeBackup(null, 30, now)).toBe(true)
    expect(shouldNudgeBackup(now - 3 * DAY, 100, now)).toBe(false)
    expect(shouldNudgeBackup(now - 20 * DAY, 100, now)).toBe(true)
  })

  it('eslatma panelda ko‘rinadi va yuklab olgach yo‘qoladi', async () => {
    localStorage.removeItem('polyglotpro:lastBackup')
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<BackupPanel seenWords={50} />)

    expect(screen.getByTestId('backup-nudge')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /yuklab olish/i }))
    await screen.findByTestId('backup-message')

    expect(screen.queryByTestId('backup-nudge')).not.toBeInTheDocument()
  })
})
