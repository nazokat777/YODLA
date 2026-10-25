import { useMemo, useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { SpeakButton } from '@/components/ui/SpeakButton'
import { LANGUAGES } from '@/core/config/languages'
import type { CardRecord } from '@/core/db'
import { countEntries, vocabularyGroups, type VocabularyFilter } from '@/core/books'
import { readingFor } from '@/core/text/transliterate'
import type { LanguageCode } from '@/core/types'
import { cn } from '@/lib/cn'

interface VocabularyPanelProps {
  language: LanguageCode
  cards: readonly CardRecord[]
  /** O'quv yo'li tartibi — guruhlar shu ketma-ketlikda */
  unitOrder: ReadonlyArray<{ id: string; title: string }>
}

const FILTERS: Array<{ id: VocabularyFilter; label: string }> = [
  { id: 'all', label: 'Hammasi' },
  { id: 'hard', label: '⚠️ Qiyin' },
  { id: 'strong', label: '🧠 Mustahkam' },
]

/** Bir vaqtda chiziladigan guruhlar — 200+ dars bir ekranda og'irlik qilmasin */
const GROUP_PAGE = 8

/** Mustahkamlik nuqtalari: ●●○ */
function StrengthDots({ value }: { value: number }) {
  return (
    <span aria-label={`Mustahkamlik ${value}/3`} className="flex gap-0.5" title={`${value}/3`}>
      {[1, 2, 3].map((dot) => (
        <span
          key={dot}
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 rounded-full', dot <= value ? 'bg-brand-500' : 'bg-ink-300/60')}
        />
      ))}
    </span>
  )
}

/**
 * LUG'ATIM — o'rganilgan so'zlar daftari.
 *
 * Bola o'z so'zlarini darslar bo'yicha KO'RIB chiqadi: yozilishi,
 * o'qilishi, tarjimasi, talaffuzi va mustahkamligi (●●○). Qiyin
 * so'zlar alohida filtrda — "qayerga e'tibor berish kerak" ko'rinadi.
 * Ro'yxatni ko'zdan kechirish ham takror: har ko'rilgan so'z yana bir
 * marta xotiradan chaqiriladi (ayniqsa tarjimani yopib turib).
 */
export function VocabularyPanel({ language, cards, unitOrder }: VocabularyPanelProps) {
  const meta = LANGUAGES[language]
  const [filter, setFilter] = useState<VocabularyFilter>('all')
  const [query, setQuery] = useState('')
  const [hideTranslation, setHideTranslation] = useState(false)
  const [shown, setShown] = useState(GROUP_PAGE)

  const groups = useMemo(
    () =>
      vocabularyGroups(cards, {
        unitOrder,
        filter,
        query,
        readingOf: (card) => readingFor(card.word, meta.script),
      }),
    [cards, unitOrder, filter, query, meta.script],
  )
  const total = countEntries(groups)

  return (
    <div className="flex flex-col gap-3" data-testid="vocabulary">
      <Panel padding="sm">
        <div className="flex items-baseline justify-between">
          <h2 className="font-extrabold">📖 Lug‘atim</h2>
          <span className="text-sm font-bold text-ink-600" data-testid="vocabulary-count">
            {total} ta so‘z
          </span>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setShown(GROUP_PAGE)
          }}
          placeholder="So‘z, tarjima yoki o‘qilishi…"
          aria-label="Lug‘atdan qidirish"
          className="mt-2 h-11 w-full rounded-2xl border-2 border-ink-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtr">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              data-testid={`vocab-filter-${item.id}`}
              onClick={() => {
                setFilter(item.id)
                setShown(GROUP_PAGE)
              }}
              className={cn(
                'tap-highlight-none rounded-full px-3 py-1 text-xs font-bold',
                filter === item.id ? 'bg-brand-700 text-white' : 'bg-ink-300/30 text-ink-600',
              )}
            >
              {item.label}
            </button>
          ))}
          {/*
            Tarjimani YOPISH — ro'yxat o'z-o'zini tekshirishga aylanadi:
            so'zni ko'radi, ma'nosini eslaydi, bosib tekshiradi.
          */}
          <button
            type="button"
            aria-pressed={hideTranslation}
            onClick={() => setHideTranslation((value) => !value)}
            data-testid="vocab-hide"
            className={cn(
              'tap-highlight-none ms-auto rounded-full px-3 py-1 text-xs font-bold',
              hideTranslation ? 'bg-flame-500 text-white' : 'bg-ink-300/30 text-ink-600',
            )}
          >
            🙈 Tarjimani yopish
          </button>
        </div>
      </Panel>

      {total === 0 && (
        <Panel padding="sm" className="text-center text-sm text-ink-600">
          {query
            ? 'Bunday so‘z topilmadi.'
            : filter === 'hard'
              ? 'Qiyin so‘z yo‘q — zo‘r!'
              : filter === 'strong'
                ? 'Hali uzoq xotiraga o‘tgan so‘z yo‘q. Takrorlash ularni shu yerga olib keladi.'
                : 'Hali so‘z o‘rganilmagan — birinchi darsdan keyin shu yerda paydo bo‘ladi.'}
        </Panel>
      )}

      {groups.slice(0, shown).map((group) => (
        <Panel key={group.unitId} padding="sm" data-testid={`vocab-group-${group.unitId}`}>
          <h3 className="mb-1 text-sm font-extrabold text-ink-600">
            {group.title} · {group.entries.length}
          </h3>
          <ul className="flex flex-col divide-y divide-ink-300/40">
            {group.entries.map(({ card, strength, hard }) => (
              <VocabularyRow
                key={card.id}
                card={card}
                strength={strength}
                hard={hard}
                hideTranslation={hideTranslation}
              />
            ))}
          </ul>
        </Panel>
      ))}

      {groups.length > shown && (
        <button
          type="button"
          onClick={() => setShown((count) => count + GROUP_PAGE)}
          className="tap-highlight-none rounded-2xl border-2 border-ink-300 py-2 text-sm font-bold text-ink-600"
        >
          Yana {Math.min(GROUP_PAGE, groups.length - shown)} ta dars ko‘rsatish
        </button>
      )}
    </div>
  )
}

interface VocabularyRowProps {
  card: CardRecord
  strength: number
  hard: boolean
  hideTranslation: boolean
}

function VocabularyRow({ card, strength, hard, hideTranslation }: VocabularyRowProps) {
  const meta = LANGUAGES[card.language]
  const reading = readingFor(card.word, meta.script)
  const [revealed, setRevealed] = useState(false)
  const showTranslation = !hideTranslation || revealed

  return (
    <li className="flex items-center gap-2 py-1.5" data-testid={`vocab-${card.id}`}>
      <span className="flex min-w-0 flex-col">
        <span
          dir={meta.dir}
          lang={meta.code}
          className={meta.dir === 'rtl' ? 'text-lg font-bold' : 'font-bold'}
        >
          {hard && <span aria-label="qiyin">⚠️ </span>}
          {card.word}
        </span>
        {reading && <span className="text-xs text-ink-600">{reading}</span>}
      </span>
      <span className="ms-auto flex flex-col items-end gap-1">
        {showTranslation ? (
          <span className="text-end text-sm text-ink-600">{card.translation}</span>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="tap-highlight-none rounded-lg bg-ink-300/30 px-2 py-0.5 text-xs font-bold text-ink-600"
          >
            ko‘rsatish
          </button>
        )}
        <StrengthDots value={strength} />
      </span>
      <SpeakButton text={card.word} locale={meta.speechLocale} />
    </li>
  )
}
