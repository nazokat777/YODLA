/**
 * Service worker — offline rejim.
 *
 * Bundler'ga tegmaydi: ildiz sohasida (`/sw.js`) turishi kerak, aks holda
 * u faqat o'z papkasidagi so'rovlarni boshqara olardi.
 *
 * PRECACHE RO'YXATI YO'Q: Vite chiqaradigan fayl nomlari har build'da
 * o'zgaradi, ro'yxat esa eskirib qolardi. Nomlar hash'langani uchun
 * runtime kesh yetarli — fayl bir marta yuklansa, o'sha nom bilan
 * mazmuni hech qachon o'zgarmaydi.
 */
const CACHE_NAME = 'polyglotpro-v1'

self.addEventListener('install', (event) => {
  // Yangi versiya kutib turmasin: ilova bitta bundle'dan iborat,
  // shuning uchun almashtirish xavfsiz
  event.waitUntil(self.skipWaiting())
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
    const cached = (await caches.match(request)) ?? (await caches.match('/index.html'))
    if (cached) return cached

    return new Response('Oflayn rejim: sahifa hali yuklanmagan.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

/** Statik fayl: avval kesh — nomlar hash'langan, mazmuni o'zgarmaydi */
async function handleAsset(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  return fetchAndCache(request)
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
