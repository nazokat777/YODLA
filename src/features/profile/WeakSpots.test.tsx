import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { addMissingCards, db, gradeCard } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { WeakSpots } from './WeakSpots'

function renderSpots() {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter>
      <WeakSpots />
    </MemoryRouter>,
  )
}

/** Kartani berilgan marta "unutilgan" holatga keltiradi */
async function forget(cardId: string, times: number) {
  for (let i = 0; i < times; i += 1) await gradeCard(cardId, 1)
}

describe('WeakSpots', () => {
  beforeEach(async () => {
    await db.cards.clear()
  })

  it('MA’LUMOT YETMASA butun bo‘lim chizilmaydi', async () => {
    /*
     * Yangi foydalanuvchiga bo'sh ro'yxat ko'rsatish "men hech nima
     * bilmayman" degan noto'g'ri taassurot qoldirardi.
     *
     * Bu yerda ikkinchi karta QIYIN, ya'ni ma'lumot yuklanganini
     * ishonchli bilamiz: "yuklanmadi" va "ko'rsatish shart emas"
     * holatlari bir-biridan ajraladi (qarorning o'zi
     * `core/mastery/skill.ts` da alohida test qilingan).
     */
    await addMissingCards([
      { word: 'apple', translation: 'olma', language: 'en' },
      { word: 'bread', translation: 'non', language: 'en' },
    ])
    await forget('en:bread', 2)

    renderSpots()

    expect(await screen.findByText('bread')).toBeInTheDocument()
    // Bir marta ham adashilmagan so'z ro'yxatga tushmaydi
    expect(screen.queryByText('apple')).not.toBeInTheDocument()
  })

  it('ko‘p unutilgan so‘z ro‘yxatga tushadi', async () => {
    await addMissingCards([
      { word: 'apple', translation: 'olma', language: 'en' },
      { word: 'bread', translation: 'non', language: 'en' },
    ])
    await forget('en:apple', 3)

    renderSpots()

    expect(await screen.findByText('apple')).toBeInTheDocument()
    expect(screen.getByText(/3 marta unutilgan/)).toBeInTheDocument()
    // Bir marta ham adashilmagan so'z "qiyin" emas
    expect(screen.queryByText('bread')).not.toBeInTheDocument()
  })

  it('mashq qilish tugmasi qiyin so‘zlar seansiga olib boradi', async () => {
    await addMissingCards([{ word: 'apple', translation: 'olma', language: 'en' }])
    await forget('en:apple', 2)

    renderSpots()

    const link = await screen.findByRole('link', { name: /mashq qilish/i })

    expect(link).toHaveAttribute('href', '/review/weak')
  })
})
