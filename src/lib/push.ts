import { removePushSubscription, savePushSubscription } from './supabase'

/**
 * Push eslatmalar (Web Push API).
 *
 * Bu qatlam FAQAT brauzer bilan gaplashadi va natijani ochiq holat
 * sifatida qaytaradi — chunki foydalanuvchiga "ruxsat berilmadi" va
 * "server javob bermadi" butunlay boshqa xabarlar bo'lishi kerak.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

/**
 * ILOVADA push sozlanganmi (VAPID ochiq kaliti bor).
 *
 * Kalit berilmagan muhitda (masalan Vercel'ga env qo'shilmaganda) sozlama
 * ko'rinsa, har bosishda "yoqib bo'lmadi" deb javob berardi — bosilganda
 * hech nima qilmaydigan tugma foydalanuvchini chalg'itadi.
 *
 * Bu BRAUZER qobiliyatidan alohida tekshiriladi: sabablar boshqa, demak
 * foydalanuvchiga aytiladigan gap ham boshqa. Kalit yo'qligi — BIZNING
 * sozlamamiz, foydalanuvchining qurilmasi aybdor emas.
 */
export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY)
}

/** BRAUZER push'ni ko'tara oladimi (iOS'da bosh ekranga qo'shilgan bo'lsa) */
export function isBrowserPushCapable(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'PushManager' in window &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  )
}

/** Push uchun kerakli hamma narsa bormi */
export function isPushSupported(): boolean {
  return isPushConfigured() && isBrowserPushCapable()
}

/**
 * base64url → ArrayBuffer.
 *
 * `applicationServerKey` aynan bayt massivini talab qiladi; satr berilsa
 * brauzer jimgina rad etadi.
 */
function decodeKey(base64url: string): ArrayBuffer {
  const padded = base64url.padEnd(
    base64url.length + ((4 - (base64url.length % 4)) % 4),
    '=',
  )
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))

  // Aynan `ArrayBuffer` qaytariladi, `Uint8Array` emas: `subscribe`
  // `BufferSource` kutadi va yangi TS kutubxonasida ular mos kelmaydi
  const buffer = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buffer)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return buffer
}

/**
 * Ro'yxatdan o'tgan service worker'ni xavfsiz olish.
 *
 * `navigator.serviceWorker.ready` registratsiya BO'LMASA hech qachon hal
 * bo'lmaydi — uni to'g'ridan-to'g'ri kutgan har bir joy abadiy osilib
 * qolardi. Shuning uchun avval `getRegistration()` so'raladi.
 */
async function getReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  const existing = await navigator.serviceWorker.getRegistration()
  if (!existing) return null

  return navigator.serviceWorker.ready
}

/**
 * Brauzerdagi HAQIQIY obuna manzili.
 *
 * Saqlangan manzil eskirishi mumkin: foydalanuvchi brauzer sozlamalaridan
 * ruxsatni bekor qilsa yoki sayt ma'lumotlarini tozalasa, ilova "eslatma
 * yoqilgan" deb ko'rsatishda davom etardi — aslida esa hech nima kelmaydi.
 */
export async function getActiveEndpoint(): Promise<string | null> {
  if (!isPushSupported()) return null

  try {
    const registration = await getReadyRegistration()
    if (!registration) return null

    const subscription = await registration.pushManager.getSubscription()

    return subscription?.endpoint ?? null
  } catch (error) {
    console.error('Obunani tekshirib bo‘lmadi:', error)
    return null
  }
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
  // Kalit alohida o'zgaruvchiga olinadi: `isPushSupported()` uni tekshiradi,
  // lekin TypeScript funksiya chegarasidan o'tib tor qila olmaydi
  const key = VAPID_PUBLIC_KEY
  if (!isPushSupported() || !key) return { status: 'unsupported' }

  try {
    const permission =
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()

    if (permission !== 'granted') return { status: 'denied' }

    // Dev rejimida service worker ataylab ro'yxatdan o'tkazilmaydi
    const registration = await getReadyRegistration()
    if (!registration) return { status: 'unsupported' }

    const subscription = await registration.pushManager.subscribe({
      // Brauzer talabi: har push KO'RINADIGAN bildirishnoma chiqarishi shart.
      // Shu sababli "bugun mashq qilganlarni o'tkazib yuborish" mijozda
      // emas, SERVERDA hal qilinadi.
      userVisibleOnly: true,
      applicationServerKey: decodeKey(key),
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
    const registration = await getReadyRegistration()
    if (!registration) return false

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
