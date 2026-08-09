import { cn } from '@/lib/cn'

export type MascotMood = 'idle' | 'happy' | 'thinking' | 'celebrating'

interface MascotProps {
  mood?: MascotMood
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = { sm: 'h-16 w-16', md: 'h-24 w-24', lg: 'h-32 w-32' } as const

/**
 * Ilova personaji — boyqush.
 *
 * NEGA EMOJI EMAS: emoji har platformada har xil chiziladi, ba'zilarida
 * umuman chizilmaydi (Windows'da bayroq emojilari o'rniga harflar
 * chiqqani shunga misol). SVG hamma joyda bir xil ko'rinadi.
 *
 * NEGA TASHQI RASM HAM EMAS: qo'shimcha so'rov va yuklanish kechikishi.
 * Boyqush oddiy shakllardan iborat.
 *
 * Bezak element — `aria-hidden`.
 */
export function Mascot({ mood = 'idle', size = 'md', className }: MascotProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="presentation"
      aria-hidden="true"
      data-mood={mood}
      className={cn(SIZES[size], className)}
    >
      {/* Tana */}
      <ellipse cx="50" cy="58" rx="34" ry="36" fill="#f59e0b" />
      <ellipse cx="50" cy="64" rx="24" ry="27" fill="#fbbf24" />

      {/* Quloqlar */}
      <path d="M22 30 L30 8 L44 24 Z" fill="#f59e0b" />
      <path d="M78 30 L70 8 L56 24 Z" fill="#f59e0b" />

      {/* Ko'z oqi */}
      <circle cx="37" cy="45" r="14" fill="#ffffff" />
      <circle cx="63" cy="45" r="14" fill="#ffffff" />

      <Eyes mood={mood} />

      {/* Tumshuq */}
      <path d="M50 54 L44 63 L56 63 Z" fill="#ea580c" />

      {/* Panjalar */}
      <path d="M40 92 h8 M52 92 h8" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

/** Kayfiyat ko'z shakli bilan beriladi */
function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === 'happy' || mood === 'celebrating') {
    // Kulgan ko'z — yoy shaklida
    return (
      <g stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M29 47 q8 -10 16 0" />
        <path d="M55 47 q8 -10 16 0" />
      </g>
    )
  }

  if (mood === 'thinking') {
    // Bir ko'z qisilgan
    return (
      <g fill="#0f172a">
        <circle cx="37" cy="45" r="6" />
        <rect x="53" y="43" width="20" height="4" rx="2" />
      </g>
    )
  }

  return (
    <g fill="#0f172a">
      <circle cx="37" cy="45" r="6" />
      <circle cx="63" cy="45" r="6" />
    </g>
  )
}
