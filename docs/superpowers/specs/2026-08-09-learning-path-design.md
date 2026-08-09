# O'quv yo'li (dizayn)

**Sana:** 2026-08-09
**Holat:** tasdiqlangan, amalga oshirishga tayyor
**Qamrov:** Faza 7 — bosh sahifadagi bo'limlar zanjiri va bo'limga bog'langan dars.

## Muammo

Bosh sahifada "Yangi so'zlarni o'rganish" degan bitta tugma bor. Uni
bosgan foydalanuvchi qaerda turganini, nimani o'rganganini va oldinda
nima borligini **ko'rmaydi**. Kontent 102 so'z va 3 darajaga bo'lingan,
lekin bu tuzilma interfeysda umuman aks etmaydi.

Natijada ikkita yo'qotish: yo'nalish hissi (qayerdaman?) va tugatish
motivatsiyasi (yana ikkita so'z — bo'lim yopiladi).

## Yechim (qisqacha)

Bosh sahifada **bo'limlar zanjiri**. Bo'lim = daraja + mavzu; holati
kartalar progressidan hisoblanadi. Bo'lim bosilganda aynan o'sha
bo'limning so'zlari bilan dars boshlanadi.

## 1. Bo'lim nima

**Bo'lim = (daraja, mavzu)** juftligi. Ikkalasi ham kartada allaqachon
bor (`level`, `topic`) — yangi ma'lumot kiritilmaydi.

Identifikator: `${daraja}-${mavzu-slug}` — masalan `a1-oila`,
`a1-kundalik-fellar`, `b1-his-tuygu`.

Slug o'zbekcha matndan yasaladi: kichik harf, tutuq belgisi tushiriladi,
qolgan belgilar `-` ga aylanadi. Tutuq **tushiriladi, `-` ga
almashtirilmaydi**: `fe'llar` → `fellar` (`fe-llar` emas).

**Tartib:** avval daraja (`LEVEL_ORDER`), keyin mavzular — kontentda
birinchi uchrash tartibida. Alohida "mavzular ro'yxati" fayli
yaratilmaydi: u kontent bilan sinxrondan chiqib ketishi mumkin edi.

## 2. Bo'lim holati

| Holat | Shart | Ko'rinishi |
| ----- | ----- | ---------- |
| `completed` | barcha so'zi kamida bir marta ko'rilgan | to'ldirilgan yashil + ✓ |
| `current` | birinchi tugallanmagan bo'lim | ajratilgan, progress ko'rsatkichi bilan |
| `locked` | joriydan keyingilari | kulrang + qulf, bosilmaydi |
| `skipped` | darajasi `startingLevel` dan past va tugallanmagan | so'nik, **bosiladi** |

**Nega `skipped` alohida holat:** daraja testida A2 chiqqan foydalanuvchi
A1 bo'limlarini o'rganmagan. Ularni "tugallangan" deb ko'rsatish yolg'on
bo'lardi (✓ qo'yilardi, aslida bitta ham so'z ko'rilmagan). Shuning uchun
ular so'nik ko'rinadi, lekin xohlagan payt ochib o'rganish mumkin.

**Tugallanish mezoni — "kamida bir marta ko'rilgan"** (`totalReviews > 0`),
"yodlangan" emas. Yodlashni SRS o'z zimmasiga oladi: karta takrorlash
navbatida qoladi va unutilsa qaytib keladi. Bo'limni "mustahkam"
bo'lgunicha yopmaslik esa foydalanuvchini bir joyda ushlab turardi.

**Qulflash faqat motivatsion tuzilma uchun.** SRS uchun tartib shart emas
— `pickLessonCards` baribir to'g'ri so'zni tanlaydi. Lekin ketma-ketlik
his qilinmasa, "yo'l" degan tushuncha ma'nosini yo'qotadi.

## 3. Dars bo'limga bog'lanadi

**Marshrut allaqachon mavjud:** `/lesson/:lessonId?` va
`PATHS.lessonById(id)` yozilgan, lekin hech qayerda ishlatilmaydi.

Bo'lim bosilganda `/lesson/a1-oila` ochiladi. `LessonScreen`:

- `lessonId` bo'lsa — kartalar shu bo'limga tegishlilariga filtrlanadi
- `lessonId` bo'lmasa — hozirgi xatti-harakat (butun to'plamdan tanlash)
- noto'g'ri `lessonId` — bo'sh holat matni ko'rsatiladi

Bo'lim ichida daraja bir xil, shuning uchun u yerda `minLevel` uzatilmaydi.

## 4. Bosh sahifadagi o'rni

Tartib o'zgaradi:

1. Sarlavha (til, streak) — o'zgarmaydi
2. Daraja/XP va kunlik maqsad — o'zgarmaydi
3. **"Bugun takrorlash"** — qoladi: SRS ilovaning yadrosi va uning
   navbati yo'ldan mustaqil
4. **O'quv yo'li** — "Yangi so'zlarni o'rganish" tugmasi o'rniga
5. Lug'at holati — o'zgarmaydi

Ya'ni **takrorlash va o'rganish ajratiladi**: birinchisi muddati yetgan
so'zlar, ikkinchisi yangi bo'limlar.

## 5. Ko'rinish

Vertikal zanjir: har bo'lim — doira tugma va yonida nomi. Doiralar
gorizontal biroz siljib turadi (Duolingo naqshi), orasida bog'lovchi
chiziq.

- `completed`: to'ldirilgan yashil, ✓
- `current`: yashil halqa, ichida `ko'rilgan/jami`
- `locked`: kulrang, qulf belgisi, `aria-disabled`
- `skipped`: so'nik yashil, bosiladi

Qulflangan bo'lim **`aria-disabled`** bo'ladi (`disabled` emas): u Tab
tartibida qoladi va ekran o'quvchi uning nomini hamda nega yopiqligini
o'qiy oladi.

RTL: doira va matn orasidagi masofa `ms-*`/`me-*` bilan beriladi.

## 6. Motion (GSAP)

Foydalanuvchi so'rovi: maksimal darajada kuchli, zamonaviy motion. GSAP
qo'shiladi — bu loyihaning "5 ta bog'liqlik" tamoyilidan ongli chekinish.

**GSAP dangasa yuklanadi** (`await import('gsap')`): birinchi ochilish
tezligiga tegmaydi va animatsiya kerak bo'lmagan ekranlarda umuman
yuklanmaydi.

### Asosiy arxitektura qoidasi

**Animatsiya — bezak. DOM animatsiyasiz ham to'g'ri bo'lishi shart.**

Har komponent avval yakuniy holatini chizadi, animatsiya esa uning
ustidan ishlaydi. Sabab ikkita: GSAP yuklanmasa yoki xato bersa ilova
buzilmaydi, va testlar (jsdom'da animatsiya yo'q) haqiqiy holatni
tekshiradi.

### Yo'l xoreografiyasi

| Moment | Harakat |
| ------ | ------- |
| Ekran ochilishi | Bo'limlar pastdan ketma-ket chiqadi (60 ms oraliq), `back.out` bilan biroz oshib qaytadi; bog'lovchi chiziq shu bilan birga "chiziladi" (`stroke-dashoffset`) |
| Joriy bo'lim | Uzluksiz "nafas": `scale 1 → 1.04`, 2 s, yoyo — ko'z qayerga qarashni biladi |
| Bosish | `scale 0.94` ga cho'kadi, so'ng marshrut o'zgaradi |
| **Bo'lim yopilishi** | Halqa to'ladi → ✓ oshib chiqadi → keyingi bo'limning qulfi silkinib yo'qoladi va u joriy holatga kattalashadi |

Oxirgi qator — yo'lning hissiy cho'qqisi: darsdan qaytgan foydalanuvchi
o'z yutug'ini **ko'radi**, raqam o'zgarganini emas.

Aylantirishda bo'limlar `IntersectionObserver` orqali ko'rinish maydoniga
kirganda jonlanadi. ScrollTrigger plagini **ishlatilmaydi** — qo'shimcha
yuk, foydasi esa shu bitta effektda.

### Mashq sikli — ataylab tez

Savol → javob → keyingi savol yo'lida faqat qisqa harakatlar
(≤200 ms): variant bosilganda cho'kish, to'g'ri javobda yashil to'lqin,
XP raqamining uchib chiqishi. Avtomatik o'tish 900 ms ichida qoladi.

Foydalanuvchi aynan shu ritm sekinligidan shikoyat qilgan edi; kuchli
effektlar shuning uchun yo'l, bosh sahifa va yakun ekraniga yig'iladi.

### `prefers-reduced-motion`

Tizimda harakat kamaytirilgan bo'lsa, barcha animatsiyalar **darhol
yakuniy holatga** o'tadi (o'chiriladi, sekinlashtirilmaydi). Bu shunchaki
did emas: harakat vestibulyar buzilishi bor odamlarda bosh aylanishi va
ko'ngil aynishini keltirib chiqaradi.

`src/lib/motion.ts`:

```
prefersReducedMotion(): boolean
loadGsap(): Promise<Gsap | null>   // reduced-motion bo'lsa null
```

`loadGsap` harakat kamaytirilganda `null` qaytaradi — chaqiruvchi joyda
har safar `if` yozish shart bo'lmaydi va animatsiya kodi umuman
yuklanmaydi.

## 7. Testlar

**`src/core/path/units.test.ts`**
- bo'limlar daraja va mavzu bo'yicha guruhlanadi
- tartib: daraja, so'ng kontentdagi birinchi uchrash
- slug: tutuq tushadi (`Kundalik fe'llar` → `a1-kundalik-fellar`)
- barcha so'zi ko'rilgan bo'lim `completed`
- birinchi tugallanmagani `current`, undan keyingilari `locked`
- `startingLevel` dan past va tugallanmagan bo'lim `skipped`
- bo'sh ro'yxatda bo'sh natija

**`src/features/lesson/LessonScreen.test.tsx`**
- `lessonId` berilganda faqat o'sha bo'lim so'zlari chiqadi
- noto'g'ri `lessonId` — bo'sh holat

**`src/features/home/LearningPath.test.tsx`**
- har holat uchun mos ko'rinish va bosiladiganligi
- qulflangan bo'lim `aria-disabled`
- **animatsiyasiz ham to'g'ri chizadi** (jsdom'da GSAP ishlamaydi — bu
  yuqoridagi "animatsiya bezak" qoidasini avtomatik qo'riqlaydi)

**`src/lib/motion.test.ts`**
- `prefersReducedMotion()` `matchMedia` javobini to'g'ri o'qiydi
- `matchMedia` yo'q brauzerda xato bermaydi (`false` qaytaradi)
- harakat kamaytirilganda `loadGsap()` `null` qaytaradi va import qilmaydi

## 8. Qamrovdan tashqarida (YAGNI)

- Bo'lim uchun "toj"/darajalar (Duolingo crowns) — bo'lim bir marta yopiladi
- Bo'lim bo'yicha alohida XP hisobi — XP global qoladi
- Tugma uslubi va seans yakuni timeline'i — keyingi (vizual) siklda
- GSAP ScrollTrigger va boshqa plaginlar
- Bo'limlarni qayta tartiblash yoki yashirish sozlamasi

## Xavflar

- **Uzun ro'yxat.** 3 daraja × ~6 mavzu ≈ 18 bo'lim. Bitta ekranga
  sig'maydi, lekin vertikal aylantirish Duolingo'da ham shunday.
- **Mavzu nomi o'zgarsa slug o'zgaradi** va eski havola ishlamay qoladi.
  Zarari cheklangan: havolalar faqat ilova ichida yasaladi, tashqariga
  chiqmaydi. Noto'g'ri `lessonId` bo'sh holat ko'rsatadi, xato bermaydi.
