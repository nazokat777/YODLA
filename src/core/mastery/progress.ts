import type { AnswerVerdict } from '@/core/exercises'
import type { ExerciseType } from '@/core/types'

/**
 * Bitta so'zning SEANS ICHIDAGI holati.
 *
 * Bu SM-2 dan alohida narsa: SM-2 so'z KUNLAR bo'yicha qachon qaytishini
 * hisoblaydi, bu esa "shu seansda o'rgandimi?" degan savolga javob
 * beradi. Ikkalasi bir vaqtda ishlaydi va bir-biriga tegmaydi.
 */
export interface WordProgress {
  cardId: string
  /** Ketma-ket to'g'ri javoblar soni */
  streak: number
  /** Oxirgi TO'G'RI javob qaysi turdagi mashqda berilgan */
  lastCorrectType: ExerciseType | null
  /** Shu seansda o'zlashtirilgan — QAYTMAS holat */
  mastered: boolean
  /** Shu so'zga berilgan savollar soni */
  asked: number
}

/**
 * YANGI so'z uchun kerakli ketma-ket to'g'ri javoblar.
 *
 * Ikkitasi va ular TURLI mashqlarda — chunki bu so'z birinchi marta
 * o'rganilyapti va bitta to'g'ri javob taxmin bo'lishi mumkin.
 */
export const REQUIRED_STREAK = 2

/**
 * TAKROR uchun kerakli to'g'ri javoblar.
 *
 * Bittasi yetarli: aralash bosqichdagi so'zlar ALLAQACHON
 * o'rganilgan va bu yerda maqsad ularni yodga solish. Ikki xil
 * turni talab qilish 12 so'zni 24+ savolga aylantirardi va dars
 * "kuniga 5 daqiqa" va'dasidan chiqib ketardi (o'lchandi: 78 ta
 * savol). SM-2 ning o'zi ham bitta to'g'ri takrorni yetarli deb
 * hisoblaydi.
 */
export const REVIEW_STREAK = 1

export function emptyProgress(cardId: string): WordProgress {
  return { cardId, streak: 0, lastCorrectType: null, mastered: false, asked: 0 }
}

/**
 * Javobni qo'llab, YANGI holat qaytaradi.
 *
 * O'ZLASHTIRISH QOIDASI: ketma-ket ikki to'g'ri javob, va ikkinchisi
 * BOSHQA turdagi mashqda.
 *
 * Nega ikki xil tur shart: to'rt variantli mashqda ko'r-ko'rona bosish
 * 25% ehtimol bilan to'g'ri chiqadi, ikki marta ketma-ket esa 6%.
 * Turlar har xil bo'lganda ("tanidi", keyin "yozdi") tasodif deyarli
 * imkonsiz — ya'ni bu haqiqiy bilimning dalili. Bir xil turda ikki
 * marta javob berish esa ekrandagi naqshni eslab qolish bo'lishi
 * mumkin.
 *
 * `mastered` QAYTMAS: bir marta o'zlashtirilgan so'z keyingi xato
 * javobda ham o'zlashtirilgan qoladi. Ko'rsatkich orqaga ketsa, bola
 * qilgan ishi bekor bo'lganday his qiladi; xatoning o'zi esa SM-2
 * jadvaliga baribir ta'sir qiladi.
 */
export function applyAnswer(
  progress: WordProgress,
  verdict: AnswerVerdict,
  type: ExerciseType,
  requiredStreak: number = REQUIRED_STREAK,
): WordProgress {
  const asked = progress.asked + 1

  if (verdict === 'wrong') {
    return { ...progress, streak: 0, lastCorrectType: null, asked }
  }

  // `almost` — imlo xatosi: so'zni bilgan, faqat bir-ikki harf adashgan
  const streak = progress.streak + 1

  /*
   * Bitta javob talab qilinganda TUR SHARTI qo'llanmaydi: bitta
   * javobda ikki xil tur bo'lishi mumkin emas va shart hech qachon
   * bajarilmasdi.
   */
  const typeRuleMet =
    requiredStreak <= 1 ||
    (progress.lastCorrectType !== null && progress.lastCorrectType !== type)

  return {
    ...progress,
    streak,
    lastCorrectType: type,
    asked,
    mastered: progress.mastered || (streak >= requiredStreak && typeRuleMet),
  }
}
