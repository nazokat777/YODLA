# Savol ekraniga jon kiritish — dizayn

**Muammo:** ilova hamma joyda jonli, faqat foydalanuvchi vaqtining 95% ini
o'tkazadigan joyda emas.

## O'lchangan holat

| | holat |
| --- | --- |
| Maskot ko'rinadigan ekranlar | onboarding (4), liga, dars yakuni |
| Maskot ko'rinmaydigan ekran | **savol ekrani** |
| GSAP ishlatiladigan joylar | bosh ekran yo'li, konfetti, dars yakuni |
| Savol-javob lahzasidagi harakat | **yo'q** |
| Variant tugmasining uslubi | `bg-white` + ingichka chegara |
| Loyihaning o'z tugma uslubi | `shadow-[0_4px_0_0]`, bosilganda soya yo'qoladi |

Ya'ni "bosiladigan" tuyg'u beradigan uslub allaqachon yozilgan —
variantlar undan foydalanmaydi.

## Yechim — to'rt qism

### 1. Variantlar bosiladigan kartaga aylanadi

`ChoiceGrid` tugmalari `Button` bilan bir xil "qalin" ko'rinish oladi:
pastdagi qattiq soya, bosilganda tugma pastga tushib soya yo'qoladi.

Har holatning o'z soya rangi bo'ladi (`idle`, `selected`, `correct`,
`wrong`). Soya YAGONA belgi emas — mavjud ikonka va ko'rinmas matn
o'z joyida qoladi (WCAG 1.4.1, daltonizm).

### 2. Javobga harakat bilan javob berish

`ChoiceGrid` javob ochilganda:

- **to'g'ri** — tanlangan variant bir marta "sakraydi" (scale 1 → 1.05 → 1)
- **xato** — tanlangan variant qaltiraydi (x: −6 → 6 → −4 → 4 → 0)

### 3. Savollar orasida kirish harakati

Yangi mashq chizilganda konteyner pastdan biroz siljib chiqadi.

### 4. Maskot javobdan keyin

`FeedbackBar` da kichik maskot: to'g'ri va "deyarli" da quvnoq, xatoda
tinch. Savol ekranining o'zida EMAS — u yerda joy tor va maskot
diqqatni savoldan tortib olardi.

## Harakat qoidalari (buzilmaydi)

**FAQAT transform.** `opacity` animatsiya qilinmaydi. Sabab tarixiy:
o'quv yo'lida `opacity` bilan animatsiya qilingan bo'limlar fon tabda
yoki to'xtatilgan `rAF` da ko'rinmas bo'lib qolardi. Siljish va masshtab
yarim yo'lda to'xtasa ham o'qilaveradi.

**Harakat — BEZAK.** `loadGsap()` `null` qaytarsa (foydalanuvchi
harakatni kamaytirgan yoki kutubxona yuklanmagan) interfeys yakuniy
holatida qoladi va hamma narsa ishlaydi. Testlar aynan shuni tekshiradi.

**`clearProps`** har animatsiyadan keyin — element o'z uslubiga qaytadi.

**Yangi paket yo'q, yangi rasm yo'q.** GSAP, `buttonStyles` va
`Mascot` allaqachon loyihada.

## Fayllar

| fayl | vazifa |
| --- | --- |
| `src/features/session/ChoiceGrid.tsx` | qalin tugma uslubi + javob harakati |
| `src/features/session/FeedbackBar.tsx` | maskot |
| `src/features/session/SessionRunner.tsx` | savol kirish harakati |

## Testlar

- Variant tugmasida soya sinfi bor (`shadow-`)
- To'g'ri/xato ikonkasi va ko'rinmas matni O'ZGARMAYDI (regressiya)
- `FeedbackBar` to'g'ri javobda quvnoq, xatoda tinch maskot ko'rsatadi
- GSAP bo'lmaganda ham variantlar ko'rinadi va bosiladi

## Nima o'zgarmaydi

Mashq mantig'i, baholash, bosqichlar, ranglar palitrasi, WCAG kontrast
qiymatlari, ekran o'quvchi uchun matnlar.
