import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import * as motion from '@/lib/motion'
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

describe('ChoiceGrid — bosiladigan tuyg‘u', () => {
  function renderGrid(revealed = false, selectedIndex: number | null = null) {
    return render(
      <ChoiceGrid
        options={['salom', 'xayr']}
        correctIndex={0}
        selectedIndex={selectedIndex}
        revealed={revealed}
        onSelect={vi.fn()}
      />,
    )
  }

  it('variant tugmasi QALIN — pastida qattiq soya bor', () => {
    renderGrid()

    // Loyihaning `Button` komponentida shu uslub allaqachon bor edi,
    // variantlar esa tekis oq quti bo'lib qolgandi va bosishga
    // undamas edi
    const [first] = screen.getAllByRole('button')
    expect(first.className).toMatch(/shadow-\[0_4px_0_0\]/)
  })

  it('javobdan keyin soya OLINADI — tugma endi bosilmaydi', () => {
    renderGrid(true, 1)

    // Javob berilgach variantlar faol emas; qalin ko'rinish esa
    // "meni bos" deb turardi
    for (const button of screen.getAllByRole('button')) {
      expect(button.className).not.toMatch(/shadow-\[0_4px_0_0\]/)
    }
  })

  it('to‘g‘ri va xato belgilari O‘ZGARMAYDI', () => {
    renderGrid(true, 1)

    // Rang yagona belgi bo'lib qolmasligi kerak (WCAG 1.4.1)
    expect(screen.getByText(/to.g.ri javob/)).toBeInTheDocument()
    expect(screen.getByText(/sizning javobingiz, xato/)).toBeInTheDocument()
  })
})

describe('ChoiceGrid — harakat bezak', () => {
  it('GSAP yuklanmasa ham variantlar KO‘RINADI va ishlaydi', async () => {
    // Harakat kamaytirilgan qurilmada `loadGsap` `null` qaytaradi.
    // Interfeys shunda ham to'liq ishlashi kerak — harakat bezak,
    // shart emas.
    vi.spyOn(motion, 'loadGsap').mockResolvedValue(null)

    const onSelect = vi.fn()
    render(
      <ChoiceGrid
        options={['salom', 'xayr']}
        correctIndex={0}
        selectedIndex={null}
        revealed={false}
        onSelect={onSelect}
      />,
    )

    const [first] = screen.getAllByRole('button')
    fireEvent.click(first)

    expect(onSelect).toHaveBeenCalledWith(0)
    expect(first).toBeVisible()
  })
})
