import { useState } from 'react'
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
  /**
   * Ovoz YO'Q bo'lganda nima qilish.
   *
   * `hidden` (sukut) — tugma umuman chizilmaydi: bosilsa hech narsa
   * bo'lmaydigan tugma chalg'itadi.
   * `hint` — 🔇 tugma va bosilganda tushuntirish: "ovoz o'rnatilmagan".
   * So'z tanishtiruvida shu — aks holda bola "ilova jim" deb o'ylaydi va
   * sababini bilmaydi (audit #2, №5).
   */
  fallback?: 'hidden' | 'hint'
}

/**
 * Talaffuzni eshitish tugmasi.
 *
 * Notanish yozuv (arab, kirill) uchun bu shunchaki qulaylik emas: so'zni
 * o'qiy olmagan foydalanuvchi uni umuman yodlay olmaydi. Shuning uchun
 * tugma so'z ko'rsatilgan har joyda hamrohlik qiladi.
 */
export function SpeakButton({
  text,
  locale,
  size = 'sm',
  className,
  fallback = 'hidden',
}: SpeakButtonProps) {
  const hasVoice = useHasVoice(locale)
  const [hintOpen, setHintOpen] = useState(false)

  // Bu tilda ovoz o'rnatilmagan bo'lsa tugma UMUMAN ko'rsatilmaydi: bosilsa
  // hech narsa bo'lmaydigan tugma foydalanuvchini chalg'itadi
  if (!hasVoice && fallback === 'hidden') return null

  if (!hasVoice) {
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <button
          type="button"
          data-testid="speak-unavailable"
          onClick={() => setHintOpen((open) => !open)}
          aria-expanded={hintOpen}
          aria-label="Ovoz mavjud emas — nega?"
          className={cn(
            'tap-highlight-none flex shrink-0 items-center justify-center rounded-full text-ink-300',
            size === 'lg' ? 'h-14 w-14 text-3xl' : 'h-11 w-11 text-xl',
          )}
        >
          <span aria-hidden="true">🔇</span>
        </button>
        {hintOpen && (
          <p role="status" className="max-w-xs text-center text-xs text-ink-600">
            Bu tilda ovoz o‘rnatilmagan. Telefon sozlamalarida «Matnni o‘qish (TTS)» bo‘limidan
            tilni yuklab olsangiz, so‘zlar o‘qib beriladi.
          </p>
        )}
      </div>
    )
  }

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
