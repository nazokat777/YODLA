import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

/** Render paytida yiqiladigan komponent */
function Boom(): never {
  throw new Error('portladi')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('xatolik bo‘lmasa bolalarini ko‘rsatadi', () => {
    render(
      <ErrorBoundary>
        <p>ishlayapti</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('ishlayapti')).toBeInTheDocument()
  })

  it('yiqilganda OQ EKRAN emas, tushunarli xabar chiqadi', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    // Xabar o'zbekcha va foydalanuvchiga nima qilishni aytadi
    expect(screen.getByRole('button', { name: /qayta yuklash/i })).toBeInTheDocument()
  })

  it('tugma sahifani qayta yuklaydi', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    })

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    fireEvent.click(screen.getByRole('button', { name: /qayta yuklash/i }))

    // Eng ko'p uchraydigan sabab — deploy'dan keyin qolgan eski bo'lak;
    // oddiy qayta yuklash uni tuzatadi
    expect(reload).toHaveBeenCalledOnce()
  })
})
