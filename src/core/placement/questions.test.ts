import { describe, expect, it } from 'vitest'
import { loadLanguageDeck } from '@/content/starterDecks'
import { seededRandom } from '@/lib/random'
import { buildPlacementQuiz } from './questions'

// Lug'at dangasa yuklanadi — testda oldindan olamiz
const DECKS = {
  en: await loadLanguageDeck('en'),
  ru: await loadLanguageDeck('ru'),
  ar: await loadLanguageDeck('ar'),
}

describe('buildPlacementQuiz', () => {
  it('har darajadan 3 tadan savol beradi', () => {
    const quiz = buildPlacementQuiz(DECKS.en, seededRandom(1))

    expect(quiz).toHaveLength(9)
    expect(quiz.filter((q) => q.level === 'A1')).toHaveLength(3)
    expect(quiz.filter((q) => q.level === 'A2')).toHaveLength(3)
    expect(quiz.filter((q) => q.level === 'B1')).toHaveLength(3)
  })

  it('savollar oson darajadan boshlanadi', () => {
    const quiz = buildPlacementQuiz(DECKS.en, seededRandom(2))

    expect(quiz.map((q) => q.level)).toEqual([
      'A1',
      'A1',
      'A1',
      'A2',
      'A2',
      'A2',
      'B1',
      'B1',
      'B1',
    ])
  })

  it('har savolda 4 ta variant va bitta to‘g‘ri javob bor', () => {
    const quiz = buildPlacementQuiz(DECKS.ru, seededRandom(3))

    quiz.forEach((question) => {
      expect(question.options).toHaveLength(4)
      expect(question.correctIndex).toBeGreaterThanOrEqual(0)
      expect(question.correctIndex).toBeLessThan(4)
      expect(question.options[question.correctIndex].length).toBeGreaterThan(0)
    })
  })

  it('variantlar takrorlanmaydi', () => {
    const quiz = buildPlacementQuiz(DECKS.ar, seededRandom(4))

    quiz.forEach((question) => {
      expect(new Set(question.options).size).toBe(4)
    })
  })

  it('so‘zlar takrorlanmaydi', () => {
    const quiz = buildPlacementQuiz(DECKS.en, seededRandom(5))
    const words = quiz.map((q) => q.word)

    expect(new Set(words).size).toBe(words.length)
  })

  it('bir xil urug‘ — bir xil natija', () => {
    const first = buildPlacementQuiz(DECKS.en, seededRandom(7))
    const second = buildPlacementQuiz(DECKS.en, seededRandom(7))

    expect(first).toEqual(second)
  })
})
