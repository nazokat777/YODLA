import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Emblem, type EmblemKind } from './Emblem'

const KINDS: EmblemKind[] = ['coin', 'trophy', 'target', 'spark', 'rocket']

describe('Emblem', () => {
  it('har bir belgi chiziladi', () => {
    for (const kind of KINDS) {
      const { container, unmount } = render(<Emblem kind={kind} />)

      expect(container.querySelector('svg')).toBeInTheDocument()
      unmount()
    }
  })

  it('bezak — ekran o‘quvchidan yashiriladi', () => {
    const { container } = render(<Emblem kind="coin" />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('gradient id belgiga bog‘langan — ikki belgi bir sahifada aralashmaydi', () => {
    const { container } = render(
      <>
        <Emblem kind="coin" />
        <Emblem kind="target" />
      </>,
    )

    const ids = [...container.querySelectorAll('linearGradient')].map((node) => node.id)

    expect(new Set(ids).size).toBe(ids.length)
  })
})
