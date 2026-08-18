# Talaffuzni tekshirish (mikrofon) — dizayn

**Sana:** 2026-08-18
**Holat:** tasdiqlangan

## Maqsad

Foydalanuvchi so'zni ovoz chiqarib aytadi, ilova uni tanidimi yoki yo'qmi
darhol ko'rsatadi. Maqsad — gapirishga jur'at berish, imtihon olish emas.

## Yondashuv

Brauzerning `SpeechRecognition` (Web Speech API) interfeysi ishlatiladi:
nutq matnga aylantiriladi va kutilgan so'z bilan solishtiriladi.

### Nima uchun aynan shu

Muqobillar ko'rib chiqildi:

- **Faqat yozib olib eshittirish** (`MediaRecorder`, baholashsiz) — offline
  ishlaydi, lekin baho bermaydi: foydalanuvchi o'zini o'zi baholaydi.
- **Pullik xizmat** (Azure Pronunciation Assessment) — fonema darajasida
  baho beradi, lekin API kaliti, to'lov va server talab qiladi.

`SpeechRecognition` tanlandi: bepul, kalitsiz, haqiqiy tekshiruv beradi.

### Cheklovlar (ochiq qabul qilingan)

- Chrome/Edge da audio **Google serveriga yuboriladi** → **internet shart**.
- Firefox da umuman yo'q.
- Baho "so'z tanildimi" darajasida. Fonema tahlili YO'Q — "siz `th` ni
  noto'g'ri aytdingiz" deyilmaydi.

Shuning uchun mashq **ixtiyoriy** va **qo'llab-quvvatlanmagan joyda umuman
ko'rinmaydi**.

## Joylashuv

🎤 tugmasi `FeedbackBar` ichida — javob berilgandan KEYIN, to'g'ri so'z
ekranda ko'rsatilgan payt, mavjud 🔊 tugmasi yonida.

**Nega javobdan keyin:** tugma kartaning yuqorisiga qo'yilsa, `recall`
mashqida (tarjimani foydalanuvchi yozadi) to'g'ri javob oldindan ochilib
qolardi. Javobdan keyin esa bir joyda turib hamma mashq turi uchun
ishlaydi va tabiiy ketma-ketlik hosil bo'ladi: ko'rdim → 🔊 eshitdim →
🎤 takrorladim.

## SM-2 va XP

**SM-2 bahosiga ta'sir qilmaydi.** Nutq tanish xatosi (shovqin, aksent,
sekin internet) takrorlash jadvalini buzmasligi kerak.

**XP berilmaydi.** Ballar hozir faqat `recordAnswer` orqali yoziladi, u bir
vaqtda kunlik javoblar sonini, kunlik maqsad progressini va liga XP sini
oshiradi. Talaffuzni shu yo'lga ulash kunlik maqsadni bitta so'zni qayta-qayta
aytib bajarish va ligada mashqsiz ball to'plash yo'lini ochardi. Ikkinchi,
parallel XP kanali profil/kunlik/liga uchtasini ajratishni talab qiladi — bu
bitta tugma uchun nomutanosib ish. Mashqning qiymati ✅/❌ ning o'zida.

## Tuzilma

Uch mustaqil bo'lak:

### `src/lib/recognition.ts` — brauzer API qobig'i (Reactsiz)

```ts
isRecognitionSupported(): boolean

type RecognitionOutcome =
  | { status: 'heard'; alternatives: string[] }
  | { status: 'no-speech' }
  | { status: 'denied' }
  | { status: 'failed' }

listenOnce(locale: string, timeoutMs?: number): Promise<RecognitionOutcome>
```

Har bir holatga alohida xabar yoziladi — "xato yuz berdi" degan foydasiz
matn bo'lmaydi.

Tiplar uchun yangi paket (`@types/dom-speech-recognition`) QO'SHILMAYDI:
kerakli minimal interfeys shu faylda e'lon qilinadi.

### `src/core/pronunciation/match.ts` — sof taqqoslash

```ts
matchesSpoken(expected: string, alternatives: string[], language: LanguageCode): boolean
```

Yumshoq qoida: qaytgan variantlardan BIRORTASI mos kelsa yetarli.
Solishtirish uchun mavjud `normalizeAnswer`, `editDistance` va
`typoTolerance` (`src/core/exercises/normalize.ts`) qayta ishlatiladi —
ular arab harakatlarini va rus `ё` sini allaqachon to'g'ri tozalaydi.

### `src/features/session/PronounceButton.tsx`

Uch holat: `bo'sh → tinglayapti → natija`. Tinglash 5 soniyada avtomatik
to'xtaydi. Brauzer nimani eshitgani ochiq ko'rsatiladi ("`waiter` deb
eshitdim") — shunda ❌ olgan odam sababini tushunadi.

## Ko'rinmaydigan holatlar

Tugma umuman chizilmaydi, agar:

- brauzerda `SpeechRecognition` bo'lmasa,
- `navigator.onLine === false`.

Bu `SpeakButton` dagi qoidaning aynan o'zi: bosilganda hech nima
qilmaydigan tugma chalg'itadi.

Mikrofonga ruxsat rad etilsa — tugma o'sha seansda o'chadi va bir marta
tushuntirish chiqadi. Har bosishda tizim oynasini qayta ochish bezor qiladi.

## Testlar

- `match.ts` — sof birlik testlari: mos, bir harf farq, mutlaqo boshqa,
  bo'sh ro'yxat, arabcha harakatli, ruscha `ё`.
- `recognition.ts` — soxta `SpeechRecognition` obyekti bilan har bir xato
  turi to'g'ri holatga aylanishi.
- `PronounceButton` — qo'llab-quvvatlanmaganda chizilmasligi, offline'da
  chizilmasligi, ruxsat rad etilganda o'chishi, ✅/❌ ko'rsatilishi.

## Tekshirib bo'lmaydigan qism (ochiq)

`SpeechRecognition` ga haqiqiy ovoz kerak. Testlar mantiqni qoplaydi,
brauzerda tugma va ruxsat oqimi ko'riladi — lekin "aytilgan `water` ni
Google to'g'ri tanidimi" ni faqat foydalanuvchi sinab ko'ra oladi.
