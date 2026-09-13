import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { InstallCard } from './InstallCard'

describe('InstallCard', () => {
  it('brauzer taklif bermasa ko‘rinmaydi; bersa — tugma prompt chaqiradi', async () => {
    render(<InstallCard />)
    expect(screen.queryByTestId('install-card')).not.toBeInTheDocument()

    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    })
    act(() => {
      window.dispatchEvent(event)
    })

    expect(screen.getByTestId('install-card')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /o‘rnatish/i }))
    expect(prompt).toHaveBeenCalled()
  })
})
