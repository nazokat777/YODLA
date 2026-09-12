import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { UpdateToast } from './UpdateToast'

function stubServiceWorker(hasController: boolean) {
  const listeners = new Set<() => void>()
  vi.stubGlobal('navigator', {
    serviceWorker: {
      controller: hasController ? {} : null,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    },
  })
  return () => listeners.forEach((fn) => fn())
}

describe('UpdateToast', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('yangi worker nazoratni olganda taklif chiqadi, yopish mumkin', () => {
    const fire = stubServiceWorker(true)
    render(<UpdateToast />)

    expect(screen.queryByTestId('update-toast')).not.toBeInTheDocument()
    act(() => fire())
    expect(screen.getByTestId('update-toast')).toHaveTextContent(/yangi versiya/i)

    fireEvent.click(screen.getByRole('button', { name: 'Yopish' }))
    expect(screen.queryByTestId('update-toast')).not.toBeInTheDocument()
  })

  it('BIRINCHI o‘rnatish yangilanish emas — taklif chiqmaydi', () => {
    const fire = stubServiceWorker(false)
    render(<UpdateToast />)

    act(() => fire())
    expect(screen.queryByTestId('update-toast')).not.toBeInTheDocument()
  })
})
