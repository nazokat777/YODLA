import { Panel } from '@/components/ui/Panel'
import { plankChain } from '@/core/books'
import { cn } from '@/lib/cn'

interface ChainStripProps {
  history: ReadonlyArray<{ day: number; cardIds: readonly string[] }>
  minWords: number
}

/** Hafta kuni qisqa nomi */
const WEEKDAY = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']

/**
 * Planka ZANJIRI — oxirgi 14 kun, har bajarilgan kun ✓ bilan.
 *
 * "Kalendarga plus qo'yish" (treking): bola zanjirni ko'radi va uni
 * uzgisi kelmaydi. Bugun hali bajarilmagan bo'lsa katak bo'sh, lekin
 * zanjir uzilgan hisoblanmaydi — kun tugamagan.
 */
export function ChainStrip({ history, minWords }: ChainStripProps) {
  const chain = plankChain(history, Math.max(1, minWords), Date.now())

  return (
    <Panel padding="sm" data-testid="chain-strip">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-extrabold">
          🔗 {chain.current > 0 ? `${chain.current} kunlik zanjir` : 'Zanjirni bugun boshlang'}
        </h2>
        {chain.best > chain.current && (
          <span className="text-xs font-bold text-ink-600">rekord: {chain.best}</span>
        )}
      </div>
      <ol className="mt-2 grid grid-cols-7 gap-1" aria-label="Oxirgi 14 kun">
        {chain.days.map((entry) => (
          <li key={entry.day} className="flex flex-col items-center gap-0.5">
            <span
              data-met={entry.met}
              title={`${entry.words} so‘z`}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold',
                entry.met ? 'bg-brand-500 text-white' : 'bg-ink-300/30 text-ink-600',
                entry.today && !entry.met && 'ring-2 ring-brand-500',
              )}
            >
              {entry.met ? '✓' : ''}
            </span>
            <span className="text-[10px] font-semibold text-ink-600">
              {WEEKDAY[new Date(entry.day).getDay()]}
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
