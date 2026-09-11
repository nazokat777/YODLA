import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { addMissingCards, db, ensureProfile, getCard } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { SpeedGame } from './SpeedGame'
import { playCorrectSound } from '@/lib/sound'

// Ovoz jsdom'da yo'q — chaqiruvning O'ZI tekshiriladi
vi.mock('@/lib/sound', () => ({ playCorrectSound: vi.fn(), playWrongSound: vi.fn() }))

const WORDS = [
  { word: 'apple', translation: 'olma', language: 'en' as const },
  { word: 'bread', translation: 'non', language: 'en' as const },
  { word: 'water', translation: 'suv', language: 'en' as const },
  { word: 'milk', translation: 'sut', language: 'en' as const },
  { word: 'tea', translation: 'choy', language: 'en' as const },
]

/** Barcha seed kartalarini "ko'rilgan" holatga o'tkazadi */
async function markSeen() {
  await db.cards.toCollection().modify({ totalReviews: 1 })
}

function renderGame(seconds?: number) {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter>
      <SpeedGame seconds={seconds} />
    </MemoryRouter>,
  )
}

/** Ko'rsatilgan so'zga to'g'ri yoki xato javob beradi */
function answer(kind: 'correct' | 'wrong') {
  const word = screen.getByTestId('speed-word').textContent?.trim()
  const want = WORDS.find((entry) => entry.word === word)?.translation

  const buttons = screen.getAllByRole('button')
  const target =
    kind === 'correct'
      ? buttons.find((node) => node.textContent?.trim() === want)
      : buttons.find(
          (node) =>
            node.textContent?.trim() !== want &&
            WORDS.some((entry) => entry.translation === node.textContent?.trim()),
        )

  fireEvent.click(target!)
}

describe('SpeedGame', () => {
  beforeEach(async () => {
    await db.cards.clear()
    await db.profile.clear()
    await addMissingCards(WORDS)
    // O'yinlar FAQAT ko'rilgan so'zlarni oladi — seeddagilar "ko'rilgan" qilinadi
    await markSeen()
  })

  it('hali KO‘RILMAGAN so‘zlar o‘yinga kirmaydi', async () => {
    /*
     * Ilgari ko'rilgan so'z kam bo'lsa BUTUN lug'at olinardi — yangi
     * foydalanuvchi ko'rmagan so'zlarni 3 soniyada topishga majbur
     * bo'lardi. O'yin tekshiruv, o'rgatish emas.
     */
    await db.cards.toCollection().modify({ totalReviews: 0 })

    renderGame()

    expect(await screen.findByText(/avval bir dars o.ting/i)).toBeInTheDocument()
  })

  it('so‘z kam bo‘lsa o‘yin boshlanmaydi', async () => {
    await db.cards.clear()
    await addMissingCards([WORDS[0]])

    renderGame()

    expect(await screen.findByText(/kamida 4 ta so.z kerak/i)).toBeInTheDocument()
  })

  it('boshlangach taymer va ochko ko‘rinadi', async () => {
    renderGame()

    fireEvent.click(await screen.findByRole('button', { name: /boshlash/i }))

    expect(screen.getByTestId('speed-timer')).toHaveTextContent('60')
    expect(screen.getByTestId('speed-live-score')).toHaveTextContent('0')
  })

  it('to‘g‘ri javob ochko qo‘shadi', async () => {
    renderGame()
    fireEvent.click(await screen.findByRole('button', { name: /boshlash/i }))

    answer('correct')

    await waitFor(() => {
      expect(screen.getByTestId('speed-live-score')).toHaveTextContent('1')
    })
  })

  it('xato javob ochko qo‘shmaydi, lekin SM-2 ni qattiq jazolamaydi', async () => {
    /*
     * O'yinda xato ko'pincha vaqt yetmagani yoki chalg'iganidan
     * bo'ladi. To'liq "unutdim" bahosi intervalni asossiz
     * qisqartirardi — bola o'yin o'ynagani uchun jazolanardi.
     */
    renderGame()
    fireEvent.click(await screen.findByRole('button', { name: /boshlash/i }))

    const word = screen.getByTestId('speed-word').textContent?.trim()
    answer('wrong')

    await waitFor(async () => {
      const card = await getCard(`en:${word}`)
      expect(card?.totalReviews).toBe(2)
    })
    expect(screen.getByTestId('speed-live-score')).toHaveTextContent('0')
  })

  it('vaqt tugagach natija va rekord saqlanadi', async () => {
    // Qisqa o'yin: haqiqiy taymer bilan kutamiz — soxta taymer
    // Dexie tranzaksiyalarini uzib yuborardi
    renderGame(1)

    fireEvent.click(await screen.findByRole('button', { name: /boshlash/i }))
    answer('correct')

    expect(await screen.findByTestId('speed-score', undefined, { timeout: 3000 })).toHaveTextContent(
      '1',
    )
    await waitFor(async () => {
      expect((await ensureProfile()).gameBests?.speed).toBe(1)
    })
  })
})

describe('SpeedGame — arab tili', () => {
  it('so‘z o‘rganilayotgan tilning yo‘nalishi va tili bilan chiziladi', async () => {
    /*
     * Arab shrifti va harakatlar uchun satr balandligi `[dir='rtl']`
     * orqali beriladi. Usiz arabcha so'z lotin shriftida chiqardi.
     */
    await db.cards.clear()
    await addMissingCards([
      { word: 'كِتَاب', translation: 'kitob', language: 'ar' },
      { word: 'قَلَم', translation: 'qalam', language: 'ar' },
      { word: 'بَيْت', translation: 'uy', language: 'ar' },
      { word: 'مَاء', translation: 'suv', language: 'ar' },
    ])
    await markSeen()
    useSettingsStore.getState().reset()
    useSettingsStore.getState().setLearningLanguage('ar')

    render(
      <MemoryRouter>
        <SpeedGame />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /boshlash/i }))

    const word = screen.getByTestId('speed-word')

    expect(word).toHaveAttribute('dir', 'rtl')
    expect(word).toHaveAttribute('lang', 'ar')
  })
})

describe('SpeedGame — ovoz', () => {
  it('ovoz yoqilgan bo‘lsa to‘g‘ri javobda signal beriladi', async () => {
    /*
     * O'yinlar ovozsiz edi, seans esa ovozli — farq asossiz. O'yinda
     * ovoz ayniqsa kerak: bola tugmaga qaraydi, natijani quloq bilan
     * oladi.
     */
    vi.mocked(playCorrectSound).mockClear()
    await db.cards.clear()
    await addMissingCards(WORDS)
    await markSeen()
    useSettingsStore.getState().reset()
    useSettingsStore.getState().setLearningLanguage('en')
    useSettingsStore.getState().setSoundEnabled(true)

    render(
      <MemoryRouter>
        <SpeedGame />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /boshlash/i }))
    answer('correct')

    await waitFor(() => {
      expect(playCorrectSound).toHaveBeenCalledTimes(1)
    })
  })
})
