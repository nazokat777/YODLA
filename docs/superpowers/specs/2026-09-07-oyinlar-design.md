# O'yinlar va dofamin qatlami

**Maqsad:** mashq zerikarli bo'lmasin. Bola ilovaga qaytishni
XOHLASIN — majburiyatdan emas.

Uch bosqichli ishning UCHINCHISI. Oldingilari:
`2026-09-07-ozlashtirish-halqasi-design.md`,
`2026-09-07-zaif-nuqtalar-design.md`.

---

## 1. Nima uchun o'yin

Mavjud 7 ta mashq turi — TEKSHIRUV formatlari: savol, javob, baho.
Ular to'g'ri ishlaydi, lekin hammasi bir xil ritmda: savol → javob →
feedback → keyingi savol.

O'yin boshqa narsa qo'shadi: **maqsad** (ochko, rekord, taymer) va
**tugash chizig'i**. Bola "yana bir marta urinib ko'ray" deydi —
mashqni davom ettirish uchun tashqi majburiyat kerak bo'lmaydi.

## 2. To'rt o'yin

| O'yin | Formati | Nima beradi |
| --- | --- | --- |
| **Vaqtga qarshi** | 60 soniya, nechta so'z ulgurasiz | Tezlik bosimi, rekord |
| **Xotira** | Yopiq kartalar, juftini top | So'z↔tarjima bog'lanishi |
| **To'g'rimi?** | "apple = olma. Ha/Yo'q" | Juda tez, ko'p so'z |
| **Kunlik chaqiriq** | Kunlik maxsus vazifa | Har kuni qaytish sababi |

### 2.1 Vaqtga qarshi poyga

60 soniya. Har savol — tanib olish (4 variant). To'g'ri javob +1 ochko
va darhol keyingi savol; xato — 1 soniya qizil, keyin keyingisi.

**Rekord** saqlanadi va yangilanishi alohida nishonlanadi.

### 2.2 Xotira o'yini

6 juft (12 karta) yopiq yotadi. Ikkitasi ochiladi; juft bo'lsa ochiq
qoladi, bo'lmasa qayta yopiladi.

**Hozirgi "juftlash" mashqidan farqi:** u yerda hamma so'z KO'RINIB
turadi va vazifa mantiqiy moslashtirish. Bu yerda kartalar YOPIQ —
ya'ni so'zning joyini ham, ma'nosini ham eslab qolish kerak.

### 2.3 To'g'rimi yoki xato?

"apple = olma. To'g'rimi?" — ikki tugma. Yarmi to'g'ri juft, yarmi
almashtirilgan.

**O'ZLASHTIRISHGA HISOBGA O'TMAYDI:** ikki variantdan bittasini
tanlash 50% ehtimol bilan to'g'ri chiqadi. Buni "bildi" deb hisoblash
o'zlashtirish qoidasining butun maqsadini buzardi
(`core/mastery/progress.ts` dagi izohga qarang).

### 2.4 Kunlik chaqiriq

Har kuni bitta vazifa, kun bo'yicha barqaror (sana urug'idan
hisoblanadi — bir kunda qayta-qayta yangilanmaydi):

- "10 ta so'zni xatosiz bil"
- "Vaqtga qarshi o'yinda 15 ochko to'pla"
- "Bitta darsni to'liq o'zlashtir"

Bajarilganda katta bonus (+50 XP) va ertaga yangisi.

## 3. SM-2 bilan munosabat

O'yinlar SM-2 jadvalini **YANGILAYDI**, lekin `matching` kabi
yumshoq baho bilan: to'g'ri = 4, xato = 2.

**Nega 1 emas:** o'yinda xato ko'pincha vaqt yetmagani yoki
chalg'iganidan bo'ladi, bilmaganidan emas. Uni to'liq "unutdim" deb
hisoblash intervalni asossiz qisqartirardi va bola o'yin o'ynagani
uchun JAZOLANARDI.

`typeStats` ham yoziladi — ko'nikma statistikasi to'planaveradi.

## 4. Dofamin qatlami (o'lchovli)

### 4.1 Omadli karta

Har savolda 8% ehtimol bilan karta "omadli" bo'ladi: XP ikki barobar.
Bu javobdan OLDIN e'lon qilinadi.

**Nega oldindan:** kutish (anticipation) dofaminning asosiy manbai —
mukofotning o'zi emas. O'zgaruvchan mukofot (variable-ratio) esa
barqaror mukofotdan kuchliroq ekani ko'p marta o'lchangan.

**Nega 8%:** har savolda bo'lsa u mukofot bo'lmay qoladi (kutish
yo'qoladi); juda kam bo'lsa umuman sezilmaydi.

### 4.2 So'z kuchi

Tanishtirish va feedback panelida so'zning "kuchi" — SM-2 intervaliga
asoslangan 4 bosqichli kichik indikator (yangi → o'rganilmoqda →
mustahkam → yodlangan).

Bu **progress feedback**: bola o'z o'sishini KO'RADI. Ko'rinmaydigan
progress motivatsiya bermaydi.

### 4.3 Nima QO'SHILMAYDI

Har to'g'ri javobda katta animatsiya, ovoz va uchayotgan ochkolar.
Ular seansni sekinlashtiradi va diqqatni mashqdan chalg'itadi —
foydalanuvchi ritm sekinligidan allaqachon shikoyat qilgan
([[yodla-session-ux]]).

## 5. Joylashuv

Pastki navigatsiyada 5 ta element bor va 320 px da ular allaqachon
tor. **Oltinchisi qo'shilmaydi.**

O'yinlar bosh ekrandan ochiladi: "O'yinlar" kartasi → `/games` —
to'rt o'yin va ularning rekordlari.

## 6. Fayllar

| Fayl | Mas'uliyat |
| --- | --- |
| `src/core/games/speed.ts` | ochko, rekord, taymer holati |
| `src/core/games/memory.ts` | yopiq kartalar taxtasi |
| `src/core/games/truefalse.ts` | juft to'g'rimi |
| `src/core/games/challenge.ts` | kunlik vazifa (sana urug'idan) |
| `src/core/games/luck.ts` | omadli karta |
| `src/core/srs/strength.ts` | so'z kuchi bosqichi |
| `src/features/games/*` | ekranlar |
| `src/core/db/schema.ts` | `ProfileRecord.gameBests` |

## 7. Qamrov tashqarisida

- Ko'p o'yinchili yoki real vaqtdagi musobaqa (liga alohida tizim).
- Ovoz effektlari — mavjud `soundEnabled` yetarli.
