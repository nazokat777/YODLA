import type { CardRecord } from '@/core/db'
import { unitIdOf } from '@/core/path'
import { wordStrength, type WordStrength } from '@/core/srs'

/** Lug'at filtri */
export type VocabularyFilter = 'all' | 'hard' | 'strong'

/** Ro'yxatdagi bitta so'z */
export interface VocabularyEntry {
  card: CardRecord
  /** 0 — yangi … 3 — uzoq muddatli xotirada */
  strength: WordStrength
  /** Hozir ham qiyin (ko'p unutilgan va hali mustahkam emas) */
  hard: boolean
}

/** Bitta dars guruhi */
export interface VocabularyGroup {
  unitId: string
  title: string
  entries: VocabularyEntry[]
}

/** Qiyin hisoblanish uchun eng kam unutishlar (profil bilan bir xil) */
const HARD_MIN_LAPSES = 2

/** Qidiruv uchun normallashtirish: kichik harf, tutuq belgilari bir xil */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[‘’ʻʼ`´]/g, "'").trim()
}

/**
 * "LUG'ATIM" — o'rganilgan so'zlar darslar bo'yicha.
 *
 * Faqat KO'RILGAN so'zlar (hali o'rganilmagan so'z lug'atda bo'lishi
 * ma'nosiz — u "men bilaman" ro'yxati). Tartib — o'quv yo'li tartibi
 * (`unitOrder`), guruh ichida — eng zaifi birinchi: qayta ko'rib
 * chiqayotgan bola avval qiyinlariga ko'z tashlasin.
 *
 * Qidiruv so'zda, tarjimada va o'qilishda (`readingOf`) ishlaydi —
 * arab yozuvini terolmaydigan bola "kitab" deb topa oladi.
 */
export function vocabularyGroups(
  cards: readonly CardRecord[],
  options: {
    unitOrder: ReadonlyArray<{ id: string; title: string }>
    filter?: VocabularyFilter
    query?: string
    readingOf?: (card: CardRecord) => string | null
  },
): VocabularyGroup[] {
  const { unitOrder, filter = 'all', query = '', readingOf } = options
  const needle = normalize(query)

  const byUnit = new Map<string, VocabularyEntry[]>()
  for (const card of cards) {
    if (card.totalReviews === 0) continue

    const strength = wordStrength(card)
    const hard = card.lapses >= HARD_MIN_LAPSES && strength < 3
    if (filter === 'hard' && !hard) continue
    if (filter === 'strong' && strength < 3) continue

    if (needle) {
      const haystack = [card.word, card.translation, readingOf?.(card) ?? '']
        .map(normalize)
        .join(' ')
      if (!haystack.includes(needle)) continue
    }

    const unitId = card.level && card.topic ? unitIdOf(card.level, card.topic) : 'boshqa'
    const list = byUnit.get(unitId) ?? []
    list.push({ card, strength, hard })
    byUnit.set(unitId, list)
  }

  const order = new Map(unitOrder.map((unit, index) => [unit.id, index]))
  const titles = new Map(unitOrder.map((unit) => [unit.id, unit.title]))

  return [...byUnit.entries()]
    .sort(
      ([a], [b]) =>
        (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER),
    )
    .map(([unitId, entries]) => ({
      unitId,
      title: titles.get(unitId) ?? 'Boshqa so‘zlar',
      entries: entries.sort(
        (a, b) => a.strength - b.strength || b.card.lapses - a.card.lapses,
      ),
    }))
}

/** Jami: guruhlardagi so'zlar soni */
export function countEntries(groups: readonly VocabularyGroup[]): number {
  return groups.reduce((sum, group) => sum + group.entries.length, 0)
}
