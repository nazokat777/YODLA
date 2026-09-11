import type { NewCardRecordInput } from '@/core/db'

/**
 * Bitta o'quv bo'limidagi so'zlarning eng ko'p soni.
 *
 * NEGA KERAK: darslikdan import qilingan mavzular kitobning BOB hajmida
 * — eng kattasi 269 so'z. O'quv yo'lida esa bir vaqtda faqat BITTA bo'lim
 * ochiq bo'ladi, qolganlari qulfli. Ya'ni keyingi bobga o'tish uchun 269
 * so'zni to'liq ko'rish kerak edi: hisoblagich "0/269" da turib qolardi
 * va yo'l qimirlamaydigan bo'lib ko'rinardi.
 *
 * 20 — qo'lda yozilgan bo'limlar (5-8 so'z) va kunlik maqsad (10/20/30)
 * bilan bir ritmda: bo'lim bir-ikki seansda yopiladi.
 */
export const MAX_UNIT_WORDS = 20

/**
 * Bitta o'quv bo'limidagi so'zlarning eng kam soni.
 *
 * Qo'lda yozilgan A1 to'plamlarida 1–2 so'zli mavzular bor edi
 * ("Maktab": faqat "kitob"). Bir so'zli dars — o'quv yo'lida alohida
 * doira, ichida esa bitta savol: bola "dars"ga kirib, o'n soniyada
 * chiqadi. Bunday mavzu qo'shnisiga qo'shiladi.
 */
export const MIN_UNIT_WORDS = 3

/**
 * Kichik mavzularni QO'SHNISIGA qo'shadi.
 *
 * Mavzu kontentdagi KEYINGI mavzuga qo'shiladi (oxirgisi — oldingisiga)
 * va uning nomini oladi. Zanjir bo'lishi mumkin: 1 so'zli mavzu 1 so'zli
 * qo'shnisiga qo'shilib 2 bo'ladi va u ham keyingisiga qo'shiladi —
 * shuning uchun tartib bilan, o'sha zahoti yangilangan hisob bilan
 * yuriladi.
 *
 * KONTENT O'ZGARMAYDI — faqat `topic` nomi (`chunkLargeTopics` kabi).
 */
export function mergeTinyTopics(cards: NewCardRecordInput[]): NewCardRecordInput[] {
  const order: string[] = []
  const totals = new Map<string, number>()
  for (const card of cards) {
    if (!card.topic) continue
    if (!totals.has(card.topic)) order.push(card.topic)
    totals.set(card.topic, (totals.get(card.topic) ?? 0) + 1)
  }

  if (order.length < 2) return cards

  /** Har mavzu qaysi nomga ko'chadi (ko'chmasa — o'zi) */
  const target = new Map<string, string>(order.map((topic) => [topic, topic]))

  for (let i = 0; i < order.length; i += 1) {
    const topic = order[i]!
    const count = totals.get(topic) ?? 0
    if (count >= MIN_UNIT_WORDS) continue

    const neighbour = i + 1 < order.length ? order[i + 1]! : order[i - 1]!
    // Oldingisi allaqachon ko'chgan bo'lishi mumkin — yakuniy nomga
    const finalName = target.get(neighbour) ?? neighbour

    for (const [from, to] of target) if (to === topic) target.set(from, finalName)
    target.set(topic, finalName)
    totals.set(finalName, (totals.get(finalName) ?? 0) + count)
    totals.set(topic, 0)
  }

  return cards.map((card) => {
    if (!card.topic) return card
    const to = target.get(card.topic) ?? card.topic
    return to === card.topic ? card : { ...card, topic: to }
  })
}

/**
 * Katta mavzularni "(1-qism)", "(2-qism)" ga bo'ladi.
 *
 * KONTENT O'ZGARMAYDI — faqat `topic` nomi. Kartalar tartibi ham
 * saqlanadi, ya'ni qismlar kitob ketma-ketligida chiqadi.
 *
 * Qismlar TENG bo'linadi: 269 so'z 14 ta 20 lik emas, 14 ta ~19 lik
 * bo'lakka bo'linadi — aks holda oxirida 9 so'zli g'alati dumcha qolardi.
 */
/**
 * `index`-karta nechanchi qismga tushadi (0 dan boshlab).
 *
 * `Math.ceil` bilan bo'lish teng taqsimlamaydi: 269 so'z 14 qismga
 * bo'linganda 13 ta 20 lik va oxirida 9 lik dumcha qolardi. Shuning
 * uchun qoldiq BIRINCHI qismlarga bittadan tarqatiladi: 3 ta 20 lik,
 * 11 ta 19 lik.
 */
function partOf(index: number, total: number, parts: number): number {
  const base = Math.floor(total / parts)
  const remainder = total % parts
  const bigZone = remainder * (base + 1)

  if (index < bigZone) return Math.floor(index / (base + 1))
  return remainder + Math.floor((index - bigZone) / base)
}

export function chunkLargeTopics(cards: NewCardRecordInput[]): NewCardRecordInput[] {
  const totals = new Map<string, number>()
  for (const card of cards) {
    if (card.topic) totals.set(card.topic, (totals.get(card.topic) ?? 0) + 1)
  }

  const seen = new Map<string, number>()

  return cards.map((card) => {
    const topic = card.topic
    if (!topic) return card

    const total = totals.get(topic) ?? 0
    if (total <= MAX_UNIT_WORDS) return card

    const index = seen.get(topic) ?? 0
    seen.set(topic, index + 1)

    const parts = Math.ceil(total / MAX_UNIT_WORDS)

    return { ...card, topic: `${topic} (${partOf(index, total, parts) + 1}-qism)` }
  })
}
