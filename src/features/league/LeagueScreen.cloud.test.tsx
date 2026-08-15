import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Liga backendi ULANGAN holat.
 *
 * Supabase qatlami mock qilinadi: bu yerda tekshiriladigan narsa —
 * server javobini ekran to'g'ri chizadimi, tartiblaydimi va yuborilgan
 * so'rovlar to'g'rimi. Haqiqiy Supabase loyihasi bo'lmasa ham bu yo'l
 * sinovdan o'tishi kerak, aks holda kalitlar kelganda xato qayerdaligini
 * topish qiyin bo'lardi.
 */
const fetchWeeklyLeague = vi.fn()
const fetchFriendCodes = vi.fn()
const fetchCheers = vi.fn()
const addFriend = vi.fn()
const sendCheer = vi.fn()

vi.mock('@/lib/supabase', () => ({
  isCloudEnabled: () => true,
  fetchWeeklyLeague: (...args: unknown[]) => fetchWeeklyLeague(...args),
  fetchFriendCodes: (...args: unknown[]) => fetchFriendCodes(...args),
  fetchCheers: (...args: unknown[]) => fetchCheers(...args),
  addFriend: (...args: unknown[]) => addFriend(...args),
  sendCheer: (...args: unknown[]) => sendCheer(...args),
  pushToday: vi.fn(async () => true),
}))

const { LeagueScreen } = await import('./LeagueScreen')

const MY_CODE = 'AB2CD3'

/** Serverdan keladigan reyting — ataylab TARTIBSIZ */
const ROWS = [
  { code: 'XY4ZW5', name: 'Dilnoza', xp: 120 },
  { code: MY_CODE, name: 'Ali', xp: 300 },
  { code: 'QR6ST7', name: 'Bobur', xp: 210 },
]

function renderScreen() {
  useSettingsStore.getState().reset()
  useSettingsStore.setState({ leagueCode: MY_CODE, leagueName: 'Ali' })

  return render(
    <MemoryRouter initialEntries={['/league']}>
      <LeagueScreen />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchWeeklyLeague.mockResolvedValue(ROWS)
  fetchFriendCodes.mockResolvedValue([])
  fetchCheers.mockResolvedValue([])
  addFriend.mockResolvedValue(true)
  sendCheer.mockResolvedValue(true)
})

describe('LeagueScreen — backend ulangan', () => {
  it('reyting XP bo‘yicha kamayish tartibida chiziladi', async () => {
    renderScreen()

    await screen.findByText('Dilnoza')

    const names = [...document.querySelectorAll('ol li')].map(
      (li) => li.querySelector('span:nth-child(2)')?.textContent,
    )
    expect(names).toEqual(['Ali', 'Bobur', 'Dilnoza'])
  })

  it('o‘rinlar 1 dan boshlanadi', async () => {
    renderScreen()

    await screen.findByText('Dilnoza')

    const ranks = [...document.querySelectorAll('ol li')].map(
      (li) => li.querySelector('span')?.textContent,
    )
    expect(ranks).toEqual(['1', '2', '3'])
  })

  it('o‘ziga xabar yuborish tugmasi KO‘RSATILMAYDI', async () => {
    renderScreen()

    await screen.findByText('Dilnoza')

    expect(screen.getByRole('button', { name: /Boburga xabar yuborish/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Aliga xabar yuborish/i })).not.toBeInTheDocument()
  })

  it('do‘stlar ko‘rinishi faqat qo‘shilganlarni qoldiradi', async () => {
    fetchFriendCodes.mockResolvedValue(['QR6ST7'])
    renderScreen()

    await screen.findByText('Dilnoza')
    fireEvent.click(screen.getByRole('button', { name: /do.stlar/i }))

    // O'zim + do'stim qoladi, begona ketadi
    await waitFor(() => {
      expect(screen.queryByText('Dilnoza')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Bobur')).toBeInTheDocument()
    expect(screen.getByText('Ali')).toBeInTheDocument()
  })

  it('do‘st qo‘shishda kod KATTA harfga o‘tkazib yuboriladi', async () => {
    renderScreen()
    await screen.findByText('Dilnoza')

    fireEvent.change(screen.getByLabelText(/do.stingizning kodi/i), {
      target: { value: 'qr6st7' },
    })
    fireEvent.click(screen.getByRole('button', { name: /qo.shish/i }))

    await waitFor(() => {
      expect(addFriend).toHaveBeenCalledWith(MY_CODE, 'QR6ST7')
    })
  })

  it('o‘z kodini do‘st sifatida qo‘shib bo‘lmaydi', async () => {
    renderScreen()
    await screen.findByText('Dilnoza')

    fireEvent.change(screen.getByLabelText(/do.stingizning kodi/i), {
      target: { value: MY_CODE },
    })
    fireEvent.click(screen.getByRole('button', { name: /qo.shish/i }))

    expect(await screen.findByText(/bu sizning kodingiz/i)).toBeInTheDocument()
    expect(addFriend).not.toHaveBeenCalled()
  })

  it('xabar tanlangan kishiga yuboriladi', async () => {
    renderScreen()
    await screen.findByText('Dilnoza')

    fireEvent.click(screen.getByRole('button', { name: /Boburga xabar yuborish/i }))
    // `bravo` turining ko'rinadigan nomi — "Barakalla"
    fireEvent.click(await screen.findByRole('button', { name: /barakalla/i }))

    await waitFor(() => {
      expect(sendCheer).toHaveBeenCalledWith(MY_CODE, 'QR6ST7', 'bravo')
    })
  })

  it('kelgan xabarlar ko‘rsatiladi', async () => {
    fetchCheers.mockResolvedValue([{ from_code: 'QR6ST7', kind: 'bravo', d: '2026-08-13' }])
    renderScreen()

    expect(await screen.findByText(/sizga xabarlar/i)).toBeInTheDocument()
  })

  it('server javob bermasa — sabab aytiladi, ekran buzilmaydi', async () => {
    fetchWeeklyLeague.mockResolvedValue(null)
    renderScreen()

    expect(await screen.findByText(/reytingni olib bo.lmadi/i)).toBeInTheDocument()
    // O'z natijasi baribir ko'rinadi
    expect(screen.getByTestId('my-tier')).toBeInTheDocument()
  })
})
