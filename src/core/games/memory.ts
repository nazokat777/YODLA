import type { CardRecord } from '@/core/db'
import { shuffle, type RandomSource } from '@/lib/random'

/** Taxtada nechta juft bo'ladi */
export const MEMORY_PAIRS = 6

/** Taxtadagi bitta katak */
export interface MemoryTile {
  /** Katak identifikatori — bir kartaning ikki katagi har xil */
  id: string
  /** Qaysi kartaga tegishli — juftlik shu bo'yicha aniqlanadi */
  cardId: string
  /** Katakda ko'rinadigan matn */
  text: string
  /** Chet tilidagi so'zmi yoki tarjimami */
  side: 'word' | 'translation'
}

export interface MemoryState {
  tiles: MemoryTile[]
  /** Hozir ochilgan kataklar (eng ko'pi ikkita) */
  opened: string[]
  /** Juftlangan kataklar — ochiq qoladi */
  matched: string[]
  /** Nechta urinish bo'ldi — natija shundan hisoblanadi */
  attempts: number
}

/**
 * Taxtani quradi: har karta ikki katak beradi (so'z va tarjimasi),
 * hammasi aralashtiriladi.
 */
export function startMemory(
  cards: readonly CardRecord[],
  pairs: number = MEMORY_PAIRS,
  random?: RandomSource,
): MemoryState {
  const chosen = cards.slice(0, pairs)

  const tiles = chosen.flatMap<MemoryTile>((card) => [
    { id: `${card.id}:w`, cardId: card.id, text: card.word, side: 'word' },
    { id: `${card.id}:t`, cardId: card.id, text: card.translation, side: 'translation' },
  ])

  return { tiles: shuffle(tiles, random), opened: [], matched: [], attempts: 0 }
}

/** Katak hozir ochiqmi (juftlangan yoki tanlangan) */
export function isRevealed(state: MemoryState, tileId: string): boolean {
  return state.matched.includes(tileId) || state.opened.includes(tileId)
}

/**
 * Katakni ochadi.
 *
 * Ikkita ochiq bo'lsa, uchinchisi OCHILMAYDI: avval juftlik
 * tekshirilishi kerak (`resolveMemory`). Aks holda bola tez-tez
 * bosib, taxtani ko'rib chiqib olardi va o'yin xotirani talab
 * qilmasdi.
 */
export function openTile(state: MemoryState, tileId: string): MemoryState {
  if (state.opened.length >= 2) return state
  if (isRevealed(state, tileId)) return state

  return { ...state, opened: [...state.opened, tileId] }
}

/**
 * Ikki ochiq katakni tekshiradi.
 *
 * Juft bo'lsa ular ochiq qoladi; bo'lmasa ikkalasi yopiladi.
 * Ikkala holatda ham urinish sanaladi.
 */
export function resolveMemory(state: MemoryState): MemoryState {
  if (state.opened.length < 2) return state

  const [first, second] = state.opened
  const firstTile = state.tiles.find((tile) => tile.id === first)
  const secondTile = state.tiles.find((tile) => tile.id === second)

  const isPair =
    firstTile !== undefined &&
    secondTile !== undefined &&
    firstTile.cardId === secondTile.cardId

  return {
    ...state,
    opened: [],
    matched: isPair ? [...state.matched, first!, second!] : state.matched,
    attempts: state.attempts + 1,
  }
}

/** Hamma juft topildimi */
export function isMemoryComplete(state: MemoryState): boolean {
  return state.tiles.length > 0 && state.matched.length === state.tiles.length
}
