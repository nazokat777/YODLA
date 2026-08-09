import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { OnboardingScreen } from './OnboardingScreen'

function renderScreen() {
  useSettingsStore.getState().reset()

  return render(
    <MemoryRouter>
      <OnboardingScreen />
    </MemoryRouter>,
  )
}

/** 1-qadamdan 2-qadamga o'tish */
function chooseEnglish() {
  fireEvent.click(screen.getByRole('button', { name: /ingliz tili/i }))
  fireEvent.click(screen.getByRole('button', { name: /davom etish/i }))
}

describe('OnboardingScreen — oqim', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset()
  })

  it('til tanlanmaguncha davom etib bo‘lmaydi', () => {
    renderScreen()

    expect(screen.getByRole('button', { name: /davom etish/i })).toBeDisabled()
  })

  it('til tanlangach daraja testiga o‘tadi', () => {
    renderScreen()
    chooseEnglish()

    expect(screen.getByTestId('placement-progress')).toHaveTextContent('1/9')
  })

  it('testni o‘tkazib yuborsa daraja A1 bo‘ladi', () => {
    renderScreen()
    chooseEnglish()

    fireEvent.click(screen.getByRole('button', { name: /o.tkazib yuborish/i }))

    expect(useSettingsStore.getState().startingLevel).toBe('A1')
    // Keyingi qadam — kunlik maqsad
    expect(screen.getByText(/kunlik maqsad/i)).toBeInTheDocument()
  })

  it('barcha savollarga javob berilgach maqsad qadamiga o‘tadi', () => {
    renderScreen()
    chooseEnglish()

    // Har savolda birinchi variantni tanlaymiz — natija muhim emas,
    // muhimi oqim oxirigacha borishi
    for (let i = 0; i < 9; i += 1) {
      const options = screen.getAllByRole('listitem')
      fireEvent.click(options[0].querySelector('button')!)
    }

    expect(screen.getByText(/kunlik maqsad/i)).toBeInTheDocument()
  })

  it('kunlik maqsad tanlanadi va yakun qadamida ko‘rinadi', () => {
    renderScreen()
    chooseEnglish()
    fireEvent.click(screen.getByRole('button', { name: /o.tkazib yuborish/i }))

    fireEvent.click(screen.getByRole('button', { name: /yengil/i }))
    fireEvent.click(screen.getByRole('button', { name: /davom etish/i }))

    expect(useSettingsStore.getState().dailyGoalWords).toBe(10)
    expect(screen.getByText(/tayyor/i)).toBeInTheDocument()
  })

  it('maqsad qadamidan orqaga qaytish mumkin', () => {
    renderScreen()
    chooseEnglish()
    fireEvent.click(screen.getByRole('button', { name: /o.tkazib yuborish/i }))

    fireEvent.click(screen.getByRole('button', { name: /orqaga/i }))

    expect(screen.getByTestId('placement-progress')).toBeInTheDocument()
  })

  it('yakunda onboarding tugallangan deb belgilanadi', () => {
    renderScreen()
    chooseEnglish()
    fireEvent.click(screen.getByRole('button', { name: /o.tkazib yuborish/i }))
    fireEvent.click(screen.getByRole('button', { name: /davom etish/i }))

    expect(useSettingsStore.getState().onboardingCompleted).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: /birinchi darsni boshlash/i }))

    expect(useSettingsStore.getState().onboardingCompleted).toBe(true)
  })
})
