import { useEffect, useMemo, useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { LANGUAGES } from '@/core/config/languages'
import type { AnswerVerdict, MatchingExercise } from '@/core/exercises'
import { shuffle } from '@/lib/random'
import { cn } from '@/lib/cn'

/** Bitta kartaning juft topishdagi natijasi */
export interface MatchingResult {
  cardId: string
  verdict: AnswerVerdict
}

interface MatchingViewProps {
  exercise: MatchingExercise
  onComplete: (results: MatchingResult[]) => void
}

/** Xato juft qizil ko'rinib turadigan vaqt (ms) */
const WRONG_FLASH_MS = 600

/**
 * Juft topish: chapda o'rganilayotgan tildagi so'zlar, o'ngda aralash
 * tarjimalar. Foydalanuvchi avval so'zni, so'ng tarjimasini bosadi.
 *
 * XATODA JAZOLAMASLIK: noto'g'ri juft qisqa vaqt qizil ko'rinadi va tanlov
 * bekor bo'ladi — foydalanuvchi qayta urinib ko'raveradi, mashq to'xtamaydi.
 * Lekin o'sha karta natijasi "wrong" deb belgilanadi, chunki SM-2 uchun
 * muhimi — so'z BIRINCHI urinishda eslanganmi.
 */
export function MatchingView({ exercise, onComplete }: MatchingViewProps) {
  const language = LANGUAGES[exercise.card.language]

  // Tarjimalar aralashtiriladi, aks holda juftlar yonma-yon tushardi.
  // Bir marta hisoblanadi: har renderda qayta aralashsa tugmalar sakrardi.
  const translations = useMemo(
    () => shuffle(exercise.pairs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id],
  )

  /** Tanlangan so'z — endi tarjimasi kutilmoqda */
  const [pickedWord, setPickedWord] = useState<string | null>(null)
  /** Juftlab bo'lingan kartalar */
  const [matched, setMatched] = useState<Set<string>>(new Set())
  /** Xato qilingan kartalar — yakuniy natija shularga qarab chiqadi */
  const [erred, setErred] = useState<Set<string>>(new Set())
  /** Qisqa vaqt qizil ko'rsatiladigan tarjima */
  const [wrongFlash, setWrongFlash] = useState<string | null>(null)

  // Qizil belgi o'zi so'nadi
  useEffect(() => {
    if (!wrongFlash) return

    const timer = setTimeout(() => setWrongFlash(null), WRONG_FLASH_MS)
    return () => clearTimeout(timer)
  }, [wrongFlash])

  function pickWord(cardId: string) {
    if (matched.has(cardId)) return

    // Bosilgan so'zni qayta bosish tanlovni bekor qiladi
    setPickedWord((current) => (current === cardId ? null : cardId))
    setWrongFlash(null)
  }

  function pickTranslation(cardId: string) {
    if (matched.has(cardId) || pickedWord === null) return

    if (pickedWord !== cardId) {
      // Noto'g'ri: xatoni yozamiz, tanlovni bekor qilamiz, lekin juft ochiq
      // qoladi — foydalanuvchi qayta urinib ko'radi
      setErred((current) => new Set(current).add(pickedWord))
      setWrongFlash(cardId)
      setPickedWord(null)
      return
    }

    const nextMatched = new Set(matched).add(cardId)
    setMatched(nextMatched)
    setPickedWord(null)

    if (nextMatched.size < exercise.pairs.length) return

    onComplete(
      exercise.pairs.map((pair) => ({
        cardId: pair.cardId,
        verdict: erred.has(pair.cardId) ? 'wrong' : 'correct',
      })),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="text-center">
        <p className="text-sm font-semibold text-ink-600">So'z va tarjimasini juftlang</p>
        <p className="mt-1 text-xs text-ink-600">
          {matched.size}/{exercise.pairs.length} topildi
        </p>
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        {/* Chap ustun — o'rganilayotgan tildagi so'zlar */}
        <div className="flex flex-col gap-2">
          {exercise.pairs.map((pair) => {
            const done = matched.has(pair.cardId)
            const active = pickedWord === pair.cardId

            return (
              <button
                key={pair.cardId}
                type="button"
                disabled={done}
                onClick={() => pickWord(pair.cardId)}
                dir={language.dir}
                lang={language.code}
                // Ikki ustunda bir xil matn uchramasa ham, ekran o'quvchi
                // qaysi tomon ekanini bilishi kerak
                aria-label={`${pair.word} — so'z`}
                aria-pressed={active}
                className={cn(
                  'tap-highlight-none min-h-13 rounded-2xl border-2 px-3 py-3 font-semibold transition-colors',
                  done && 'border-brand-500 bg-brand-100 text-brand-700 opacity-50',
                  !done && active && 'border-brand-500 bg-brand-50',
                  !done && !active && 'border-ink-300 bg-white',
                )}
              >
                {pair.word}
              </button>
            )
          })}
        </div>

        {/* O'ng ustun — aralash tarjimalar */}
        <div className="flex flex-col gap-2">
          {translations.map((pair) => {
            const done = matched.has(pair.cardId)
            const flash = wrongFlash === pair.cardId

            return (
              <button
                key={pair.cardId}
                type="button"
                disabled={done}
                onClick={() => pickTranslation(pair.cardId)}
                aria-label={`${pair.translation} — tarjima`}
                className={cn(
                  'tap-highlight-none min-h-13 rounded-2xl border-2 px-3 py-3 font-semibold transition-colors',
                  done && 'border-brand-500 bg-brand-100 text-brand-700 opacity-50',
                  !done && flash && 'border-wrong-500 border-dashed bg-wrong-500/10 text-wrong-600',
                  !done && !flash && 'border-ink-300 bg-white',
                )}
              >
                {pair.translation}
                {/* To'g'ri/xato faqat rang bilan berilmaydi (WCAG 1.4.1) */}
                {flash && <span className="sr-only"> — mos kelmadi</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
