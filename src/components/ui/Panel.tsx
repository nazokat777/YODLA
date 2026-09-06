import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Ichki bo'shliq o'lchamlari */
const PADDING = { none: '', sm: 'p-3', md: 'p-4' } as const

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /**
   * Ichki bo'shliq.
   *
   * NEGA PROP, `className` EMAS: `cn()` shunchaki satrlarni birlashtiradi,
   * Tailwind ziddiyatlarini YECHMAYDI. `className="p-3"` uzatilsa,
   * elementda `p-4 p-3` ikkalasi ham qoladi va qaysi biri ishlashini CSS
   * faylidagi tartib hal qiladi — chaqiruvchining niyati emas. Amalda
   * `p-4` yutib, uzatilgan `p-3` jimgina yo'qolardi.
   */
  padding?: keyof typeof PADDING
  /**
   * Bosiladigan karta: hover/fokusda biroz ko'tariladi va soyasi kuchayadi.
   * Faqat ichida havola yoki tugma bo'lgan panellar uchun — statik kartaning
   * "ko'tarilishi" yolg'on va'da bo'lardi.
   */
  interactive?: boolean
}

/**
 * Oq fonli "karta" konteyner.
 *
 * DIQQAT: nomi ataylab `Panel` — chunki `Card` nomi SRS domen modeli
 * (so'z kartasi) uchun band. Bu chalkashlikning oldini oladi.
 */
export function Panel({ className, padding = 'md', interactive = false, ...rest }: PanelProps) {
  return (
    <div
      className={cn(
        // Ustki 1px yorug' chiziq (inset soya) kartaga "shisha" hajm beradi
        'rounded-[var(--radius-card)] border border-white bg-white shadow-pop',
        'shadow-[var(--shadow-pop),inset_0_1px_0_0_rgb(255_255_255/0.9)]',
        interactive &&
          'transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-pop-lg focus-within:-translate-y-0.5',
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  )
}
