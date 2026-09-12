import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { LANGUAGES } from '@/core/config/languages'
import type { AnswerVerdict, Exercise } from '@/core/exercises'
import type { CardRecord } from '@/core/db'
import { setMnemonic } from '@/core/db'
import { transliterate } from '@/core/text/transliterate'
import { WordImage } from '@/components/ui/WordImage'
import { WordStrengthMeter } from '@/components/ui/WordStrengthMeter'
import { cn } from '@/lib/cn'
import { coinFlight, withMotion } from '@/lib/motion'
import { formatInterval } from '@/lib/format'
import { PronounceButton } from '@/components/ui/PronounceButton'
import { SpeakButton } from '@/components/ui/SpeakButton'

interface FeedbackBarProps {
  exercise: Exercise
  verdict: AnswerVerdict
  /**
   * Javobdan keyingi yangi interval (kunlarda).
   *
   * `null` — jadval bu javobda O'ZGARMADI (so'z shu seansda ikkinchi
   * marta chiqqan). Unda qator umuman chizilmaydi: o'zgarmagan muddatni
   * "keyingi takrorlash" deb ko'rsatish foydalanuvchini chalg'itardi.
   */
  nextIntervalDays: number | null
  /**
   * Javobdan KEYINGI karta holati (SM-2 yangilangan). `null` — bu
   * so'z shu seansda ikkinchi marta chiqqan va jadval o'zgarmagan.
   */
  gradedCard?: CardRecord | null
  /** Shu javob uchun berilgan XP */
  xpGained: number
  /** Kunlik maqsad aynan shu javob bilan bajarildimi */
  goalJustCompleted: boolean
  /**
   * So'z aynan shu javob bilan O'ZLASHTIRILDI (ikki xil mashqda to'g'ri).
   *
   * Bu darsdagi eng muhim "yutuq lahzasi": bola so'zni nafaqat topdi,
   * balki uni ikki tomondan bildi. Uni ko'rinmas qoldirish — eng katta
   * mukofotni yashirish. Alohida nishon va akkord bilan belgilanadi.
   */
  mastered?: boolean
  /** Kunning birinchi to'g'ri javobi — qaytib kelgani uchun ×2 */
  firstWinOfDay?: boolean
  /** Yo'ldoshning ko'rinishi (seans boshida bir marta o'qiladi); tuxumda `null` */
  companion?: string | null
  onContinue: () => void
}

/** Har natija uchun sarlavha va ranglar */
const TONE = {
  correct: {
    title: 'Perfect! — to‘g‘ri',
    icon: '✅',
    panel: 'border-brand-500 bg-brand-50',
    text: 'text-brand-700',
  },
  almost: {
    title: 'Almost! — deyarli',
    icon: '✍️',
    panel: 'border-flame-500 bg-flame-500/10',
    text: 'text-flame-700',
  },
  wrong: {
    title: 'Nice try! — o‘rganamiz',
    icon: '💡',
    panel: 'border-wrong-500 bg-wrong-500/10',
    text: 'text-wrong-600',
  },
} as const

/** Ko'rsatiladigan matn va u qaysi tilda ekani */
interface Line {
  text: string
  /** true — o'rganilayotgan tilda (RTL/shrift/talaffuz shu bo'yicha) */
  isTarget: boolean
}

/**
 * "To'g'ri javob" sifatida NIMANI ko'rsatish kerakligini aniqlaydi.
 *
 * MUHIM: bu mashq turiga bog'liq. Tanib olish va eshitishda variantlar
 * TARJIMALAR edi — u yerda "to'g'ri javob" ham tarjima bo'lishi kerak.
 * Aks holda foydalanuvchiga javob sifatida savolning o'zi ko'rsatilardi.
 */
function resolveAnswerLines(exercise: Exercise): { answer: Line; context: Line | null } {
  switch (exercise.type) {
    case 'recognition':
    case 'listening':
      return {
        answer: { text: exercise.options[exercise.correctIndex], isTarget: false },
        // So'zning o'zi kontekst sifatida qoladi: eshitish mashqida
        // foydalanuvchi uni birinchi marta yozuvda ko'radi
        context: { text: exercise.card.word, isTarget: true },
      }

    case 'recall':
      return {
        answer: { text: exercise.card.word, isTarget: true },
        context: { text: exercise.card.translation, isTarget: false },
      }

    case 'construction':
    case 'spelling':
      return {
        answer: { text: exercise.answer, isTarget: true },
        context: null,
      }

    case 'cloze':
      // Variantlar SO'ZLAR edi — javob ham so'z. Jumla kontekst sifatida
      // qoladi, lekin bo'sh joy to'ldirilgan holda ko'rsatiladi
      return {
        answer: { text: exercise.options[exercise.correctIndex], isTarget: true },
        context: {
          text: exercise.prompt.replace('___', exercise.options[exercise.correctIndex]),
          isTarget: true,
        },
      }

    // Juft topishda feedback paneli ko'rsatilmaydi — natija o'sha yerda
    // rang bilan beriladi
    case 'matching':
      return {
        answer: { text: exercise.card.word, isTarget: true },
        context: { text: exercise.card.translation, isTarget: false },
      }
  }
}

/**
 * Javobdan keyingi darhol feedback (TZ 4).
 *
 * Muhim tamoyil: XATO JAZOLANMAYDI. Xato javobda to'g'ri javob ko'rsatiladi,
 * tushuntiriladi va foydalanuvchiga mnemonika (assotsiatsiya) yozish taklif
 * qilinadi — aynan shu lahzada u eng foydali.
 */
export function FeedbackBar({
  exercise,
  verdict,
  nextIntervalDays,
  gradedCard = null,
  xpGained,
  goalJustCompleted,
  mastered = false,
  firstWinOfDay = false,
  companion = null,
  onContinue,
}: FeedbackBarProps) {
  const tone = TONE[verdict]
  const language = LANGUAGES[exercise.card.language]
  const { answer, context } = resolveAnswerLines(exercise)
  const answerReading = answer.isTarget ? transliterate(answer.text, language.script) : null
  const panelRef = useRef<HTMLDivElement>(null)

  /**
   * Panel chiqishi bilan unga fokus ko'chiriladi.
   *
   * Ikki muammoni bir yo'la hal qiladi:
   *  1. "Tekshirish" tugmasi DOM'dan olib tashlanadi — fokus <body> ga tushib,
   *     klaviatura foydalanuvchisi qaytadan Tab bosishga majbur bo'lardi.
   *  2. Yangi qo'shilgan `aria-live` hududini ekran o'quvchilar ko'pincha
   *     o'qimaydi; fokus ko'chirilsa esa mazmun albatta e'lon qilinadi.
   */
  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  /*
   * TANGA UCHADI: XP nishonidan seans ko'rsatkichiga egri yo'l bo'ylab.
   * XP qaerga ketganini ko'rsatadi — raqam "narsa"ga aylanadi.
   * Faqat to'g'ri javobda: xatoda ham XP bor, lekin uni nishonlash
   * "xato ham yaxshi" degan noto'g'ri signal berardi.
   */
  useEffect(() => {
    if (verdict === 'wrong' || xpGained <= 0) return

    let cancelled = false
    let revert = () => {}

    void withMotion(
      panelRef.current,
      (gsap) => {
        const from = panelRef.current?.querySelector('[data-testid="xp-gained"]')
        const to = document.querySelector('[data-testid="session-progress"]')
        if (from && to) coinFlight(gsap, from, to)
      },
      ['motionPath'],
    ).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [verdict, xpGained])

  /** Talaffuz tugmasi — faqat o'rganilayotgan tildagi matn uchun */
  const speakButton = (text: string) => (
    <SpeakButton text={text} locale={language.speechLocale} />
  )

  /**
   * Javob satri uchun ikkala ovoz tugmasi.
   *
   * Tartib ataylab shunday: avval NAMUNANI eshitish, keyin O'ZI aytib
   * ko'rish. Teskarisi mantiqsiz bo'lardi.
   *
   * Faqat javob satrida ishlatiladi: bitta panelda ikkita mikrofon tugmasi
   * "qaysi birini aytishim kerak?" degan savolni tug'dirardi.
   */
  const audioButtons = (text: string) => (
    <>
      {speakButton(text)}
      <PronounceButton
        text={text}
        locale={language.speechLocale}
        language={language.code}
      />
    </>
  )

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="alert"
      className={cn(
        'flex flex-col gap-3 rounded-2xl border-2 p-4 focus:outline-none',
        tone.panel,
      )}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-2xl">
          {tone.icon}
        </span>
        <p className={cn('text-lg font-extrabold', tone.text)}>{tone.title}</p>
        {/*
          YO'LDOSH javobga munosabat bildiradi: to'g'rida sakraydi, xatoda
          yelka qisadi (jazo emas — "yana urinamiz"). Bola javobni faqat
          o'zi uchun emas, yo'ldoshi uchun ham beradi.
        */}
        {companion && (
          <span
            aria-hidden="true"
            data-testid="companion-react"
            className={cn('ms-1 text-2xl', verdict === 'wrong' ? 'shrug' : 'combo-pop')}
          >
            {companion}
          </span>
        )}

        {/*
          SO'Z KUCHI — bola bugun qilgan ishi so'zni oldinga
          surganini KO'RADI. Ko'rinmaydigan progress motivatsiya
          bermaydi.
        */}
        <WordStrengthMeter card={gradedCard ?? exercise.card} className="ms-auto" />

        {xpGained > 0 && (
          <span
            data-testid="xp-gained"
            className="ms-auto rounded-full bg-white/80 px-2.5 py-1 text-sm font-extrabold text-brand-700"
          >
            +{xpGained} XP
          </span>
        )}
      </div>

      {goalJustCompleted && (
        <p className="rounded-xl bg-flame-500/15 px-3 py-2 text-sm font-bold text-flame-700">
          🎯 Kunlik maqsad bajarildi!
        </p>
      )}

      {firstWinOfDay && (
        <p
          data-testid="first-win"
          role="status"
          className="mastered-pop flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-flame-500 px-3 py-2 text-sm font-extrabold text-white shadow-pop"
        >
          <span aria-hidden="true" className="text-lg">
            ☀️
          </span>
          Bugungi birinchi g‘alaba — XP ×2! Qaytib kelganing uchun.
        </p>
      )}

      {mastered && (
        <p
          data-testid="mastered-ribbon"
          role="status"
          className="mastered-pop flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-sky-500 px-3 py-2 text-sm font-extrabold text-white shadow-pop"
        >
          <span aria-hidden="true" className="text-lg">
            ⭐
          </span>
          Word mastered! Bu so‘z endi seniki.
        </p>
      )}

      {verdict !== 'correct' && (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-ink-600">To'g'ri javob:</p>

          <div className="flex items-center gap-2">
            {/*
              Javob KO'RSATILGANDAN keyin rasm chalg'itmaydi, balki
              ma'noni mustahkamlaydi — so'z endi sir emas.
            */}
            <WordImage translation={exercise.card.translation} size="sm" />

            <div className="flex flex-col">
              <p
                data-testid="correct-answer"
                dir={answer.isTarget ? language.dir : 'ltr'}
                lang={answer.isTarget ? language.code : 'uz'}
                className="text-xl font-bold"
              >
                {answer.text}
              </p>
              {/* Javobni ko'rish yetarli emas — uni o'qiy olish ham kerak */}
              {answer.isTarget && answerReading && (
                <p dir="ltr" lang="uz" className="text-sm text-ink-600">
                  {answerReading}
                </p>
              )}
            </div>
            {answer.isTarget && audioButtons(answer.text)}
          </div>

          {context && (
            <div className="flex items-center gap-2">
              <p
                dir={context.isTarget ? language.dir : 'ltr'}
                lang={context.isTarget ? language.code : 'uz'}
                // Arabcha jumla 14 px da o'qilmaydi — harakatlar yo'qoladi
                className={cn(
                  'text-ink-600',
                  context.isTarget && language.dir === 'rtl' ? 'text-lg leading-relaxed' : 'text-sm',
                )}
              >
                {context.isTarget ? context.text : `= ${context.text}`}
              </p>
              {context.isTarget && speakButton(context.text)}
            </div>
          )}
        </div>
      )}

      {/*
        Mnemonika faqat javobdan KEYIN ko'rinadi — mashq paytida u javobni
        oshkor qilardi. To'g'ri javobda esa ekran 900 ms da o'tib ketadi,
        shuning uchun u yerda tahrirlash taklif qilinmaydi.
      */}
      {verdict === 'correct' ? (
        exercise.card.mnemonic && (
          <p className="rounded-xl bg-white/70 px-3 py-2 text-sm text-ink-600 italic">
            💡 {exercise.card.mnemonic}
          </p>
        )
      ) : (
        <MnemonicEditor
          cardId={exercise.card.id}
          word={exercise.card.word}
          initialValue={exercise.card.mnemonic}
        />
      )}

      {nextIntervalDays !== null && (
        <p className="text-xs font-semibold text-ink-600">
          Keyingi takrorlash: {formatInterval(nextIntervalDays)}
        </p>
      )}

      <Button
        block
        size="lg"
        onClick={onContinue}
        variant={verdict === 'wrong' ? 'danger' : 'primary'}
      >
        {verdict === 'correct' ? 'Davom etish' : 'Tushunarli'}
      </Button>
    </div>
  )
}

/**
 * Mnemonika yozish va TAHRIRLASH (TZ 3.3 — Keyword Method).
 * "Bu so'zni nimaga o'xshatasan?" — o'zbekcha ohangdosh so'z + assotsiatsiya.
 */
function MnemonicEditor({
  cardId,
  word,
  initialValue,
}: {
  cardId: string
  word: string
  initialValue?: string
}) {
  const [saved, setSaved] = useState(initialValue ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(initialValue ?? '')

  async function handleSave() {
    const trimmed = value.trim()
    if (trimmed.length === 0) return

    try {
      await setMnemonic(cardId, trimmed)
      setSaved(trimmed)
      setIsOpen(false)
    } catch (error) {
      console.error('Mnemonikani saqlab bo‘lmadi:', error)
    }
  }

  // Yozilgani bo'lsa — ko'rsatiladi va yoniga tahrirlash taklif qilinadi
  if (!isOpen && saved) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
        <p className="flex-1 text-sm text-ink-600 italic">💡 {saved}</p>
        <button
          type="button"
          onClick={() => {
            setValue(saved)
            setIsOpen(true)
          }}
          className="tap-highlight-none min-h-11 shrink-0 text-sm font-semibold text-brand-700 underline underline-offset-4"
        >
          Tahrirlash
        </button>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="tap-highlight-none min-h-11 text-start text-sm font-semibold text-brand-700 underline underline-offset-4"
      >
        Esda qolishi uchun assotsiatsiya yozish
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="mnemonic-input" className="text-sm text-ink-600">
        «{word}» nimaga o'xshaydi? Kulgili bo'lsa — yaxshiroq esda qoladi.
      </label>
      <input
        id="mnemonic-input"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') void handleSave()
        }}
        placeholder="masalan: «bread» — «birodar non olib keldi»"
        className="h-12 w-full rounded-xl border-2 border-ink-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
      />
      <Button size="sm" onClick={() => void handleSave()} disabled={value.trim().length === 0}>
        Saqlash
      </Button>
    </div>
  )
}
