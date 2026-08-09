import { levelRank } from '@/core/config/levels'
import type { CardRecord, NewCardRecordInput } from '@/core/db'
import type { LevelCode } from '@/core/types'

export type UnitState = 'completed' | 'current' | 'locked' | 'skipped'

export interface PathUnit {
  id: string
  level: LevelCode
  topic: string
  /** Bo'limdagi so'zlar soni */
  total: number
  /** Kamida bir marta ko'rilganlari */
  learned: number
  state: UnitState
}

/** Tutuq belgisining barcha ko'rinishlari */
const APOSTROPHES = /['’‘ʻʼ`´]/g

/**
 * Mavzu nomidan URL uchun barqaror slug.
 *
 * Tutuq TUSHIRILADI, chiziqchaga aylantirilmaydi: `fe'llar` → `fellar`.
 * Aks holda `fe-llar` chiqib, havola o'qib bo'lmas holga kelardi.
 */
export function slugifyTopic(topic: string): string {
  return topic
    .toLowerCase()
    .replace(APOSTROPHES, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Bo'lim identifikatori: `a1-oila` */
export function unitIdOf(level: LevelCode, topic: string): string {
  return `${level.toLowerCase()}-${slugifyTopic(topic)}`
}

/**
 * Kontentdagi mavzular tartibi.
 *
 * Bazadagi kartalar birlamchi kalit (id) bo'yicha keladi — ya'ni alifbo
 * tartibida. Mavzular ketma-ketligini o'shandan olsak, o'quv yo'li
 * tasodifiy tartibda chiqardi. Shuning uchun tartib KONTENTDAN olinadi.
 */
export function topicOrderFromDeck(deck: Record<LevelCode, NewCardRecordInput[]>): string[] {
  const seen: string[] = []

  for (const cards of Object.values(deck)) {
    for (const card of cards) {
      if (card.topic && !seen.includes(card.topic)) seen.push(card.topic)
    }
  }

  return seen
}

interface BuildOptions {
  /** Daraja testi natijasi — undan pastdagi bo'limlar "skipped" bo'ladi */
  minLevel?: LevelCode
  /** Mavzular ketma-ketligi (`topicOrderFromDeck`) */
  topicOrder?: string[]
}

/**
 * Kartalardan o'quv yo'lini quradi.
 *
 * Bo'lim holati SAQLANMAYDI — har safar progressdan hisoblanadi. Shuning
 * uchun kontent kengaysa yoki foydalanuvchi so'z o'rgansa, yo'l o'zi
 * yangilanadi va migratsiya kerak bo'lmaydi.
 */
export function buildUnits(cards: CardRecord[], options: BuildOptions = {}): PathUnit[] {
  const { minLevel, topicOrder = [] } = options

  // Daraja va mavzusi belgilanmagan kartalar yo'lda ko'rsatilmaydi:
  // ular qo'lda qo'shilgan yoki eski yozuvlar bo'lishi mumkin
  const grouped = new Map<string, PathUnit>()

  for (const card of cards) {
    if (!card.level || !card.topic) continue

    const id = unitIdOf(card.level, card.topic)
    const unit = grouped.get(id) ?? {
      id,
      level: card.level,
      topic: card.topic,
      total: 0,
      learned: 0,
      state: 'locked' as UnitState,
    }

    unit.total += 1
    if (card.totalReviews > 0) unit.learned += 1

    grouped.set(id, unit)
  }

  const topicIndex = (topic: string) => {
    const index = topicOrder.indexOf(topic)
    // Ro'yxatda yo'q mavzu oxiriga tushadi
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
  }

  const units = [...grouped.values()].sort((a, b) => {
    const byLevel = levelRank(a.level) - levelRank(b.level)
    if (byLevel !== 0) return byLevel

    const byTopic = topicIndex(a.topic) - topicIndex(b.topic)
    if (byTopic !== 0) return byTopic

    return a.topic.localeCompare(b.topic)
  })

  const minRank = minLevel === undefined ? 0 : levelRank(minLevel)
  let currentAssigned = false

  for (const unit of units) {
    if (unit.learned === unit.total) {
      unit.state = 'completed'
      continue
    }

    // Daraja testida "bilaman" deb belgilangan darajalar: qulflanmaydi,
    // lekin "tugallangan" ham emas — foydalanuvchi ularni ko'rmagan
    if (levelRank(unit.level) < minRank) {
      unit.state = 'skipped'
      continue
    }

    if (!currentAssigned) {
      unit.state = 'current'
      currentAssigned = true
      continue
    }

    unit.state = 'locked'
  }

  return units
}
