/**
 * Animatsiya qatlami.
 *
 * ASOSIY QOIDA: animatsiya — bezak. Interfeys animatsiyasiz ham to'g'ri
 * bo'lishi shart, shuning uchun bu modul hech qachon xato tashlamaydi va
 * kerak bo'lmasa GSAP umuman yuklanmaydi.
 */
import type { gsap as GsapNamespace } from 'gsap'

type GsapLike = typeof GsapNamespace

/**
 * Foydalanuvchi tizim sozlamasida harakatni kamaytirishni so'raganmi.
 *
 * Bu did masalasi emas: harakat vestibulyar buzilishi bor odamlarda bosh
 * aylanishi va ko'ngil aynishini keltirib chiqaradi.
 */
export function prefersReducedMotion(): boolean {
  if (typeof matchMedia !== 'function') return false

  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Qo'shimcha GSAP plaginlari.
 *
 * Har biri ALOHIDA so'raladi: hammasini birdan yuklash dangasa
 * bo'lakni ikki barobar kattalashtirardi, holbuki bitta ekranga
 * odatda bittasi kerak.
 */
export type MotionPlugin = 'scrollTrigger' | 'drawSVG' | 'splitText' | 'physics2D'

/** Yuklangan plaginlar — ikkinchi marta yuklanmasin */
const registered = new Set<MotionPlugin>()

/**
 * `SplitText` KLASSI.
 *
 * `gsap.registerPlugin(SplitText)` uni `gsap.SplitText` sifatida
 * QO'SHMAYDI — bu tuzoqqa bir marta tushildi va sarlavha animatsiyasi
 * jimgina ishlamay turdi. Klass yuklanganda shu yerda saqlanadi.
 */
let SplitTextClass: SplitTextConstructor | null = null

type SplitTextConstructor = new (
  target: Element,
  config: Record<string, unknown>,
) => { chars: Element[]; revert: () => void }

/**
 * Plaginni yuklab, GSAP'ga ro'yxatdan o'tkazadi.
 *
 * Xato bo'lsa JIMGINA o'tadi: plagin yo'qligi animatsiyani
 * yo'qotadi, interfeysni emas.
 */
async function registerPlugin(gsap: GsapLike, plugin: MotionPlugin): Promise<void> {
  if (registered.has(plugin)) return

  try {
    switch (plugin) {
      case 'scrollTrigger': {
        const module = await import('gsap/ScrollTrigger')
        gsap.registerPlugin(module.ScrollTrigger)
        break
      }
      case 'drawSVG': {
        const module = await import('gsap/DrawSVGPlugin')
        gsap.registerPlugin(module.DrawSVGPlugin)
        break
      }
      case 'splitText': {
        const module = await import('gsap/SplitText')
        gsap.registerPlugin(module.SplitText)
        SplitTextClass = module.SplitText as unknown as SplitTextConstructor
        break
      }
      case 'physics2D': {
        const module = await import('gsap/Physics2DPlugin')
        gsap.registerPlugin(module.Physics2DPlugin)
        break
      }
    }

    registered.add(plugin)
  } catch (error) {
    console.error(`GSAP plagini yuklanmadi (${plugin}):`, error)
  }
}

/**
 * GSAP'ni dangasa yuklaydi.
 *
 * `null` qaytishi mumkin: harakat kamaytirilgan yoki kutubxona yuklanmadi.
 * Chaqiruvchi shu bitta tekshiruv bilan cheklanadi — animatsiya bo'lmasa
 * interfeys shunchaki yakuniy holatida qoladi.
 */
export async function loadGsap(): Promise<GsapLike | null> {
  if (prefersReducedMotion()) return null

  try {
    const module = await import('gsap')
    return module.gsap
  } catch (error) {
    console.error('GSAP yuklanmadi:', error)
    return null
  }
}

/* ------------------------------------------------------------------ */
/* Presetlar                                                            */
/* ------------------------------------------------------------------ */

/**
 * Animatsiyani `gsap.context` ichida ishga tushiradi va uni qaytarish
 * funksiyasini beradi. Komponent `useEffect` cleanup'ida shu funksiyani
 * chaqiradi — DOM toza qoladi.
 *
 * Harakat kamaytirilgan, GSAP yuklanmagan yoki `scope` yo'q bo'lsa `fn`
 * UMUMAN chaqirilmaydi — presetlar reduced-motion tekshiruvini o'zlari
 * qilmaydi, hammasi shu bitta joyda.
 */
export async function withMotion(
  scope: Element | null,
  fn: (gsap: GsapLike) => void,
  plugins: readonly MotionPlugin[] = [],
): Promise<() => void> {
  if (!scope) return () => {}

  const gsap = await loadGsap()
  if (!gsap) return () => {}

  for (const plugin of plugins) await registerPlugin(gsap, plugin)

  // Plagin yuklanguncha komponent yo'q qilingan bo'lishi mumkin
  if (!scope.isConnected) return () => {}

  const context = gsap.context(() => fn(gsap), scope)
  return () => context.revert()
}

type Target = Element | Element[] | NodeListOf<Element> | string

/**
 * Elementlar ketma-ket "otilib" chiqadi.
 *
 * OPACITY ATAYLAB YO'Q (hamma presetda): animatsiya tugamay qolsa (fon
 * tab, to'xtatilgan rAF, unmount) kontent ko'rinmas bo'lib qolardi.
 * Siljish va masshtab yarim yo'lda ham o'qiladi.
 */
export function enterStagger(
  gsap: GsapLike,
  targets: Target,
  options: { stagger?: number; duration?: number; y?: number } = {},
) {
  const { stagger = 0.05, duration = 0.35, y = 16 } = options

  if (!hasTarget(gsap, targets)) return null

  return gsap.from(targets, {
    y,
    scale: 0.96,
    duration,
    stagger,
    ease: 'back.out(1.6)',
    clearProps: 'transform',
  })
}

/** Bosilgan element bir marta "sakraydi" — javob qabul qilingani sezilsin */
export function pressBounce(gsap: GsapLike, target: Target) {
  return gsap.fromTo(
    target,
    { scale: 0.94 },
    { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.4)', clearProps: 'transform' },
  )
}

/**
 * Raqam 0 dan `value` gacha sanab chiqadi.
 *
 * Element JSX'da YAKUNIY qiymat bilan chiziladi — animatsiya bo'lmasa
 * foydalanuvchi to'g'ri sonni ko'radi, 0 ni emas. Oxirgi kadrda aynan
 * `value` yoziladi (yaxlitlash xatosi bo'lmasin).
 */
export function countUp(gsap: GsapLike, node: Element, value: number, duration = 0.8) {
  const counter = { value: 0 }

  return gsap.to(counter, {
    value,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      node.textContent = String(Math.round(counter.value))
    },
    onComplete: () => {
      node.textContent = String(value)
    },
  })
}

/** Xato javob — qisqa qaltirash. Jami ≤ 200 ms: mashq ritmi qoidasi */
export function shake(gsap: GsapLike, target: Target) {
  return gsap.fromTo(
    target,
    { x: 0 },
    { x: 6, duration: 0.05, yoyo: true, repeat: 3, clearProps: 'transform' },
  )
}

/**
 * Yangi savol yon tomondan siljib kiradi.
 *
 * RTL'da teskari tomondan: arabcha o'quvchi uchun "keyingi" — chap.
 *
 * NEGA AYLANISH (rotationY) EMAS: 3D aylanish sinab ko'rilgan va rad
 * etilgan — animatsiya davomida BUTUN mashq, variantlar bilan birga,
 * qiyshayib turadi va matn o'qilmaydi. Bola uchun bu bir zumlik "nima
 * bo'lyapti?" degan to'siq. Yassi siljish esa yarim yo'lda ham o'qiladi.
 */
export function slideIn(gsap: GsapLike, target: Target, dir: 'ltr' | 'rtl' = 'ltr') {
  return gsap.fromTo(
    target,
    { x: dir === 'rtl' ? -28 : 28 },
    { x: 0, duration: 0.28, ease: 'power3.out', clearProps: 'transform' },
  )
}

/**
 * Nishon HAQIQATAN mavjudmi.
 *
 * Bo'sh tanlovda GSAP "target not found" deb ogohlantiradi va konsol
 * shu xabarlar bilan to'lib ketardi — haqiqiy xatolar orasida
 * ko'rinmay qolardi.
 */
function hasTarget(gsap: GsapLike, target: Target): boolean {
  return gsap.utils.toArray<Element>(target).length > 0
}

/** Sekin suzish — ko'z qayerga qarashni biladi (joriy bo'lim) */
export function floatLoop(gsap: GsapLike, target: Target) {
  if (!hasTarget(gsap, target)) return null

  return gsap.to(target, { y: -6, duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' })
}

/** Kengayib so'nadigan halqa (element `opacity` bilan boshlanadi — u bezak) */
export function pulseRing(gsap: GsapLike, target: Target) {
  if (!hasTarget(gsap, target)) return null

  return gsap.fromTo(
    target,
    { scale: 1, opacity: 0.7 },
    { scale: 1.7, opacity: 0, duration: 1.6, repeat: -1, ease: 'power1.out' },
  )
}

/* ------------------------------------------------------------------ */
/* Premium presetlar (plagin talab qiladiganlari)                       */
/* ------------------------------------------------------------------ */

/**
 * Elementlar EKRANGA KIRGANDA birma-bir chiqadi (`scrollTrigger`).
 *
 * NEGA KERAK: o'quv yo'lida 260 dan ortiq bo'lim bor va ularning
 * hammasini ochilishda animatsiyalash isrof — foydalanuvchi bir vaqtda
 * beshtasini ko'radi. Skroll bo'yicha ochilish ham chiroyliroq, ham
 * arzonroq.
 *
 * `once: true` — element bir marta ochiladi va qaytib yopilmaydi:
 * yuqoriga qaytganda hamma narsa qayta sakrab chiqsa, bu bezovta
 * qilardi.
 */
export function revealOnScroll(gsap: GsapLike, targets: Target, options: { y?: number } = {}) {
  const { y = 24 } = options

  // Bo'sh tanlov: GSAP "target not found" deb ogohlantiradi va konsol
  // haqiqiy xatolar ko'rinmaydigan darajada to'lib ketardi
  return gsap.utils.toArray<Element>(targets).map((element) =>
    gsap.from(element, {
      y,
      scale: 0.94,
      duration: 0.45,
      ease: 'back.out(1.7)',
      clearProps: 'transform',
      scrollTrigger: { trigger: element, start: 'top 92%', once: true },
    }),
  )
}

/**
 * SVG chizig'i chizilib boradi (`drawSVG`).
 *
 * O'quv yo'lidagi egri chiziq shu bilan "chiziladi" — bo'limlar
 * shunchaki ro'yxat emas, YO'L ekani ko'rinadi.
 */
export function drawPath(gsap: GsapLike, target: Target, duration = 1.2) {
  return gsap.fromTo(
    target,
    { drawSVG: '0%' },
    { drawSVG: '100%', duration, ease: 'power2.inOut' },
  )
}

/**
 * Nuqtadan zarrachalar otiladi (`physics2D`).
 *
 * To'g'ri javobda bosilgan tugmadan chiqadi. Qisqa (0.6 s) va
 * `pointer-events: none` — mashq ritmini to'xtatmaydi.
 */
export function particleBurst(gsap: GsapLike, particles: Target) {
  return gsap.fromTo(
    particles,
    { x: 0, y: 0, opacity: 1, scale: 1 },
    {
      duration: 0.6,
      opacity: 0,
      scale: 0.4,
      ease: 'power1.out',
      physics2D: { velocity: 'random(120, 260)', angle: 'random(200, 340)', gravity: 500 },
    },
  )
}

/**
 * Sarlavha harflari birma-bir chiqadi (`splitText`).
 *
 * FAQAT bir marta va faqat KATTA sarlavhalarda: har matnni bo'lish
 * ekran o'quvchi uchun so'zlarni bo'lib yuborishi mumkin, shuning
 * uchun `SplitText` `aria-label` ni saqlaydi.
 */
export function revealHeading(gsap: GsapLike, element: Element) {
  if (!SplitTextClass) return null

  const label = element.textContent ?? ''
  element.setAttribute('aria-label', label)

  const split = new SplitTextClass(element, {
    type: 'chars',
    // Ekran o'quvchi bo'lingan harflarni birma-bir o'qimasin
    charsClass: 'inline-block',
    aria: 'none',
  })

  gsap.from(split.chars, {
    y: 18,
    duration: 0.4,
    stagger: 0.02,
    ease: 'back.out(2)',
    clearProps: 'transform',
  })

  return split
}

/** Bosilganda 3D qiyalik — karta "haqiqiy" bo'lib tuyuladi */
export function pressTilt(gsap: GsapLike, target: Target) {
  return gsap.fromTo(
    target,
    { rotationX: 0, scale: 1 },
    {
      rotationX: 6,
      scale: 0.98,
      transformPerspective: 600,
      duration: 0.12,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      clearProps: 'transform',
    },
  )
}

/**
 * SVG chizig'i SKROLL bilan chiziladi (`scrollTrigger` + `drawSVG`).
 *
 * Foydalanuvchi pastga tushgan sari yo'l uzayadi — bu o'quv yo'lining
 * "yo'l" ekanini eng aniq ko'rsatadigan effekt. `scrub` tufayli
 * chiziq skroll bilan BOG'LANGAN, o'z-o'zidan yugurmaydi.
 */
export function drawPathOnScroll(gsap: GsapLike, target: Target, trigger: Element) {
  if (!hasTarget(gsap, target)) return null

  return gsap.fromTo(
    target,
    { drawSVG: '0%' },
    {
      drawSVG: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: 'top 80%',
        end: 'bottom bottom',
        scrub: 0.6,
      },
    },
  )
}
