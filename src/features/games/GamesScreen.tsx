import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Panel } from '@/components/ui/Panel'
import { db } from '@/core/db'
import type { GameId } from '@/core/db'

interface GameEntry {
  id: GameId
  to: string
  icon: string
  title: string
  description: string
  /** Rekord qanday o'lchanadi */
  unit: string
}

const GAMES: GameEntry[] = [
  {
    id: 'speed',
    to: PATHS.speedGame,
    icon: '⚡',
    title: 'Vaqtga qarshi',
    description: '60 soniyada nechta so‘zni bilasiz?',
    unit: 'ochko',
  },
  {
    id: 'memory',
    to: PATHS.memoryGame,
    icon: '🧠',
    title: 'Xotira o‘yini',
    description: 'Yopiq kartalardan juftini toping',
    unit: 'ball',
  },
]

/**
 * O'yinlar sahifasi.
 *
 * NEGA ALOHIDA SAHIFA, pastki navigatsiyada emas: u yerda allaqachon
 * beshta element bor va 320 px li ekranda ular tor joylashgan
 * (o'lchandi). Oltinchisi qo'shilsa yorliqlar o'qib bo'lmas holga
 * kelardi.
 */
export function GamesScreen() {
  /*
   * FAQAT O'QISH. `ensureProfile()` `rw` tranzaksiya ochadi va uni
   * `useLiveQuery` ichida chaqirib bo'lmaydi — Dexie xato beradi va
   * natija jimgina `undefined` bo'lib qoladi, ya'ni rekordlar hech
   * qachon ko'rinmasdi.
   */
  const profile = useLiveQuery(() => db.profile.get('me'), [])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">O‘yinlar</h1>
        <p className="mt-1 text-sm text-ink-600">
          Bilganingizni mustahkamlang — tez va qiziqarli.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {GAMES.map((game) => {
          const best = profile?.gameBests?.[game.id] ?? 0

          return (
            <li key={game.id}>
              <Link to={game.to} className="tap-highlight-none block">
                <Panel interactive className="flex items-center gap-3">
                  <span aria-hidden="true" className="text-4xl">
                    {game.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold">{game.title}</span>
                    <span className="block text-sm text-ink-600">{game.description}</span>
                  </span>
                  {/* Rekord FAQAT bor bo'lsa: "0 ochko" hech kimni
                      ilhomlantirmaydi va bo'sh joyni egallaydi */}
                  {best > 0 && (
                    <span className="shrink-0 rounded-full bg-flame-500/15 px-3 py-1 text-sm font-extrabold text-flame-700">
                      🏆 {best} {game.unit}
                    </span>
                  )}
                </Panel>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
