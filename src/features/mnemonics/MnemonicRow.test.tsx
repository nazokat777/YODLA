import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { CardRecord } from '@/core/db'
import { MnemonicRow } from './MnemonicRow'

function makeCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    id: 'en:water',
    word: 'water',
    translation: 'suv',
    language: 'en',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    ...overrides,
  }
}

describe('MnemonicRow', () => {
  it('so‘z, tarjima va mnemonikani ko‘rsatadi', () => {
    render(
      <MnemonicRow
        card={makeCard({ mnemonic: 'vatanimda suv' })}
        onSave={() => {}}
        onDelete={() => {}}
      />,
    )

    expect(screen.getByText('water')).toBeInTheDocument()
    // Tarjima va mnemonika ikkalasida ham "suv" bor — aniq matn bilan qidiramiz
    expect(screen.getByText('— suv')).toBeInTheDocument()
    expect(screen.getByText(/vatanimda suv/)).toBeInTheDocument()
  })

  it('mnemonikasi yo‘q kartada "qo‘shish" taklif qilinadi', () => {
    render(<MnemonicRow card={makeCard()} onSave={() => {}} onDelete={() => {}} />)

    expect(screen.getByRole('button', { name: /assotsiatsiya qo.shish/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /o.chirish/i })).not.toBeInTheDocument()
  })

  it('saqlash ota komponentga matnni uzatadi', () => {
    const onSave = vi.fn()
    render(<MnemonicRow card={makeCard()} onSave={onSave} onDelete={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /assotsiatsiya qo.shish/i }))
    fireEvent.change(screen.getByLabelText(/assotsiatsiya/i), { target: { value: 'yangi' } })
    fireEvent.click(screen.getByRole('button', { name: /^saqlash$/i }))

    expect(onSave).toHaveBeenCalledWith('en:water', 'yangi')
  })

  it('o‘chirish ota komponentga xabar beradi', () => {
    const onDelete = vi.fn()
    render(
      <MnemonicRow card={makeCard({ mnemonic: 'bor' })} onSave={() => {}} onDelete={onDelete} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /o.chirish/i }))

    expect(onDelete).toHaveBeenCalledWith('en:water')
  })

  it('bo‘sh matn saqlanmaydi', () => {
    const onSave = vi.fn()
    render(<MnemonicRow card={makeCard()} onSave={onSave} onDelete={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /assotsiatsiya qo.shish/i }))

    expect(screen.getByRole('button', { name: /^saqlash$/i })).toBeDisabled()
  })
})
