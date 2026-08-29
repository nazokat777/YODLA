import { cn } from '@/lib/cn'

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
const STATES: Record<ChoiceState, { className: string; icon?: string; srText?: string }> = {
  idle: { className: 'border-ink-300 bg-white' },
  selected: { className: 'border-brand-500 bg-brand-50' },
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
  return (
    <ul dir={dir} lang={lang} className="flex flex-col gap-2">
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
