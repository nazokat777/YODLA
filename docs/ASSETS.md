# Tashqi resurslar va ularning litsenziyasi

Bu faylda ilovada ishlatilgan, **boshqalar yaratgan** resurslar qayd etiladi.
Loyiha ochiq repoda va jonli saytda turgani uchun har bir tashqi fayl qayerdan
olingani va qanday litsenziya bilan kelgani yozib boriladi.

## Personaj

Ilovada tashqi rasm sifatidagi personaj YO'Q. Avvalgi 3D feya rasmi
olib tashlandi: uslubi ilovaning qolgan qismiga yopishmasdi va kichik
o'lchamda sifatsiz ko'rinardi.

O'rniga `src/components/ui/Emblem.tsx` — brend ranglarida chizilgan SVG
belgilar (tanga, kubok, nishon, uchqun, raketa). Ular har o'lchamda
tiniq, litsenziya talab qilmaydi va paketga nol kilobayt qo'shadi.

## Jumlalar ("gap ichida" mashqi uchun)

| Fayl | Manba | Litsenziya |
| ---- | ----- | ---------- |
| `src/content/decks/sentences-en.ts` | [Tatoeba](https://tatoeba.org) (eng) | CC-BY 2.0 FR |
| `src/content/decks/sentences-ru.ts` | [Tatoeba](https://tatoeba.org) (rus) | CC-BY 2.0 FR |
| `src/content/decks/sentences-ar.ts` | [Tatoeba](https://tatoeba.org) (ara) | CC-BY 2.0 FR |

**CC-BY 2.0 FR** atributni talab qiladi — manba shu yerda va generator
faylining sarlavhasida ko'rsatilgan.

**Qanday tayyorlangan:** `scripts/add-sentences.py` Tatoeba eksportini yuklab
oladi va har so'zga eng qisqa mos jumlani biriktiradi (3–8 so'z, so'z aynan
shu shaklda va alohida so'z sifatida uchraydi). Ingliz: 1559 jumla (so'zlarning
96%), rus: 2584 (71%), arab: 862 (38%).

Arab tilida qidirish HARAKATSIZ shakl bo'yicha boradi: lug'atda so'z harakatli
yoziladi ("مَرْحَبًا"), Tatoeba jumlalarida esa deyarli har doim harakatsiz
("مرحبا"). Aynan taqqoslansa bironta ham moslik topilmasdi.

Darsliklarning O'Z matnidan olingan arab jumlalari ham saqlanib qoladi
(`scripts/import-vocab.mjs`) — ular ustiga yozilmaydi.

## O'zimiz yaratgan resurslar

`public/icon-*.png` va `public/apple-touch-icon.png` — `scripts/make-icons.mjs`
bilan yaratilgan (tashqi manba yo'q, litsenziya masalasi tug'ilmaydi).

## So'z rasmlari

`public/word-images/` — 251 ta SVG rasmcha, so'z ma'nosini ko'rsatadi.

| Manba | Litsenziya |
| --- | --- |
| [OpenMoji](https://openmoji.org) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

Fayl nomi — Unicode kod nuqtasi (`1F34E.svg` — olma). Xarita
`src/content/wordImages.ts` da: kalit O'ZBEKCHA tarjima, shuning uchun
bitta rasm uchala tilga ham xizmat qiladi.

Yangilash: `node scripts/fetch-word-images.mjs`. Skript OpenMoji'da
topilmagan kodlarni ro'yxat qilib chiqaradi va nol bo'lmagan kod bilan
tugaydi.

**Kalit so'z bo'yicha avtomatik qidiruv YO'Q.** Rasmlar aniq Unicode
kodi bo'yicha olinadi, ya'ni natija oldindan ma'lum — ilova bolalar
uchun mo'ljallangan va tasodifiy rasm tushishi mumkin emas.

CC BY-SA 4.0 talab qiladigan atribut shu bo'lim orqali beriladi.
