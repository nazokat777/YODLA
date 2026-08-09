import type { LanguageMeta } from '@/core/types'
import { cn } from '@/lib/cn'

interface LanguageBadgeProps {
  language: LanguageMeta
  size?: 'sm' | 'md' | 'lg'
  /** Tanlangan holat — kontrast ranglar bilan ajratiladi */
  active?: boolean
  className?: string
}

const SIZES = {
  sm: 'h-7 min-w-7 px-1.5 text-xs',
  md: 'h-9 min-w-9 px-2 text-sm',
  lg: 'h-12 min-w-12 px-2.5 text-base',
} as const

/**
 * Til belgisi — ISO kodi (EN / RU / AR) bilan.
 *
 * NEGA BAYROQ EMOJI EMAS: Windows'da bayroq emojilari umuman
 * ko'rsatilmaydi — brauzer ularni "GB", "RU", "SA" harflari sifatida
 * chiqaradi, ya'ni interfeys buziladi. Bundan tashqari bayroq TILNI emas,
 * DAVLATNI bildiradi (ingliz tili faqat Britaniyaniki emas), shuning
 * uchun til kodi ham aniqroq, ham universal.
 *
 * Belgi `aria-hidden` — yonida tilning to'liq nomi baribir yozilgan.
 */
export function LanguageBadge({ language, size = 'md', active = false, className }: LanguageBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-extrabold tracking-wider tabular-nums',
        SIZES[size],
        active ? 'bg-white/25 text-white' : 'bg-ink-300/40 text-ink-600',
        className,
      )}
    >
      {language.code.toUpperCase()}
    </span>
  )
}
