import type { LanguageMeta } from '@/core/types'
import { cn } from '@/lib/cn'

interface WordDisplayProps {
  text: string
  language: LanguageMeta
  /** Katta sarlavha ko'rinishidami yoki oddiy matn */
  size?: 'lg' | 'md'
  className?: string
  /** Testlarda elementni aniq topish uchun */
  testId?: string
}

/**
 * O'rganilayotgan tildagi matnni to'g'ri yo'nalish va shrift bilan chiqarish.
 *
 * Arab yozuvi lotin bilan bir xil o'lchamda o'qilmaydi (harflar mayda va
 * bir-biriga ulanadi), shuning uchun kattaroq va kengroq qatorlar bilan
 * ko'rsatiladi.
 */
export function WordDisplay({ text, language, size = 'lg', className, testId }: WordDisplayProps) {
  const isRtl = language.dir === 'rtl'

  return (
    <p
      data-testid={testId}
      dir={language.dir}
      lang={language.code}
      className={cn(
        'font-extrabold',
        size === 'lg' ? 'text-3xl' : 'text-xl',
        isRtl && (size === 'lg' ? 'text-[2.75rem] leading-relaxed' : 'text-2xl leading-relaxed'),
        className,
      )}
    >
      {text}
    </p>
  )
}
