# O'zlashtirish halqasi — amalga oshirish rejasi

Spec: `docs/superpowers/specs/2026-09-07-ozlashtirish-halqasi-design.md`

Har vazifa: **test → qizil → kod → yashil → commit**. Yangi test o'zi
ushlashi kerak bo'lgan xatoni HAQIQATAN ushlashini isbotlash uchun
implementatsiya vaqtincha buziladi.

Umumiy cheklovlar (har vazifada amal qiladi):
- `core/` React'siz va sof; `content/` dan import qilmaydi
- Testlar `npx vitest run --maxWorkers=2` bilan yuriladi
- `npm run build` (tsc -b) MAJBURIY — `tsc --noEmit` yetarli emas
- Izohlar o'zbekcha, "nega" ni tushuntiradi

---

- [ ] **1. `core/mastery/progress.ts` — so'z holati**

  `WordProgress`, `emptyProgress(cardId)`, `applyAnswer(progress, verdict, type)`.
  Qoida: `correct`/`almost` → `streak+1` va tur yozib qo'yiladi;
  `wrong` → `streak=0`, `lastCorrectType=null`. `mastered` — qaytmas,
  `streak>=2` VA oxirgi ikki tur har xil bo'lganda.

  Testlar: bir marta to'g'ri → o'zlashtirilmaydi; BIR XIL turda ikki
  marta → o'zlashtirilmaydi; har xil turda ikki marta → o'zlashtiriladi;
  `almost` streakni buzmaydi; `wrong` nolga qaytaradi; o'zlashtirilgan
  so'z keyingi xato javobda ham o'zlashtirilgan qoladi.

- [ ] **2. `core/mastery/select.ts` — keyingi so'zni tanlash**

  `pickNextCardId(entries, lastShownId)`: `mastered` bo'lmaganlardan eng
  kichik `streak`, tenglikda eng kichik `asked`; `lastShownId` boshqa
  nomzod bo'lsa chetlab o'tiladi. Hammasi o'zlashtirilgan bo'lsa `null`.

  `excludedTypesFor(progress)`: `streak === 1` bo'lsa
  `[lastCorrectType]`, aks holda bo'sh.

  Testlar: eng kam bilingan so'z tanlanadi; ketma-ket bir so'z
  BERILMAYDI; bitta so'z qolganda u qaytariladi (chetlab o'tish
  yumshatiladi); hammasi tugaganda `null`.

- [ ] **3. `core/mastery/weakness.ts` — zaiflik og'irligi**

  `weakness(card, now)` spec 3.2 formulasi bo'yicha;
  `pickWeakest(cards, size, now)` — eng zaif N ta.

  Testlar: ko'p xato qilingan so'z oldinda; bir xil xatoda yengilligi
  past bo'lgani oldinda; hech qachon ko'rilmagan (`lastReviewedAt: null`)
  karta ham tartibga tushadi va yiqilmaydi; `size` dan kam karta bo'lsa
  hammasi qaytadi.

- [ ] **4. `generateExercise` ga `excludeTypes`**

  `GenerateExerciseOptions` ga `excludeTypes?: readonly ExerciseType[]`.
  `pickExerciseType` shu turlarni tashlab ketadi; agar pog'onada boshqa
  tur qolmasa, chetlash BEKOR QILINADI (mashq baribir beriladi).

  Testlar: chetlangan tur qaytmaydi; yagona mumkin tur chetlansa ham
  mashq yaratiladi (yiqilmaydi).

- [ ] **5. `SessionRunner` — dinamik navbat**

  `mode?: 'fixed' | 'mastery'` (sukut `fixed` — takrorlash o'zgarmaydi).
  `mastery` da: `WordProgress` xaritasi holatda, keyingi karta
  `pickNextCardId` bilan, mashq `excludeTypes` bilan yaratiladi,
  `MAX_SESSION_STEPS = 60` chegarasi.

  Ko'rsatkich: `o'zlashtirilgan/jami so'z`.

  Testlar: xato javobdan keyin so'z QAYTADI; ikki xil turda to'g'ri
  javobdan keyin so'z boshqa CHIQMAYDI; ko'rsatkich orqaga ketmaydi;
  60 qadamda seans tugaydi.

- [ ] **6. Bosqich 2 — aralash takror**

  `LessonScreen` `pool` sifatida SHU BO'LIM so'zlarini emas, butun tilni
  beradi; `SessionRunner` bosqich 1 tugagach `pickWeakest(oldingi
  so'zlar, 12)` bilan ikkinchi navbatni quradi va sarlavhani
  `Aralash takror` ga o'zgartiradi.

  Oldingi so'z bo'lmasa bosqich O'TKAZIB YUBORILADI.

  Testlar: birinchi darsda bosqich 2 yo'q; oldingi so'zlar bo'lganda
  bosqich 2 boshlanadi va zaif so'zlar kiradi.

- [ ] **7. Yakun paneli — halol hisobot**

  O'zlashtirilmagan so'zlar qolsa: "N ta so'z o'zlashtirildi · M tasi
  keyingi darsga qoldi".

  Testlar: qolgan so'zlar ko'rsatiladi; hammasi o'zlashtirilganda bu
  qator CHIQMAYDI.

- [ ] **8. Tekshiruv va yakun**

  To'liq test to'plami, `npm run lint`, `npm run build`, brauzerda
  jonli seans (yangi baza → 1-dars → 100% gacha → aralash bosqich),
  so'ng commit va push.
