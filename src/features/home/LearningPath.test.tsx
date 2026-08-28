import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { addMissingCards, db, getAllCards, type NewCardRecordInput } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import * as starterDecks from '@/content/starterDecks'
import { LearningPath } from './LearningPath'

const WORDS: NewCardRecordInput[] = [
  { word: 'hello', translation: 'salom', language: 'en', topic: 'Salomlashish', level: 'A1' },
  { word: 'mother', translation: 'ona', language: 'en', topic: 'Oila', level: 'A1' },
  { word: 'airport', translation: 'aeroport', language: 'en', topic: 'Sayohat', level: 'A2' },
]

/** Kartalarni bosh ekran o'qiydi — testda ham shu yo'l takrorlanadi */
async function renderPath() {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  const cards = await getAllCards('en')

  return render(
    <MemoryRouter>
      <LearningPath cards={cards} />
    </MemoryRouter>,
  )
}

describe('LearningPath', () => {
  beforeEach(async () => {
    await db.cards.clear()
  })

  it('bo‘limlarni ko‘rsatadi', async () => {
    await addMissingCards(WORDS)
    await renderPath()

    expect(await screen.findByText('Salomlashish')).toBeInTheDocument()
    expect(screen.getByText('Oila')).toBeInTheDocument()
    expect(screen.getByText('Sayohat')).toBeInTheDocument()
  })

  it('joriy bo‘lim darsga havola qiladi', async () => {
    await addMissingCards(WORDS)
    await renderPath()

    const link = await screen.findByRole('link', { name: /salomlashish/i })

    expect(link).toHaveAttribute('href', '/lesson/a1-salomlashish')
  })

  it('qulflangan bo‘lim havola emas va aria-disabled', async () => {
    await addMissingCards(WORDS)
    await renderPath()

    // Birinchi bo'lim joriy; keyingilari qulflangan
    const locked = await screen.findByTestId('unit-a1-oila')

    expect(locked).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByRole('link', { name: /oila/i })).not.toBeInTheDocument()
  })

  it('tugallangan bo‘limni belgilaydi', async () => {
    await addMissingCards(WORDS)
    await db.cards.update('en:hello', { totalReviews: 2 })

    await renderPath()

    await waitFor(() => {
      expect(screen.getByTestId('unit-a1-salomlashish')).toHaveAttribute(
        'data-state',
        'completed',
      )
    })
  })

  it('animatsiyasiz ham to‘g‘ri chizadi', async () => {
    // jsdom'da GSAP ishlamaydi — bu test "animatsiya bezak" qoidasini
    // avtomatik qo'riqlaydi
    await addMissingCards(WORDS)
    await renderPath()

    const unit = await screen.findByTestId('unit-a1-salomlashish')

    expect(unit).toBeVisible()
  })
})

describe('LearningPath — yuklanish holati', () => {
  it('lug‘at kelgunicha ALIFBO tartibida chizilmaydi', async () => {
    // Mavzu tartibi lug'atdan keladi va u dangasa yuklanadi. Tayyor
    // bo'lmasidan chizilsa, bo'limlar avval alifbo bo'yicha ko'rinib,
    // keyin sakrab qayta saralanardi — arabchada "10-dars" "2-dars" dan
    // oldin turib qolardi.
    await addMissingCards(WORDS)
    await renderPath()

    // Yuklanayotgani BILINADI (bo'sh joy emas)
    expect(await screen.findByTestId('path-loading')).toBeInTheDocument()

    // Tayyor bo'lgach ro'yxat chiqadi
    await waitFor(() => {
      expect(screen.getByText('Salomlashish')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('path-loading')).not.toBeInTheDocument()
  })

  it('karta umuman bo‘lmasa hech narsa ko‘rsatmaydi', async () => {
    // Bo'sh holat — "yuklanmoqda" emas
    const { container } = await renderPath()

    await waitFor(() => {
      expect(screen.queryByTestId('path-loading')).not.toBeInTheDocument()
    })
    expect(container.querySelector('section')).toBeNull()
  })

  it('lug‘at bo‘lagi yuklanmasa ham yo‘l chiziladi', async () => {
    // Yangi versiya chiqqach eski sahifada bo'lak nomi o'zgaradi; oflaynda
    // til almashtirilganda ham shu bo'ladi. Ilgari bunda `topicOrder`
    // abadiy `null` qolib, yo'l "yuklanmoqda" holatida qotardi.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(starterDecks, 'loadLanguageDeck').mockRejectedValue(new Error('chunk yo‘q'))

    await addMissingCards(WORDS)
    await renderPath()

    expect(await screen.findByText('Oila')).toBeInTheDocument()
    expect(screen.getByText('Salomlashish')).toBeInTheDocument()
  })
})
