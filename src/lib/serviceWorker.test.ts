import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `public/sw.js` uchun testlar.
 *
 * Fayl ATAYLAB bundler'dan tashqarida turadi (ildiz sohasi kerak), shuning
 * uchun uni import qilib bo'lmaydi. Buning o'rniga matn o'qilib, soxta
 * `self` ichida ishga tushiriladi va hodisa ishlovchilari ushlanadi.
 */
interface Handlers {
  fetch: (event: { request: Request; respondWith: (r: unknown) => void }) => void
}

/** Soxta Cache: nima yozilgani va nima o'qilgani ko'rinib turadi */
function makeCache() {
  const store = new Map<string, Response>()

  return {
    store,
    match: vi.fn((request: Request) => Promise.resolve(store.get(request.url))),
    put: vi.fn((request: Request, response: Response) => {
      store.set(request.url, response)
      return Promise.resolve()
    }),
    add: vi.fn(() => Promise.resolve()),
  }
}

let cache: ReturnType<typeof makeCache>
let handlers: Partial<Handlers>
let fetchMock: ReturnType<typeof vi.fn>

/** Javobni ushlab, uni kutib olish uchun yordamchi */
function runFetch(url: string): Promise<Response> {
  const request = new Request(url)
  let captured: Promise<Response> | undefined

  handlers.fetch?.({
    request,
    respondWith: (result) => {
      captured = Promise.resolve(result as Response)
    },
  })

  if (!captured) throw new Error('respondWith chaqirilmadi')
  return captured
}

beforeEach(() => {
  cache = makeCache()
  handlers = {}
  fetchMock = vi.fn((request: Request) =>
    Promise.resolve(new Response(`tarmoq:${request.url}`, { status: 200 })),
  )

  const scope = {
    location: { origin: 'https://yodla.test' },
    addEventListener: (name: string, handler: unknown) => {
      handlers[name as keyof Handlers] = handler as Handlers['fetch']
    },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve(), matchAll: () => Promise.resolve([]) },
    registration: { showNotification: vi.fn() },
  }

  const source = readFileSync('public/sw.js', 'utf8')
  const run = new Function('self', 'caches', 'fetch', 'Response', 'URL', 'Request', source)

  run(
    scope,
    { open: () => Promise.resolve(cache), keys: () => Promise.resolve([]), match: cache.match },
    fetchMock,
    Response,
    URL,
    Request,
  )
})

describe('sw.js — statik fayllar', () => {
  it('hash‘langan fayl keshdan beriladi, tarmoqqa CHIQILMAYDI', async () => {
    const url = 'https://yodla.test/assets/index-Abc123.js'
    cache.store.set(url, new Response('eski'))

    const response = await runFetch(url)

    expect(await response.text()).toBe('eski')
    // Nomi hash'langan fayl mazmuni hech qachon o'zgarmaydi — so'rov ortiqcha
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('hash‘lanmagan fayl keshdan beriladi, LEKIN fonda yangilanadi', async () => {
    const url = 'https://yodla.test/icons.svg'
    cache.store.set(url, new Response('eski'))

    const response = await runFetch(url)

    // Foydalanuvchi kutib qolmasligi uchun javob darhol keshdan
    expect(await response.text()).toBe('eski')

    // Ammo `icons.svg`, `manifest.webmanifest`, ikonkalar nomi
    // O'ZGARMAYDI: faqat keshga tayanilsa, yangilangan ikonka mavjud
    // foydalanuvchiga HECH QACHON yetib bormasdi
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
    await vi.waitFor(() => {
      expect(cache.store.get(url)).toBeDefined()
    })
  })
})

describe('sw.js — oflayn zaxira', () => {
  it('keshda ham, tarmoqda ham bo‘lmasa 503 qaytadi', async () => {
    fetchMock.mockRejectedValue(new Error('oflayn'))

    const response = await runFetch('https://yodla.test/icons.svg')

    // `undefined` qaytsa brauzer TypeError berardi va sahifa yiqilardi
    expect(response.status).toBe(503)
  })
})
