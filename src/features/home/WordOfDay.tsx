import { useMemo, useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { SpeakButton } from '@/components/ui/SpeakButton'
import { WordImage } from '@/components/ui/WordImage'
import { LANGUAGES } from '@/core/config/languages'
import type { CardRecord } from '@/core/db'
import { wordOfDay } from '@/core/stats'
import { imageCodeFor } from '@/content/wordImages'
import { transliterate } from '@/core/text/transliterate'
import { haptic } from '@/lib/haptics'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { unitIdOf } from '@/core/path'

interface WordOfDayProps {
  cards: readonly CardRecord[]
}

/**
 * KUNNING SO'ZI — qiziquvchanlik bo'shlig'i.
 *
 * So'z ko'rinadi, ma'nosi YOPIQ ("Ma'nosini ko'rish"). Bir bosish —
 * ochiladi, ovozi eshitiladi. Bu dars emas, mukofot ham emas — shunchaki
 * har kuni bitta yangi "sir". Bola bosh ekranga aynan shuning uchun
 * ham qaytadi.
 */
export function WordOfDay({ cards }: WordOfDayProps) {
  // Rasmi bor so'zlar afzal: "olma" ko'rinadi va esda qoladi, "hers" emas
  const card = useMemo(
    () => wordOfDay(cards, Date.now(), (item) => imageCodeFor(item.translation) !== null),
    [cards],
  )
  const [revealed, setRevealed] = useState(false)

  if (!card) return null
  const language = LANGUAGES[card.language]
  const lessonId = card.level && card.topic ? unitIdOf(card.level, card.topic) : null
  const reading = transliterate(card.word, language.script)

  return (
    <Panel data-home-card data-testid="word-of-day" className="flex flex-col gap-2">
      <p className="text-xs font-extrabold uppercase tracking-wider text-ink-600">
        🔮 Kunning so‘zi
      </p>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p
            dir={language.dir}
            lang={language.code}
            className={language.dir === 'rtl' ? 'text-3xl font-extrabold leading-relaxed' : 'text-2xl font-extrabold'}
          >
            {card.word}
          </p>
          {reading && <p className="text-xs text-ink-600">{reading}</p>}
        </div>
        <SpeakButton text={card.word} locale={language.speechLocale} />
      </div>

      {revealed ? (
        <div data-testid="word-of-day-meaning" className="mastered-pop flex items-center gap-3 rounded-xl bg-brand-50 px-3 py-2">
          <WordImage translation={card.translation} size="sm" />
          <p className="text-lg font-extrabold text-brand-700">{card.translation}</p>
          {/* Qiziqish → darhol harakat: shu so'z bo'lgan darsga */}
          {lessonId ? (
            <Link
              to={PATHS.lessonById(lessonId)}
              data-testid="word-of-day-lesson"
              className="tap-highlight-none ms-auto shrink-0 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white"
            >
              Shu darsga →
            </Link>
          ) : (
            <p className="ms-auto text-xs text-ink-600">darsda uchraydi</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setRevealed(true)
            haptic('tap')
          }}
          className="tap-highlight-none rounded-xl border-2 border-dashed border-brand-500/60 px-3 py-2 text-sm font-bold text-brand-700"
        >
          Ma‘nosini ko‘rish 👀
        </button>
      )}
    </Panel>
  )
}
