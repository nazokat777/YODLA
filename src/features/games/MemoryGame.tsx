import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import { Panel } from '@/components/ui/Panel'
import { LANGUAGES } from '@/core/config/languages'
import { getAllCards, gradeCard, recordTypeResult, saveGameBest, type CardRecord } from '@/core/db'
import {
  MEMORY_PAIRS,
  isMemoryComplete,
  openTile,
  resolveMemory,
  startMemory,
  type MemoryState,
} from '@/core/games'
import { shuffle } from '@/lib/random'
import { cn } from '@/lib/cn'
import { useSettingsStore } from '@/stores/useSettingsStore'

/** Juft bo'lmagan kataklar necha ms ochiq turadi */
const FLIP_BACK_MS = 900

/** O'yin natijasi: kam urinish — yaxshi. Rekord uchun teskari o'lchov */
const PERFECT_ATTEMPTS = MEMORY_PAIRS

/**
 * Xotira o'yini: kartalar YOPIQ yotadi, juftini topish kerak.
 *
 * HOZIRGI "juftlash" MASHQIDAN FARQI: u yerda hamma so'z ko'rinib
 * turadi va vazifa mantiqiy moslashtirish. Bu yerda kataklar yopiq —
 * ya'ni so'zning ma'nosini ham, JOYINI ham eslab qolish kerak.
 */
export function MemoryGame() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const language = learningLanguage ? LANGUAGES[learningLanguage] : null

  const [cards, setCards] = useState<CardRecord[] | null>(null)
  const [state, setState] = useState<MemoryState | null>(null)
  const [round, setRound] = useState(0)
  const [isRecord, setIsRecord] = useState(false)

  useEffect(() => {
    if (!learningLanguage) return

    let cancelled = false

    void getAllCards(learningLanguage)
      .then((all) => {
        if (cancelled) return

        // Ko'rilgan so'zlar afzal — o'yin tekshiruv, o'rgatish emas
        const seen = all.filter((card) => card.totalReviews > 0)
        setCards(shuffle(seen.length >= MEMORY_PAIRS ? seen : all))
      })
      .catch((error: unknown) => {
        console.error('O‘yin uchun so‘zlarni yuklab bo‘lmadi:', error)
        if (!cancelled) setCards([])
      })

    return () => {
      cancelled = true
    }
  }, [learningLanguage])

  // Har raundda yangi taxta
  useEffect(() => {
    if (!cards || cards.length < MEMORY_PAIRS) return

    setState(startMemory(shuffle(cards), MEMORY_PAIRS))
    setIsRecord(false)
  }, [cards, round])

  /*
   * Ikkita katak ochilgach juftlik TEKSHIRILADI.
   *
   * Kechikish ataylab: juft bo'lmagan kataklar bir lahza ochiq turishi
   * kerak, aks holda bola ularni ko'rib ulgurmaydi va o'yin xotirani
   * emas, tasodifni sinardi.
   */
  useEffect(() => {
    if (!state || state.opened.length < 2) return

    const [first, second] = state.opened
    const firstTile = state.tiles.find((tile) => tile.id === first)
    const secondTile = state.tiles.find((tile) => tile.id === second)
    const isPair = firstTile?.cardId === secondTile?.cardId

    if (firstTile) {
      /*
       * SM-2 ga yumshoq baho (`matching` kabi): o'yindagi xato
       * ko'pincha esdan chiqqanidan emas, joyini adashganidan.
       */
      void gradeCard(firstTile.cardId, isPair ? 4 : 2)
      void recordTypeResult(firstTile.cardId, 'matching', !isPair)
    }

    const timer = window.setTimeout(
      () => setState((current) => (current ? resolveMemory(current) : current)),
      isPair ? 250 : FLIP_BACK_MS,
    )

    return () => clearTimeout(timer)
  }, [state])

  const complete = state !== null && isMemoryComplete(state)

  // O'yin tugadi — rekord (kam urinish yaxshi, shuning uchun teskari)
  useEffect(() => {
    if (!complete || !state) return

    const score = Math.max(1, PERFECT_ATTEMPTS * 2 - state.attempts)
    void saveGameBest('memory', score).then(setIsRecord)
  }, [complete, state])

  const handleOpen = useCallback((tileId: string) => {
    setState((current) => (current ? openTile(current, tileId) : current))
  }, [])

  if (cards === null) return <Panel className="text-ink-600">Yuklanmoqda…</Panel>

  if (cards.length < MEMORY_PAIRS) {
    return (
      <div className="flex flex-col gap-3">
        <Panel className="text-center text-ink-600">
          O‘yin uchun kamida {MEMORY_PAIRS} ta so‘z kerak. Avval bir dars o‘ting.
        </Panel>
        <LinkButton to={PATHS.home} block>
          Bosh sahifaga
        </LinkButton>
      </div>
    )
  }

  if (!state) return <Panel className="text-ink-600">Yuklanmoqda…</Panel>

  if (complete) {
    return (
      <div className="flex flex-col gap-3">
        <Panel className="text-center">
          <p className="text-5xl" aria-hidden="true">
            {isRecord ? '🏆' : '🧠'}
          </p>
          <h2 className="mt-2 text-xl font-extrabold">
            {isRecord ? 'Yangi rekord!' : 'Hammasi topildi!'}
          </h2>
          <p data-testid="memory-attempts" className="mt-2 text-sm text-ink-600">
            {state.attempts} ta urinish
          </p>
        </Panel>
        <Button block size="lg" onClick={() => setRound((current) => current + 1)}>
          Yana o‘ynash
        </Button>
        <Link to={PATHS.games} className="text-center text-sm font-semibold text-ink-600">
          O‘yinlarga qaytish
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-extrabold">Xotira o‘yini</h1>
        <span data-testid="memory-progress" className="text-sm font-semibold text-ink-600">
          {state.matched.length / 2}/{state.tiles.length / 2} juft
        </span>
      </div>

      <ul className="grid grid-cols-3 gap-2">
        {state.tiles.map((tile) => {
          const matched = state.matched.includes(tile.id)
          const open = matched || state.opened.includes(tile.id)
          const isTarget = tile.side === 'word'

          return (
            <li key={tile.id}>
              <button
                type="button"
                onClick={() => handleOpen(tile.id)}
                disabled={open}
                dir={open && isTarget ? language?.dir : 'ltr'}
                lang={open && isTarget ? language?.code : 'uz'}
                aria-label={open ? tile.text : 'Yopiq katak'}
                className={cn(
                  'tap-highlight-none flex min-h-20 w-full items-center justify-center rounded-2xl border-2 px-1 py-2 text-center text-sm font-bold transition-colors',
                  matched && 'border-brand-500 bg-brand-100 text-brand-700',
                  open && !matched && 'border-sky-500 bg-sky-100',
                  !open && 'border-ink-300 bg-white',
                )}
              >
                {/* Yopiq katakda MATN umuman chizilmaydi: `hidden`
                    bilan yashirilgan matnni ekran o'quvchi o'qib
                    yuborishi va o'yinni buzishi mumkin edi */}
                {open ? tile.text : <span aria-hidden="true">❓</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
