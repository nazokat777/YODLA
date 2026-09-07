# Zaif nuqtalarni aniqlash

**Maqsad:** foydalanuvchi QAYSI so'zni va QAYSI ko'nikmani o'zlashtira
olmayotganini aniqlash, so'ng mashqni aynan o'sha yerga yo'naltirish.

Uch bosqichli ishning IKKINCHISI. Birinchisi:
`2026-09-07-ozlashtirish-halqasi-design.md`.

---

## 1. Muammo

Hozir ilova so'zning QIYINLIGINI biladi (`lapses`, `easeFactor`), lekin
QAYSI KO'NIKMA oqsayotganini bilmaydi.

Bu muhim farq. Bola `apple → olma` ni variantlardan bexato tanishi
mumkin, lekin uni YOZOLMASLIGI mumkin. Bular ikki xil xotira:
tanish (recognition) va eslab chaqirish (recall). Hozirgi ilova
ikkalasini bir xil "bilaman" deb hisoblaydi va mashqni tasodifiy
tanlaydi — ya'ni bola zaif ko'nikmasini chetlab o'tib ketishi mumkin.

Foydalanuvchi ham buni ko'rmaydi: "nimani bilmayapman?" degan savolga
ilovada javob yo'q.

## 2. Model — ko'nikma kesimidagi statistika

`CardRecord` ga yangi maydon (baza 4-versiyasi):

```ts
/** Mashq turi kesimidagi natijalar */
typeStats?: Partial<Record<ExerciseType, { seen: number; wrong: number }>>
```

Har javobda o'sha turning `seen` i oshadi, xato bo'lsa `wrong` ham.

**Nega kartada, alohida jadvalda emas:** statistika kartaning o'zi
haqida va u bilan birga o'chadi. Alohida jadval yetim yozuvlar
qoldirardi va har o'qishda qo'shimcha so'rov talab qilardi.

**MIGRATSIYA:** maydon ixtiyoriy (`?`) — eski kartalarda u yo'q va shu
holicha ishlaydi. Foydalanuvchining SM-2 progressi (`interval`,
`easeFactor`, `repetitions`) TEGILMAYDI.

## 3. Zaif ko'nikmani aniqlash

```
xatoUlushi(tur) = wrong / seen
```

`seen < MIN_SAMPLES` (3) bo'lsa tur BAHOLANMAYDI: bitta xato javobdan
"bu ko'nikma zaif" degan xulosa chiqarish statistik shovqin.

`weakestType(card, available)` — mavjud turlar orasidan eng yuqori
xato ulushi. Teng bo'lsa yoki ma'lumot yetmasa `null`.

## 4. Mashqni yo'naltirish

`pickExerciseType` ga yangi ixtiyoriy parametr: `preferType`.

Berilgan tur pog'onada mavjud bo'lsa, u **50% ehtimol** bilan
tanlanadi; qolgan 50% — odatdagi tasodif.

**NEGA 100% EMAS:** har safar eng yomon mashqni berish bolani faqat
qiynaydi va zeriktiradi — ilovaning butun maqsadiga zid. Bundan
tashqari o'zlashtirish qoidasi ikki XIL turni talab qiladi
(`mastery/progress.ts`), ya'ni bitta turga qadalib qolish so'zni hech
qachon o'zlashtirilgan holatga chiqarmasdi.

50% — kompromiss: zaif ko'nikma ikki barobar tez-tez keladi, lekin
xilma-xillik saqlanadi.

## 5. Foydalanuvchi KO'RADIGAN qism

`ProfileScreen` da yangi bo'lim: **"Ustida ishlash kerak"**

1. **Qiyin so'zlar** — eng zaif 8 tasi (`mastery/weakness.ts`), har
   biri yonida necha marta unutilgani.
2. **Zaif ko'nikma** — eng ko'p xato qilinadigan mashq turi va uning
   o'zbekcha nomi ("Tarjimani yozish — 10 tadan 6 tasi xato").
3. **"Qiyin so'zlarni mashq qilish"** tugmasi — o'sha so'zlar bilan
   o'zlashtirish seansi.

Ma'lumot yetmasa (yangi foydalanuvchi) bo'lim UMUMAN chizilmaydi:
bo'sh ro'yxat "men hech nima bilmayman" degan taassurot qoldirardi.

## 6. Fayllar

| Fayl | Mas'uliyat |
| --- | --- |
| `src/core/db/schema.ts` | `typeStats` maydoni |
| `src/core/db/db.ts` | 4-versiya |
| `src/core/db/cards.repo.ts` | `recordTypeResult` |
| `src/core/mastery/skill.ts` | `errorRate`, `weakestType`, `EXERCISE_TYPE_NAMES` |
| `src/core/exercises/generate.ts` | `preferType` |
| `src/features/session/SessionRunner.tsx` | statistikani yozish, `preferType` uzatish |
| `src/features/profile/WeakSpots.tsx` | ko'rinish |
| `src/features/review/ReviewScreen.tsx` | `?focus=weak` rejimi |

## 7. Qamrov tashqarisida

- O'yinlar va mukofot dizayni — 3-spec.
- Mavzu (topic) kesimidagi statistika: bo'lim darajasidagi zaiflik
  allaqachon o'quv yo'lida ko'rinadi (`learned/total`).
