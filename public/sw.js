/**
 * Service worker — offline rejim.
 *
 * Bundler'ga tegmaydi: ildiz sohasida (`/sw.js`) turishi kerak, aks holda
 * u faqat o'z papkasidagi so'rovlarni boshqara olardi.
 *
 * PRECACHE RO'YXATI YO'Q: Vite chiqaradigan fayl nomlari har build'da
 * o'zgaradi, ro'yxat esa eskirib qolardi. Runtime kesh yetarli — `/assets/`
 * ichidagi nomlar hash'langan, ya'ni bir nom bilan mazmun hech qachon
 * o'zgarmaydi. `public/` dagi fayllar (ikonkalar, manifest, sprite) esa
 * hash'lanmagan va ular boshqacha muomala talab qiladi — `handleAsset`
 * ga qarang.
 */
const CACHE_NAME = 'polyglotpro-v1'

/**
 * Ilova qobig'i — offline'dagi yagona tayanch.
 *
 * SPA barcha manzillarda AYNI hujjatni beradi, lekin javob so'ralgan manzil
 * bilan keshlanadi ("/", "/review", ...). Shu sababli "/index.html" hech
 * qachon keshga tushmaydi va unga tayanish xato edi: foydalanuvchi offline'da
 * ilgari ochmagan sahifasiga ("/stats") kirsa, 503 olardi — holbuki JS va CSS
 * allaqachon keshda va SPA istalgan manzilni chiza olardi.
 *
 * Shuning uchun ildiz hujjati o'rnatishda ATAYLAB keshlanadi va barcha
 * navigatsiyalar uchun tayanch bo'ladi.
 */
const APP_SHELL = '/'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME)
        await cache.add(APP_SHELL)
      } catch {
        // Tarmoq yo'q bo'lsa ham o'rnatish to'xtamaydi — qobiq keyingi
        // muvaffaqiyatli navigatsiyada keshga tushadi
      }

      // Yangi versiya kutib turmasin: ilova bitta bundle'dan iborat,
      // shuning uchun almashtirish xavfsiz
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
      )
      await self.clients.claim()
    })(),
  )
})

/** Tarmoqdan olib, muvaffaqiyatli javobni keshga yozadi */
async function fetchAndCache(request) {
  const response = await fetch(request)

  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }

  return response
}

/** Navigatsiya: avval tarmoq — yangi versiya darhol ko'rinsin */
async function handleNavigation(request) {
  try {
    return await fetchAndCache(request)
  } catch {
    const cached = (await caches.match(request)) ?? (await caches.match(APP_SHELL))
    if (cached) return cached

    return new Response('Oflayn rejim: sahifa hali yuklanmagan.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

/**
 * Nomi hash'langanmi (`/assets/index-Abc123.js`).
 *
 * Vite chiqargan fayllar shunday: nom mazmunga bog'liq, ya'ni bir nom
 * bilan mazmun HECH QACHON o'zgarmaydi.
 */
function isImmutable(url) {
  return new URL(url).pathname.startsWith('/assets/')
}

/** Statik fayl */
async function handleAsset(request) {
  const cached = await caches.match(request)

  // Hash'langan fayl: kesh yakuniy javob, tarmoqqa chiqish ortiqcha
  if (cached && isImmutable(request.url)) return cached

  // Qolganlarining nomi O'ZGARMAYDI: `icons.svg`, `manifest.webmanifest`,
  // ikonkalar. Faqat keshga tayanilsa, yangilangan ikonka yoki sprite
  // mavjud foydalanuvchiga hech qachon yetib bormasdi — yangi JS esa
  // eski sprite'dagi yo'q belgiga murojaat qilib, ikonkalar ko'rinmay
  // qolardi. Shuning uchun: javob darhol keshdan, yangisi FONDA olinadi
  // va keyingi ochilishda ishlatiladi.
  const network = fetchAndCache(request).catch(() => cached)

  if (cached) return cached

  // Keshda ham yo'q, tarmoq ham bermadi — yiqilish o'rniga tushunarli javob
  return (
    (await network) ??
    new Response('Oflayn rejim: fayl hali yuklanmagan.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Faqat GET va faqat o'z domeni: tashqi so'rovlar va POST keshlanmaydi
  if (request.method !== 'GET') return
  if (new URL(request.url).origin !== self.location.origin) return

  event.respondWith(
    request.mode === 'navigate' ? handleNavigation(request) : handleAsset(request),
  )
})

/**
 * Kelgan push.
 *
 * Mazmun serverdan JSON bo'lib keladi, lekin unga TAYANIB BO'LMAYDI:
 * ba'zi brauzerlar obunani tekshirish uchun bo'sh push yuboradi. Shuning
 * uchun har maydonning zaxira qiymati bor.
 */
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    // JSON emas — zaxira matn ishlatiladi
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'YODLA', {
      body: payload.body || 'Bugungi mashqni unutmang — 5 daqiqa yetarli!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      lang: 'uz',
      // Bir xil `tag`: eski o'qilmagan eslatma yangisi bilan ALMASHADI,
      // ekranda o'nta bir xil bildirishnoma yig'ilib qolmaydi
      tag: 'yodla-reminder',
      data: { url: payload.url || '/review' },
    }),
  )
})

/**
 * Bildirishnoma bosilganda.
 *
 * Ilova allaqachon ochiq bo'lsa YANGI oyna ochilmaydi — mavjudi
 * fokuslanadi va kerakli manzilga o'tadi. Aks holda foydalanuvchida
 * bir xil ilovaning bir nechta nusxasi to'planardi.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = (event.notification.data && event.notification.data.url) || '/review'

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus()
          if ('navigate' in client) await client.navigate(url)
          return
        }
      }

      await self.clients.openWindow(url)
    })(),
  )
})
