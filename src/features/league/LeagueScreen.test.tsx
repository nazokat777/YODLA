import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LeagueScreen } from './LeagueScreen'

describe('LeagueScreen', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset()
  })

  it('rozilik berilmagan bo‘lsa taklif ko‘rsatiladi', () => {
    render(<LeagueScreen />)

    expect(screen.getByText(/ligaga qo.shilish/i)).toBeInTheDocument()
  })

  it('nima yuborilishi ochiq yoziladi', () => {
    // Foydalanuvchi nimaga rozi bo'layotganini bilishi shart
    render(<LeagueScreen />)

    expect(screen.getByText(/so.zlaringiz va xatolaringiz qurilmada qoladi/i)).toBeInTheDocument()
  })

  it('ism kiritilgach kod yaratiladi', () => {
    render(<LeagueScreen />)

    fireEvent.change(screen.getByLabelText(/ism/i), { target: { value: 'Ali' } })
    fireEvent.click(screen.getByRole('button', { name: /qo.shilish/i }))

    expect(useSettingsStore.getState().leagueCode).toMatch(/^[A-Z2-9]{6}$/)
    expect(useSettingsStore.getState().leagueName).toBe('Ali')
  })

  it('ism bo‘sh bo‘lsa qo‘shilib bo‘lmaydi', () => {
    render(<LeagueScreen />)

    expect(screen.getByRole('button', { name: /qo.shilish/i })).toBeDisabled()
  })

  it('bulut yo‘q bo‘lsa lokal rejim aytiladi', () => {
    useSettingsStore.getState().joinLeague('Ali')
    render(<LeagueScreen />)

    // Testlarda env bo'sh — foydalanuvchi holatni bilishi kerak
    expect(screen.getByText(/lokal rejim/i)).toBeInTheDocument()
  })
})
