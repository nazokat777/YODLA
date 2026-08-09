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
