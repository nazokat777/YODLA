# Mnemonika: yozish, tahrirlash, boshqarish (dizayn)

**Sana:** 2026-08-15
**Holat:** tasdiqlangan, amalga oshirishga tayyor
**Qamrov:** mavjud yarim qurilgan mnemonika imkoniyatini yakunlash.

## Muammo

Mnemonika poydevori bor: `Card.mnemonic` maydoni, `setMnemonic()` funksiyasi,
va `FeedbackBar` ichidagi yozish oynasi. Lekin ustki qavat qurilmagan:

1. Yozish oynasi **faqat mnemonika hali yo'q bo'lsa** chiqadi — bir marta
   yozgandan keyin uni **o'zgartirib bo'lmaydi**.
2. O'chirish yo'q (`setMnemonic` bo'sh satrni qabul qiladi, lekin UI'da
   bunga yo'l yo'q).
3. Yozish faqat **xato javob** lahzasida mumkin. Foydalanuvchi o'zi bilgan,
   lekin doim adashadigan so'ziga oldindan assotsiatsiya qo'sha olmaydi.
4. Yozilganlarni **bir joyda ko'rish** imkoni yo'q.
5. Mnemonika uchun **bironta test yo'q**.

## Yechim

Uch qism: ma'lumot qatlamiga bitta so'rov, mashq ekraniga kichik tuzatish,
va yangi "Assotsiatsiyalarim" ekrani.

### Nima QILINMAYDI (ongli qaror)

- **Ilova mnemonika taklif qilmaydi.** Manba qidirildi: o'zbek tili uchun
  tayyor mnemonika to'plami mavjud emas ([EMNLP 2024](https://aclanthology.org/2024.findings-emnlp.316.pdf)
  tadqiqoti ham "so'z va mnemonikalar to'plami mavjud emas" deb yozadi).
  Sun'iy intellekt varianti tashqi API, kalit va pul talab qiladi hamda
  offline ishlamaydi. Bundan tashqari o'zi o'ylab topilgan assotsiatsiya
  tayyorisidan yaxshiroq esda qoladi (*generation effect*).
- **Mnemonika mashq PAYTIDA ko'rsatilmaydi** — faqat javobdan keyin. Aks
  holda u javobni oshkor qilib, retrieval practice'ni buzardi.
- **To'g'ri javob oqimiga tegilmaydi.** U 900 ms da avtomatik o'tadi
  (`AUTO_ADVANCE_MS`); u yerga oyna qo'yish seans ritmini buzardi va
  foydalanuvchi uni ko'rishga ham ulgurmasdi.

## 1. Ma'lumot qatlami

`setMnemonic(cardId, text)` **o'zgarishsiz qoladi** — bo'sh satr berilsa
mnemonikani o'chiradi, ya'ni "o'chirish" allaqachon qo'llab-quvvatlanadi.

Bitta yangi so'rov:

```ts
/** Mnemonikasi bor kartalar (so'z bo'yicha tartiblangan) */
getMnemonicCards(language: LanguageCode): Promise<CardRecord[]>
```

## 2. Mashq ekrani (`FeedbackBar`)

Hozirgi shart:

```tsx
{verdict !== 'correct' && !exercise.card.mnemonic && <MnemonicEditor …/>}
```

`!exercise.card.mnemonic` sharti olib tashlanadi. Mnemonika bor bo'lsa u
ko'rsatiladi va yoniga **"Tahrirlash"** tugmasi qo'yiladi; bosilganda o'sha
`MnemonicEditor` mavjud matn bilan ochiladi.

`MnemonicEditor` `initialValue` prop oladi va saqlagach yangi matnni
ko'rsatadi.

## 3. Yangi ekran: "Assotsiatsiyalarim"

Manzil: `/mnemonics` (`PATHS.mnemonics`), Profil ekranidan havola.

```
┌─────────────────────────────────┐
│ 🔍 So'z qidirish...             │
├─────────────────────────────────┤
│ bread — non                     │
│ 💡 birodar non olib keldi       │
│                    [✏️]  [🗑️]   │
└─────────────────────────────────┘
```

**Xulqi:**

- Ochilganda faqat **mnemonikasi bor** kartalar ko'rinadi.
- Qidiruv maydoniga yozilsa — shu tildagi **barcha** kartalar orasidan
  so'z yoki tarjima bo'yicha qidiradi. Shu tariqa istalgan so'zga yangi
  assotsiatsiya qo'shiladi.
- Qidiruv **xotirada** bajariladi (`getAllCards` bir marta yuklanadi):
  har harfda bazaga so'rov yuborish ~4000 kartada ortiqcha yuk.
- Natijalar **50 ta bilan cheklanadi** — 9942 kartani chizish telefonni
  qotirardi. Cheklov ochiq yoziladi ("yana N ta — qidiruvni aniqlashtiring").
- ✏️ tahrirlaydi, 🗑️ o'chiradi (tasdiq so'ralmaydi: matn qayta yozilishi
  mumkin va yo'qotish arzimas).
- Bo'sh holat: "Hali assotsiatsiya yozmagansiz. Takrorlash paytida xato
  qilganingizda yoki shu yerda qidirib qo'shing."

## Fayl xaritasi

| Fayl | O'zgarish |
| ---- | --------- |
| `src/core/db/cards.repo.ts` | `getMnemonicCards()` |
| `src/app/paths.ts` | `mnemonics: '/mnemonics'` |
| `src/app/App.tsx` | yangi marshrut (`AppShell` ichida) |
| `src/features/session/FeedbackBar.tsx` | tahrirlash tugmasi, `initialValue` |
| `src/features/mnemonics/MnemonicsScreen.tsx` | yangi ekran |
| `src/features/mnemonics/MnemonicRow.tsx` | bitta qator (ko'rsatish/tahrirlash) |
| `src/features/profile/ProfileScreen.tsx` | havola |

## Testlar

**`cards.repo.test.ts`** — `getMnemonicCards` faqat mnemonikali kartalarni
qaytaradi va tilni ajratadi; `setMnemonic` bo'sh satrda o'chiradi va **SM-2
holatiga tegmaydi**.

**`FeedbackBar`** — mnemonika bor kartada "Tahrirlash" chiqadi; bosilganda
maydon mavjud matn bilan to'ladi; to'g'ri javobda oyna umuman chiqmaydi.

**`MnemonicsScreen`** — ochilganda faqat mnemonikali kartalar; qidiruv
mnemonikasizlarni ham topadi; saqlash va o'chirish ishlaydi; 50 dan ortiq
natijada cheklov xabari chiqadi; bo'sh holat matni.

## Qamrovdan tashqarida (YAGNI)

- Mnemonikani bulutga sinxronlash (liga faqat ism va XP yuboradi — bu
  ongli maxfiylik qarori)
- Rasm biriktirish
- Mnemonikani boshqalar bilan ulashish
- Ohangdosh so'z generatori (keyingi bosqichda ko'rib chiqilishi mumkin)
