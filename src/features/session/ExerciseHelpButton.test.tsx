import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ExerciseHelpButton } from './ExerciseHelpButton'

beforeEach(() => {
  localStorage.clear()
})

describe('ExerciseHelpButton', () => {
  it('har turni BIRINCHI marta ko‘rganda ko‘rsatma o‘zi ochiladi', () => {
    render(<ExerciseHelpButton type="listening" />)

    expect(screen.getByText(/tugmasini bosing va so.zni tinglang/i)).toBeInTheDocument()
  })

  it('shu tur ikkinchi marta chiqqanda ko‘rsatma yopiq turadi', () => {
    const { unmount } = render(<ExerciseHelpButton type="listening" />)
    unmount()

    render(<ExerciseHelpButton type="listening" />)

    expect(screen.queryByText(/tugmasini bosing va so.zni tinglang/i)).not.toBeInTheDocument()
  })

  it('bir tur ko‘rilgani BOSHQA turni yopmaydi', () => {
    const { unmount } = render(<ExerciseHelpButton type="listening" />)
    unmount()

    render(<ExerciseHelpButton type="spelling" />)

    expect(screen.getByText(/harflar aralashtirilgan/i)).toBeInTheDocument()
  })

  it('tugma orqali istalgan payt qayta ochiladi', () => {
    const { unmount } = render(<ExerciseHelpButton type="spelling" />)
    unmount()
    render(<ExerciseHelpButton type="spelling" />)

    fireEvent.click(screen.getByRole('button', { name: /qanday bajariladi/i }))

    expect(screen.getByText(/harflar aralashtirilgan/i)).toBeInTheDocument()
  })

  it('localStorage ishlamasa ham yiqilmaydi', () => {
    const original = Storage.prototype.getItem
    Storage.prototype.getItem = () => {
      throw new Error('yopiq')
    }

    expect(() => render(<ExerciseHelpButton type="cloze" />)).not.toThrow()

    Storage.prototype.getItem = original
  })
})
