import { cn } from '@/lib/cn'

export type MascotMood = 'idle' | 'happy' | 'thinking' | 'celebrating'

interface MascotProps {
  mood?: MascotMood
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = { sm: 'h-16 w-16', md: 'h-24 w-24', lg: 'h-32 w-32' } as const

/**
 * Ilova personaji — mushuk.
 *
 * NEGA EMOJI EMAS: emoji har platformada har xil chiziladi, ba'zilarida
 * umuman chizilmaydi (Windows'da bayroq emojilari o'rniga harflar
 * chiqqani shunga misol). SVG hamma joyda bir xil ko'rinadi.
 *
 * NEGA TASHQI RASM HAM EMAS: qo'shimcha so'rov va yuklanish kechikishi.
 * Mushuk oddiy shakllardan iborat, hajmi bir necha yuz bayt.
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
      {/* Quloqlar */}
      <path d="M24 36 L19 11 L41 25 Z" fill="#64748b" />
      <path d="M76 36 L81 11 L59 25 Z" fill="#64748b" />
      <path d="M27 33 L24 19 L37 28 Z" fill="#f472b6" />
      <path d="M73 33 L76 19 L63 28 Z" fill="#f472b6" />

      {/* Bosh */}
      <circle cx="50" cy="57" r="36" fill="#94a3b8" />

      {/* Tumshuq atrofi */}
      <ellipse cx="50" cy="70" rx="20" ry="14" fill="#cbd5e1" />

      <Eyes mood={mood} />

      {/* Burun va og'iz */}
      <path d="M50 64 l-5 5 h10 Z" fill="#f472b6" />
      <Mouth mood={mood} />

      {/* Mo'ylovlar */}
      <path
        d="M30 68 h-14 M30 74 h-12 M70 68 h14 M70 74 h12"
        stroke="#0f172a"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Bo'yinbog' — brend rangi: personaj ilova palitrasiga bog'lanadi */}
      <path d="M26 84 q24 12 48 0" stroke="#10b981" strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="91" r="5" fill="#f59e0b" />
    </svg>
  )
}

/** Kayfiyat ko'z shakli bilan beriladi */
function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === 'happy' || mood === 'celebrating') {
    // Kulgan ko'z — yoy shaklida
    return (
      <g stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M31 52 q7 -9 14 0" />
        <path d="M55 52 q7 -9 14 0" />
      </g>
    )
  }

  if (mood === 'thinking') {
    // Bir ko'z qisilgan — "o'ylayapman"
    return (
      <g fill="#0f172a">
        <circle cx="38" cy="51" r="6" />
        <rect x="54" y="49" width="18" height="4" rx="2" />
      </g>
    )
  }

  return (
    <g fill="#0f172a">
      <circle cx="38" cy="51" r="6" />
      <circle cx="62" cy="51" r="6" />
      {/* Yorug'lik nuqtasi — nigoh jonli ko'rinadi */}
      <circle cx="40" cy="49" r="2" fill="#ffffff" />
      <circle cx="64" cy="49" r="2" fill="#ffffff" />
    </g>
  )
}

/** Og'iz — quvonganda ochiq, o'ylaganda qiyshiq */
function Mouth({ mood }: { mood: MascotMood }) {
  if (mood === 'celebrating') {
    return <path d="M43 72 q7 9 14 0 Z" fill="#0f172a" />
  }

  if (mood === 'thinking') {
    return (
      <path d="M45 74 q6 -3 11 1" stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    )
  }

  return (
    <path
      d="M50 69 v3 M50 72 q-5 5 -9 1 M50 72 q5 5 9 1"
      stroke="#0f172a"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
  )
}
