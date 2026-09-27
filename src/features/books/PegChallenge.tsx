import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import {
  growthText,
  MEMORIZE_SECONDS,
  PEGS,
  pegHint,
  ROUND_A,
  ROUND_B,
  scoreRecall,
} from '@/core/mnemonics/pegs'
import { shuffle } from '@/lib/random'
import { cn } from '@/lib/cn'

/**
 * Sinov bosqichlari:
 *  intro → memA → recallA → learn → memB → recallB → result
 *
 * Ikki sinov BIR XIL shartda (10 so'z, bir xil vaqt) — farq faqat
 * usulda. Shunda natija halol: o'sish usuldan, omaddan emas.
 */
type Phase = 'intro' | 'memA' | 'recallA' | 'learn' | 'memB' | 'recallB' | 'result'

/** Eng yaxshi natija — faqat shu qurilmada */
const BEST_KEY = 'yodla:peg-best'

function readBest(): number | null {
  try {
    const raw = localStorage.getItem(BEST_KEY)
    return raw === null ? null : Number(raw)
  } catch {
    return null
  }
}

/**
 * XOTIRA SINOVI — qarmoq usulini o'z natijangizda ko'rish.
 *
 * NEGA: "usul ishlaydi" degan gapga bola ishonmaydi — lekin o'zi 3 ta
 * so'zdan 9 taga chiqqanini KO'RSA, ishonadi va usulni so'z yodlashda
 * ham ishlata boshlaydi. Mnemonika darsining asosiy metodikasi shu.
 */
export function PegChallenge() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [before, setBefore] = useState(0)
  const [after, setAfter] = useState(0)
  const [best, setBest] = useState<number | null>(() => readBest())

  const finishA = (score: number) => {
    setBefore(score)
    setPhase('learn')
  }

  const finishB = (score: number) => {
    setAfter(score)
    setPhase('result')
    if (best === null || score > best) {
      setBest(score)
      try {
        localStorage.setItem(BEST_KEY, String(score))
      } catch {
        // Saqlab bo'lmasa ham natija ko'rsatiladi
      }
    }
  }

  return (
    <Panel padding="sm" data-testid="peg-challenge">
      <h2 className="font-bold">🧪 Xotira sinovi — qarmoq usuli</h2>

      {phase === 'intro' && (
        <div className="mt-1 flex flex-col gap-2 text-sm">
          <p className="text-ink-600">
            Avval 10 ta so‘zni oddiy usulda yodlaysiz, keyin qarmoq usulini o‘rganib — yana 10 tasini.
            Farqni o‘zingiz ko‘rasiz. ≈4 daqiqa.
          </p>
          {best !== null && (
            <p className="text-xs font-bold text-brand-700">Eng yaxshi natijangiz: {best}/10</p>
          )}
          <Button block onClick={() => setPhase('memA')} data-testid="peg-start">
            Sinovni boshlash
          </Button>
        </div>
      )}

      {phase === 'memA' && (
        <Memorize words={ROUND_A} onDone={() => setPhase('recallA')} />
      )}
      {phase === 'recallA' && <Recall words={ROUND_A} onDone={finishA} />}

      {phase === 'learn' && (
        <div className="mt-1 flex flex-col gap-2 text-sm">
          <p className="font-bold">
            Birinchi sinov: {before}/10. Endi usul — har raqamning doimiy «qarmog‘i» bor:
          </p>
          <ul className="grid grid-cols-2 gap-1.5" data-testid="peg-list">
            {PEGS.map((peg) => (
              <li key={peg.number} className="rounded-xl bg-brand-50 px-2 py-1.5 text-xs">
                <b>
                  {peg.number} — {peg.emoji} {peg.image}
                </b>
                <span className="block text-ink-600">{peg.why}</span>
              </li>
            ))}
          </ul>
          <p className="text-ink-600">
            Har so‘zni o‘z raqamining qarmog‘i bilan bitta <b>harakatli, g‘alati</b> sahnaga
            joylang: «1 — quyosh: quyosh tarvuzdek yorilib ketdi». Keyin raqam bo‘yicha eslaysiz.
          </p>
          <Button block onClick={() => setPhase('memB')} data-testid="peg-second">
            Qarmoqlarni esladim — ikkinchi sinov
          </Button>
        </div>
      )}

      {phase === 'memB' && (
        <Memorize words={ROUND_B} withPegs onDone={() => setPhase('recallB')} />
      )}
      {phase === 'recallB' && <Recall words={ROUND_B} withPegs onDone={finishB} />}

      {phase === 'result' && (
        <div className="mt-1 flex flex-col gap-2 text-sm" data-testid="peg-result">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-ink-300/25 py-2">
              <p className="text-2xl font-extrabold">{before}/10</p>
              <p className="text-xs text-ink-600">usulsiz</p>
            </div>
            <div className="rounded-xl bg-brand-50 py-2">
              <p className="text-2xl font-extrabold text-brand-700">{after}/10</p>
              <p className="text-xs text-ink-600">qarmoq bilan</p>
            </div>
          </div>
          <p className="text-center font-bold">{growthText(before, after)}</p>
          <p className="text-xs text-ink-600">
            Chet tilidagi so‘zda ham xuddi shunday: so‘zning tovushini tanish o‘zbekcha so‘zga
            ulang va ikkalasini bitta sahnaga joylang. «Bugun» bo‘limidagi ilgak ustaxonasi shu.
          </p>
          <Button block variant="secondary" onClick={() => setPhase('intro')}>
            Qayta urinish
          </Button>
        </div>
      )}
    </Panel>
  )
}

interface MemorizeProps {
  words: readonly string[]
  withPegs?: boolean
  onDone: () => void
}

/** Yodlash bosqichi — sanoqli vaqt, keyin avtomatik o'tadi */
function Memorize({ words, withPegs = false, onDone }: MemorizeProps) {
  const [left, setLeft] = useState(MEMORIZE_SECONDS)

  useEffect(() => {
    const endsAt = Date.now() + MEMORIZE_SECONDS * 1000
    const timer = setInterval(() => {
      const next = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setLeft(next)
      if (next === 0) {
        clearInterval(timer)
        onDone()
      }
    }, 250)
    return () => clearInterval(timer)
    // onDone har renderda yangi — taymer faqat bir marta ishga tushadi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mt-1 flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold">Tartibi bilan yodlang</span>
        <span className="font-extrabold tabular-nums text-brand-700" data-testid="peg-timer">
          {left} s
        </span>
      </div>
      <ol className="flex flex-col gap-1" data-testid="peg-words">
        {words.map((word, index) => (
          <li key={word} className="rounded-lg bg-white px-2.5 py-1.5 text-sm">
            <b>{index + 1}.</b> {word}
            {withPegs && (
              <span className="block text-xs text-ink-600">{pegHint(PEGS[index]!, word)}</span>
            )}
          </li>
        ))}
      </ol>
      <Button block variant="secondary" onClick={onDone}>
        Tayyorman
      </Button>
    </div>
  )
}

interface RecallProps {
  words: readonly string[]
  withPegs?: boolean
  onDone: (score: number) => void
}

/**
 * Eslash — har raqamga so'zni tanlash (klaviatura emas: telefonda 10
 * so'z yozish sinovni xotira emas, yozish tezligi sinoviga aylantirardi).
 */
function Recall({ words, withPegs = false, onDone }: RecallProps) {
  const options = useMemo(() => shuffle(words), [words])
  const [answers, setAnswers] = useState<(string | null)[]>(() => words.map(() => null))
  const slot = answers.findIndex((answer) => answer === null)

  const pick = (word: string) => {
    if (slot === -1) return
    const next = [...answers]
    next[slot] = word
    setAnswers(next)
  }

  const undo = () => {
    // `findLastIndex` emas: eski Android WebView'larda yo'q
    let last = -1
    answers.forEach((answer, index) => {
      if (answer !== null) last = index
    })
    if (last === -1) return
    const next = [...answers]
    next[last] = null
    setAnswers(next)
  }

  return (
    <div className="mt-1 flex flex-col gap-2">
      <p className="text-sm font-bold">
        {slot === -1
          ? 'Hammasi joylandi'
          : withPegs
            ? `${slot + 1} — ${PEGS[slot]!.emoji} ${PEGS[slot]!.image}: qaysi so‘z edi?`
            : `${slot + 1}-o‘rinda qaysi so‘z edi?`}
      </p>
      <ol className="grid grid-cols-2 gap-1 text-xs" data-testid="peg-slots">
        {answers.map((answer, index) => (
          <li
            key={index}
            className={cn(
              'rounded-lg border px-2 py-1',
              index === slot ? 'border-brand-500 bg-brand-50' : 'border-ink-300/60',
            )}
          >
            {index + 1}. {answer ?? '…'}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-1.5">
        {options.map((word) => (
          <button
            key={word}
            type="button"
            disabled={answers.includes(word) || slot === -1}
            onClick={() => pick(word)}
            className="tap-highlight-none rounded-xl border-2 border-ink-300 bg-white px-2.5 py-1.5 text-sm font-semibold disabled:opacity-30"
          >
            {word}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={undo}>
          ↩ Qaytarish
        </Button>
        <Button
          block
          disabled={slot !== -1}
          onClick={() => onDone(scoreRecall(words, answers))}
          data-testid="peg-check"
        >
          Tekshirish
        </Button>
      </div>
    </div>
  )
}
