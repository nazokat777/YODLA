import type { ExerciseType } from '@/core/types'
import type { WordProgress } from './progress'

/**
 * Navbatdagi so'zni tanlaydi. Hammasi o'zlashtirilgan bo'lsa `null`.
 *
 * TARTIB: eng kam bilingan so'z birinchi. Bu ataylab — bola qiynalgan
 * so'zga ko'proq urinish tegishi kerak, oson so'z esa allaqachon
 * o'zlashtirilib, ro'yxatdan chiqib ketadi.
 *
 * OXIRGI SO'Z CHETLANADI: bir so'z ketma-ket ikki marta berilsa, javob
 * hali ekranda (yoki xotirada) turgan bo'ladi — bu nusxa ko'chirish,
 * eslab chaqirish emas. Lekin boshqa nomzod qolmasa chetlash BEKOR
 * qilinadi: aks holda seans o'sha so'z bilan tiqilib qolardi.
 */
export function pickNextCardId(
  entries: readonly WordProgress[],
  lastShownId: string | null,
): string | null {
  const pending = entries.filter((entry) => !entry.mastered)
  if (pending.length === 0) return null

  const candidates =
    pending.length > 1 ? pending.filter((entry) => entry.cardId !== lastShownId) : pending

  // `pending.length > 1` bo'lsa ham hammasi `lastShownId` bo'lishi
  // mumkin emas, lekin himoya arzon
  const pool = candidates.length > 0 ? candidates : pending

  return pool.reduce((best, entry) => {
    if (entry.streak !== best.streak) return entry.streak < best.streak ? entry : best

    return entry.asked < best.asked ? entry : best
  }).cardId
}

/**
 * Shu so'z uchun QAYSI mashq turlari berilmasligi kerak.
 *
 * O'zlashtirish ikki xil turda ketma-ket to'g'ri javobni talab qiladi
 * (`progress.ts` ga qarang). Ya'ni so'z hozir to'g'ri javob olgan
 * bo'lsa, keyingi mashq BOSHQA turda bo'lishi shart — aks holda hisob
 * o'sadi, lekin so'z hech qachon o'zlashtirilgan holatga chiqmaydi.
 */
export function excludedTypesFor(progress: WordProgress): ExerciseType[] {
  if (progress.streak === 0 || progress.lastCorrectType === null) return []

  return [progress.lastCorrectType]
}
