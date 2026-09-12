/**
 * Service worker registratsiyasi.
 *
 * Qaror mantig'i alohida sof funksiyada — shuning uchun uni brauzersiz
 * test qilish mumkin.
 */

/**
 * @param isProduction production build'mi (`import.meta.env.PROD`)
 * @param isSupported  brauzerda `serviceWorker` bormi
 */
export function shouldRegisterServiceWorker(
  isProduction: boolean,
  isSupported: boolean,
): boolean {
  return isProduction && isSupported
}

/**
 * Service worker'ni ro'yxatdan o'tkazadi.
 *
 * Dev rejimida ATAYLAB o'tkazib yuboriladi: SW keshi tuzatishni
 * qiyinlashtiradi — o'zgartirish kiritilgach eski nusxa ko'rinib qolardi.
 */
export function registerServiceWorker(): void {
  const isSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator

  if (!shouldRegisterServiceWorker(import.meta.env.PROD, isSupported)) return

  // Registratsiya sahifa yuklanib bo'lgach — birinchi ochilish tezligi
  // muhimroq
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      // PWA qo'shimcha qulaylik: ro'yxatdan o'tmasa ham ilova ishlayveradi
      console.error('Service worker ro‘yxatdan o‘tmadi:', error)
    })
  })
}

/**
 * Yangi versiya o'rnatilganda xabar beradi.
 *
 * SW `skipWaiting` + `clients.claim` bilan ishlaydi: yangi worker darhol
 * nazoratni oladi, lekin OCHIQ sahifa eski JS bilan qolaveradi — ilova
 * ikki xil holatda bo'lishi mumkin. Shuning uchun foydalanuvchiga
 * "yangilash" taklif qilinadi (majburan qayta yuklanmaydi — dars o'rtasida
 * bo'lishi mumkin).
 *
 * BIRINCHI o'rnatishda ham `controllerchange` keladi (`claim` tufayli) —
 * u yangilanish emas, shuning uchun oldin nazoratchi bo'lgan holatgina
 * hisoblanadi.
 */
export function onUpdateAvailable(callback: () => void): () => void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => {}

  const container = navigator.serviceWorker
  const hadController = Boolean(container.controller)
  const handler = () => {
    if (hadController) callback()
  }
  container.addEventListener('controllerchange', handler)
  return () => container.removeEventListener('controllerchange', handler)
}
