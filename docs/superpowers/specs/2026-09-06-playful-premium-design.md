# Playful Premium dizayn + GSAP harakat qatlami

**Maqsad:** ilovani "wow" darajasidagi premium ko'rinishga keltirish — bolalarga mos, yorqin, lekin nafis; harakatlar GSAP orqali, bitta preset kutubxonasi bilan.

## 1. Vizual poydevor (`src/index.css`)

- Shrift: `Nunito` (Google Fonts, 600/700/800, `display=swap`); arabcha `Noto Naskh Arabic` qoladi.
- Fon: `body` uchun yumshoq mesh-gradient — 3 radial gradient (brand, sky, flame) 6–8% shaffoflikda, `slate-50` ustida. `fixed` attachment emas (iOS muammosi) — `background-attachment: scroll`.
- Yangi tokenlar: `--color-sky-100/500/700`, `--shadow-pop` (`0 10px 30px -10px rgb(16 185 129 / .35)`), `--radius-card: 1.5rem`.
- `Panel`: `rounded-[--radius-card]`, `shadow-pop`, ustki `inset 0 1px 0 rgb(255 255 255 / .9)`; `interactive` prop → hover ko'tariladi (`-translate-y-0.5`).
- `Button primary`: mavjud 3D bosish + `shine` pseudo-element (`::after` gradient, `translateX(-150%)→150%`, 1.6 s, `infinite`, faqat `hover`/`focus-visible` va `data-shine` da).
- Arab matn: `[dir='rtl']` `line-height: 1.9`; so'z ko'rsatish `text-4xl`.

## 2. Harakat presetlari (`src/lib/motion.ts`)

Har preset `(gsap, target, opts?) => Tween|Timeline`. Umumiy o'rov `withMotion(scope, fn)`:
- `loadGsap()` → `null` bo'lsa hech nima qilmaydi;
- `gsap.context(fn, scope)` yaratadi, `revert` funksiyasini qaytaradi (cleanup uchun).

Presetlar (opacity ISHLATILMAYDI — kontent doim ko'rinadi):
| nom | nima | parametr |
|---|---|---|
| `enterStagger` | `from {y:16, scale:.96}` `stagger .05` `back.out(1.6)` | `.35 s` |
| `pressBounce` | `scale .94→1` `elastic.out(1,.4)` | `.45 s` |
| `countUp` | proxy `{v}` → `textContent` | `.8 s`, `power2.out` |
| `shake` | `x: ±6` 3 marta | `.2 s` (session qoidasi) |
| `flipIn` | `rotationY: dir==='rtl' ? -90 : 90 → 0`, `transformPerspective 800` | `.3 s` |
| `floatLoop` | `y: -6` `yoyo repeat:-1` `sine.inOut` | `1.4 s` |
| `pulseRing` | halqa `scale 1→1.6`, `borderWidth` kamayadi, `repeat:-1` | `1.6 s` |
| `burst` | mavjud `Confetti` + `scale 0→1` halqa | `.6 s` |

RTL: `x`-ga bog'liq presetlar `dir` argumentini oladi.

## 3. Ekranlar

1. **LearningPath** — bo'limlar zigzag (chap/markaz/o'ng) joylashadi, orqada SVG egri chiziq (`stroke-dasharray`, faqat bezak, `aria-hidden`). Joriy bo'lim `floatLoop` + `pulseRing`. Kirishda `enterStagger`.
2. **HomeScreen** — streak/XP kartalari `countUp`; streak olovi CSS `flicker` keyframe.
3. **Session** — savol `flipIn`; variantlar `enterStagger` (`.03` stagger, jami ≤200 ms); to'g'ri → `pressBounce` + XP `countUp`; xato → `shake`. Progress bar `transition: width .4s cubic-bezier(.2,.8,.2,1)`.
4. **SessionSummaryPanel** — XP `countUp`, yulduzlar `enterStagger` `elastic`, `burst`.
5. **AppShell nav** — faol element `pressBounce`; ostida indikator chizig'i `left` transition.

## 4. Cheklovlar

- Animatsiya bezak: DOM avval yakuniy holatda render bo'ladi. `prefers-reduced-motion` → hamma preset no-op.
- Har preset `gsap.context` ichida; komponent `useEffect` cleanup'da `revert()`.
- Mashq ichi ≤200 ms; katta harakat faqat home/path/onboarding/yakun.
- GSAP dangasa chunk bo'lib qoladi. Asosiy bundle o'smasligi kerak (±1 kB).
- Mavjud testlar o'zgarmaydi; presetlar `motion.test.ts`da: reduced-motion → GSAP yuklanmaydi, `withMotion` revert qaytaradi, `countUp` yakunda to'g'ri son.

## 5. Qamrov tashqarisida

So'z rasmlari/emoji, bo'lim nomlarini qisqartirish, 263 bo'limli yo'lni ixchamlash — alohida ish.
