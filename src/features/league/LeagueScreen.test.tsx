import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LeagueScreen } from './LeagueScreen'

/** Ekran marshrut ichida yashaydi — `useSearchParams` Router talab qiladi */
function renderScreen(path = '/league') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LeagueScreen />
    </MemoryRouter>,
  )
}

describe('LeagueScreen', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset()
  })

  it('rozilik berilmagan bo‘lsa taklif ko‘rsatiladi', () => {
    renderScreen()

    expect(screen.getByText(/ligaga qo.shilish/i)).toBeInTheDocument()
  })

  it('nima yuborilishi ochiq yoziladi', () => {
    // Foydalanuvchi nimaga rozi bo'layotganini bilishi shart
    renderScreen()

    expect(screen.getByText(/so.zlaringiz va xatolaringiz qurilmada qoladi/i)).toBeInTheDocument()
  })

  it('ism kiritilgach kod yaratiladi', () => {
    renderScreen()

    fireEvent.change(screen.getByLabelText(/ism/i), { target: { value: 'Ali' } })
    fireEvent.click(screen.getByRole('button', { name: /qo.shilish/i }))

    expect(useSettingsStore.getState().leagueCode).toMatch(/^[A-Z2-9]{6}$/)
    expect(useSettingsStore.getState().leagueName).toBe('Ali')
  })

  it('ism bo‘sh bo‘lsa qo‘shilib bo‘lmaydi', () => {
    renderScreen()

    expect(screen.getByRole('button', { name: /qo.shilish/i })).toBeDisabled()
  })

  it('bulut yo‘q bo‘lsa lokal rejim aytiladi', () => {
    useSettingsStore.getState().joinLeague('Ali')
    renderScreen()

    // Testlarda env bo'sh — foydalanuvchi holatni bilishi kerak
    expect(screen.getByText(/lokal rejim/i)).toBeInTheDocument()
  })

  it('taklif havolasi kod maydonini to‘ldiradi, lekin O‘ZI qo‘shmaydi', () => {
    // Havolani bosgan odam bilmagan holda kimnidir kuzata boshlamasligi kerak
    useSettingsStore.getState().joinLeague('Ali')
    renderScreen('/league?add=N2NAWS')

    expect(screen.getByLabelText(/do.stingizning kodi/i)).toHaveValue('N2NAWS')
  })
})
