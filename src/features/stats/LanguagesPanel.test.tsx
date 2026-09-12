import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { addMissingCards, db } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LanguagesPanel } from './LanguagesPanel'

describe('LanguagesPanel', () => {
  beforeEach(async () => {
    await db.cards.clear()
    useSettingsStore.getState().reset()
    useSettingsStore.getState().setLearningLanguage('en')
  })

  it('faqat so‘z o‘rganilgan tillar chiziladi', async () => {
    await addMissingCards([
      { word: 'apple', translation: 'olma', language: 'en' },
      { word: 'вода', translation: 'suv', language: 'ru' },
    ])
    // Ingliz: o'rganilmoqda; rus: hali ko'rilmagan
    await db.cards.update('en:apple', { repetitions: 1, interval: 1, totalReviews: 1 })

    render(<LanguagesPanel />)

    expect(await screen.findByTestId('language-row-en')).toHaveTextContent('1 o‘rganilmoqda')
    expect(screen.queryByTestId('language-row-ru')).not.toBeInTheDocument()
  })

  it('hech qaysi tilda so‘z yo‘q — panel chizilmaydi', async () => {
    const { container } = render(<LanguagesPanel />)
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(container).toBeEmptyDOMElement()
  })
})
