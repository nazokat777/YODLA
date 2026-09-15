import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { addMissingCards, db, getCard, setMnemonic, type NewCardRecordInput } from '@/core/db'
import { MemoryRouter } from 'react-router-dom'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { MnemonicsScreen } from './MnemonicsScreen'

const WORDS: NewCardRecordInput[] = [
  { word: 'water', translation: 'suv', language: 'en' },
  { word: 'bread', translation: 'non', language: 'en' },
  { word: 'book', translation: 'kitob', language: 'en' },
]

function renderScreen(path = '/mnemonics') {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter initialEntries={[path]}>
      <MnemonicsScreen />
    </MemoryRouter>,
  )
}

beforeEach(async () => {
  await db.cards.clear()
})

describe('MnemonicsScreen', () => {
  it('ochilganda faqat MNEMONIKASI BOR kartalar ko‘rinadi', async () => {
    await addMissingCards(WORDS)
    await setMnemonic('en:water', 'vatanimda suv')
    renderScreen()

    expect(await screen.findByText(/vatanimda suv/)).toBeInTheDocument()
    expect(screen.queryByText('bread')).not.toBeInTheDocument()
  })

  it('hech narsa yozilmagan bo‘lsa yo‘l ko‘rsatiladi', async () => {
    await addMissingCards(WORDS)
    renderScreen()

    expect(await screen.findByText(/hali assotsiatsiya yozmagansiz/i)).toBeInTheDocument()
  })

  it('qidiruv MNEMONIKASIZ so‘zni ham topadi', async () => {
    await addMissingCards(WORDS)
    renderScreen()
    await screen.findByText(/hali assotsiatsiya yozmagansiz/i)

    fireEvent.change(screen.getByLabelText(/so.z qidirish/i), { target: { value: 'bre' } })

    expect(await screen.findByText('bread')).toBeInTheDocument()
  })

  it('qidiruv TARJIMA bo‘yicha ham ishlaydi', async () => {
    await addMissingCards(WORDS)
    renderScreen()
    await screen.findByText(/hali assotsiatsiya yozmagansiz/i)

    fireEvent.change(screen.getByLabelText(/so.z qidirish/i), { target: { value: 'kitob' } })

    expect(await screen.findByText('book')).toBeInTheDocument()
  })

  it('yangi assotsiatsiya saqlanadi', async () => {
    await addMissingCards(WORDS)
    renderScreen()
    await screen.findByText(/hali assotsiatsiya yozmagansiz/i)

    fireEvent.change(screen.getByLabelText(/so.z qidirish/i), { target: { value: 'bread' } })
    fireEvent.click(await screen.findByRole('button', { name: /assotsiatsiya qo.shish/i }))
    fireEvent.change(screen.getByLabelText(/^assotsiatsiya$/i), {
      target: { value: 'birodar non' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^saqlash$/i }))

    await waitFor(async () => {
      expect((await getCard('en:bread'))?.mnemonic).toBe('birodar non')
    })
  })

  it('o‘chirish bazadan ham olib tashlaydi', async () => {
    await addMissingCards(WORDS)
    await setMnemonic('en:water', 'vaqtinchalik')
    renderScreen()

    fireEvent.click(await screen.findByRole('button', { name: /water — o.chirish/i }))

    await waitFor(async () => {
      expect((await getCard('en:water'))?.mnemonic).toBeUndefined()
    })
  })
})

describe('MnemonicsScreen — imtihondan kelgan havola', () => {
  beforeEach(async () => {
    await db.cards.clear()
    await addMissingCards(WORDS)
  })

  it('`?q=` bilan ochilsa qidiruv shu so‘z bilan to‘ldirilgan bo‘ladi', async () => {
    renderScreen('/mnemonics?q=bread')

    expect(screen.getByLabelText(/so'z qidirish/i)).toHaveValue('bread')
    expect(await screen.findByText('bread')).toBeInTheDocument()
  })
})
