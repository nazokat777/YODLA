import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Panel } from '@/components/ui/Panel'
import type { CardRecord } from '@/core/db'
import { unitIdOf, type PathUnit } from '@/core/path'
import type { LearnedWord } from '@/features/session/SessionRunner'

interface ExamReportProps {
  covered: PathUnit[]
  examCards: CardRecord[]
  /** Birinchi urinishda xato qilingan so'zlar */
  missed: LearnedWord[]
  /** Topshirganlik uchun berilgan bonus (0 — qayta topshirish) */
  bonusXp: number
}

/**
 * Imtihon hisoboti — MAVZULAR kesimida.
 *
 * "Qaysi mavzu bo'sh?" savoliga javob: har bo'lim uchun to'g'ri/jami va
 * adashilgan so'zlar. Adashilgan so'z yoniga ✍️ — assotsiatsiya yozish
 * havolasi: o'z qo'li bilan yozilgan obraz (keyword method) tarjimani
 * yod olishdan 2–3 barobar mustahkamroq (Atkinson 1975).
 */
export function ExamReport({ covered, examCards, missed, bonusXp }: ExamReportProps) {
  const missedIds = new Set(missed.map((word) => word.id))
  const total = examCards.length
  const correct = total - missedIds.size
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)

  const rows = covered
    .map((unit) => {
      const cards = examCards.filter(
        (card) => card.level && card.topic && unitIdOf(card.level, card.topic) === unit.id,
      )
      return {
        unit,
        total: cards.length,
        missed: cards.filter((card) => missedIds.has(card.id)),
      }
    })
    .filter((row) => row.total > 0)

  return (
    <Panel padding="sm" data-testid="exam-report">
      <div className="flex items-baseline justify-between">
        <h3 className="font-extrabold">🏆 Imtihon topshirildi</h3>
        <span className="text-sm font-bold text-ink-600">
          {correct}/{total} · {percent}%
        </span>
      </div>
      {bonusXp > 0 && (
        <p className="mt-0.5 text-sm font-bold text-brand-700">+{bonusXp} XP imtihon bonusi</p>
      )}

      <ul className="mt-2 flex flex-col gap-1.5">
        {rows.map(({ unit, total: unitTotal, missed: unitMissed }) => (
          <li key={unit.id} className="text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="line-clamp-1 font-semibold">{unit.title}</span>
              <span
                className={
                  unitMissed.length === 0 ? 'shrink-0 font-bold text-brand-700' : 'shrink-0 font-bold text-flame-500'
                }
              >
                {unitMissed.length === 0 ? '✓' : '⚠'} {unitTotal - unitMissed.length}/{unitTotal}
              </span>
            </div>
            {unitMissed.length > 0 && (
              <ul className="mt-0.5 flex flex-wrap gap-1">
                {unitMissed.map((card) => (
                  <li key={card.id}>
                    <Link
                      to={`${PATHS.mnemonics}?q=${encodeURIComponent(card.word)}`}
                      className="inline-flex items-center gap-1 rounded-full bg-flame-500/10 px-2 py-0.5 text-xs font-bold text-ink-900"
                      title="Assotsiatsiya yozish"
                    >
                      {card.word} <span aria-hidden="true">✍️</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {missed.length > 0 && (
        <p className="mt-2 text-xs text-ink-600">
          Adashilgan so‘zlar qayta o‘zlashtirildi va ertaga takrorlashga chiqadi. ✍️ — o‘z
          assotsiatsiyangizni yozing: obraz so‘zni uzoqroq ushlab turadi.
        </p>
      )}
    </Panel>
  )
}
