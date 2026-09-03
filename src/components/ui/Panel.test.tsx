import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Panel } from './Panel'

describe('Panel', () => {
  it('sukut bo‘yicha keng ichki bo‘shliq', () => {
    render(<Panel data-testid="p">matn</Panel>)

    expect(screen.getByTestId('p').className).toMatch(/\bp-4\b/)
  })

  it('kichik bo‘shliq so‘ralsa kattasi QOLMAYDI', () => {
    render(
      <Panel data-testid="p" padding="sm">
        matn
      </Panel>,
    )

    const panel = screen.getByTestId('p')

    // `cn()` Tailwind ziddiyatlarini yechmaydi: `className="p-3"` uzatilsa
    // elementda `p-4 p-3` ikkalasi qolib, CSS tartibiga qarab `p-4` yutardi
    // va chaqiruvchining niyati jimgina yo'qolardi
    expect(panel.className).toMatch(/\bp-3\b/)
    expect(panel.className).not.toMatch(/\bp-4\b/)
  })
})
