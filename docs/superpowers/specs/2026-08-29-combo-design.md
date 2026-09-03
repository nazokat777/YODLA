# Kombo va benuqson dars — dizayn

**Maqsad:** o'yin hissi qo'shish — hech nimani tortib olmasdan.

## Nega yuraklar YO'Q

Loyihaning o'z qoidasi (`src/core/gamification/xp.ts`):

> XATO HAM XP BERADI. Foydalanuvchi urinishi uchun taqdirlanadi, chunki
> xato javob ham o'rganish (TZ 4: "xatoda jazolamay tushuntirish").

Yuraklar buning teskarisi va uchta aniq zarari bor: SM-2 uchun xato —
ma'lumot, uni jazoga aylantirsak bola taxmin qilishdan qo'rqadi;
Duolingoda yuraklar monetizatsiya vositasi, bu yerda esa ular faqat
"ilova yopildi" degani; va o'rganishdan chetlatilgan bola qaytmasligi
mumkin.

Shuning uchun o'yin hissi FAQAT mukofot tomonidan quriladi.

## 1. Kombo

Ketma-ket to'g'ri javoblar sanog'i. Yutish mumkin, yutqazish mumkin emas.

| javob | kombo |
| --- | --- |
| `correct` | +1 |
| `almost` | **o'zgarmaydi** |
| `wrong` | 0 ga tushadi |

**`almost` nega komboni buzmaydi:** u imlo xatosi bilan berilgan TO'G'RI
javob (`typoTolerance`). O'nlik komboni bitta harf uchun yo'qotish
adolatsiz bo'lardi va foydalanuvchini yozishdan qo'rqitardi.

**Bonus:** har 5-chi ketma-ket to'g'ri javob uchun **+5 XP**. Ya'ni
5, 10, 15 da bonus beriladi. Pog'onali bonus (har javobga +1) emas:
"🔥 5 — +5 XP" ekranda bir qarashda o'qiladi, kasrli koeffitsient esa
tushunarsiz.

**Ko'rsatish:** kombo 2 dan boshlab progress panelida ko'rinadi. "🔥 1"
shovqin — u har to'g'ri javobdan keyin chiqaverardi.

## 2. Benuqson dars

`finalizeSession` allaqachon `answered > 0 && wrong === 0` ni aniqlaydi
va nishon uchun yozib qo'yadi. Endi u **+15 XP** ham beradi.

15 — kunlik maqsad bonusidan (20) kichik: kunlik odat benuqsonlikdan
muhimroq.

## Arxitektura

| fayl | vazifa |
| --- | --- |
| `src/core/gamification/combo.ts` (yangi) | `nextCombo`, `comboBonusXp` — sof |
| `src/core/gamification/xp.ts` | `PERFECT_SESSION_BONUS_XP` |
| `src/core/db/progress.repo.ts` | `recordAnswer` ga `bonusXp`; `finalizeSession` benuqson XP beradi |
| `src/features/session/SessionRunner.tsx` | komboni yuritadi va ko'rsatadi |

**Kombo SAQLANMAYDI.** U seans ichidagi holat — ilova yopilsa yo'qoladi.
Uni bazaga yozish streak bilan chalkashtirardi: streak — kunlar,
kombo — javoblar.

**XP yozish yo'li bitta bo'lib qoladi.** Kombo bonusi `recordAnswer` ga
argument sifatida uzatiladi va o'sha tranzaksiyada yoziladi — alohida
yozuv qilinsa, ikkalasi orasida ilova yopilganda XP yo'qolardi.

## Testlar

- `correct` komboni oshiradi, `wrong` nolga tushiradi, `almost` tegmaydi
- bonus faqat 5, 10, 15 da beriladi; 4 va 6 da yo'q
- `recordAnswer` bonusni jami XP ga qo'shadi
- benuqson seans +15 XP beradi; bitta xato bo'lsa bermaydi
- kombo 2 dan ko'rinadi, 1 da ko'rinmaydi

## Nima o'zgarmaydi

`XP_PER_VERDICT` qiymatlari, kunlik maqsad bonusi, nishonlar, streak,
SM-2, dars bosqichlari.
