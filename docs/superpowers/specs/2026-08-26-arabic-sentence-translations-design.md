# Arabcha jumla tarjimalari — dizayn

**Sana:** 2026-08-26
**Holat:** tasdiqlangan

## Maqsad

Arabcha kartalarga "jumla qurish" (`construction`) mashqini ochish. Bu mashq
jumlaning O'ZBEKCHA tarjimasini savol sifatida ko'rsatadi va foydalanuvchi
arabcha jumlani so'zlardan yig'adi.

Hozir u arabchada faqat qo'lda yozilgan 132 kartada ishlaydi (2293 dan).

## Manba: darslikning o'z tarjimasi

Mabdaul qiroat manbasida (`qiroat_lessons.json`) har darsning `reading`
maydoni bilan bir qatorda `translation` maydoni bor — dars matnining to'liq
o'zbekcha tarjimasi. U 169 darsdan **52 tasida** mavjud.

Bu ODAM yozgan tarjima. Muqobillar o'lchandi va rad etildi:

- **Tatoeba o'zbekcha korpusi** — butun korpus 1218 jumla. Bizning lug'at
  bilan kesishmasi amalda nol.
- **Mashina tarjimasi** — o'zbekchaga sifati past, ilovadan bolalar
  foydalanadi, noto'g'ri tarjima noto'g'ri o'rganish demak.

## Juftlash

1. `reading` va `translation` bir xil qoida bilan jumlalarga bo'linadi.
2. Jumlalar soni AYNAN teng bo'lgan darslar olinadi — 52 tadan **39 tasi**.
3. Juftlar indeks bo'yicha biriktiriladi: `arabcha[i] ↔ o'zbekcha[i]`.

### Mos kelmagan darslar butunlay tashlanadi

13 ta darsda sonlar farq qiladi (masalan 24/15, 15/20). Ularda tarjima
OLINMAYDI — jumlaning o'zi qoladi (u "gap ichida" mashqiga xizmat qiladi),
faqat "jumla qurish" berilmaydi.

Nega taxmin qilinmaydi: noto'g'ri juftlangan tarjima foydalanuvchiga
NOTO'G'RI MA'NO o'rgatadi. Kam mashq — noto'g'ri mashqdan yaxshiroq.

### Har juftga qo'shimcha tekshiruv

"Mos" deb topilgan darsda ham bo'linish adashishi mumkin, shuning uchun:

- o'zbekcha tomonda arab harfi bo'lmasligi kerak;
- ikkala tomon ham bo'sh bo'lmasligi kerak;
- uzunliklar nisbati 0.3x–4x oralig'ida bo'lishi kerak.

Tekshiruvdan o'tmagan juft — tarjimasiz qoladi.

## Kutilayotgan natija

Arabcha "jumla qurish": 132 → ~330 karta.

## Testlar

`decks.test.ts` dagi "tarjimasiz jumla o'z so'zini albatta ichiga oladi"
tekshiruvi TARJIMASIZ jumlalarga qo'llanadi. Tarjima qo'shilgan kartalar
undan chiqadi, ya'ni qamrov torayadi. Buning o'rniga tarjimali juftlar
uchun alohida tekshiruv yoziladi:

- jumla tarjimasida arab harfi qolmagan;
- jumla va tarjimasi uzunlik jihatidan aqlli nisbatda.

## Qo'lda tekshirish

Import qilgach tasodifiy juftlar o'qib solishtiriladi (ma'no mos keladimi),
so'ng brauzerda haqiqiy "jumla qurish" mashqi arabchada ochib ko'riladi.
