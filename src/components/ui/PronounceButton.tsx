import { useState } from 'react'
import { matchesSpoken } from '@/core/pronunciation'
import type { LanguageCode } from '@/core/types'
import { cn } from '@/lib/cn'
import { isMicBlocked, isRecognitionSupported, listenOnce } from '@/lib/recognition'

interface PronounceButtonProps {
  /** Aytilishi kutilayotgan so'z — o'rganilayotgan tilda */
  text: string
  /** Web Speech API til tegi, masalan "ar-SA" */
  locale: string
  language: LanguageCode
  className?: string
}

/** Bosilgandan keyingi holat */
type Feedback =
  | { kind: 'ok' }
  | { kind: 'miss'; heard: string }
  | { kind: 'no-speech' }
  | { kind: 'denied' }
  | { kind: 'failed' }

const MESSAGE: Record<Exclude<Feedback['kind'], 'miss'>, string> = {
  ok: '✅ To‘g‘ri talaffuz!',
  'no-speech': 'Ovoz eshitilmadi — yana urinib ko‘ring.',
  denied: 'Mikrofonga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering.',
  failed: 'Tekshirib bo‘lmadi — internet aloqasini tekshiring.',
}

/**
 * Talaffuzni mikrofon orqali tekshirish.
 *
 * Natija SM-2 jadvaliga ham, XP ga ham TA'SIR QILMAYDI: nutq tanish xatosi
 * (shovqin, aksent, sekin internet) o'rganish rejasini buzmasligi kerak.
 *
 * Tugma qo'llab-quvvatlanmagan brauzerda va oflaynda UMUMAN chizilmaydi —
 * bosilganda hech nima qilmaydigan tugma foydalanuvchini chalg'itadi
 * (`SpeakButton` dagi qoidaning aynan o'zi).
 */
export function PronounceButton({
  text,
  locale,
  language,
  className,
}: PronounceButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [blocked, setBlocked] = useState(() => isMicBlocked())

  // Bir marta hisoblanadi: brauzer imkoniyati seans davomida o'zgarmaydi.
  // Oflayn holat esa o'zgarishi mumkin — lekin unda `listenOnce` "failed"
  // qaytaradi va foydalanuvchi sababini o'qiydi.
  const [supported] = useState(
    () =>
      isRecognitionSupported() &&
      (typeof navigator === 'undefined' || navigator.onLine),
  )

  async function handleClick() {
    if (isListening || blocked) return

    setFeedback(null)
    setIsListening(true)

    const outcome = await listenOnce(locale)

    setIsListening(false)

    switch (outcome.status) {
      case 'heard':
        setFeedback(
          matchesSpoken(text, outcome.alternatives, language)
            ? { kind: 'ok' }
            : { kind: 'miss', heard: outcome.alternatives[0] },
        )
        break
      case 'denied':
        // Tugma shu seansda o'chadi: har bosishda tizim oynasini qayta
        // ochishga urinish bezor qiladi va baribir natija bermaydi
        setBlocked(true)
        setFeedback({ kind: 'denied' })
        break
      default:
        setFeedback({ kind: outcome.status })
    }
  }

  // Shart hook'lardan KEYIN tekshiriladi: React hook'lari shartli
  // chaqirilmasligi kerak
  if (!supported) return null

  return (
    <span className={cn('flex flex-col items-start gap-1', className)}>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={blocked}
        aria-label="Talaffuzni tekshirish"
        className={cn(
          'tap-highlight-none flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl transition-colors',
          isListening
            ? 'animate-pulse bg-flame-500/20 text-flame-600'
            : 'text-ink-600 hover:bg-brand-50 hover:text-brand-700',
          blocked && 'opacity-40',
        )}
      >
        <span aria-hidden="true">🎤</span>
      </button>

      {isListening && (
        <span className="text-xs font-semibold text-flame-600">Tinglayapman…</span>
      )}

      {/*
        Natija `role="status"` bilan e'lon qilinadi: fokus tugmada qoladi,
        matn esa pastda paydo bo'ladi va ekran o'quvchi uni o'qiydi.
      */}
      {!isListening && feedback && (
        <span
          role="status"
          className={cn(
            'text-xs font-semibold',
            feedback.kind === 'ok' ? 'text-brand-700' : 'text-ink-600',
          )}
        >
          {feedback.kind === 'miss'
            ? `“${feedback.heard}” deb eshitildi`
            : MESSAGE[feedback.kind]}
        </span>
      )}
    </span>
  )
}
