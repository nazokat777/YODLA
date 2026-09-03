import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Mascot } from './Mascot'

/** Personaj tasviri — bezak bo'lgani uchun `alt` bo'sh, rol yo'q */
function mascotOf(container: HTMLElement) {
  return container.querySelector('img')
}

describe('Mascot', () => {
  it('bezak element sifatida ekran o‘quvchidan yashiriladi', () => {
    // Yonidagi matn ma'noni allaqachon beradi — takrorlash shovqin bo'lardi
    const { container } = render(<Mascot mood="idle" />)
    const image = mascotOf(container)

    expect(image).not.toBeNull()
    expect(image).toHaveAttribute('aria-hidden', 'true')
    expect(image).toHaveAttribute('alt', '')
  })

  it('quvnoq kayfiyatda boshqa tasvir ko‘rsatiladi', () => {
    const { container: idle } = render(<Mascot mood="idle" />)
    const { container: happy } = render(<Mascot mood="happy" />)

    expect(mascotOf(idle)?.getAttribute('src')).not.toBe(mascotOf(happy)?.getAttribute('src'))
  })

  it('bir guruhdagi kayfiyatlar bir tasvirni bo‘lishadi', () => {
    // Har kayfiyat uchun alohida fayl saqlash hajmni ikki baravar oshirardi
    const { container: happy } = render(<Mascot mood="happy" />)
    const { container: celebrating } = render(<Mascot mood="celebrating" />)

    expect(mascotOf(happy)?.getAttribute('src')).toBe(mascotOf(celebrating)?.getAttribute('src'))
  })

  it('kayfiyat data-atributi bilan belgilanadi', () => {
    const { container } = render(<Mascot mood="celebrating" />)

    expect(mascotOf(container)).toHaveAttribute('data-mood', 'celebrating')
  })

  it('o‘lchamlar oldindan beriladi — joy siljimasin', () => {
    const { container } = render(<Mascot mood="idle" />)

    expect(mascotOf(container)).toHaveAttribute('width', '256')
    expect(mascotOf(container)).toHaveAttribute('height', '256')
  })
})

describe('Mascot — o‘lchamlar', () => {
  it('matn yonidagi eng kichik o‘lcham', () => {
    // Javob panelida maskot sarlavha bilan bir qatorda turadi; 320 px li
    // ekranda kattarog'i sarlavhani uch qatorga siqib qo'yardi
    render(<Mascot size="xs" />)

    expect(document.querySelector('[data-mood]')?.className).toMatch(/h-12 w-12/)
  })
})
