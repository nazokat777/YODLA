import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { checkExercise, checkTextAnswer, deriveGrade } from './check'
import type { Exercise } from './types'

/** Test uchun minimal karta */
function makeCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    id: 'en:hello',
    word: 'hello',
    translation: 'salom',
    language: 'en',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    ...overrides,
  }
}

describe('checkTextAnswer', () => {
  it('to‘liq mos javob — correct', () => {
    expect(checkTextAnswer('hello', 'hello', 'en')).toBe('correct')
  })

  it('katta harf va bo‘shliqlar ahamiyatsiz', () => {
    expect(checkTextAnswer('  HeLLo  ', 'hello', 'en')).toBe('correct')
  })

  it('bitta harf xatosi — almost (jazolanmaydi)', () => {
    expect(checkTextAnswer('helo', 'hello', 'en')).toBe('almost')
  })

  it('ikki harf xatosi uzun so‘zda hali ham almost', () => {
    expect(checkTextAnswer('sayohta', 'sayohat', 'en')).toBe('almost')
  })

  it('qisqa so‘zda bitta harf xatosi ham wrong', () => {
    // "uy" (3 harfdan qisqa) — bag'rikenglik yo'q
    expect(checkTextAnswer('ug', 'uy', 'en')).toBe('wrong')
  })

  it('butunlay boshqa so‘z — wrong', () => {
    expect(checkTextAnswer('water', 'hello', 'en')).toBe('wrong')
  })

  it('bo‘sh javob — wrong', () => {
    expect(checkTextAnswer('', 'hello', 'en')).toBe('wrong')
    expect(checkTextAnswer('   ', 'hello', 'en')).toBe('wrong')
  })

  it('arab harakalari yozilmasa ham correct', () => {
    expect(checkTextAnswer('مرحبا', 'مَرْحَبًا', 'ar')).toBe('correct')
  })

  it('rus tilida ё o‘rniga е yozilsa correct', () => {
    expect(checkTextAnswer('еще', 'ещё', 'ru')).toBe('correct')
  })
})

describe('checkExercise', () => {
  const card = makeCard()

  it('tanib olish: to‘g‘ri variant', () => {
    const exercise: Exercise = {
      id: 'x',
      type: 'recognition',
      card,
      prompt: 'hello',
      options: ['suv', 'salom', 'non'],
      correctIndex: 1,
    }

    expect(checkExercise(exercise, 1)).toBe('correct')
    expect(checkExercise(exercise, 0)).toBe('wrong')
  })

  it('tanib olishda matn kelsa — wrong (noto‘g‘ri javob turi)', () => {
    const exercise: Exercise = {
      id: 'x',
      type: 'recognition',
      card,
      prompt: 'hello',
      options: ['suv', 'salom'],
      correctIndex: 1,
    }

    expect(checkExercise(exercise, 'salom')).toBe('wrong')
  })

  it('eslab yozish: imlo xatosiga bag‘rikeng', () => {
    const exercise: Exercise = {
      id: 'x',
      type: 'recall',
      card,
      prompt: 'salom',
      answer: 'hello',
    }

    expect(checkExercise(exercise, 'hello')).toBe('correct')
    expect(checkExercise(exercise, 'helo')).toBe('almost')
    expect(checkExercise(exercise, 'water')).toBe('wrong')
  })

  it('jumla qurish: so‘zlar tartibi muhim', () => {
    const exercise: Exercise = {
      id: 'x',
      type: 'construction',
      card,
      prompt: 'Bu mening uyim',
      tokens: ['is', 'This', 'house', 'my'],
      answer: 'This is my house',
    }

    expect(checkExercise(exercise, 'This is my house')).toBe('correct')
    expect(checkExercise(exercise, 'This my house is')).toBe('wrong')
  })
})

describe('deriveGrade', () => {
  const card = makeCard()
  const recognition: Exercise = {
    id: 'x',
    type: 'recognition',
    card,
    prompt: 'hello',
    options: ['salom'],
    correctIndex: 0,
  }
  const recall: Exercise = { id: 'y', type: 'recall', card, prompt: 'salom', answer: 'hello' }

  it('xato javob → 0 (interval qaytadan boshlanadi)', () => {
    expect(deriveGrade(recognition, 'wrong')).toBe(0)
    expect(deriveGrade(recall, 'wrong')).toBe(0)
  })

  it('kichik imlo xatosi → 3 (o‘tdi, lekin qiyin bo‘ldi)', () => {
    expect(deriveGrade(recall, 'almost')).toBe(3)
  })

  it('oson turda to‘g‘ri → 4', () => {
    expect(deriveGrade(recognition, 'correct')).toBe(4)
  })

  it('qiyin turda to‘g‘ri → 5 (aktiv eslab chaqirish qimmatliroq)', () => {
    expect(deriveGrade(recall, 'correct')).toBe(5)
  })

  it('baho SM-2 ning o‘tish chegarasi bilan mos', () => {
    // almost (3) o'tgan hisoblanadi, wrong (0) — yo'q
    expect(deriveGrade(recall, 'almost')).toBeGreaterThanOrEqual(3)
    expect(deriveGrade(recall, 'wrong')).toBeLessThan(3)
  })
})

describe('checkExercise — cloze', () => {
  const cloze: Exercise = {
    id: 'en:water:cloze',
    type: 'cloze',
    card: makeCard({ id: 'en:water', word: 'water', translation: 'suv' }),
    prompt: 'I drink ___ every morning',
    options: ['water', 'bread', 'tea', 'salt'],
    correctIndex: 0,
  }

  it('to‘g‘ri indeks — correct', () => {
    expect(checkExercise(cloze, 0)).toBe('correct')
  })

  it('xato indeks — wrong', () => {
    expect(checkExercise(cloze, 2)).toBe('wrong')
  })
})

describe('checkExercise — spelling', () => {
  const spelling: Exercise = {
    id: 'en:water:spelling',
    type: 'spelling',
    card: makeCard({ id: 'en:water', word: 'water', translation: 'suv' }),
    prompt: 'suv',
    letters: ['w', 'a', 't', 'e', 'r'],
    answer: 'water',
  }

  it('to‘g‘ri harflar — correct', () => {
    expect(checkExercise(spelling, 'water')).toBe('correct')
  })

  it('bitta harf xato — almost (imlo bag‘rikengligi)', () => {
    expect(checkExercise(spelling, 'watar')).toBe('almost')
  })

  it('bo‘sh javob — wrong', () => {
    expect(checkExercise(spelling, '')).toBe('wrong')
  })

  it('harfma-harf aktiv tur — to‘g‘ri javobga baho 5', () => {
    expect(deriveGrade(spelling, 'correct')).toBe(5)
  })
})
