import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChoiceGrid } from './ChoiceGrid'

describe('ChoiceGrid', () => {
  it('sukut bo‘yicha variantlar CHAPDAN o‘ngga', () => {
    // Tanib olish va eshitib tushunishda variantlar o'zbekcha tarjimalar
    render(
      <ChoiceGrid
        options={['salom', 'xayr']}
        correctIndex={0}
        selectedIndex={null}
        revealed={false}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('list')).not.toHaveAttribute('dir', 'rtl')
  })

  it('o‘rganilayotgan til yozuvi berilsa o‘shanga bo‘ysunadi', () => {
    // "Gap ichida" mashqida variantlar arabcha so'zlar — ular RTL
    render(
      <ChoiceGrid
        options={['كِتاب', 'قَلَم']}
        correctIndex={0}
        selectedIndex={null}
        revealed={false}
        onSelect={vi.fn()}
        dir="rtl"
        lang="ar"
      />,
    )

    const list = screen.getByRole('list')
    expect(list).toHaveAttribute('dir', 'rtl')
    expect(list).toHaveAttribute('lang', 'ar')
  })
})
