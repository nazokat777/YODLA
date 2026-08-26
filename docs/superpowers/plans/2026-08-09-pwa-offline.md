# PWA va offline: amalga oshirish rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Holat:** ✅ **BAJARILGAN.** Offline production build'da tekshirilgan.

**Goal:** Ilovani telefonga o'rnatiladigan va internetsiz ishlaydigan qilish.

**Architecture:** Uch mustaqil bo'lak — ikonkalar (Node `zlib` bilan yasalgan PNG artefaktlar), manifest, va qo'lda yozilgan service worker. Registratsiya `src/lib/pwa.ts` dagi sof funksiya orqali boshqariladi, shuning uchun qaror mantig'i test qilinadi.

**Tech Stack:** Node (ichki `zlib`, `fs`), TypeScript, Vitest, Vite (statik `public/` papkasi).

**Spec:** [docs/superpowers/specs/2026-08-09-pwa-offline-design.md](../specs/2026-08-09-pwa-offline-design.md)

## Global Constraints

- **Yangi npm bog'liqligi qo'shilmaydi** — loyihada 5 ta runtime bog'liqlik bor va bu ongli tanlov.
- Kod izohlari va UI matni — **o'zbek tilida**.
- Brend ranglari: `#10b981` (asosiy yashil), oq `#ffffff`.
- Ikonka PNG'lari **repoga commit qilinadi**; generator build jarayoniga ulanmaydi.
- Service worker faqat **`GET`** va faqat **o'z domeni** so'rovlarini keshlaydi.
- Har commit oldidan `npm test` to'liq o'tishi shart (bazaviy holat: **340 test**).

## Fayl xaritasi

| Fayl | Mas'uliyati |
| ---- | ----------- |
| `scripts/make-icons.mjs` | PNG ikonkalarni yasaydi (bir martalik, qo'lda ishga tushiriladi) |
| `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | Artefaktlar |
| `public/manifest.webmanifest` | O'rnatish metama'lumoti |
| `public/sw.js` | Service worker (kesh strategiyalari) |
| `src/lib/pwa.ts` | Registratsiya qarori va chaqiruvi |
| `index.html` | manifest va apple-touch-icon havolalari |

---

### Task 1: Ikonka generatori va PNG artefaktlar

**Files:**
- Create: `scripts/make-icons.mjs`
- Create (generatsiya natijasi): `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-touch-icon.png`
- Test: `src/lib/icons.test.ts`

**Interfaces:**
- Consumes: Node `node:zlib`, `node:fs`
- Produces: to'rtta PNG fayl (barchasi RGBA, 8-bit)

- [ ] **Step 1: Write the failing test**

`src/lib/icons.test.ts`:

```ts
import { readFileSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Kutilgan ikonkalar va ularning o'lchamlari */
const ICONS = [
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
  { file: 'public/icon-maskable-512.png', size: 512 },
  { file: 'public/apple-touch-icon.png', size: 180 },
]

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

describe.each(ICONS)('$file', ({ file, size }) => {
  it('mavjud va haqiqiy PNG', () => {
    expect(existsSync(file)).toBe(true)

    const data = readFileSync(file)
    expect(data.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true)
  })

  it('o‘lchami kutilganday', () => {
    // IHDR bo'limi: 8 bayt imzo + 4 uzunlik + 4 tur, keyin en/bo'y
    const data = readFileSync(file)

    expect(data.readUInt32BE(16)).toBe(size)
    expect(data.readUInt32BE(20)).toBe(size)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/icons.test.ts
```

Expected: FAIL — fayllar mavjud emas.

- [ ] **Step 3: Write the generator**

`scripts/make-icons.mjs`:

```js
/**
 * Ilova ikonkalarini yasaydi (yashil fon + oq mushuk).
 *
 * NEGA RASM KUTUBXONASISIZ: ikonka oddiy geometrik shakllardan iborat,
 * shuning uchun har piksel analitik tekshiruv bilan bo'yaladi. PNG esa
 * Node'ning ichki `zlib` moduli bilan kodlanadi. Doimiy bog'liqlik
 * saqlash o'rniga bir martalik skript — natija repoga commit qilinadi.
 *
 * Ishga tushirish:  node scripts/make-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const GREEN = [16, 185, 129, 255] // #10b981
const WHITE = [255, 255, 255, 255]

/* ---------------------------- PNG kodlash ---------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)

  const typeBuffer = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))

  return Buffer.concat([length, typeBuffer, data, crc])
}

function encodePng(size, pixels) {
  // Har qator oldiga filtr bayti (0 — filtrsiz) qo'yiladi
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit chuqurligi
  ihdr[9] = 6 // rang turi: RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ------------------------------ Shakllar ------------------------------ */

const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r

const inEllipse = (x, y, cx, cy, rx, ry) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1

/** Uchburchak ichidami — barisentrik belgi testi */
function inTriangle(x, y, [ax, ay], [bx, by], [cx, cy]) {
  const sign = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry)

  const d1 = sign(x, y, ax, ay, bx, by)
  const d2 = sign(x, y, bx, by, cx, cy)
  const d3 = sign(x, y, cx, cy, ax, ay)

  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0

  return !(hasNeg && hasPos)
}

/** Yumaloq kvadrat — burchak radiusi ulushda */
function inRoundedSquare(x, y, radius) {
  if (x >= radius && x <= 1 - radius) return y >= 0 && y <= 1
  if (y >= radius && y <= 1 - radius) return x >= 0 && x <= 1

  const cx = x < 0.5 ? radius : 1 - radius
  const cy = y < 0.5 ? radius : 1 - radius
  return inCircle(x, y, cx, cy, radius)
}

/**
 * Mushuk siluetи ichidami (normallashtirilgan 0..1 koordinatalar,
 * `scale` — markazga nisbatan kichraytirish).
 */
function catAt(x, y, scale) {
  // Markazga nisbatan masshtablash
  const px = (x - 0.5) / scale + 0.5
  const py = (y - 0.5) / scale + 0.5

  const ears =
    inTriangle(px, py, [0.24, 0.4], [0.18, 0.12], [0.42, 0.28]) ||
    inTriangle(px, py, [0.76, 0.4], [0.82, 0.12], [0.58, 0.28])

  const head = inCircle(px, py, 0.5, 0.56, 0.32)

  if (!ears && !head) return null

  // Yuz tafsilotlari fon rangida "o'yiladi" — kichik o'lchamda ham aniq
  const eyes = inCircle(px, py, 0.39, 0.51, 0.052) || inCircle(px, py, 0.61, 0.51, 0.052)
  const nose = inEllipse(px, py, 0.5, 0.64, 0.04, 0.03)

  return eyes || nose ? GREEN : WHITE
}

/* ------------------------------ Chizish ------------------------------ */

/**
 * @param size   piksel o'lchami
 * @param scale  mushuk kattaligi (maskable uchun kichikroq: Android
 *               ikonkani doiraga qirqadi, chekkadagi tasvir kesilib qoladi)
 * @param rounded burchaklar yumaloqlanadimi (maskable — to'la kvadrat)
 */
function drawIcon(size, { scale = 1, rounded = true } = {}) {
  const pixels = Buffer.alloc(size * size * 4)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size
      const ny = (y + 0.5) / size
      const offset = (y * size + x) * 4

      const insideBackground = rounded ? inRoundedSquare(nx, ny, 0.22) : true
      if (!insideBackground) continue // shaffof qoladi

      const color = catAt(nx, ny, scale) ?? GREEN
      pixels[offset] = color[0]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[2]
      pixels[offset + 3] = color[3]
    }
  }

  return encodePng(size, pixels)
}

const OUTPUTS = [
  ['public/icon-192.png', 192, { scale: 1 }],
  ['public/icon-512.png', 512, { scale: 1 }],
  // Maskable: tasvir markazdagi xavfsiz hududda turishi kerak
  ['public/icon-maskable-512.png', 512, { scale: 0.72, rounded: false }],
  ['public/apple-touch-icon.png', 180, { scale: 1, rounded: false }],
]

for (const [file, size, options] of OUTPUTS) {
  writeFileSync(file, drawIcon(size, options))
  console.log(`${file} — ${size}×${size}`)
}
```

- [ ] **Step 4: Generate the icons**

```bash
node scripts/make-icons.mjs
```

Expected: to'rt qator chiqadi (`public/icon-192.png — 192×192` va h.k.).

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/lib/icons.test.ts
```

Expected: PASS — 8 passed.

- [ ] **Step 6: Ko'z bilan tekshirish**

PNG'lardan birini brauzerda oching (masalan `public/icon-512.png` faylini
sudrab tashlang) va mushuk ko'rinayotganini tasdiqlang. Buzuq chiqsa
`catAt` dagi koordinatalarni to'g'rilang.

- [ ] **Step 7: Commit**

```bash
git add scripts/make-icons.mjs public/*.png src/lib/icons.test.ts
git commit -m "feat: ilova ikonkalari — bog'liqliksiz PNG generatori"
```

---

### Task 2: Manifest va HTML havolalari

**Files:**
- Create: `public/manifest.webmanifest`
- Modify: `index.html`
- Test: `src/lib/manifest.test.ts`

**Interfaces:**
- Consumes: Task 1 dagi PNG fayllar
- Produces: `public/manifest.webmanifest`

- [ ] **Step 1: Write the failing test**

`src/lib/manifest.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'))

describe('manifest.webmanifest', () => {
  it('o‘rnatish uchun zarur maydonlar bor', () => {
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBe('/')
    expect(manifest.scope).toBe('/')
  })

  it('ilovadek ochiladi va brend ranglarini ishlatadi', () => {
    // `standalone` — brauzer paneli ko'rinmaydi
    expect(manifest.display).toBe('standalone')
    expect(manifest.theme_color).toBe('#10b981')
    expect(manifest.background_color).toBe('#10b981')
  })

  it('har bir ikonka fayli mavjud', () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3)

    manifest.icons.forEach((icon: { src: string; sizes: string; type: string }) => {
      expect(existsSync(`public${icon.src}`)).toBe(true)
      expect(icon.type).toBe('image/png')
      expect(icon.sizes).toMatch(/^\d+x\d+$/)
    })
  })

  it('Android adaptiv shakl uchun maskable ikonka bor', () => {
    const maskable = manifest.icons.filter((icon: { purpose?: string }) =>
      icon.purpose?.includes('maskable'),
    )

    expect(maskable.length).toBeGreaterThan(0)
  })
})

describe('index.html', () => {
  const html = readFileSync('index.html', 'utf8')

  it('manifestga havola qiladi', () => {
    expect(html).toContain('rel="manifest"')
  })

  it('iOS uchun apple-touch-icon beradi', () => {
    // iOS manifestdagi ikonkalarni o'qimaydi
    expect(html).toContain('apple-touch-icon')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/manifest.test.ts
```

Expected: FAIL — `manifest.webmanifest` mavjud emas.

- [ ] **Step 3: Write the manifest**

`public/manifest.webmanifest`:

```json
{
  "name": "PolyglotPro — Til o'rganish",
  "short_name": "PolyglotPro",
  "description": "Ingliz, rus va arab tillarini aqlli takrorlash (SRS) orqali o'rganing.",
  "lang": "uz",
  "dir": "ltr",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#10b981",
  "background_color": "#10b981",
  "categories": ["education"],
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    {
      "src": "/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

- [ ] **Step 4: Update `index.html`**

`<title>` qatoridan oldin qo'shing:

```html
    <link rel="manifest" href="/manifest.webmanifest" />
    <!-- iOS manifestdagi ikonkalarni o'qimaydi — alohida havola kerak -->
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="PolyglotPro" />
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/lib/manifest.test.ts
```

Expected: PASS — 6 passed.

- [ ] **Step 6: Commit**

```bash
git add public/manifest.webmanifest index.html src/lib/manifest.test.ts
git commit -m "feat: PWA manifesti va ikonka havolalari"
```

---

### Task 3: Service worker va registratsiya

**Files:**
- Create: `public/sw.js`
- Create: `src/lib/pwa.ts`
- Modify: `src/main.tsx`
- Test: `src/lib/pwa.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `shouldRegisterServiceWorker(isProduction: boolean, isSupported: boolean): boolean`
  - `registerServiceWorker(): void`

- [ ] **Step 1: Write the failing test**

`src/lib/pwa.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker, shouldRegisterServiceWorker } from './pwa'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('shouldRegisterServiceWorker', () => {
  it('production va qo‘llab-quvvatlansa — ha', () => {
    expect(shouldRegisterServiceWorker(true, true)).toBe(true)
  })

  it('dev rejimida ro‘yxatdan o‘tmaydi', () => {
    // SW keshi tuzatishga xalaqit beradi: o'zgartirish kiritilgach
    // eski nusxa ko'rinib qolardi
    expect(shouldRegisterServiceWorker(false, true)).toBe(false)
  })

  it('brauzer qo‘llab-quvvatlamasa — yo‘q', () => {
    expect(shouldRegisterServiceWorker(true, false)).toBe(false)
  })
})

describe('registerServiceWorker', () => {
  it('qo‘llab-quvvatlanmagan brauzerda xato tashlamaydi', () => {
    // PWA — qo'shimcha qulaylik; ilovaning ishlashi unga bog'liq emas
    vi.stubGlobal('navigator', {})

    expect(() => registerServiceWorker()).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/pwa.test.ts
```

Expected: FAIL — `Failed to resolve import "./pwa"`.

- [ ] **Step 3: Write `src/lib/pwa.ts`**

```ts
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
```

- [ ] **Step 4: Write `public/sw.js`**

```js
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
```

- [ ] **Step 5: Registratsiyani `src/main.tsx` ga ulash**

Import qo'shing:

```ts
import { registerServiceWorker } from '@/lib/pwa'
```

va fayl oxiriga (render chaqiruvidan keyin):

```ts
registerServiceWorker()
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run src/lib/pwa.test.ts
npm test
```

Expected: `pwa.test.ts` 4 passed; to'liq to'plam ham xatosiz.

- [ ] **Step 7: Commit**

```bash
git add public/sw.js src/lib/pwa.ts src/lib/pwa.test.ts src/main.tsx
git commit -m "feat: service worker — offline rejim"
```

---

### Task 4: Brauzerda tekshirish, hujjat va deploy

**Files:**
- Modify: `README.md`
- Delete: `public/favicon.svg` (shablondan qolgan binafsha ikonka)
- Modify: `index.html` (favicon havolasi yangi PNG'ga)

**Interfaces:**
- Consumes: Task 1–3 natijalari
- Produces: —

- [ ] **Step 1: Eski faviconni almashtirish**

`index.html` dagi qatorni:

```html
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

shu bilan almashtiring:

```html
    <link rel="icon" type="image/png" href="/icon-192.png" />
```

so'ng eski faylni o'chiring:

```bash
git rm public/favicon.svg
```

- [ ] **Step 2: `README.md` — texnologiyalar jadvaliga qator qo'shish**

```markdown
| PWA      | Manifest + qo'lda yozilgan service worker (Faza 7) |
```

- [ ] **Step 3: `README.md` — yangi bo'lim**

"Vaqt va reaktivlik haqida bitta tuzoq" bo'limidan oldin qo'shing (quyidagi to'rt tirnoqli blok ichidagi matn — README ga tushadigan mazmun):

````markdown
## Offline rejim (PWA)

Ilova telefonga o'rnatiladi va internetsiz ishlaydi — kontent ham,
progress ham allaqachon qurilmada (IndexedDB), tarmoqdan faqat ilova
qobig'i kerak edi.

[public/sw.js](public/sw.js) ikki strategiyani ishlatadi:

| So'rov | Strategiya | Sabab |
| ------ | ---------- | ----- |
| Navigatsiya (HTML) | Avval tarmoq | Yangi versiya darhol ko'rinadi; internetsiz keshdagi nusxa beriladi |
| `/assets/*` | Avval kesh | Fayl nomlari hash bilan — mazmuni o'zgarmaydi |

Precache ro'yxati **ataylab yo'q**: Vite fayl nomlarini har build'da
o'zgartiradi, qo'lda yozilgan ro'yxat esa eskirib qolardi.

Ikonkalar [scripts/make-icons.mjs](scripts/make-icons.mjs) bilan
yasaladi — rasm kutubxonasisiz, Node'ning ichki `zlib` moduli orqali.
Natija repoga commit qilinadi:

```bash
node scripts/make-icons.mjs
```

> Service worker unit test bilan qoplanmagan: `caches` va `fetch`
> hodisalari jsdom'da mavjud emas. U brauzerda tekshiriladi —
> DevTools → Application → Service Workers, so'ng Network → Offline
> bilan sahifani qayta yuklash.
````

- [ ] **Step 4: To'liq tekshiruv**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: hammasi xatosiz.

- [ ] **Step 5: Commit va deploy**

```bash
git add -A
git commit -m "chore: PWA yakuni — favicon almashtirildi, README yangilandi"
git push origin main
```

- [ ] **Step 6: Jonli saytda qo'lda tekshirish**

Deploy tugagach (`vercel ls yodla --prod` → `● Ready`):

1. Saytni oching, DevTools → **Application → Manifest** — nom, ranglar va
   ikonkalar ko'rinishi kerak.
2. **Application → Service Workers** — `sw.js` "activated and running".
3. **Network → Offline** belgilanadi, sahifa qayta yuklanadi — ilova
   ochilishi va dars ishlashi kerak.
4. Telefonda: brauzer menyusidagi "Bosh ekranga qo'shish" — yashil
   ikonkada mushuk ko'rinishi kerak.

Muammo chiqsa (eski kesh yopishib qolsa): `public/sw.js` dagi
`CACHE_NAME` raqamini oshiring va qayta deploy qiling.

---

## Yakuniy holat

- Ilova telefonga o'rnatiladi (`standalone`, yashil splash)
- Internetsiz ochiladi va to'liq ishlaydi
- Ikonkalar ilova identifikatsiyasiga mos (yashil fon + mushuk), iOS ham qo'llab-quvvatlanadi
- Yangi npm bog'liqligi qo'shilmadi
- Yangi testlar: ikonkalar (8), manifest (6), registratsiya (4)
