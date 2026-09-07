# Zaif nuqtalarni aniqlash — reja

Spec: `docs/superpowers/specs/2026-09-07-zaif-nuqtalar-design.md`

Har vazifa: test → qizil → kod → yashil → commit. Yangi test o'zi
ushlashi kerak bo'lgan xatoni ushlashini isbotlash uchun implementatsiya
vaqtincha buziladi. `npm run build` MAJBURIY.

- [ ] **1. Baza 4-versiyasi + `recordTypeResult`**
  `typeStats` maydoni; `recordTypeResult(cardId, type, wrong)` atomik
  yangilaydi. Testlar: eski baza migratsiyasi SM-2 progressini saqlaydi;
  `seen`/`wrong` to'g'ri ortadi; yo'q kartada yiqilmaydi.

- [ ] **2. `core/mastery/skill.ts`**
  `errorRate(stats)`, `weakestType(card, available)` (`MIN_SAMPLES = 3`),
  `EXERCISE_TYPE_NAMES`. Testlar: kam namunada `null`; eng yomon tur
  tanlanadi; mavjud bo'lmagan tur tanlanmaydi.

- [ ] **3. `preferType` — mashqni yo'naltirish**
  `pickExerciseType` ga `preferType`; 50% ehtimol. Testlar: berilgan tur
  tez-tez chiqadi, lekin BOSHQA turlar ham chiqadi (xilma-xillik).

- [ ] **4. Seansda statistikani yozish va ishlatish**
  `SessionRunner` har javobda `recordTypeResult`; mashq yaratishda
  `preferType: weakestType(...)`. Testlar: javobdan keyin statistika
  yoziladi.

- [ ] **5. "Ustida ishlash kerak" bo'limi**
  `WeakSpots.tsx`: qiyin so'zlar + zaif ko'nikma + mashq tugmasi.
  Ma'lumot yetmasa chizilmaydi. Testlar: bo'sh holatda yo'q; qiyin
  so'zlar ro'yxati chiqadi.

- [ ] **6. Qiyin so'zlar mashqi**
  `/review?focus=weak` — eng zaif so'zlar bilan o'zlashtirish seansi.
  Testlar: faqat zaif so'zlar olinadi.

- [ ] **7. Tekshiruv:** to'liq testlar, lint, build, brauzerda jonli
  seans, commit va push.
