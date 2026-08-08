import type { LevelCode } from '@/core/types'

/** Darajalar o'sish tartibida — dars va kontent shu ketma-ketlikda beriladi */
export const LEVEL_ORDER: readonly LevelCode[] = ['A1', 'A2', 'B1']

/**
 * Daraja tartib raqami (kichigi oldin).
 *
 * Darajasi belgilanmagan karta ENG OXIRIDA turadi: qo'lda qo'shilgan yoki
 * eski kartalar A1 darsini egallab olmasligi kerak.
 */
export function levelRank(level: LevelCode | undefined): number {
  if (level === undefined) return Number.MAX_SAFE_INTEGER

  const index = LEVEL_ORDER.indexOf(level)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}
