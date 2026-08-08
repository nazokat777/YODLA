import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

/** Ko'rinish bo'yicha uslublar */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white shadow-[0_4px_0_0] shadow-brand-700 hover:bg-brand-600',
  secondary: 'bg-white text-ink-900 border-2 border-ink-300 hover:bg-slate-50',
  ghost: 'bg-transparent text-ink-600 hover:bg-slate-100',
  danger: 'bg-wrong-500 text-white shadow-[0_4px_0_0] shadow-wrong-600 hover:bg-wrong-600',
}

/** O'lcham bo'yicha uslublar — barmoq uchun qulay balandliklar */
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-12 px-5 text-base',
  lg: 'h-14 px-6 text-lg',
}

/**
 * Tugma uslublarini yig'uvchi funksiya.
 * <button> va <Link> bir xil ko'rinishga ega bo'lishi uchun ajratilgan.
 */
export function buttonStyles(options: {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  className?: string
}) {
  const { variant = 'primary', size = 'md', block = false, className } = options

  return cn(
    'tap-highlight-none inline-flex items-center justify-center gap-2 rounded-2xl font-bold',
    'transition-all duration-100 active:translate-y-[2px] active:shadow-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0',
    VARIANTS[variant],
    SIZES[size],
    block && 'w-full',
    className,
  )
}
