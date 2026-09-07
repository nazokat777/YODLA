import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RouteTransition } from './RouteTransition'

describe('RouteTransition', () => {
  it('kontent ANIMATSIYASIZ ham ko‘rinadi', () => {
    /*
     * Animatsiya bezak: u yuklanmasa yoki tugamay qolsa ham sahifa
     * o'qilishi shart. Shuning uchun `opacity` ishlatilmaydi.
     */
    render(
      <MemoryRouter>
        <RouteTransition>
          <p>Salom</p>
        </RouteTransition>
      </MemoryRouter>,
    )

    expect(screen.getByText('Salom')).toBeVisible()
  })
})
