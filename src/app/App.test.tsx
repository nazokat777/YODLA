import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from '@/app/App'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Faza 1 uchun "smoke" testlar: routing va qorovul ishlayaptimi.
 * SRS yadrosining chuqur testlari Faza 2'da qo'shiladi.
 */
describe('App routing', () => {
  it('onboarding tugallanmagan bo‘lsa, til tanlash ekraniga yo‘naltiradi', () => {
    useSettingsStore.getState().reset()

    render(<App />)

    expect(screen.getByRole('heading', { name: /qaysi tilni/i })).toBeInTheDocument()
  })

  it('onboarding tugagach, bosh ekran ko‘rsatiladi', () => {
    useSettingsStore.getState().reset()
    useSettingsStore.getState().setLearningLanguage('en')
    useSettingsStore.getState().completeOnboarding()

    render(<App />)

    expect(screen.getByRole('navigation', { name: /asosiy navigatsiya/i })).toBeInTheDocument()
    expect(screen.getByText(/kunlik maqsad/i)).toBeInTheDocument()
  })
})
