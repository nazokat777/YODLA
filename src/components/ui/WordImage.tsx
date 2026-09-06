import { imageUrlFor } from '@/content/wordImages'
import { cn } from '@/lib/cn'

const SIZES = { sm: 'h-10 w-10', md: 'h-16 w-16', lg: 'h-24 w-24' } as const

interface WordImageProps {
  /** So'zning O'ZBEKCHA tarjimasi — rasm shu bo'yicha topiladi */
  translation: string
  size?: keyof typeof SIZES
  className?: string
}

/**
 * So'z ma'nosini ko'rsatuvchi rasm.
 *
 * Rasmi yo'q so'z uchun HECH NIMA chizmaydi (`null`) — bo'sh joy yoki
 * "rasm yo'q" belgisidan ko'ra hech nima yaxshiroq. Lug'atning 7 foizida
 * rasm bor va bu ataylab: rasm faqat ANIQ narsalarga qo'yilgan.
 *
 * QAYERDA KO'RSATILMAYDI: tanib olish, eshitish va juft topish
 * mashqlarida. U yerda savol "bu so'z nimani anglatadi?" va rasm javobni
 * to'g'ridan-to'g'ri aytib qo'yardi — mashq eslab chaqirishni talab
 * qilmay qolardi.
 *
 * Bezak — `aria-hidden`. Ma'no doim yonidagi matnda bo'ladi.
 */
export function WordImage({ translation, size = 'md', className }: WordImageProps) {
  const src = imageUrlFor(translation)
  if (!src) return null

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      data-testid="word-image"
      // Aniq o'lcham: rasm yuklanguncha matn sakrab ketmasin
      width={72}
      height={72}
      loading="lazy"
      decoding="async"
      className={cn('select-none object-contain', SIZES[size], className)}
    />
  )
}
