import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import { Panel } from '@/components/ui/Panel'
import { getAllCards, type CardRecord } from '@/core/db'
import { pickLessonCards } from '@/core/lesson/order'
import { SessionRunner, type SessionSummary } from '@/features/session/SessionRunner'
import { SessionSummaryPanel } from '@/features/session/SessionSummaryPanel'
import { useSettingsStore } from '@/stores/useSettingsStore'

/** Bir darsda nechta so'z beriladi */
const LESSON_SIZE = 5

/**
 * Dars ekrani (TZ 6.3): yangi so'zlarni o'rganish.
 *
 * Takrorlashdan farqi — bu yerda avval HALI KO'RILMAGAN so'zlar beriladi.
 * Ular yetmasa, eng kam mustahkamlangan so'zlar bilan to'ldiriladi.
 */
export function LessonScreen() {
  const navigate = useNavigate()
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)

  const [cards, setCards] = useState<CardRecord[] | null>(null)
  const [pool, setPool] = useState<CardRecord[]>([])
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  /** Qiymati o'zgarganda yangi dars yuklanadi */
  const [lessonKey, setLessonKey] = useState(0)

  useEffect(() => {
    if (!learningLanguage) return

    let cancelled = false
    setCards(null)
    setSummary(null)

    getAllCards(learningLanguage)
      .then((all) => {
        if (cancelled) return

        setPool(all)
        // Tartib domen qoidasi — core/lesson/order.ts da test qilingan
        setCards(pickLessonCards(all, LESSON_SIZE))
      })
      .catch((error: unknown) => {
        console.error('Darsni yuklab bo‘lmadi:', error)
        if (!cancelled) setCards([])
      })

    return () => {
      cancelled = true
    }
  }, [learningLanguage, lessonKey])

  const handleFinish = useCallback((result: SessionSummary) => setSummary(result), [])

  return (
    <div className="flex flex-1 flex-col p-4">
      {/* Yuqori panel: darsdan chiqish */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(PATHS.home)}
          aria-label="Darsdan chiqish"
          className="tap-highlight-none text-2xl text-ink-600"
        >
          ✕
        </button>
        <h1 className="text-lg font-extrabold">Dars</h1>
      </div>

      {cards === null && <Panel className="text-ink-600">Yuklanmoqda…</Panel>}

      {cards !== null && cards.length === 0 && (
        <Panel className="text-center text-ink-600">
          Bu tilda hali so‘z yo‘q.
        </Panel>
      )}

      {cards !== null && cards.length > 0 && summary === null && (
        <SessionRunner key={lessonKey} cards={cards} pool={pool} onFinish={handleFinish} />
      )}

      {summary !== null && (
        <div className="flex flex-col gap-3">
          <SessionSummaryPanel summary={summary} />
          <LinkButton to={PATHS.home} block>
            Bosh sahifaga
          </LinkButton>
          <Button variant="ghost" block onClick={() => setLessonKey((key) => key + 1)}>
            Yana bir dars
          </Button>
        </div>
      )}
    </div>
  )
}
