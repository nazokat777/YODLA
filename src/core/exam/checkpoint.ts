import type { PathUnit } from '@/core/path'

/**
 * Yig'ma imtihon nuqtasi.
 *
 * PEDAGOGIKA: har dars o'z so'zlarini o'rgatadi, lekin 2-darsdan keyin
 * 1-dars, 10-darsdan keyin 1–9-darslar sekin unutila boshlaydi.
 * Eslab chaqirishning eng kuchli usuli — TEKSHIRUV (testing effect,
 * Roediger & Karpicke 2006): eslab chaqirishga urinish qayta o'qishdan
 * ikki barobar mustahkamroq iz qoldiradi. Shuning uchun HAR bo'lim
 * tugagach, shu bo'limgacha bo'lgan BARCHA bo'limlardan yig'ma imtihon
 * beriladi: 2-darsdan keyin 1–2, 10-darsdan keyin 1–10.
 */
export interface ExamCheckpoint {
  /** Imtihon qaysi bo'limdan keyin — bo'lim id si imtihon kaliti */
  unitId: string
  /** Imtihon qamrab olgan bo'limlar (o'tkazib yuborilganlar kirmaydi) */
  covered: PathUnit[]
}

/** Nechta bo'limdan boshlab imtihon beriladi (birinchi dars — hali yo'q) */
export const EXAM_MIN_UNITS = 2

/**
 * Berilgan bo'limgacha (o'zi ham kiradi) bo'lgan bo'limlar.
 *
 * "Skipped" bo'limlar (daraja testida "bilaman" deyilganlar)
 * imtihonga kirmaydi: ular hech qachon o'qilmagan — ulardan so'rash
 * bolani bilmagan narsasida jazolash bo'lardi.
 */
export function examCoverage(units: readonly PathUnit[], unitId: string): PathUnit[] {
  const at = units.findIndex((unit) => unit.id === unitId)
  if (at === -1) return []
  return units.slice(0, at + 1).filter((unit) => unit.state !== 'skipped')
}

/**
 * HOZIR topshirilishi kerak bo'lgan imtihon (yo'q bo'lsa `null`).
 *
 * Eng OXIRGI tugallangan bo'lim olinadi: agar bola 1–5 ni imtihonsiz
 * o'tgan bo'lsa (eski versiya), beshta alohida imtihon emas, bitta
 * yig'ma "1–5" beriladi — u baribir hammasini qamraydi.
 */
export function pendingExam(
  units: readonly PathUnit[],
  passed: Readonly<Record<string, unknown>>,
): ExamCheckpoint | null {
  for (let i = units.length - 1; i >= 0; i -= 1) {
    const unit = units[i]!
    if (unit.state !== 'completed') continue

    const covered = examCoverage(units, unit.id)
    if (covered.length < EXAM_MIN_UNITS) return null
    if (unit.id in passed) return null

    return { unitId: unit.id, covered }
  }

  return null
}

/** Bo'lim uchun imtihon MAVJUDMI (yo'l ustidagi tugun uchun) */
export function hasExam(units: readonly PathUnit[], unit: PathUnit): boolean {
  return unit.state === 'completed' && examCoverage(units, unit.id).length >= EXAM_MIN_UNITS
}
