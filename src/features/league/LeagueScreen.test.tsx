import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LeagueScreen } from './LeagueScreen'

/*
 * Server "tirik" deb soxtalanadi: qo'shilish formasi faqat server javob
 * berganda ko'rsatiladi. `fetchWeeklyLeague` null qaytarsa — "tez kunda".
 */
const fetchWeeklyLeague = vi.fn()
vi.mock('@/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/supabase')>()
  return { ...actual, fetchWeeklyLeague: (...args: unknown[]) => fetchWeeklyLeague(...args) }
})

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
    fetchWeeklyLeague.mockResolvedValue([])
  })

  it('rozilik berilmagan bo‘lsa taklif ko‘rsatiladi', async () => {
    renderScreen()

    expect(await screen.findByText(/ligaga qo.shilish/i)).toBeInTheDocument()
  })

  it('server javob bermasa ism so‘ralmaydi — "tez kunda" va qayta tekshirish', async () => {
    /*
     * Ilgari bola ism kiritib, "Qo'shilish"ni bosib, keyin "server javob
     * bermadi" ko'rardi — o'lik yo'l. Forma faqat server tirik bo'lsa.
     */
    fetchWeeklyLeague.mockResolvedValue(null)
    renderScreen()

    expect(await screen.findByText(/liga tez kunda/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/ism/i)).not.toBeInTheDocument()

    // Qayta tekshirish — server tiklangan bo'lsa forma chiqadi
    fetchWeeklyLeague.mockResolvedValue([])
    fireEvent.click(screen.getByRole('button', { name: /qayta tekshirish/i }))
    expect(await screen.findByLabelText(/ism/i)).toBeInTheDocument()
  })

  it('nima yuborilishi ochiq yoziladi', async () => {
    // Foydalanuvchi nimaga rozi bo'layotganini bilishi shart
    renderScreen()

    expect(
      await screen.findByText(/so.zlaringiz va xatolaringiz qurilmada qoladi/i),
    ).toBeInTheDocument()
  })

  it('ism kiritilgach kod yaratiladi', async () => {
    renderScreen()

    fireEvent.change(await screen.findByLabelText(/ism/i), { target: { value: 'Ali' } })
    fireEvent.click(screen.getByRole('button', { name: /qo.shilish/i }))

    expect(useSettingsStore.getState().leagueCode).toMatch(/^[A-Z2-9]{6}$/)
    expect(useSettingsStore.getState().leagueName).toBe('Ali')
  })

  it('ism bo‘sh bo‘lsa qo‘shilib bo‘lmaydi', async () => {
    renderScreen()

    expect(await screen.findByRole('button', { name: /qo.shilish/i })).toBeDisabled()
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
