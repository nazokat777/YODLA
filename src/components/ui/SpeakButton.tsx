import { speak } from '@/lib/speech'
import { useHasVoice } from '@/hooks/useHasVoice'
import { cn } from '@/lib/cn'

interface SpeakButtonProps {
  /** O'qib beriladigan matn — o'rganilayotgan tilda */
  text: string
  /** Web Speech API til tegi, masalan "ar-SA" */
  locale: string
  size?: 'sm' | 'lg'
  className?: string
}

/**
 * Talaffuzni eshitish tugmasi.
 *
 * Notanish yozuv (arab, kirill) uchun bu shunchaki qulaylik emas: so'zni
 * o'qiy olmagan foydalanuvchi uni umuman yodlay olmaydi. Shuning uchun
 * tugma so'z ko'rsatilgan har joyda hamrohlik qiladi.
 */
export function SpeakButton({ text, locale, size = 'sm', className }: SpeakButtonProps) {
  const hasVoice = useHasVoice(locale)

  // Bu tilda ovoz o'rnatilmagan bo'lsa tugma UMUMAN ko'rsatilmaydi: bosilsa
  // hech narsa bo'lmaydigan tugma foydalanuvchini chalg'itadi
  if (!hasVoice) return null

  return (
    <button
      type="button"
      onClick={() => speak(text, locale)}
      aria-label="Talaffuzni eshitish"
      className={cn(
        'tap-highlight-none flex shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700',
        size === 'lg' ? 'h-14 w-14 text-3xl' : 'h-11 w-11 text-xl',
        className,
      )}
    >
      <span aria-hidden="true">🔊</span>
    </button>
  )
}
