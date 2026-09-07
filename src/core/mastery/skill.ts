import type { CardRecord, TypeStat } from '@/core/db'
import type { ExerciseType } from '@/core/types'

/**
 * Turni baholash uchun kerakli eng kam namuna.
 *
 * Bitta xato javobdan "bu ko'nikma zaif" degan xulosa chiqarish
 * statistik shovqin: bola chalg'igan, tugmani noto'g'ri bosgan yoki
 * shunchaki omadsiz bo'lgan bo'lishi mumkin.
 */
export const MIN_SAMPLES = 3

/** Mashq turlarining o'zbekcha nomlari — foydalanuvchiga ko'rsatish uchun */
export const EXERCISE_TYPE_NAMES: Record<ExerciseType, string> = {
  recognition: 'Ma’noni tanish',
  recall: 'Tarjimani yozish',
  listening: 'Eshitib tushunish',
  construction: 'Jumla tuzish',
  cloze: 'Tushib qolgan so‘z',
  spelling: 'Harflardan yig‘ish',
  matching: 'Juftlarni topish',
}

/** Xato ulushi (0..1). Namuna yo'q bo'lsa 0 */
export function errorRate(stat: TypeStat | undefined): number {
  if (!stat || stat.seen === 0) return 0

  return stat.wrong / stat.seen
}

/**
 * Shu kartada foydalanuvchi eng ko'p qiynalayotgan mashq turi.
 *
 * NEGA KERAK: so'zning qiyinligi (`lapses`) QAYSI ko'nikma
 * oqsayotganini aytmaydi. Bola `apple → olma` ni variantlardan bexato
 * tanishi, lekin uni YOZOLMASLIGI mumkin — bular ikki xil xotira
 * (tanish va eslab chaqirish). Mashqni aynan zaif tomonga
 * yo'naltirish uchun shu farqni bilish kerak.
 *
 * `null` qaytadi, agar: yetarli namuna yo'q, yoki hech bir turda xato
 * yo'q. Ikkala holatda ham "zaif ko'nikma" degan xulosa asossiz
 * bo'lardi.
 *
 * @param available faqat shu turlar orasidan tanlanadi (mashq
 *   yaratilishi mumkin bo'lganlari)
 */
export function weakestType(
  card: CardRecord,
  available: readonly ExerciseType[],
): ExerciseType | null {
  const stats = card.typeStats
  if (!stats) return null

  let worst: ExerciseType | null = null
  let worstRate = 0

  for (const type of available) {
    const stat = stats[type]
    if (!stat || stat.seen < MIN_SAMPLES) continue

    const rate = errorRate(stat)
    if (rate > worstRate) {
      worst = type
      worstRate = rate
    }
  }

  return worst
}

/** Bitta turning umumiy hisobi — profil ekranida ko'rsatish uchun */
export interface SkillSummary {
  type: ExerciseType
  seen: number
  wrong: number
}

/**
 * Barcha kartalar bo'ylab tur kesimidagi yig'indi.
 *
 * Eng ko'p xato ULUSHIGA ega tur birinchi bo'ladi; namunasi kam
 * turlar umuman kirmaydi.
 */
export function skillSummary(cards: readonly CardRecord[]): SkillSummary[] {
  const totals = new Map<ExerciseType, SkillSummary>()

  for (const card of cards) {
    for (const [type, stat] of Object.entries(card.typeStats ?? {})) {
      const key = type as ExerciseType
      const current = totals.get(key) ?? { type: key, seen: 0, wrong: 0 }

      totals.set(key, {
        type: key,
        seen: current.seen + stat.seen,
        wrong: current.wrong + stat.wrong,
      })
    }
  }

  return [...totals.values()]
    .filter((item) => item.seen >= MIN_SAMPLES)
    .sort((a, b) => b.wrong / b.seen - a.wrong / a.seen)
}
