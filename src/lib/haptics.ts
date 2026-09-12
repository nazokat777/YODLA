/**
 * Tebranish — mukofotning UCHINCHI kanali (ko'z, quloq, qo'l).
 *
 * NEYROBIOLOGIYA: bir vaqtda kelgan ko'p kanalli signal miyada
 * kuchliroq iz qoldiradi (multisensory integration). Telefon qo'lda —
 * qisqa tebranish to'g'ri javobni "his qildiradi". Naqshlar farqli:
 * oddiy to'g'ri — bitta qisqa; pog'ona — ikki; katta bayram — uch.
 *
 * Xato javobda tebranish YO'Q: bu jazo kanaliga aylanardi.
 *
 * `navigator.vibrate` iOS Safari'da yo'q — u yerda jimgina o'tadi.
 */
import { useSettingsStore } from '@/stores/useSettingsStore'

export type HapticKind = 'tap' | 'success' | 'milestone' | 'celebrate'

const PATTERNS: Record<HapticKind, number[]> = {
  tap: [8],
  success: [18],
  milestone: [18, 60, 28],
  celebrate: [24, 60, 24, 60, 48],
}

/**
 * Brauzer foydalanuvchi hali bosmagan sahifada `vibrate` ni bloklaydi va
 * konsolga xato yozadi (bosh ekran ochilishidagi bayramlar). Birinchi
 * teginishgacha jim turamiz.
 */
let interacted = false
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => (interacted = true), { once: true, passive: true })
}

export function haptic(kind: HapticKind): void {
  if (!interacted) return
  // Sozlamada o'chirilgan bo'lsa — jim (ota-ona xohlashi mumkin)
  if (!useSettingsStore.getState().hapticsEnabled) return
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return

  try {
    navigator.vibrate(PATTERNS[kind])
  } catch {
    // Ba'zi brauzerlar foydalanuvchi harakatisiz rad etadi — muhim emas
  }
}
