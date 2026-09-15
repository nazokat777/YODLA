import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import type { CardRecord, ExamResult } from '@/core/db'
import { examCoverage, hasExam } from '@/core/exam'
import { buildUnits, type PathUnit } from '@/core/path'
import { useTopicOrder } from './useTopicOrder'
import {
  drawPathOnScroll,
  enterStagger,
  floatLoop,
  pulseRing,
  revealOnScroll,
  withMotion,
} from '@/lib/motion'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/cn'

/** Holatga qarab doira uslubi */
const CIRCLE = {
  completed:
    'bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-[0_4px_0_0] shadow-brand-800',
  current:
    'bg-gradient-to-b from-brand-500 to-brand-700 text-white ring-4 ring-brand-300 shadow-[0_6px_0_0] shadow-brand-800',
  skipped: 'border-2 border-brand-300 bg-brand-50 text-brand-700',
  locked: 'border-2 border-ink-300 bg-white text-ink-600',
} as const

/**
 * Zigzag: bo'limlar 4 qadamli naqsh bo'yicha siljiydi.
 *
 * Duolingo'dagi kabi "ilon" yo'l: markaz → o'ng → markaz → chap.
 * Bir tomonlama zinapoyadan farqli o'laroq, u ekranning butun kengligini
 * ishlatadi va uzun ro'yxat monoton ko'rinmaydi.
 *
 * `ms-*` (`ml-*` emas): interfeys o'zbekcha va chapdan o'ngga, lekin
 * logik bo'shliq kelajakda interfeys tili o'zgarsa ham to'g'ri ishlaydi.
 */
const ZIGZAG = ['ms-0', 'ms-10', 'ms-20', 'ms-10'] as const

/**
 * O'quv yo'li — bo'limlar zanjiri.
 *
 * Bo'lim holati saqlanmaydi, kartalar progressidan hisoblanadi
 * (`core/path/units.ts`). Shuning uchun dars tugagach ro'yxat o'zi
 * yangilanadi: `useLiveQuery` bazadagi o'zgarishni sezadi.
 */
interface LearningPathProps {
  /**
   * Shu tildagi kartalar. `undefined` — hali yuklanmoqda.
   *
   * Kartalarni bosh ekran O'QIYDI va shu yerga uzatadi: u ularni
   * statistika uchun baribir o'qiydi, ikkinchi so'rov esa bitta ekran
   * uchun butun jadvalni ikki marta skanerlardi.
   */
  cards: CardRecord[] | undefined
  /** Topshirilgan imtihonlar (bo'lim id → natija) — yo'lda 🏆 tugunlar */
  examResults?: Readonly<Record<string, ExamResult>>
  /** Hozir kutilayotgan imtihonning bo'lim id si — u ajralib turadi */
  pendingExamId?: string | null
}

export function LearningPath({ cards, examResults = {}, pendingExamId = null }: LearningPathProps) {
  /** Joriy bo'lim — ochilishda shu joyga suriladi */
  const currentRef = useRef<HTMLLIElement>(null)
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const startingLevel = useSettingsStore((s) => s.startingLevel)

  /*
   * Kelgunicha yo'l CHIZILMAYDI: `buildUnits` tartibsiz qolganda alifboga
   * tushadi va bo'limlar avval noto'g'ri ketma-ketlikda ko'rinib, keyin
   * sakrab qayta saralanardi (arabchada "10-dars" "2-dars" dan oldin).
   */
  const topicOrder = useTopicOrder(learningLanguage)

  const units = useMemo(() => {
    if (!cards || !learningLanguage || topicOrder === null) return []

    return buildUnits(cards, { minLevel: startingLevel, topicOrder })
  }, [cards, learningLanguage, startingLevel, topicOrder])

  // Kartalar yoki mavzu tartibi hali yo'lda. Buni "bo'lim yo'q" dan
  // farqlash kerak: birinchi ochilishda lug'at bazaga yozilayotgan bir-ikki
  // soniya davomida yo'l butunlay g'oyib bo'lib turardi va keyin birdan
  // paydo bo'lardi
  const isLoading = cards === undefined || topicOrder === null

  const listRef = useRef<HTMLOListElement>(null)
  /**
   * Chiziq va ro'yxatni O'RAB turuvchi element.
   *
   * `gsap.context` selektorlarni SCOPE ICHIDA qidiradi. Chiziq
   * `<ol>` ning tashqarisida turadi, shuning uchun `<ol>` ni scope
   * qilib bo'lmaydi — GSAP uni topolmay, "target not found" deb
   * ogohlantirardi va animatsiya umuman qo'llanmasdi.
   */
  const wrapRef = useRef<HTMLDivElement>(null)
  const [pathShape, setPathShape] = useState<{ d: string; height: number } | null>(null)

  /*
   * YO'L CHIZIG'I bo'limlar MARKAZIDAN o'tadi.
   *
   * Ilgari chiziq umuman yo'q edi va sababi to'g'ri edi: bo'limlar
   * zigzag bo'ylab siljigani uchun bitta TIK chiziq ularning hech
   * biridan o'tmasdi. Yechim — tik chiziq emas, doiralarning haqiqiy
   * markazlaridan o'tuvchi EGRI chiziq. Buning uchun joylashuv
   * o'lchanadi: uni oldindan hisoblab bo'lmaydi, chunki u shrift
   * o'lchami va ekran kengligiga bog'liq.
   */
  useEffect(() => {
    const list = listRef.current
    if (!list || units.length === 0) return

    /**
     * Elementning ro'yxatga NISBATAN joylashuvi.
     *
     * `getBoundingClientRect` YARAMAYDI: u CSS transformni hisobga
     * oladi va o'lchov kirish animatsiyasi paytida olinsa, doiralar
     * o'sha lahzadagi (siljigan) holatida yozilardi. O'lchandi: chiziq
     * doiralardan 28 px pastda qolib ketardi — aynan `enterStagger`
     * dagi `y: 28` qadar.
     *
     * `offsetLeft/offsetTop` esa JOYLASHUV qiymatlari: transform
     * ularga umuman ta'sir qilmaydi.
     */
    const offsetWithin = (element: HTMLElement) => {
      let x = 0
      let y = 0
      let node: HTMLElement | null = element

      while (node && node !== list) {
        x += node.offsetLeft
        y += node.offsetTop
        node = node.offsetParent as HTMLElement | null
      }

      return { x, y }
    }

    const measure = () => {
      const circles = list.querySelectorAll<HTMLElement>('[data-circle]')
      if (circles.length < 2) return

      const base = list.getBoundingClientRect()
      const points = [...circles].map((circle) => {
        const origin = offsetWithin(circle)
        return { x: origin.x + circle.offsetWidth / 2, y: origin.y + circle.offsetHeight / 2 }
      })

      /*
       * Silliq egri: har ikki nuqta orasida ULARNING O'RTASIGA
       * qaratilgan kvadratik yoy. To'g'ri chiziqlar bilan bog'lansa
       * yo'l siniq va "arzon" ko'rinardi.
       */
      let d = `M ${points[0]!.x} ${points[0]!.y}`
      for (let i = 1; i < points.length; i += 1) {
        const previous = points[i - 1]!
        const current = points[i]!
        const midY = (previous.y + current.y) / 2
        d += ` C ${previous.x} ${midY} ${current.x} ${midY} ${current.x} ${current.y}`
      }

      setPathShape({ d, height: base.height })
    }

    measure()

    /*
     * Ekran kengligi o'zgarsa zigzag ham o'zgaradi.
     *
     * `ResizeObserver` BO'LMASLIGI mumkin (eski brauzer, test muhiti).
     * Chiziq — bezak, shuning uchun u yo'q bo'lsa bir marta o'lchab
     * qo'ya qolamiz: butun ekranni yiqitish mutlaqo asossiz bo'lardi.
     */
    if (typeof ResizeObserver !== 'function') return

    const observer = new ResizeObserver(measure)
    observer.observe(list)

    return () => observer.disconnect()
  }, [units])

  // Bo'limlar ketma-ket "otilib" chiqadi. Animatsiya bo'lmasa ro'yxat
  // shunchaki joyida turadi — DOM allaqachon to'g'ri
  useEffect(() => {
    if (units.length === 0) return

    let cancelled = false
    let revert = () => {}

    void withMotion(listRef.current, (gsap) => {
      /*
       * FAQAT BIRINCHI EKRANDAGI bo'limlar.
       *
       * O'lchandi: inglizchada yo'lda 213 bo'lim bor va `stagger: 0.06`
       * ularning hammasiga qo'llanganda animatsiya 13 SONIYA davom
       * etardi — oxirgi bo'limlar shuncha vaqt siljigan holatda qotib
       * turardi. Ekrandan tashqaridagi elementni "chiroyli chiqarish"
       * ma'nosiz: uni hech kim ko'rmaydi.
       */
      enterStagger(gsap, '[data-unit]:nth-child(-n+8)', {
        stagger: 0.06,
        duration: 0.5,
        y: 28,
      })

      /*
       * QOLGANLARI ekranga kirganda ochiladi.
       *
       * Bu ham chiroyliroq, ham ARZONROQ: 260 dan ortiq bo'limni
       * ochilishda animatsiyalash isrof edi — foydalanuvchi bir
       * vaqtda beshtasini ko'radi.
       */
      revealOnScroll(gsap, '[data-unit]:nth-child(n+9)')

      // "Nafas" + halqa: ko'z qayerga qarashni biladi
      floatLoop(gsap, '[data-state="current"]')
      pulseRing(gsap, '[data-ring]')
    }, ['scrollTrigger']).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [units.length])

  /*
   * YO'L CHIZIG'I skroll bilan chiziladi.
   *
   * ALOHIDA EFFEKT: chiziq DOMga o'lchovdan KEYIN qo'shiladi, ya'ni
   * yuqoridagi effekt ishga tushganda u hali yo'q edi va GSAP
   * "target not found" deb ogohlantirardi — animatsiya esa umuman
   * qo'llanmasdi.
   */
  useEffect(() => {
    const list = listRef.current
    if (!pathShape || !list || !wrapRef.current) return

    let cancelled = false
    let revert = () => {}

    void withMotion(
      wrapRef.current,
      (gsap) => {
        drawPathOnScroll(gsap, '[data-path-line]', list)
      },
      ['scrollTrigger', 'drawSVG'],
    ).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [pathShape])

  useEffect(() => {
    const target = currentRef.current
    if (!target) return

    // Faqat EKRANDAN PASTDA bo'lsa suriladi. Yangi foydalanuvchida joriy
    // bo'lim birinchi o'rinda turadi va uni markazga tortish streak,
    // kunlik maqsad va "bugun takrorlash" kartalarini ekrandan chiqarib
    // yuborardi — ular esa aynan bosh ekranning maqsadi.
    const { top } = target.getBoundingClientRect()
    if (top <= window.innerHeight) return

    // `auto`: ochilishdagi uzoq animatsiya kutish bo'lib tuyuladi
    target.scrollIntoView({ block: 'center', behavior: 'auto' })
  }, [units])

  if (isLoading) {
    return (
      <section data-testid="path-loading">
        <h2 className="mb-3 font-bold">O'quv yo'li</h2>
        <ol className="flex flex-col gap-3" aria-hidden="true">
          {[0, 1, 2].map((row) => (
            <li key={row} className={cn('flex items-center gap-3', row % 2 === 1 && 'ms-10')}>
              <div className="h-14 w-14 animate-pulse rounded-full bg-ink-300/40" />
              <div className="h-4 w-32 animate-pulse rounded bg-ink-300/40" />
            </li>
          ))}
        </ol>
      </section>
    )
  }

  if (units.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 font-bold">O'quv yo'li</h2>

      <div ref={wrapRef} className="relative">
        {/*
          YO'L CHIZIG'I — sof bezak, shuning uchun `aria-hidden` va
          bosishni o'tkazmaydi. U doiralarning ORTIDA turadi.
        */}
        {pathShape && (
          <svg
            aria-hidden="true"
            /*
              `-z-10` YARAMAYDI: u chiziqni sahifa FONINING ortiga
              yuborardi va chiziq umuman ko'rinmasdi. Yechim — chiziq
              odatiy qatlamda, ro'yxat esa uning USTIDA.
            */
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${listRef.current?.clientWidth ?? 0} ${pathShape.height}`}
            preserveAspectRatio="none"
          >
            <path
              data-path-line
              d={pathShape.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={4}
              strokeLinecap="round"
              className="text-brand-300/60"
            />
          </svg>
        )}

        <ol ref={listRef} className="relative z-10 flex flex-col gap-3">
        {units.map((unit, index) => (
          <Fragment key={unit.id}>
            {/*
              Seksiya sarlavhasi FAQAT o'zgarganda chiziladi. Shu tufayli
              "Enterprise 1" yuz marta emas, bir marta ko'rinadi va
              foydalanuvchi yo'lning qayerida turganini biladi.
            */}
            {unit.section && unit.section !== units[index - 1]?.section && (
              <li className="mt-4 first:mt-0">
                <h3 className="rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold tracking-wide text-brand-700 uppercase">
                  {unit.section}
                </h3>
              </li>
            )}
          <li
            data-unit
            ref={unit.state === 'current' ? currentRef : undefined}
            className={cn('flex items-center gap-3', ZIGZAG[index % ZIGZAG.length])}
          >
            <div className="relative shrink-0">
              {/* Joriy bo'lim ostidagi kengayuvchi halqa — sof bezak */}
              {unit.state === 'current' && (
                <span
                  data-ring
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full border-4 border-brand-500"
                />
              )}
              <UnitCircle unit={unit} />
            </div>
            <div className="flex min-w-0 flex-col">
              {/*
                `line-clamp-2` (`truncate` EMAS): uzun nomlar bor —
                "The Loch Ness Monster — Episode 2: The Wrong Photograph".
                Bir qatorga siqilsa ular bir-biridan farq qilmay qolardi,
                chunki farq nomning OXIRIDA.
              */}
              <span className="line-clamp-2 font-bold">{unit.title}</span>
              <span className="text-xs text-ink-600">
                {unit.level} · {unit.learned}/{unit.total} so'z
              </span>
            </div>
          </li>
          {/*
            YIG'MA IMTIHON tuguni — tugallangan bo'limdan keyin (2-bo'limdan
            boshlab). Topshirilmagan bo'lsa — yo'ldagi keyingi qadam:
            yangi so'zlarni olishdan oldin eskilarini mustahkamlash.
          */}
          {hasExam(units, unit) && (
            <ExamNode
              unitId={unit.id}
              count={examCoverage(units, unit.id).length}
              result={examResults[unit.id]}
              pending={unit.id === pendingExamId}
            />
          )}
          </Fragment>
        ))}
        </ol>
      </div>
    </section>
  )
}

interface ExamNodeProps {
  unitId: string
  /** Nechta dars qamraladi — "1–N" yozuvi uchun */
  count: number
  result: ExamResult | undefined
  pending: boolean
}

/**
 * Imtihon tuguni. Kutilayotgani — katta, halqali, "keyingi qadam";
 * topshirilgani — kichik chip (foiz bilan), qayta topshirish mumkin.
 */
function ExamNode({ unitId, count, result, pending }: ExamNodeProps) {
  const percent = result ? Math.round((result.correct / Math.max(1, result.total)) * 100) : null

  if (!pending && result) {
    return (
      <li data-unit className="ms-5 flex items-center gap-3">
        <Link
          to={PATHS.examById(unitId)}
          data-testid={`exam-${unitId}`}
          data-exam="passed"
          className="tap-highlight-none inline-flex items-center gap-1.5 rounded-full bg-flame-500/15 px-3 py-1 text-xs font-extrabold text-ink-900"
          aria-label={`Imtihon 1–${count} — ${percent}%, qayta topshirish`}
        >
          🏆 Imtihon 1–{count} · {percent}%
        </Link>
      </li>
    )
  }

  if (!pending) return null

  return (
    <li data-unit className="ms-5 flex items-center gap-3">
      <div className="relative shrink-0">
        <span
          data-ring
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border-4 border-flame-500"
        />
        <Link
          to={PATHS.examById(unitId)}
          data-testid={`exam-${unitId}`}
          data-exam="pending"
          data-circle
          aria-label={`Imtihon: 1–${count} darslar`}
          className="tap-highlight-none flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-flame-500 to-flame-600 text-2xl shadow-[0_6px_0_0] shadow-flame-700 ring-4 ring-flame-500/30 transition-transform active:translate-y-0.5"
        >
          <span aria-hidden="true">🏆</span>
        </Link>
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="font-bold">Imtihon · 1–{count} darslar</span>
        <span className="text-xs text-ink-600">O‘tilgan hamma so‘zdan yig‘ma tekshiruv</span>
      </div>
    </li>
  )
}

/** Bo'lim doirasi — qulflanganida havola bo'lmaydi */
function UnitCircle({ unit }: { unit: PathUnit }) {
  const className = cn(
    'flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-extrabold',
    CIRCLE[unit.state],
  )

  const label =
    unit.state === 'locked'
      ? `${unit.topic} — hali ochilmagan`
      : `${unit.topic} — ${unit.learned}/${unit.total}`

  if (unit.state === 'locked') {
    return (
      <div
        data-testid={`unit-${unit.id}`}
        data-state={unit.state}
        data-circle
        role="button"
        aria-disabled="true"
        // FOKUS OLMAYDI: yo'lda 400 dan ortiq bo'lim bor va ularning
        // deyarli hammasi qulflangan. Har biri fokus olsa, klaviatura
        // yoki ekran o'quvchisi bilan yuradigan foydalanuvchi hech nima
        // qilmaydigan yuzlab to'xtashdan o'tishi kerak bo'lardi.
        aria-label={label}
        className={className}
      >
        <span aria-hidden="true">🔒</span>
      </div>
    )
  }

  return (
    <Link
      to={PATHS.lessonById(unit.id)}
      data-testid={`unit-${unit.id}`}
      data-state={unit.state}
      data-circle
      aria-label={label}
      className={cn(className, 'tap-highlight-none transition-transform active:translate-y-0.5')}
    >
      {unit.state === 'completed' ? (
        <span aria-hidden="true">✓</span>
      ) : (
        <span aria-hidden="true">
          {unit.learned}/{unit.total}
        </span>
      )}
    </Link>
  )
}
