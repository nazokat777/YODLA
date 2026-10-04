import { addDays, startOfDay } from '@/lib/date'

/** Zanjirdagi bitta kun */
export interface ChainDay {
  /** Kun boshi */
  day: number
  /** Shu kuni ko'rilgan noyob so'zlar */
  words: number
  /** Minimal planka bajarilganmi */
  met: boolean
  /** Bugungi kun (hali tugamagan) */
  today: boolean
}

export interface PlankChain {
  /** Oxirgi `days` kun — eskisidan yangisiga */
  days: ChainDay[]
  /** Hozirgi uzluksiz zanjir (kun) */
  current: number
  /** Ko'rsatilgan oraliqdagi eng uzun zanjir */
  best: number
}

/**
 * MINIMAL PLANKA ZANJIRI — "kalendarga plus qo'yish".
 *
 * Mnemonika darsidagi intizom qoidasi: bardavomlik intensivlikdan
 * ustun, va har bajarilgan kun KO'RINISHI kerak (treking). Uzilmagan
 * zanjirni ko'rgan bola uni uzgisi kelmaydi.
 *
 * Bugun hali bajarilmagan bo'lsa zanjir UZILGAN hisoblanmaydi — kun
 * tugamagan. Aks holda har ertalab "zanjir 0" ko'rinib, bola o'zini
 * yutqazgandek his qilardi.
 */
export function plankChain(
  stats: ReadonlyArray<{ day: number; cardIds: readonly string[] }>,
  minWords: number,
  now: number,
  days = 14,
): PlankChain {
  const todayStart = startOfDay(now)
  const byDay = new Map(stats.map((stat) => [startOfDay(stat.day), stat.cardIds.length]))

  const list: ChainDay[] = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = addDays(todayStart, -offset)
    const words = byDay.get(day) ?? 0
    list.push({ day, words, met: words >= minWords, today: offset === 0 })
  }

  // Hozirgi zanjir: bugundan orqaga. Bugun bajarilmagan bo'lsa — kechadan
  let current = 0
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const entry = list[i]!
    if (entry.met) current += 1
    else if (entry.today) continue
    else break
  }

  let best = 0
  let run = 0
  for (const entry of list) {
    run = entry.met ? run + 1 : 0
    best = Math.max(best, run)
  }

  return { days: list, current, best }
}
