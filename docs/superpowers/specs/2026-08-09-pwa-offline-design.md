# PWA va offline rejim (dizayn)

**Sana:** 2026-08-09
**Holat:** tasdiqlangan, amalga oshirishga tayyor
**Qamrov:** Faza 7 ning birinchi qismi — ilovani o'rnatiladigan va internetsiz ishlaydigan qilish.

## Muammo

Ilova brauzer sahifasi bo'lib qolgan:

1. **Internetsiz ochilmaydi.** Kontent va progress allaqachon qurilmada
   (IndexedDB), lekin ilova qobig'i (HTML/JS/CSS) har safar tarmoqdan
   olinadi. Metroda yoki internetsiz joyda mashq qilib bo'lmaydi — bu
   "kuniga 5 daqiqa" va'dasiga to'g'ridan-to'g'ri zid.
2. **Telefonga o'rnatilmaydi.** Bosh ekranda ikonkasi yo'q, har safar
   brauzerdan qidirib topish kerak. Kundalik odat shakllanishiga to'siq.
3. **Ikonka begona.** `public/favicon.svg` — shablondan qolgan binafsha
   rasm (`#863bff`), ilova brendiga aloqasi yo'q.

## Yechim (qisqacha)

Manifest + qo'lda yozilgan service worker + ilova identifikatsiyasiga mos
ikonkalar to'plami. Yangi bog'liqlik qo'shilmaydi.

## 1. Ikonkalar

Ko'rinish: **yashil yumaloq kvadrat + oq mushuk** — mascot va brend rangi
(`#10b981`) birlashadi, ilova bosh ekranda darhol tanib olinadi.

| Fayl | O'lcham | Vazifasi |
| ---- | ------- | -------- |
| `public/icon-192.png` | 192×192 | Android o'rnatish |
| `public/icon-512.png` | 512×512 | Splash ekran va do'kon ko'rinishi |
| `public/icon-maskable-512.png` | 512×512 | Android adaptiv shakl |
| `public/apple-touch-icon.png` | 180×180 | iOS bosh ekrani |
| `public/favicon.svg` | — | almashtiriladi (hozirgisi shablondan qolgan) |

**Maskable versiyada mushuk kichraytiriladi:** Android ikonkani doira yoki
boshqa shaklga qirqadi, shuning uchun tasvir markazdagi ~80% "xavfsiz
hudud" ichida turishi kerak. Aks holda quloqlari kesilib qolardi.

### PNG yangi bog'liqliksiz yasaladi

`scripts/make-icons.mjs` skripti PNG faylini o'zi kodlaydi: Node'ning
ichki `zlib` moduli deflate uchun, CRC32 esa bir necha qatorlik funksiya.
Ikonka oddiy geometrik shakllardan iborat (doira, ellips, uchburchak),
shuning uchun har piksel analitik tekshiruv bilan bo'yaladi — SVG
rasterizator kerak emas.

**Nega rasm kutubxonasi qo'shilmaydi:** loyihada atigi 5 ta runtime
bog'liqlik bor va bu ongli tanlov. Ikonkalar yiliga bir marta
o'zgaradigan artefakt — ular uchun doimiy bog'liqlik saqlash noo'rin.

Natijadagi PNG'lar **repoga commit qilinadi**; skript faqat kerak
bo'lganda qo'lda yugurtiriladi (build jarayoniga ulanmaydi).

## 2. Manifest

`public/manifest.webmanifest`:

- `name`: "PolyglotPro — Til o'rganish", `short_name`: "PolyglotPro"
- `start_url` va `scope`: `/`
- `display`: `standalone` — brauzer paneli ko'rinmaydi, ilovadek ochiladi
- `theme_color`: `#10b981` (holat paneli), `background_color`: `#10b981`
  (yuklanishdagi splash ekran yashil bo'ladi)
- `orientation`: `portrait` — ilova mobil-birinchi qilib chizilgan
- `lang`: `uz`, `categories`: `["education"]`

`index.html` ga `<link rel="manifest">` va `<link rel="apple-touch-icon">`
qo'shiladi.

## 3. Service worker

`public/sw.js` — qo'lda yoziladi, bundler'ga tegmaydi (u ildiz sohasida
turishi kerak).

| So'rov turi | Strategiya | Sabab |
| ----------- | ---------- | ----- |
| Navigatsiya (HTML) | Avval tarmoq, so'ng kesh | Yangi versiya darhol ko'rinadi; internetsiz keshdagi `index.html` beriladi |
| `/assets/*` | Avval kesh | Fayl nomlari hash bilan — mazmuni hech qachon o'zgarmaydi |
| Boshqa `GET` (ikonka, manifest) | Avval kesh, so'ng tarmoq | Kam o'zgaradi |

**Precache ro'yxati yo'q.** Vite chiqaradigan fayl nomlari har build'da
o'zgaradi; ro'yxatni qo'lda yozish eskirib qolardi, avtomatik yozish esa
plagin talab qilardi. Hash'langan nomlar tufayli runtime kesh yetarli:
fayl bir marta yuklansa, keyin o'sha nom bilan hech qachon o'zgarmaydi.

**Kesh versiyalanadi** (`polyglotpro-v1`); `activate` da boshqa nomdagi
keshlar o'chiriladi, shuning uchun eski fayllar cheksiz to'planmaydi.

**`skipWaiting` + `clients.claim`** ishlatiladi: ilova bitta bundle'dan
iborat (lazy chunk yo'q), shuning uchun yangi versiyaga o'tish xavfsiz va
foydalanuvchidan "yangilash" tugmasini bosishni so'rash shart emas.

**Faqat `GET` va faqat o'z domeni** keshlanadi.

## 4. Registratsiya

`src/lib/pwa.ts`:

```ts
shouldRegisterServiceWorker(isProduction: boolean, isSupported: boolean): boolean
registerServiceWorker(): void
```

**Dev rejimida ro'yxatdan o'tmaydi:** service worker keshi tuzatishni
qiyinlashtiradi — o'zgartirish kiritilgach eski nusxa ko'rinib qolardi.

Qo'llab-quvvatlamaydigan brauzerda jimgina o'tkazib yuboriladi: PWA —
qo'shimcha qulaylik, ilovaning ishlashi unga bog'liq emas.

## 5. Testlar

- **`src/lib/pwa.test.ts`** — `shouldRegisterServiceWorker` haqiqat
  jadvali (prod+qo'llab-quvvatlanadi → ha; dev → yo'q; qo'llab-quvvatlanmaydi
  → yo'q); `registerServiceWorker()` qo'llab-quvvatlanmaganda xato
  tashlamaydi.
- **`src/lib/manifest.test.ts`** — manifest fayli o'qiladi: majburiy
  maydonlar bor, `display` = `standalone`, har bir ikonka fayli diskda
  mavjud.
- **`src/lib/icons.test.ts`** — har PNG'ning imzosi to'g'ri va IHDR
  bo'limidagi o'lcham kutilganiga teng (buzuq generatsiyani ushlaydi).

**Ochiq chegara:** service worker'ning O'ZI unit test bilan qoplanmaydi —
`caches`, `fetch` hodisalari va o'rnatish sikli jsdom'da mavjud emas. U
brauzerda qo'lda tekshiriladi: DevTools → Application → Service Workers,
so'ng Network → Offline bilan sahifa qayta yuklanadi.

## 6. Qamrovdan tashqarida (YAGNI)

- "Ilovani o'rnating" bannerи (custom install prompt) — brauzer o'zi taklif qiladi
- Push bildirishnomalar, background sync — server kerak
- Offline holat indikatori — ilova offline'da to'liq ishlaydi, ko'rsatadigan farq yo'q
- Ikonkalarni build paytida yasash — artefakt sifatida commit qilinadi

## Xavflar

- **Eski kesh yopishib qolishi.** Navigatsiya tarmoqdan boshlanadi va
  kesh versiyalangan, shuning uchun yangi deploy ochilganda ko'rinadi.
  Muammo chiqsa: `CACHE_NAME` dagi raqamni oshirish yetarli.
- **TTS offline'da ishlamasligi mumkin.** Ba'zi brauzerlarda ovozlar
  bulutdan olinadi. Ilova bunga chidamli: `speech.ts` xatoni yutadi va
  mashqlar davom etadi.
