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
): Promise<() => void> {
  if (!scope) return () => {}

  const gsap = await loadGsap()
  if (!gsap) return () => {}

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
 * Karta yon tomondan aylanib kiradi.
 *
 * RTL'da teskari tomondan: arabcha o'quvchi uchun "keyingi" — chap.
 */
export function flipIn(gsap: GsapLike, target: Target, dir: 'ltr' | 'rtl' = 'ltr') {
  return gsap.fromTo(
    target,
    { rotationY: dir === 'rtl' ? -70 : 70, transformPerspective: 800 },
    { rotationY: 0, duration: 0.3, ease: 'power3.out', clearProps: 'transform' },
  )
}

/** Sekin suzish — ko'z qayerga qarashni biladi (joriy bo'lim) */
export function floatLoop(gsap: GsapLike, target: Target) {
  return gsap.to(target, { y: -6, duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' })
}

/** Kengayib so'nadigan halqa (element `opacity` bilan boshlanadi — u bezak) */
export function pulseRing(gsap: GsapLike, target: Target) {
  return gsap.fromTo(
    target,
    { scale: 1, opacity: 0.7 },
    { scale: 1.7, opacity: 0, duration: 1.6, repeat: -1, ease: 'power1.out' },
  )
}
