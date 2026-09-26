import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Panel } from '@/components/ui/Panel'
import { cn } from '@/lib/cn'

/**
 * USULLAR — yodlashning 7 qadamli algoritmi va uni ILOVADA qayerda
 * ishlatish.
 *
 * Manba: mnemonika bo'yicha o'zbek tilidagi ma'ruzalar turkumining
 * tahlili (3 prinsip — hajm, konkretika, bog'lash; 7 qadam; 9 xato) va
 * ularning ilmiy asoslari: Ebbinghaus (1885) unutish yoyi, Atkinson
 * (1975) kalit-so'z usuli, Roediger & Karpicke (2006) tekshiruv
 * effekti, Cepeda (2008) oraliqli takror.
 *
 * NEGA ILOVADA: usulni BILISH kifoya emas — har qadam ilovaning
 * qaysi ekranida bajarilishini ko'rsatamiz. Shunda "o'qidim" emas,
 * "qildim" bo'ladi.
 */
interface Step {
  icon: string
  title: string
  text: string
  /** Ilovada qayerda bajariladi */
  where: string
  to?: string
}

const STEPS: Step[] = [
  {
    icon: '🔢',
    title: '1. Hajmni bil',
    text: '«Ko‘p» yoki «kam» — ma’lumot emas. Nechta so‘z borligini bilgan bola rejani ko‘radi: «250 ta → kuniga 10 ta → 25 kun».',
    where: 'Xarita: har kitobning aniq soni va kunlik ulushi',
  },
  {
    icon: '🎯',
    title: '2. Ma’noni tushun',
    text: 'So‘z ≠ tovush. Lug‘atni boshdan-oxir yodlash — xato: 2000–3000 so‘z bilan gapning 90%i ifodalanadi. Avval ma’no, keyin yodlash.',
    where: 'Dars: yangi so‘z avval tarjimasi va rasmi bilan tanishtiriladi',
    to: '/lesson',
  },
  {
    icon: '🪝',
    title: '3. Ilgak top (tovushga o‘xshatish)',
    text: 'Begona tovushni tanish tovushga ulang: pillow → pilov, kettle → katta, candle → qand, book → buqa. Mukammal qofiya shart emas — birinchi bo‘g‘in yetadi. Ilgak vaqtinchalik: so‘z o‘zlashgach o‘zi tushib qoladi.',
    where: 'Assotsiatsiyalarim: har so‘zga o‘z ilgagingizni yozing',
    to: PATHS.mnemonics,
  },
  {
    icon: '🎬',
    title: '4. Obraz yasa',
    text: 'Bitta kadrda tovush ham, ma’no ham bo‘lsin: yostiq yorilib ichidan pilov uchib chiqadi. Kuchli obraz — harakatli, kulgili yoki g‘alati, kattalashtirilgan, o‘zingiz ham ichida. Miya zerikarli kadrni saqlamaydi.',
    where: 'Dars: har yangi so‘zga bitta mnemonik ko‘rsatma chiqadi',
    to: '/lesson',
  },
  {
    icon: '🙈',
    title: '5. Qaramasdan esla',
    text: 'Tanish ≠ eslash. Yopib, o‘zing aytib, keyin tekshirish — qayta o‘qishdan kuchliroq. Xato — signal, muvaffaqiyatsizlik emas.',
    where: 'Mashqlar: variantsiz yozish, imtihon',
    to: PATHS.review,
  },
  {
    icon: '🔁',
    title: '6. Ikki tomonni tekshir',
    text: 'Arabcha→o‘zbekcha — tushunish; o‘zbekcha→arabcha yozish — gapirish. Ikkinchisi qiyinroq va aynan shu kerak.',
    where: 'Mashqlar: «tarjimani yozish» va «harflardan yig‘ish»',
  },
  {
    icon: '📅',
    title: '7. Oraliqli takrorla',
    text: 'Bir kunda urib-urib takrorlash — foydasiz. 10 daqiqa → 1 kun → 3 kun → 7 kun → 14 kun → 30 kun. Yaxshi bilingan so‘z navbatdan chiqadi, qiynalgani orqaga suriladi.',
    where: 'Takrorlash: ilova jadvalini o‘zi yuritadi (SM-2)',
    to: PATHS.review,
  },
  {
    icon: '💬',
    title: '8. Hayotda ishlat',
    text: 'So‘z faqat ishlatilgandan keyin miya bilan birikadi: gap tuz, o‘qi, eshit, ayt.',
    where: 'Dars: jumla, gap ichida, tinglash mashqlari',
  },
]

/** 9 xatoning ilovaga eng daxldor qismi */
const MISTAKES: Array<{ icon: string; title: string; text: string }> = [
  {
    icon: '🧱',
    title: 'Intizom yo‘q',
    text: 'Bardavomlik intensivlikdan ustun. Haftada 2 kun 8 soatdan ko‘ra — har kuni 15 daqiqa. Shuning uchun bizda «minimal planka» bor: eng yomon kuningizda ham 5 ta so‘z, zanjir uzilmasin.',
  },
  {
    icon: '📋',
    title: 'Ishlamaydigan metodika',
    text: 'Kontekstsiz ro‘yxat bo‘lib so‘z yodlash ishlamaydi. Shuning uchun har so‘z jumla, rasm va mashq bilan keladi.',
  },
  {
    icon: '😴',
    title: 'Dangasalik',
    text: 'Sababini vrach kabi qidiring: charchoq, tartibsizlik yoki feedback yo‘qligi. Ilova feedbackni darhol beradi — xato joyida ko‘rsatiladi.',
  },
  {
    icon: '😰',
    title: 'Xato qilishdan qo‘rqish',
    text: 'Salbiy his ma’lumotni sekinlashtiradi (affektiv filtr). Bola tez o‘rganadi, chunki qo‘rqmaydi. Shuning uchun bizda xato — jazo emas: so‘z qaytadi va o‘zlashtiriladi.',
  },
  {
    icon: '⏱️',
    title: 'Vaqtni boshqarmaslik',
    text: 'Taymer bilan ishlang: 15+3 yoki 25+5 daqiqa. Kunlik ulush ham daqiqada ko‘rsatiladi.',
  },
]

export function MethodsPanel() {
  const [openStep, setOpenStep] = useState<string | null>(STEPS[0]!.title)

  return (
    <div className="flex flex-col gap-3">
      <Panel padding="sm" tone="brand">
        <h2 className="font-extrabold">Yodlashning 3 tayanchi</h2>
        <ol className="mt-1 flex list-decimal flex-col gap-1 ps-4 text-sm">
          <li>
            <b>Hajm:</b> nechta ekanini bil — mavhum «ko‘p» yodlanmaydi.
          </li>
          <li>
            <b>Konkretika:</b> mavhum so‘z emas, ko‘rinadigan obraz yodlanadi.
          </li>
          <li>
            <b>Bog‘lash:</b> yangi so‘z — kurtka, eski bilim — ilgak. Ilgaksiz yerga tushadi.
          </li>
        </ol>
        <p className="mt-2 text-xs text-ink-600">
          Ebbinghaus (1885): fotoxotira yo‘q — unutish yoyi hammada bir xil. Farqni faqat usul va
          takror qiladi.
        </p>
      </Panel>

      <section>
        <h2 className="mb-2 font-bold">8 qadamli algoritm</h2>
        <ul className="flex flex-col gap-2">
          {STEPS.map((step) => {
            const open = openStep === step.title
            return (
              <li key={step.title}>
                <Panel padding="sm">
                  <button
                    type="button"
                    onClick={() => setOpenStep(open ? null : step.title)}
                    aria-expanded={open}
                    data-testid={`step-${step.title.slice(0, 2)}`}
                    className="tap-highlight-none flex w-full items-center gap-2 text-start"
                  >
                    <span aria-hidden="true" className="text-xl">
                      {step.icon}
                    </span>
                    <span className="font-bold">{step.title}</span>
                    <span
                      aria-hidden="true"
                      className={cn('ms-auto text-ink-600 transition-transform', open && 'rotate-90')}
                    >
                      ›
                    </span>
                  </button>
                  {open && (
                    <div className="mt-1.5 text-sm text-ink-600">
                      <p>{step.text}</p>
                      <p className="mt-1.5 rounded-xl bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700">
                        Ilovada: {step.where}
                        {step.to && (
                          <Link to={step.to} className="ms-1 underline">
                            ochish →
                          </Link>
                        )}
                      </p>
                    </div>
                  )}
                </Panel>
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-bold">Nima to‘sqinlik qiladi</h2>
        <ul className="flex flex-col gap-2">
          {MISTAKES.map((mistake) => (
            <li key={mistake.title}>
              <Panel padding="sm" className="flex items-start gap-2 text-sm">
                <span aria-hidden="true" className="text-xl leading-none">
                  {mistake.icon}
                </span>
                <span>
                  <b>{mistake.title}.</b> <span className="text-ink-600">{mistake.text}</span>
                </span>
              </Panel>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
