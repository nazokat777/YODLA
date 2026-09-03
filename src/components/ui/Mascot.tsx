import { cn } from '@/lib/cn'
import mascotIdle from '@/assets/mascot-idle.webp'
import mascotHappy from '@/assets/mascot-happy.webp'

export type MascotMood = 'idle' | 'happy' | 'thinking' | 'celebrating'

interface MascotProps {
  mood?: MascotMood
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * `xs` — matn yonida turadigan o'lcham.
 *
 * 320 px li ekranda javob panelidagi qator maskot (64 px), ikonka, sarlavha
 * va XP dan iborat. `sm` bilan sarlavhaga 97 px qolib, u uch qatorga
 * o'ralib ketardi.
 */
const SIZES = { xs: 'h-12 w-12', sm: 'h-16 w-16', md: 'h-24 w-24', lg: 'h-32 w-32' } as const

/**
 * Ilova personaji — feya (3D render).
 *
 * NEGA RASM (avvalgi qo'lda chizilgan SVG emas): qo'lda yozilgan geometrik
 * SVG yuz kichik o'lchamda quruq va bejirim chiqardi. Tayyor 3D render
 * hajmi ham katta emas, ko'rinishi esa beqiyos yoqimli.
 *
 * NEGA WEBP: bir xil sifatda PNG'dan ~4 baravar kichik (19 KB / 74 KB).
 * Ilova offline ishlaydi, shuning uchun har kilobayt hisobda.
 *
 * NEGA IKKI RASM: har kayfiyat uchun alohida render saqlash 4 fayl degani
 * bo'lardi. Tinch (idle/thinking) va quvnoq (happy/celebrating) — ikki
 * holat farqni bergani yetarli.
 *
 * Manba: Pixabay (Content License — bepul, atribut talab qilinmaydi).
 * Batafsil: docs/ASSETS.md
 *
 * Bezak element — `aria-hidden`.
 */
export function Mascot({ mood = 'idle', size = 'md', className }: MascotProps) {
  const isCheerful = mood === 'happy' || mood === 'celebrating'

  return (
    <img
      src={isCheerful ? mascotHappy : mascotIdle}
      alt=""
      aria-hidden="true"
      data-mood={mood}
      // O'lchamlar aniq beriladi: rasm yuklanguncha joy siljib ketmasin
      width={256}
      height={256}
      className={cn(
        'select-none object-contain',
        // Yumshoq soya — render "sahifaga yopishtirilgan" bo'lib qolmasin
        'drop-shadow-[0_6px_10px_rgba(15,23,42,0.18)]',
        SIZES[size],
        className,
      )}
    />
  )
}
