import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Mascot } from './Mascot'

describe('Mascot', () => {
  it('bezak element sifatida ekran o‘quvchidan yashiriladi', () => {
    // Yonidagi matn ma'noni allaqachon beradi — takrorlash shovqin bo'lardi
    const { container } = render(<Mascot mood="idle" />)
    const svg = container.querySelector('svg')

    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('har kayfiyat uchun boshqacha chizadi', () => {
    const { container: idle } = render(<Mascot mood="idle" />)
    const { container: happy } = render(<Mascot mood="happy" />)

    expect(idle.innerHTML).not.toBe(happy.innerHTML)
  })

  it('kayfiyat data-atributi bilan belgilanadi', () => {
    const { container } = render(<Mascot mood="celebrating" />)

    expect(container.querySelector('svg')).toHaveAttribute('data-mood', 'celebrating')
  })
})
