import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useLanguageAccent } from './useLanguageAccent'

function Probe() {
  useLanguageAccent()
  return null
}

describe('useLanguageAccent', () => {
  it('html[data-lang] o‘rganilayotgan tilga teng va u bilan o‘zgaradi', () => {
    useSettingsStore.getState().reset()
    useSettingsStore.getState().setLearningLanguage('ar')
    render(<Probe />)

    expect(document.documentElement.dataset.lang).toBe('ar')

    useSettingsStore.getState().setLearningLanguage('ru')
    expect(document.documentElement.dataset.lang).toBe('ru')
  })
})
