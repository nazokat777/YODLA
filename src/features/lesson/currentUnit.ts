import type { CardRecord } from '@/core/db'
import type { LanguageCode, LevelCode } from '@/core/types'
import { buildUnits } from '@/core/path'
import { readTopicOrder } from '@/content/topicOrderCache'

/**
 * O'quv yo'lidagi JORIY bo'lim identifikatori (topilmasa `null`).
 *
 * Mavzular tartibi keshdan o'qiladi — u bosh ekran tomonidan yoziladi.
 * Kesh bo'sh bo'lsa (foydalanuvchi to'g'ridan-to'g'ri darsga kirgan)
 * `null` qaytadi va dars eski yo'l bilan, butun lug'atdan tuziladi:
 * lug'atni shu yerda yuklash darsning boshlanishini kechiktirardi.
 */
export function currentUnitId(
  cards: CardRecord[],
  language: LanguageCode,
  minLevel: LevelCode,
): string | null {
  const topicOrder = readTopicOrder(language)
  if (!topicOrder) return null

  const units = buildUnits(cards, { minLevel, topicOrder })

  return units.find((unit) => unit.state === 'current')?.id ?? null
}
