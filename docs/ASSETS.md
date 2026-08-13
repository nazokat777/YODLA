# Tashqi resurslar va ularning litsenziyasi

Bu faylda ilovada ishlatilgan, **boshqalar yaratgan** resurslar qayd etiladi.
Loyiha ochiq repoda va jonli saytda turgani uchun har bir tashqi fayl qayerdan
olingani va qanday litsenziya bilan kelgani yozib boriladi.

## Personaj (mascot)

| Fayl | Manba | Litsenziya |
| ---- | ----- | ---------- |
| `src/assets/mascot-idle.webp` | [Pixabay #7096399](https://pixabay.com/illustrations/fairy-girl-3d-rendering-cartoon-7096399/) | Pixabay Content License |
| `src/assets/mascot-happy.webp` | [Pixabay #7096405](https://pixabay.com/illustrations/fairy-girl-3d-rendering-cartoon-7096405/) | Pixabay Content License |

**Pixabay Content License:** tijorat maqsadida ham bepul, atribut talab
qilinmaydi. Taqiqlanadi: rasmni o'zgartirmasdan boshqa stok saytda qayta
tarqatish. Bizda bunday holat yo'q — rasmlar ilova ichida personaj sifatida
ishlatiladi.

**Qanday tayyorlangan:** asl PNG (1255×1280) shaffof fon bilan yuklab olingan,
ko'rinadigan qism bo'yicha kesilgan, kvadratga joylangan, 256×256 ga
kichraytirilgan va WebP (sifat 88) ga o'girilgan — 74 KB → 19 KB.

## Jumlalar ("gap ichida" mashqi uchun)

| Fayl | Manba | Litsenziya |
| ---- | ----- | ---------- |
| `src/content/decks/sentences-en.ts` | [Tatoeba](https://tatoeba.org) (eng) | CC-BY 2.0 FR |
| `src/content/decks/sentences-ru.ts` | [Tatoeba](https://tatoeba.org) (rus) | CC-BY 2.0 FR |

**CC-BY 2.0 FR** atributni talab qiladi — manba shu yerda va generator
faylining sarlavhasida ko'rsatilgan.

**Qanday tayyorlangan:** `scripts/add-sentences.py` Tatoeba eksportini yuklab
oladi va har so'zga eng qisqa mos jumlani biriktiradi (3–8 so'z, so'z aynan
shu shaklda va alohida so'z sifatida uchraydi). Ingliz: 1559 jumla (so'zlarning
96%), rus: 2584 (71%).

Arab jumlalari Tatoeba'dan EMAS — ular Mabdaul qiroat darsliklarining o'z
matnidan olingan (`scripts/import-vocab.mjs`).

## O'zimiz yaratgan resurslar

`public/icon-*.png` va `public/apple-touch-icon.png` — `scripts/make-icons.mjs`
bilan yaratilgan (tashqi manba yo'q, litsenziya masalasi tug'ilmaydi).
