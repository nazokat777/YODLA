import { LEVEL_ORDER } from '@/core/config/levels'
import type { NewCardRecordInput } from '@/core/db'
import type { LevelCode } from '@/core/types'
import { shuffle, type RandomSource } from '@/lib/random'
import { QUESTIONS_PER_LEVEL } from './score'

/** Bitta test savoli — tanib olish ko'rinishida */
export interface PlacementQuestion {
  level: LevelCode
  /** O'rganilayotgan tildagi so'z */
  word: string
  /** O'zbekcha variantlar */
  options: string[]
  correctIndex: number
}

/** Savoldagi variantlar soni */
const CHOICES = 4

/**
 * Daraja testi savollarini KONTENTDAN yasaydi.
 *
 * Nega bazadan emas: onboarding paytida foydalanuvchining bazasi hali
 * bo'sh bo'lishi mumkin. Bundan tashqari test SRS holatiga umuman
 * tegmasligi kerak — u faqat o'qiydi va hech narsa yozmaydi.
 *
 * Savollar oson darajadan boshlanadi: qiyin savol birinchi bo'lib chiqsa,
 * boshlovchi o'zini bilimsiz his qilib testni tashlab ketishi mumkin.
 */
/** Variant sifatida yaroqli tarjima: to'liq, qisqa, "…" va qavssiz */
export function isCleanDistractor(translation: string): boolean {
  const text = translation.trim()
  return text.length > 0 && text.length <= 24 && !/[…()[\]/]|^\.{2,}/.test(text)
}

export function buildPlacementQuiz(
  deck: Record<LevelCode, NewCardRecordInput[]>,
  random: RandomSource = Math.random,
): PlacementQuestion[] {
  /*
   * Chalg'ituvchi manbai — faqat TOZA tarjimalar. Import qilingan
   * lug'atda "… qilishingiz kerak" kabi bo'lak-tarjimalar bor; ular
   * variant sifatida g'alati ko'rinadi va bolani chalg'itadi
   * (audit #2, №4).
   */
  const everyTranslation = LEVEL_ORDER.flatMap((level) =>
    deck[level].map((card) => card.translation).filter(isCleanDistractor),
  )

  return LEVEL_ORDER.flatMap((level) => {
    const chosen = shuffle(deck[level], random).slice(0, QUESTIONS_PER_LEVEL)

    return chosen.map((card) => {
      // Chalg'ituvchilar butun to'plamdan olinadi: shu tildagi boshqa
      // so'zlar eng ishonchli chalg'ituvchi bo'ladi.
      //
      // To'g'ri javob AYNAN TENGLIK bilan chiqarib tashlanadi, ya'ni bu
      // tarjimalar noyobligiga tayanadi. Shu shartni
      // `deckIntegrity.test.ts` dagi "tarjimalar NOYOB" testi uchala til
      // uchun tekshiradi — usiz savolda ikki bir xil variant chiqishi
      // mumkin edi.
      const distractors = shuffle(
        everyTranslation.filter((translation) => translation !== card.translation),
        random,
      ).slice(0, CHOICES - 1)

      const options = shuffle([card.translation, ...distractors], random)

      return {
        level,
        word: card.word,
        options,
        correctIndex: options.indexOf(card.translation),
      }
    })
  })
}
