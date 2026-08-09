# Faza 6 — to'liq onboarding, daraja testi va mascot (dizayn)

**Sana:** 2026-08-09
**Holat:** tasdiqlangan, amalga oshirishga tayyor
**Qamrov:** TZ 6.1 — til tanlash → daraja testi → kunlik maqsad → birinchi dars; personaj (mascot).

## Muammo

Onboarding bitta qadamdan iborat: til tanlanadi va foydalanuvchi darhol
bosh ekranga tushadi. Undan kelib chiqadigan uchta kamchilik:

1. **Hamma A1 dan boshlaydi.** Tilni biladigan foydalanuvchi "salom",
   "suv", "bir" kabi so'zlarni qayta o'rganishga majbur — u ilovani birinchi
   seansdayoq tashlab ketadi.
2. **Kunlik maqsad so'ralmaydi** — hammaga 20 so'z qo'yiladi. O'zi tanlamagan
   maqsadga sodiqlik pastroq bo'ladi.
3. **Personaj yo'q.** Onboardingda bitta 🦉 emoji turibdi, u ham
   platformaga qarab har xil chiziladi (bayroq emojilari bilan bo'lgan
   muammoning aynan o'zi).

## Yechim (qisqacha)

To'rt qadamli onboarding; daraja qisqa test bilan aniqlanadi va u darslar
qayerdan boshlanishini belgilaydi; barcha qadamlarda ichki SVG bilan
chizilgan boyqush hamrohlik qiladi.

## 1. Onboarding oqimi

```
1. Til tanlash      → mavjud ekran + mascot
2. Daraja testi     → 9 savol (A1/A2/B1 dan 3 tadan); o'tkazib yuborish mumkin
3. Kunlik maqsad    → Yengil 10 / Oddiy 20 / Jiddiy 30 so'z
4. Tayyor           → natija ko'rsatiladi, "Birinchi darsni boshlash"
```

**Bitta marshrut, ichki qadamlar.** `/onboarding` o'zgarmaydi; qadamlar
`features/onboarding/steps/` dagi alohida komponentlar, ketma-ketlikni
`OnboardingScreen` boshqaradi.

Nega alohida marshrutlar emas: har bir `/onboarding/*` yo'liga "oldingi
qadam bajarilganmi" tekshiruvi kerak bo'lardi. Bu bir martalik oqim uchun
ortiqcha murakkablik, foydasi esa yo'q — qadamlarga havola berilmaydi.

Orqaga qaytish qadamlar orasida ishlaydi (ichki holat), birinchi qadamdan
orqaga chiqish yo'q.

Oxirgi qadamdagi asosiy tugma `completeOnboarding()` ni chaqiradi va
to'g'ridan-to'g'ri **`/lesson`** ga o'tkazadi (TZ 6.1: onboarding birinchi
dars bilan tugaydi — bosh ekranga tushgan foydalanuvchi nima qilishni
bilmay qolishi mumkin). Ikkilamchi "Keyinroq" havolasi bosh ekranga
olib boradi.

## 2. Daraja testi

### Savollar qayerdan olinadi

Savollar **kontentdan** (`DECKS`) yasaladi, bazadan emas: onboarding
paytida foydalanuvchining bazasi hali bo'sh yoki to'liq bo'lmasligi mumkin.

Har daraja uchun 3 ta so'z tasodifiy tanlanadi. Savol tanib olish
ko'rinishida: o'rganilayotgan tildagi so'z ko'rsatiladi, 4 ta o'zbekcha
variantdan bittasi to'g'ri. Chalg'ituvchilar — o'sha tildagi boshqa
so'zlarning tarjimalari.

`buildPlacementQuiz(deck, random)` — sof funksiya, tasodif manbaini
argument sifatida oladi (`lib/random` dagi mavjud naqsh), shuning uchun
testlarda `seededRandom` bilan takrorlanadigan natija olinadi.

### MUHIM: test SRS holatiga tegmaydi

Daraja testi mavjud `SessionRunner` ni **ishlatmaydi** va bazaga **hech
narsa yozmaydi**. `SessionRunner` har javobni SM-2 bahosi, XP va kunlik
statistika sifatida yozadi — natijada foydalanuvchi hali o'rganishni
boshlamasdan turib bilmagan so'zlari "unutilgan" deb belgilanardi va
streak/XP sun'iy boshlanardi.

Test javoblari faqat komponent holatida saqlanadi; yakunda undan bitta
qiymat — boshlang'ich daraja — chiqadi.

### Daraja qanday hisoblanadi

`scorePlacement(correctByLevel)` — sof funksiya
(`src/core/placement/score.ts`).

Har darajada 3 savol; **2 tasi to'g'ri bo'lsa daraja o'tilgan** hisoblanadi.
Boshlang'ich daraja — **o'tilmagan eng past daraja**:

| A1 | A2 | B1 | Natija |
| -- | -- | -- | ------ |
| ✗  | —  | —  | A1     |
| ✓  | ✗  | —  | A2     |
| ✓  | ✓  | ✗  | B1     |
| ✓  | ✓  | ✓  | B1     |

Hammasi o'tilganda ham B1 qaytadi: undan yuqori daraja kontentda yo'q.
Past daraja yiqilsa yuqorilari hisobga olinmaydi — bilim zinapoyasi
uzluksiz deb qaraladi.

**O'tkazib yuborish** tugmasi bosilsa natija A1 bo'ladi (eng xavfsiz
taxmin: hech narsa isbotlanmagan).

## 3. Natija darslarga qanday ta'sir qiladi

Natija sozlamalarga `startingLevel: LevelCode` sifatida yoziladi
(`useSettingsStore`, standart qiymati `'A1'`).

> `persist` versiyasi **oshirilmaydi**: yangi maydon qo'shilganda Zustand
> saqlangan holatni boshlang'ich qiymatlar ustiga yozadi va maydon o'z
> standart qiymatini oladi. Versiya oshirilsa va `migrate` yozilmasa,
> mavjud foydalanuvchi tanlagan tilini yo'qotardi (bu qoida
> `useSettingsStore` da izoh sifatida yozilgan).

`pickLessonCards` uchinchi argument oladi: `minLevel`. Tartiblash guruhlari:

1. ko'rilmagan **va** darajasi `minLevel` dan past emas — asosiy o'quv yo'li
2. ko'rilganlar — mustahkamlash
3. ko'rilmagan **va** darajasi `minLevel` dan past — zaxira

Guruh ichida tartib avvalgidek: daraja → ko'rilganlik → interval.

Past darajadagi so'zlar **o'chirilmaydi**, faqat oxiriga suriladi: A2 dan
boshlagan foydalanuvchining A2/B1 so'zlari tugasa ham dars bo'sh
qaytmaydi. Bazadagi kontent to'liq qoladi, shuning uchun keyinchalik
"boshidan takrorlash" imkoniyatini qo'shish uchun migratsiya kerak emas.

`minLevel` berilmasa (yoki `'A1'` bo'lsa) tartib hozirgidek qoladi —
mavjud xatti-harakat va testlar buzilmaydi.

## 4. Mascot

`src/components/ui/Mascot.tsx` — ichki SVG boyqush.

**Nega emoji emas:** emoji har platformada har xil chiziladi, ba'zilarida
umuman chizilmaydi (bayroq emojilari bilan aynan shu bo'ldi — Windows'da
🇬🇧 o'rniga "GB" harflari chiqardi). SVG hamma joyda bir xil.

**Nega tashqi rasm ham emas:** qo'shimcha so'rov, yuklanish kechikishi va
`dist` hajmi. Boyqush oddiy geometrik shakllardan iborat, SVG hajmi kichik.

Props: `mood: 'idle' | 'happy' | 'thinking' | 'celebrating'`, `size`,
`className`. Kayfiyat ko'z va qosh shakllari bilan farqlanadi.

Bezak element bo'lgani uchun `aria-hidden="true"` — yonidagi matn ma'noni
allaqachon beradi, ekran o'quvchi uni takrorlashi shovqin bo'lardi.

Qo'llanishi: onboardingning har qadami (kayfiyat qadamga mos) va seans
yakuni paneli.

## 5. Testlar

**`src/core/placement/score.test.ts`**
- 2/3 daraja o'tishi, 1/3 — yo'q
- past daraja yiqilsa yuqorilari hisobga olinmaydi
- hammasi o'tilganda B1
- hech narsa to'g'ri bo'lmasa A1

**`src/core/placement/questions.test.ts`**
- har darajadan 3 tadan, jami 9 savol
- har savolda 4 ta variant va bittasi to'g'ri
- chalg'ituvchilar takrorlanmaydi va to'g'ri javobga teng emas
- bir xil urug' (`seededRandom`) — bir xil natija

**`src/core/lesson/order.test.ts`** (mavjud faylga qo'shiladi)
- `minLevel` berilganda past darajadagi ko'rilmagan so'z oxirga suriladi
- `minLevel` berilmasa tartib o'zgarmaydi
- past darajadagi so'zlardan boshqa hech narsa qolmasa, ular baribir qaytadi

**`src/features/onboarding/OnboardingScreen.test.tsx`**
- qadamlar ketma-ketligi va orqaga qaytish
- testni o'tkazib yuborish → `startingLevel` A1
- to'liq oqim → sozlamalarga til, daraja va maqsad yoziladi
- onboarding tugagach bosh sahifaga o'tiladi

## 6. Qamrovdan tashqarida (YAGNI)

- Ro'yxatdan o'tish / hisob yaratish — backend yo'q (TZ 6.1 dagi taklif
  bosqichi keyingi fazalarga qoldiriladi)
- Mascot animatsiyasi (harakat, ko'z pirpiratish) — statik holatlar yetarli
- Darajani keyin qayta aniqlash (testni qayta topshirish) — Profil ekranida
  keyinroq qo'shiladi
- B1 dan yuqori darajalar — kontent yo'q

## Xavflar

- **Test uzun tuyulishi.** 9 savol ~1 daqiqa. O'tkazib yuborish tugmasi
  birinchi savoldayoq ko'rinadi, shuning uchun majburiy bo'lib qolmaydi.
- **Noto'g'ri yuqori daraja.** Tasodifan 2/3 to'g'ri javob berish mumkin.
  Zarari cheklangan: past darajadagi so'zlar o'chirilmaydi, ular zaxirada
  qoladi va SRS baribir bilinmagan so'zni tez-tez qaytaradi.
