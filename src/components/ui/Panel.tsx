import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Ichki bo'shliq o'lchamlari */
const PADDING = { none: '', sm: 'p-3', md: 'p-4' } as const

/**
 * Panel ohangi — chegara va fon rangi.
 *
 * NEGA PROP, `className` EMAS: `padding` bilan bir xil sabab. `cn()`
 * Tailwind ziddiyatlarini yechmaydi, ya'ni `className="border-flame-500"`
 * uzatilganda elementda `border-white border-flame-500` ikkalasi qoladi
 * va qaysi biri ishlashini CSS faylidagi tartib hal qiladi. Ogohlantirish
 * paneli jimgina oq chegarali bo'lib qolishi mumkin edi.
 */
const TONES = {
  default: 'border-white',
  brand: 'border-brand-500 bg-brand-50',
  warning: 'border-flame-500 bg-flame-500/10',
  outline: 'border-brand-500',
} as const

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
  /** Chegara va fon ohangi */
  tone?: keyof typeof TONES
}

/**
 * Oq fonli "karta" konteyner.
 *
 * DIQQAT: nomi ataylab `Panel` — chunki `Card` nomi SRS domen modeli
 * (so'z kartasi) uchun band. Bu chalkashlikning oldini oladi.
 */
export function Panel({
  className,
  padding = 'md',
  interactive = false,
  tone = 'default',
  ...rest
}: PanelProps) {
  return (
    <div
      className={cn(
        // Ustki 1px yorug' chiziq (inset soya) kartaga "shisha" hajm beradi
        'rounded-[var(--radius-card)] border bg-white shadow-pop',
        TONES[tone],
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
