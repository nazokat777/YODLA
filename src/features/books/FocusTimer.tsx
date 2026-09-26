import { useEffect, useRef, useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { cn } from '@/lib/cn'

/** Diqqat bloklari — daqiqada: ish + dam */
const BLOCKS = [
  { work: 15, rest: 3, label: '15 + 3' },
  { work: 25, rest: 5, label: '25 + 5' },
] as const

type Phase = 'idle' | 'work' | 'rest'

/** "04:59" */
function format(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * DIQQAT TAYMERI — 15+3 yoki 25+5.
 *
 * Diqqat — xotira va ma'lumot orasidagi ko'prik: chalg'igan miya
 * yodlamaydi. Taymer ishni aniq bloklarga bo'ladi (time blocking) va
 * damni MAJBURIY qiladi — dam paytida miya o'rganilganni joylashtiradi.
 *
 * Vaqt `Date.now()` dan hisoblanadi, sanagichdan emas: telefon ekrani
 * o'chsa ham yoki tab fonda turib `setInterval` sekinlashsa ham taymer
 * to'g'ri qoladi.
 */
export function FocusTimer() {
  const [block, setBlock] = useState<(typeof BLOCKS)[number]>(BLOCKS[0])
  const [phase, setPhase] = useState<Phase>('idle')
  const [endsAt, setEndsAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (phase === 'idle') return
    tickRef.current = setInterval(() => setNow(Date.now()), 500)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [phase])

  const left = Math.max(0, Math.round((endsAt - now) / 1000))

  // Blok tugadi — keyingisiga o'tish
  useEffect(() => {
    if (phase === 'idle' || left > 0) return
    if (phase === 'work') {
      setPhase('rest')
      setEndsAt(Date.now() + block.rest * 60_000)
    } else {
      setPhase('idle')
    }
    try {
      navigator.vibrate?.(200)
    } catch {
      // Tebranish bo'lmasa — jim
    }
  }, [left, phase, block.rest])

  const start = () => {
    setPhase('work')
    setEndsAt(Date.now() + block.work * 60_000)
    setNow(Date.now())
  }

  return (
    <Panel padding="sm" data-testid="focus-timer">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">⏱️ Diqqat taymeri</h2>
        {phase === 'idle' && (
          <div className="flex gap-1" role="group" aria-label="Blok uzunligi">
            {BLOCKS.map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={block.label === option.label}
                onClick={() => setBlock(option)}
                className={cn(
                  'tap-highlight-none rounded-full px-2.5 py-1 text-xs font-bold',
                  block.label === option.label ? 'bg-brand-700 text-white' : 'bg-ink-300/30 text-ink-600',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {phase === 'idle' ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-ink-600">
            {block.work} daqiqa faqat so‘z, telefon bildirishnomalari o‘chiq. Keyin {block.rest} daqiqa
            dam — miya shu paytda joylashtiradi.
          </p>
          <button
            type="button"
            onClick={start}
            data-testid="focus-start"
            className="tap-highlight-none shrink-0 rounded-2xl bg-brand-700 px-4 py-2 text-sm font-extrabold text-white"
          >
            Boshlash
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-3xl font-extrabold tabular-nums" data-testid="focus-left">
              {format(left)}
            </p>
            <p className="text-xs font-bold text-ink-600">
              {phase === 'work' ? '🎯 Diqqat bloki' : '☕ Dam — ko‘zni yuming, nafas oling'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPhase('idle')}
            className="tap-highlight-none rounded-2xl border-2 border-ink-300 px-3 py-1.5 text-sm font-bold text-ink-600"
          >
            To‘xtatish
          </button>
        </div>
      )}
    </Panel>
  )
}
