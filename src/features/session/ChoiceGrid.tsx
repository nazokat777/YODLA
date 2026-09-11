import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { enterStagger, particleBurst, pressBounce, shake, withMotion } from '@/lib/motion'

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

    let revert = () => {}
    let cancelled = false

    void withMotion(listRef.current, (gsap) => {
      const target = listRef.current?.querySelectorAll('li')[selectedIndex]
      if (!target) return

      // To'g'ri — sakraydi; xato — qaltiraydi. Ikkalasi ham ≤200 ms:
      // mashq ritmi sekinlashmasligi kerak
      if (selectedIndex === correctIndex) {
        pressBounce(gsap, target)

        /*
         * ZARRACHALAR to'g'ri javobdan otiladi.
         *
         * Ular tugmaning ICHIDA, `pointer-events: none` bilan turadi
         * va ritmni to'xtatmaydi: animatsiya fonda ketaveradi,
         * foydalanuvchi esa darhol keyingi savolga o'tadi.
         */
        particleBurst(gsap, target.querySelectorAll('[data-spark]'))
      } else {
        shake(gsap, target)
      }
    }, ['physics2D']).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [revealed, selectedIndex, correctIndex])

  /*
   * Variantlar ketma-ket chiqadi — ko'z ularni birma-bir "o'qiydi".
   * Jami 4 × 0.03 + 0.2 = 0.32 s, lekin BIRINCHI variant darhol o'z
   * joyida: kutish sezilmaydi.
   *
   * BOG'LIQLIK — matn, massiv EMAS: `options` har renderda yangi massiv
   * bo'lib keladi va bog'liqlik sifatida ishlatilsa animatsiya javob
   * berilganda ham qayta ishga tushardi — variantlar feedback paytida
   * ikkinchi marta "sakrab" chiqardi.
   */
  const optionsKey = options.join('|')

  useEffect(() => {
    let revert = () => {}
    let cancelled = false

    // Element BU YERDA olinadi: `withMotion` GSAP yuklanishini kutadi va
    // o'sha vaqt ichida komponent yo'q qilinsa `listRef.current` null
    // bo'ladi — ilgari shu joyda "null.querySelectorAll" xatosi chiqardi
    const list = listRef.current

    void withMotion(list, (gsap) => {
      enterStagger(gsap, list!.querySelectorAll('li'), {
        stagger: 0.03,
        duration: 0.2,
        y: 10,
      })
    }).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey])

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
                // Arab yozuvi lotinchadan KATTAROQ: harakatlar 16 px da
                // ajratib bo'lmaydi, bola esa aynan ularni o'qiyapti
                dir === 'rtl' && 'text-xl leading-relaxed',
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
                // Zarrachalar tugma ichidan otiladi
                'relative overflow-visible',
              )}
            >
              {/*
                UCHQUNLAR — sof bezak, `aria-hidden`. To'g'ri javobda
                shu nuqtadan otiladi; animatsiyasiz ular ko'rinmas
                holicha qoladi (`opacity-0`).
              */}
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute start-6 top-1/2 h-0 w-0"
                >
                  {Array.from({ length: 8 }, (_, spark) => (
                    <span
                      key={spark}
                      data-spark
                      className="absolute h-1.5 w-1.5 rounded-full bg-brand-500 opacity-0"
                    />
                  ))}
                </span>
              )}
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
