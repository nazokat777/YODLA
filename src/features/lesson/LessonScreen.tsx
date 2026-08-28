import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import { Panel } from '@/components/ui/Panel'
import { getAllCards, type CardRecord } from '@/core/db'
import { pickLessonCards } from '@/core/lesson/order'
import { unitIdOf } from '@/core/path'
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
  const startingLevel = useSettingsStore((s) => s.startingLevel)
  const { lessonId } = useParams<{ lessonId?: string }>()

  const [cards, setCards] = useState<CardRecord[] | null>(null)
  const [pool, setPool] = useState<CardRecord[]>([])
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  /** So'ralgan bo'lim umuman mavjud emas (eskirgan havola) */
  const [isMissingUnit, setIsMissingUnit] = useState(false)
  /** Qiymati o'zgarganda yangi dars yuklanadi */
  const [lessonKey, setLessonKey] = useState(0)

  useEffect(() => {
    if (!learningLanguage) return

    let cancelled = false
    setCards(null)
    setSummary(null)
    setIsMissingUnit(false)

    getAllCards(learningLanguage)
      .then((all) => {
        if (cancelled) return

        // Bo'lim berilgan bo'lsa — faqat o'sha mavzu so'zlari.
        // Bo'lim ichida daraja bir xil, shuning uchun minLevel uzatilmaydi.
        const scope = lessonId
          ? all.filter((card) =>
              card.level && card.topic ? unitIdOf(card.level, card.topic) === lessonId : false,
            )
          : all

        // Bo'lim so'ralgan, lekin unga hech bir karta tushmadi — holbuki
        // tilda kartalar bor. Ya'ni bo'lim YO'Q (eskirgan xatcho'p yoki
        // yangilanishdan keyin nomi o'zgargan mavzu), lug'at bo'sh emas.
        setIsMissingUnit(Boolean(lessonId) && scope.length === 0 && all.length > 0)

        setPool(scope)
        // Tartib domen qoidasi — core/lesson/order.ts da test qilingan
        setCards(pickLessonCards(scope, LESSON_SIZE, lessonId ? undefined : startingLevel))
      })
      .catch((error: unknown) => {
        console.error('Darsni yuklab bo‘lmadi:', error)
        if (!cancelled) setCards([])
      })

    return () => {
      cancelled = true
    }
  }, [learningLanguage, lessonKey, startingLevel, lessonId])

  const handleFinish = useCallback((result: SessionSummary) => setSummary(result), [])

  return (
    <div className="flex flex-1 flex-col p-4">
      {/* Yuqori panel: darsdan chiqish */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(PATHS.home)}
          aria-label="Darsdan chiqish"
          /*
           * 44×44 — barmoq uchun eng kichik ishonchli o'lcham.
           * Ilgari tugma faqat ✕ belgisining o'zi edi (20×32) va uni
           * telefonda birinchi urinishda bosish qiyin bo'lardi. Bu esa
           * darsdan chiqishning YAGONA yo'li.
           */
          className="tap-highlight-none -ms-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl text-ink-600"
        >
          ✕
        </button>
        <h1 className="text-lg font-extrabold">Dars</h1>
      </div>

      {cards === null && <Panel className="text-ink-600">Yuklanmoqda…</Panel>}

      {cards !== null && cards.length === 0 && isMissingUnit && (
        <div className="flex flex-col gap-3">
          <Panel className="text-center text-ink-600">
            Bu bo‘lim topilmadi. U yangilanishdan keyin boshqa nom olgan
            bo‘lishi mumkin — o‘quv yo‘lidan qaytadan tanlang.
          </Panel>
          <LinkButton to={PATHS.home} block>
            Bosh sahifaga
          </LinkButton>
        </div>
      )}

      {cards !== null && cards.length === 0 && !isMissingUnit && (
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
