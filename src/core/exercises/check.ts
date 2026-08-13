import type { Grade, LanguageCode } from '@/core/types'
import { editDistance, normalizeAnswer, typoTolerance } from './normalize'
import type { AnswerVerdict, Exercise } from './types'

/**
 * Yozma javobni tekshirish.
 *
 * Uch bosqichli: to'liq mos → kichik imlo xatosi → xato.
 * "almost" holati ataylab ajratilgan: foydalanuvchi so'zni ESLAGAN,
 * faqat yozishda adashgan — buni xato deb hisoblash motivatsiyani so'ndiradi
 * (TZ 4: "xatoda jazolamay to'g'ri javobni tushuntirish").
 */
export function checkTextAnswer(
  input: string,
  expected: string,
  language: LanguageCode,
): AnswerVerdict {
  const normalizedInput = normalizeAnswer(input, language)
  const normalizedExpected = normalizeAnswer(expected, language)

  if (normalizedInput.length === 0) return 'wrong'
  if (normalizedInput === normalizedExpected) return 'correct'

  const distance = editDistance(normalizedInput, normalizedExpected)

  return distance <= typoTolerance(normalizedExpected.length) ? 'almost' : 'wrong'
}

/** Variant tanlangan mashqni tekshirish */
export function checkChoiceAnswer(selectedIndex: number, correctIndex: number): AnswerVerdict {
  return selectedIndex === correctIndex ? 'correct' : 'wrong'
}

/**
 * Mashq turi bo'yicha javobni tekshirish.
 * `answer` — variantli mashqlarda tanlangan indeks, yozma mashqlarda matn.
 */
export function checkExercise(exercise: Exercise, answer: number | string): AnswerVerdict {
  switch (exercise.type) {
    case 'recognition':
    case 'listening':
      return typeof answer === 'number'
        ? checkChoiceAnswer(answer, exercise.correctIndex)
        : 'wrong'

    case 'recall':
      return typeof answer === 'string'
        ? checkTextAnswer(answer, exercise.answer, exercise.card.language)
        : 'wrong'

    case 'construction':
      return typeof answer === 'string'
        ? checkTextAnswer(answer, exercise.answer, exercise.card.language)
        : 'wrong'

    case 'cloze':
      return typeof answer === 'number'
        ? checkChoiceAnswer(answer, exercise.correctIndex)
        : 'wrong'

    case 'spelling':
      return typeof answer === 'string'
        ? checkTextAnswer(answer, exercise.answer, exercise.card.language)
        : 'wrong'

    // Juft topish natijasi MatchingView da hisoblanadi — bu shohobcha
    // faqat union to'liqligi uchun
    case 'matching':
      return 'wrong'
  }
}

/** Mashq turining "qiyin" (aktiv ishlab chiqarish talab qiladigan) ekani */
function isProductiveType(exercise: Exercise): boolean {
  return (
    exercise.type === 'recall' ||
    exercise.type === 'construction' ||
    exercise.type === 'spelling'
  )
}

/**
 * Mashq natijasidan SM-2 bahosini (0–5) chiqarish.
 *
 * Nega foydalanuvchi o'zini baholamaydi: o'z bilimini baholash ishonchsiz
 * (Dunning–Kruger). Mashqning O'ZI obyektiv o'lchov beradi.
 *
 *   xato              → 0  (interval 1 kunga qaytadi)
 *   kichik imlo xatosi → 3  (o'tdi, lekin easeFactor pasayadi)
 *   to'g'ri, oson tur  → 4  (tanib olish / eshitish — passivroq)
 *   to'g'ri, qiyin tur → 5  (yozish / jumla qurish — aktiv eslab chaqirish)
 */
export function deriveGrade(exercise: Exercise, verdict: AnswerVerdict): Grade {
  if (verdict === 'wrong') return 0
  if (verdict === 'almost') return 3

  return isProductiveType(exercise) ? 5 : 4
}
