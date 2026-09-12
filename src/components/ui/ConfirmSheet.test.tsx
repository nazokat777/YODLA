import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConfirmSheet } from './ConfirmSheet'

function renderSheet(open = true) {
  const onPrimary = vi.fn()
  const onDanger = vi.fn()
  render(
    <ConfirmSheet
      open={open}
      title="Chiqasizmi?"
      primaryLabel="Davom etish"
      dangerLabel="Chiqish"
      onPrimary={onPrimary}
      onDanger={onDanger}
    >
      3/4 so‘z
    </ConfirmSheet>,
  )
  return { onPrimary, onDanger }
}

describe('ConfirmSheet', () => {
  it('yopiq bo‘lsa hech nima chizilmaydi', () => {
    renderSheet(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('XAVFSIZ tugma fokusda — tasodifiy Enter chiqib ketmaydi', () => {
    renderSheet()
    expect(screen.getByRole('button', { name: 'Davom etish' })).toHaveFocus()
  })

  it('Esc va fon — xavfsiz tomon; "Chiqish" — xavfli', () => {
    const { onPrimary, onDanger } = renderSheet()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onPrimary).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Yopish' }))
    expect(onPrimary).toHaveBeenCalledTimes(2)

    fireEvent.click(screen.getByRole('button', { name: 'Chiqish' }))
    expect(onDanger).toHaveBeenCalledTimes(1)
  })
})
