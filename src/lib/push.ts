import { removePushSubscription, savePushSubscription } from './supabase'

/**
 * Push eslatmalar (Web Push API).
 *
 * Bu qatlam FAQAT brauzer bilan gaplashadi va natijani ochiq holat
 * sifatida qaytaradi — chunki foydalanuvchiga "ruxsat berilmadi" va
 * "server javob bermadi" butunlay boshqa xabarlar bo'lishi kerak.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

/** Brauzerda push uchun kerakli hamma narsa bormi */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'PushManager' in window &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  )
}

/**
 * base64url → Uint8Array.
 *
 * `applicationServerKey` aynan bayt massivini talab qiladi; satr berilsa
 * brauzer jimgina rad etadi.
 */
function decodeKey(base64url: string): Uint8Array {
  const padded = base64url.padEnd(
    base64url.length + ((4 - (base64url.length % 4)) % 4),
    '=',
  )
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))

  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

export type PushResult =
  | { status: 'enabled'; endpoint: string }
  | { status: 'denied' }
  | { status: 'unsupported' }
  | { status: 'failed' }

/**
 * Eslatmalarni yoqish.
 *
 * DIQQAT: bu funksiya foydalanuvchi BOSGANDA chaqirilishi shart — brauzer
 * ruxsat oynasini faqat foydalanuvchi harakatidan keyin ochadi.
 */
export async function enablePush(hour: number): Promise<PushResult> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return { status: 'unsupported' }

  try {
    const permission =
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()

    if (permission !== 'granted') return { status: 'denied' }

    const registration = await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      // Brauzer talabi: har push KO'RINADIGAN bildirishnoma chiqarishi shart.
      // Shu sababli "bugun mashq qilganlarni o'tkazib yuborish" mijozda
      // emas, SERVERDA hal qilinadi.
      userVisibleOnly: true,
      applicationServerKey: decodeKey(VAPID_PUBLIC_KEY),
    })

    const json = subscription.toJSON() as {
      endpoint?: string
      keys?: { p256dh?: string; auth?: string }
    }

    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
      return { status: 'failed' }
    }

    const saved = await savePushSubscription({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      hour,
      // `getTimezoneOffset` UTC'gacha bo'lgan farqni TESKARI ishorada
      // beradi: Toshkent uchun -300. Bazada sharq musbat bo'lgani qulay.
      offsetMinutes: -new Date().getTimezoneOffset(),
    })

    return saved ? { status: 'enabled', endpoint: json.endpoint } : { status: 'failed' }
  } catch (error) {
    console.error('Eslatmalarni yoqib bo‘lmadi:', error)
    return { status: 'failed' }
  }
}

/**
 * Eslatmalarni o'chirish.
 *
 * Avval SERVERDAN o'chiriladi: brauzer obunasi yo'qolib, server yozuvi
 * qolib ketsa, foydalanuvchi o'chirgan eslatma yuborilishda davom etardi.
 */
export async function disablePush(): Promise<boolean> {
  if (!isPushSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) return true

    await removePushSubscription(subscription.endpoint)
    await subscription.unsubscribe()

    return true
  } catch (error) {
    console.error('Eslatmalarni o‘chirib bo‘lmadi:', error)
    return false
  }
}
