import { useEffect, useRef, useState } from 'react'
import type { ExerciseType } from '@/core/types'
import { EXERCISE_HELP } from './exerciseHelp'
import { withMotion, enterStagger } from '@/lib/motion'

/** Ko'rilgan turlar shu prefiks bilan saqlanadi */
const SEEN_KEY = 'polyglotpro:help-seen:'

/**
 * Shu tur avval ko'rilganmi.
 *
 * `localStorage` XATO TASHLASHI mumkin: Safari'ning maxfiy rejimida va
 * cookie'lar bloklanganda o'qish ham istisno beradi. Ko'rsatma tufayli
 * dars yiqilishi mumkin emas — shuning uchun xatoda "ko'rilmagan" deb
 * hisoblanadi (ko'rsatma ortiqcha chiqadi, lekin ilova ishlaydi).
 */
function wasSeen(type: ExerciseType): boolean {
  try {
    return localStorage.getItem(SEEN_KEY + type) !== null
  } catch {
    return false
  }
}

function markSeen(type: ExerciseType): void {
  try {
    localStorage.setItem(SEEN_KEY + type, '1')
  } catch {
    // Saqlanmasa — ko'rsatma keyingi safar ham chiqadi, zarari yo'q
  }
}

interface ExerciseHelpButtonProps {
  type: ExerciseType
}

/**
 * "Qanday bajariladi?" — mashq turi bo'yicha ko'rsatma.
 *
 * Ilova ettita turli mashqni aralashtirib beradi. Yangi foydalanuvchi
 * (ayniqsa bola) har turni birinchi marta ko'rganda nima qilish
 * kerakligini bilmaydi, shuning uchun ko'rsatma o'sha safar O'ZI
 * ochiladi. Keyin u yo'lda turmaydi — faqat "?" tugmasi qoladi.
 */
export function ExerciseHelpButton({ type }: ExerciseHelpButtonProps) {
  const help = EXERCISE_HELP[type]

  // Birinchi renderda hal qilinadi: keyingi renderlarda "ko'rilgan"
  // bo'lib qolgani panelni o'z-o'zidan yopib yubormasligi kerak
  const [isOpen, setIsOpen] = useState(() => !wasSeen(type))
  const bodyRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (isOpen) markSeen(type)
  }, [isOpen, type])

  useEffect(() => {
    if (!isOpen) return

    let revert = () => {}
    void withMotion(bodyRef.current, (gsap) => {
      revert = () => {}
      enterStagger(gsap, bodyRef.current as Element, { y: -8, duration: 0.3 })
    }).then((fn) => {
      revert = fn
    })

    return () => revert()
  }, [isOpen])

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="tap-highlight-none inline-flex items-center gap-1.5 self-start rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 transition-colors hover:bg-sky-100/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      >
        <span aria-hidden="true">💡</span>
        Qanday bajariladi?
      </button>

      {isOpen && (
        <p
          ref={bodyRef}
          className="rounded-2xl border border-sky-100 bg-sky-100/40 px-3 py-2 text-sm text-ink-600"
        >
          <span className="font-bold text-ink-900">{help.title}. </span>
          {help.body}
        </p>
      )}
    </div>
  )
}
