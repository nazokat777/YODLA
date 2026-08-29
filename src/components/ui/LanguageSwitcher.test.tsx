import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LanguageSwitcher } from './LanguageSwitcher'

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset()
    useSettingsStore.getState().setLearningLanguage('en')
  })

  it('uchala tilni ko‘rsatadi va faol tilni belgilaydi', () => {
    render(<LanguageSwitcher />)

    // Tugma nomi to'liq til nomi (aria-label) — ekran o'quvchi uchun aniq
    expect(screen.getByRole('button', { name: 'Ingliz tili' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Rus tili' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Arab tili' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('boshqa tilni bosganda o‘rganilayotgan til o‘zgaradi', () => {
    render(<LanguageSwitcher />)

    fireEvent.click(screen.getByRole('button', { name: 'Rus tili' }))

    expect(useSettingsStore.getState().learningLanguage).toBe('ru')
  })

  it('arab tili tanlanganda INTERFEYS teskari o‘girilmaydi', () => {
    render(<LanguageSwitcher />)

    fireEvent.click(screen.getByRole('button', { name: 'Arab tili' }))

    expect(useSettingsStore.getState().learningLanguage).toBe('ar')

    // Interfeys matni HAR DOIM o'zbekcha — lotin yozuvi, chapdan o'ngga.
    // Butun sahifani RTL qilish o'zbekcha jumlalarni buzardi: savol
    // belgisi chap tomonga o'tib, "?Bu so'z nimani anglatadi" bo'lardi.
    // Arabchaning o'zi alohida `dir` bilan belgilanadi.
    expect(document.documentElement.dir).not.toBe('rtl')
  })
})
