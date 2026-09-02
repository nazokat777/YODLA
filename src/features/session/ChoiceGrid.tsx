import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { loadGsap } from '@/lib/motion'

interface ChoiceGridProps {
  options: string[]
  correctIndex: number
  /** Tanlangan variant (javob berilmagan bo'lsa null) */
  selectedIndex: number | null
  /** Javob berilgandan keyin to'g'ri/xato ranglar ko'rsatiladi */
  revealed: boolean
  onSelect: (index: number) => void
  /**
   * Variantlar matnining yozuv yo'nalishi.
   *
   * Sukut — `ltr`: ko'p mashqlarda variantlar O'ZBEKCHA tarjimalar.
   * "Gap ichida" mashqida esa ular o'rganilayotgan tilda, shuning uchun
   * u yerda arabcha uchun `rtl` uzatiladi.
   */
  dir?: 'ltr' | 'rtl'
  lang?: string
}

/** Variantning javobdan keyingi holati */
type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong'

/**
 * Har holat uchun uslub, ikonka va ekran o'quvchi uchun matn.
 *
 * MUHIM: to'g'ri/xato FAQAT rang bilan berilmaydi (WCAG 1.4.1).
 * Ikonka + ko'rinmas matn qo'shiladi — qizil-yashil daltonizm erkaklarning
 * ~8% ida uchraydi va ular uchun ikkala fon bir xil ko'rinadi.
 */
const STATES: Record<
  ChoiceState,
  { className: string; shadow?: string; icon?: string; srText?: string }
> = {
  idle: { className: 'border-ink-300 bg-white', shadow: 'shadow-ink-300' },
  selected: { className: 'border-brand-500 bg-brand-50', shadow: 'shadow-brand-300' },
  correct: {
    className: 'border-brand-500 bg-brand-100 text-brand-700',
    icon: '✓',
    srText: "to'g'ri javob",
  },
  wrong: {
    className: 'border-wrong-500 border-dashed bg-wrong-500/10 text-wrong-600',
    icon: '✕',
    srText: 'sizning javobingiz, xato',
  },
}

/**
 * Variantli mashqlar uchun umumiy tugmalar to'plami.
 * "Tanib olish" va "eshitib tushunish" turlari ikkalasi ham shuni ishlatadi.
 */
export function ChoiceGrid({
  options,
  correctIndex,
  selectedIndex,
  revealed,
  onSelect,
  dir = 'ltr',
  lang,
}: ChoiceGridProps) {
  const listRef = useRef<HTMLUListElement>(null)

  /*
   * Javobga harakat bilan javob berish.
   *
   * To'g'ri — variant bir marta sakraydi; xato — qaltiraydi. Bu shunchaki
   * bezak emas: harakat javob QABUL QILINGANINI darhol bildiradi, matnni
   * o'qishdan oldin.
   *
   * FAQAT `transform`: `opacity` animatsiyasi fon tabda yoki to'xtatilgan
   * `rAF` da element ko'rinmas bo'lib qolishiga olib kelardi (o'quv
   * yo'lida aynan shu xato bo'lgan). `clearProps` esa animatsiyadan keyin
   * elementni o'z uslubiga qaytaradi.
   */
  useEffect(() => {
    if (!revealed || selectedIndex === null) return

    let cancelled = false
    let context: { revert: () => void } | null = null

    void loadGsap().then((gsap) => {
      const root = listRef.current
      if (!gsap || cancelled || !root) return

      const target = root.querySelectorAll('li')[selectedIndex]
      if (!target) return

      context = gsap.context(() => {
        if (selectedIndex === correctIndex) {
          gsap.fromTo(
            target,
            { scale: 1 },
            { scale: 1.05, duration: 0.12, yoyo: true, repeat: 1, clearProps: 'transform' },
          )
        } else {
          gsap.fromTo(
            target,
            { x: 0 },
            { x: 6, duration: 0.07, yoyo: true, repeat: 3, clearProps: 'transform' },
          )
        }
      }, listRef)
    })

    return () => {
      cancelled = true
      context?.revert()
    }
  }, [revealed, selectedIndex, correctIndex])

  return (
    <ul ref={listRef} dir={dir} lang={lang} className="flex flex-col gap-2">
      {options.map((option, index) => {
        const isSelected = selectedIndex === index
        const isCorrect = index === correctIndex

        // Javob berilgach: to'g'risi doim belgilanadi, xato tanlov ham
        const state: ChoiceState = !revealed
          ? isSelected
            ? 'selected'
            : 'idle'
          : isCorrect
            ? 'correct'
            : isSelected
              ? 'wrong'
              : 'idle'

        const visual = STATES[state]

        return (
          // Kalit sifatida indeks: variant MATNI takrorlanmasligi kafolatlanmagan
          <li key={index}>
            <button
              type="button"
              // `aria-disabled` (`disabled` emas): javobdan keyin variantlar
              // Tab tartibida qoladi va ekran o'quvchi ularni qayta o'qiy oladi
              aria-disabled={revealed}
              // `aria-pressed` faqat javob berishdan OLDIN ma'noli. Javobdan
              // keyin u foydalanuvchining XATO tanlovini "faol" deb belgilardi.
              aria-pressed={revealed ? undefined : isSelected}
              onClick={() => {
                if (!revealed) onSelect(index)
              }}
              className={cn(
                'tap-highlight-none flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-start font-semibold transition-colors',
                visual.className,
                // Tugma "qalin": pastida qattiq soya, bosilganda u
                // yo'qoladi va tugma pastga tushadi. Loyihaning `Button`
                // komponentida shu uslub bor edi, variantlar esa tekis oq
                // quti bo'lib qolib, bosishga umuman undamas edi.
                //
                // Javob berilgach soya OLINADI: variantlar endi faol emas,
                // qalin ko'rinish esa "meni bos" deb turardi.
                !revealed &&
                  visual.shadow &&
                  cn(
                    'shadow-[0_4px_0_0] transition-transform duration-100',
                    visual.shadow,
                    'active:translate-y-[2px] active:shadow-none',
                  ),
                revealed && 'cursor-default',
              )}
            >
              {visual.icon && (
                <span aria-hidden="true" className="text-lg font-extrabold">
                  {visual.icon}
                </span>
              )}
              <span>{option}</span>
              {visual.srText && <span className="sr-only">— {visual.srText}</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
