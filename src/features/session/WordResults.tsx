import { SpeakButton } from '@/components/ui/SpeakButton'
import { LANGUAGES } from '@/core/config/languages'
import { transliterate } from '@/core/text/transliterate'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { LearnedWord } from './SessionRunner'

interface WordResultsProps {
  /** Seansda bilingan so'zlar */
  learned: readonly LearnedWord[]
  /** Kamida bir marta xato qilingan so'zlar */
  missed: readonly LearnedWord[]
  /** O'zlashtirilmay qolganlar soni (60 qadam chegarasi) — ular ham "qiyin"ga */
  pendingWords?: readonly LearnedWord[]
}

/**
 * SEANS YAKUNI — qaysi so'z yaxshi yodlandi, qaysi biri qiynadi.
 *
 * Ikki to'liq ro'yxat, har so'z tarjimasi va o'qilishi bilan:
 *  - ✅ "Yaxshi yodladingiz" — bitta ham xatosiz bilingan so'zlar;
 *  - ⚠️ "Qiynaldingiz" — kamida bir marta adashilgan so'zlar.
 *
 * NEGA: "8 ta so'z o'rganildi" degan son bolaga qayerga e'tibor
 * berishni aytmaydi. Qiyin so'zlarni NOMMA-NOM ko'rish — yana bir
 * eslab chaqirish (qayta ko'rish) va metakognitsiya: bola o'zi nimani
 * bilmasligini biladi. Qiyin so'zlar ertaga birinchi navbatda qaytadi —
 * bu ham aytiladi, xato jazo emas.
 */
export function WordResults({ learned, missed, pendingWords = [] }: WordResultsProps) {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const missedIds = new Set([...missed, ...pendingWords].map((word) => word.id))
  const good = learned.filter((word) => !missedIds.has(word.id))
  const hard = [
    ...missed,
    ...pendingWords.filter((word) => !missed.some((known) => known.id === word.id)),
  ]

  if (good.length === 0 && hard.length === 0) return null

  return (
    <section className="flex flex-col gap-3" data-testid="word-results">
      {good.length > 0 && (
        <WordList
          testId="words-good"
          title={`✅ Yaxshi yodladingiz — ${good.length} ta`}
          hint="Bitta ham xatosiz. Bu so‘zlar endi kechroq takrorlanadi."
          words={good}
          tone="good"
          language={learningLanguage}
        />
      )}
      {hard.length > 0 && (
        <WordList
          testId="words-hard"
          title={`⚠️ Qiynaldingiz — ${hard.length} ta`}
          hint="Ertaga birinchi navbatda qaytadi. Bir marta ovoz chiqarib o‘qib chiqing — bu ham takror."
          words={hard}
          tone="hard"
          language={learningLanguage}
        />
      )}
    </section>
  )
}

interface WordListProps {
  testId: string
  title: string
  hint: string
  words: readonly LearnedWord[]
  tone: 'good' | 'hard'
  language: keyof typeof LANGUAGES | null
}

function WordList({ testId, title, hint, words, tone, language }: WordListProps) {
  const meta = language ? LANGUAGES[language] : null

  return (
    <div
      data-testid={testId}
      className={
        tone === 'good'
          ? 'rounded-2xl border-2 border-brand-500/40 bg-brand-50 p-3'
          : 'rounded-2xl border-2 border-flame-500/40 bg-flame-500/10 p-3'
      }
    >
      <h3 className="font-extrabold">{title}</h3>
      <p className="mt-0.5 text-xs text-ink-600">{hint}</p>
      <ul className="mt-2 flex flex-col divide-y divide-ink-300/40">
        {words.map((word) => {
          const reading = meta ? transliterate(word.word, meta.script) : null
          return (
            <li key={word.id} className="flex items-center gap-2 py-1.5">
              <span className="flex min-w-0 flex-col">
                <span
                  dir={meta?.dir}
                  lang={meta?.code}
                  className={meta?.dir === 'rtl' ? 'text-lg font-bold' : 'font-bold'}
                >
                  {word.word}
                </span>
                {reading && <span className="text-xs text-ink-600">{reading}</span>}
              </span>
              <span className="ms-auto text-end text-sm text-ink-600">{word.translation}</span>
              {meta && <SpeakButton text={word.word} locale={meta.speechLocale} />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
