import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { WordResults } from './WordResults'

describe('WordResults — yaxshi va qiyin so‘zlar', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset()
    useSettingsStore.getState().setLearningLanguage('ar')
  })

  it('xatosiz bilinganlar "yaxshi", adashilganlar "qiynaldingiz" ro‘yxatida', () => {
    render(
      <WordResults
        learned={[
          { id: 'ar:kitab', word: 'كِتَاب', translation: 'kitob' },
          { id: 'ar:qalam', word: 'قَلَمٌ', translation: 'qalam' },
        ]}
        missed={[{ id: 'ar:qalam', word: 'قَلَمٌ', translation: 'qalam' }]}
      />,
    )

    const good = screen.getByTestId('words-good')
    expect(good).toHaveTextContent('Yaxshi yodladingiz — 1 ta')
    expect(good).toHaveTextContent('kitob')
    expect(good).toHaveTextContent('kitab')
    expect(good).not.toHaveTextContent('qalam')

    const hard = screen.getByTestId('words-hard')
    expect(hard).toHaveTextContent('Qiynaldingiz — 1 ta')
    expect(hard).toHaveTextContent('qalam')
  })

  it('hech narsa bo‘lmasa — ko‘rsatilmaydi', () => {
    const { container } = render(<WordResults learned={[]} missed={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
