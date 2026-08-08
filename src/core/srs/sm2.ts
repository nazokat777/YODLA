import type { Grade } from '@/core/types'
import { addDays, startOfDay } from '@/lib/date'
import {
  DEFAULT_EASE_FACTOR,
  FIRST_INTERVAL_DAYS,
  MAX_EASE_FACTOR,
  MIN_EASE_FACTOR,
  PASSING_GRADE,
  RELEARN_INTERVAL_DAYS,
  SECOND_INTERVAL_DAYS,
} from './constants'

/**
 * Kartaning takrorlash holati — SM-2 algoritmi shu to'rt maydon bilan ishlaydi.
 * `Card` modelining qolgan qismi (so'z, tarjima, rasm) algoritmga kerak emas,
 * shuning uchun ajratilgan: yadro logika sof va oson testlanadi.
 */
export interface SrsState {
  /** Keyingi takrorlashgacha kunlar (yangi kartada 0) */
  interval: number
  /** Ketma-ket muvaffaqiyatli takrorlashlar soni */
  repetitions: number
  /** Yengillik koeffitsienti (1.3 … 2.5) */
  easeFactor: number
  /** Takrorlash vaqti (timestamp, ms) */
  dueDate: number
}

/** Yangi (hali o'rganilmagan) karta holati — darhol takrorlashga tayyor */
export function initialSrsState(now: number): SrsState {
  return {
    interval: 0,
    repetitions: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    dueDate: now,
  }
}

/** Sonni [min, max] oralig'iga qisish */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Suzuvchi nuqta xatolarini yig'ilishidan saqlash uchun 2 xonagacha yaxlitlash */
function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Baho 0…5 oralig'idagi butun sonmi? */
function assertGrade(grade: Grade): void {
  if (!Number.isInteger(grade) || grade < 0 || grade > 5) {
    throw new RangeError(`Baho 0 va 5 orasidagi butun son bo'lishi kerak, kelgan qiymat: ${grade}`)
  }
}

/**
 * Yangi yengillik koeffitsienti.
 *
 * SuperMemo-2 formulasi:
 *   EF' = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
 *
 * Baho bo'yicha o'zgarish:
 *   q=5 → +0.10   q=4 →  0.00   q=3 → −0.14
 *   q=2 → −0.32   q=1 → −0.54   q=0 → −0.80
 *
 * TZ 3.1'dan kelib chiqib natija [1.3, 2.5] oralig'iga qisiladi.
 *
 * IZOH (asl SM-2'dan farq): 1987-yilgi asl tavsifda xato javobda (q < 3)
 * EF o'zgarmasdi. Biz uni har qanday bahoda yangilaymiz — chunki doimiy
 * xato qilinadigan so'z haqiqatan ham qiyin va uning intervallari
 * kelajakda ham qisqaroq bo'lishi kerak (TZ: "easeFactor javob sifatiga
 * qarab moslashadi").
 */
export function nextEaseFactor(easeFactor: number, grade: Grade): number {
  assertGrade(grade)
  const diff = 5 - grade
  const delta = 0.1 - diff * (0.08 + diff * 0.02)
  return clamp(round2(easeFactor + delta), MIN_EASE_FACTOR, MAX_EASE_FACTOR)
}

/**
 * Keyingi interval (kunlarda).
 *
 * @param repetitions  BU takrorlashgacha bo'lgan muvaffaqiyatlar soni
 * @param interval     joriy interval (kun)
 * @param easeFactor   YANGILANGAN yengillik koeffitsienti
 *
 * Qoida (TZ 3.1):
 *   xato          → 1 kun (qaytadan boshlanadi)
 *   1-muvaffaqiyat → 1 kun
 *   2-muvaffaqiyat → 6 kun
 *   keyingilari    → joriy interval × easeFactor (yaxlitlangan)
 */
export function nextInterval(
  repetitions: number,
  interval: number,
  easeFactor: number,
  grade: Grade,
): number {
  assertGrade(grade)

  if (grade < PASSING_GRADE) return RELEARN_INTERVAL_DAYS
  if (repetitions === 0) return FIRST_INTERVAL_DAYS
  if (repetitions === 1) return SECOND_INTERVAL_DAYS

  // Interval hech qachon 1 kundan kichik bo'lmaydi
  return Math.max(FIRST_INTERVAL_DAYS, Math.round(interval * easeFactor))
}

/**
 * SM-2 ning yadro qadami: joriy holat + baho → yangi holat.
 *
 * Sof funksiya: kiruvchi obyektni o'zgartirmaydi, `now` tashqaridan beriladi
 * (shu sabab testlarda vaqtni to'liq boshqarish mumkin).
 *
 * Hisoblash tartibi: avval easeFactor yangilanadi, keyin interval YANGI
 * easeFactor bilan hisoblanadi — shunda baho darhol keyingi intervalga
 * ta'sir qiladi.
 *
 * DIQQAT — `dueDate` kun chegarasiga tekislanadi:
 *   dueDate = shu kun boshi + interval kun
 * Ya'ni kechqurun 22:00 da o'rgangan so'z ertasi kuni ERTALAB ham
 * takrorlashga chiqadi. Aks holda foydalanuvchi "ertalab mashq qilaman"
 * odatini shakllantira olmasdi.
 */
export function reviewSrsState(state: SrsState, grade: Grade, now: number): SrsState {
  assertGrade(grade)

  const passed = grade >= PASSING_GRADE
  const easeFactor = nextEaseFactor(state.easeFactor, grade)
  const interval = nextInterval(state.repetitions, state.interval, easeFactor, grade)

  return {
    interval,
    repetitions: passed ? state.repetitions + 1 : 0,
    easeFactor,
    dueDate: addDays(startOfDay(now), interval),
  }
}

/** Karta hozir takrorlashga tayyormi? */
export function isDue(state: Pick<SrsState, 'dueDate'>, now: number): boolean {
  return state.dueDate <= now
}
