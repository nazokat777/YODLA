import { useEffect, useRef } from 'react'
import { Panel } from '@/components/ui/Panel'
import { WordImage } from '@/components/ui/WordImage'
import { LANGUAGES } from '@/core/config/languages'
import { enterStagger, withMotion } from '@/lib/motion'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { LearnedWord } from './SessionRunner'

interface LootStripProps {
  words: readonly LearnedWord[]
}

/**
 * BUGUNGI O'LJA — seansda bilingan so'zlar kartochkalar sifatida.
 *
 * PEDAGOGIKA: yakundagi qayta ko'rish — yana bitta eslab chaqirish
 * (retrieval), u ham yengil va bosimsiz: bola so'zni ko'radi va ichida
 * "ha, buni bilaman" deydi. Bu seansning oxirgi taassuroti — va oxirgi
 * taassurot eslab qolinadi (recency).
 *
 * PSIXOLOGIYA: to'plam (collection) hissi — kartochkalar birma-bir
 * "tushadi", har biri o'lja. So'zlar raqam emas, NARSA bo'ladi.
 */
export function LootStrip({ words }: LootStripProps) {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const language = learningLanguage ? LANGUAGES[learningLanguage] : null
  const rootRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    let cancelled = false
    let revert = () => {}

    void withMotion(rootRef.current, (gsap) => {
      enterStagger(gsap, '[data-loot]', { stagger: 0.09, duration: 0.45, y: 16 })
    }).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [words])

  if (words.length === 0) return null

  return (
    <Panel data-testid="loot-strip" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h3 className="font-bold">Bugungi o‘lja</h3>
        <span className="text-sm text-ink-600">{words.length} so‘z</span>
      </div>
      {/* Gorizontal lenta: 375 px da 3–4 kartochka ko'rinadi, qolgani suriladi */}
      <ul ref={rootRef} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {words.map((word) => (
          <li
            key={word.id}
            data-loot
            className="flex w-24 shrink-0 flex-col items-center gap-1 rounded-2xl border border-brand-100 bg-brand-50 px-2 py-3 text-center"
          >
            <WordImage translation={word.translation} size="sm" />
            <span
              dir={language?.dir}
              lang={language?.code}
              className={
                language?.dir === 'rtl'
                  ? 'w-full truncate text-lg font-bold leading-relaxed'
                  : 'w-full truncate text-sm font-bold'
              }
            >
              {word.word}
            </span>
            <span className="w-full truncate text-xs text-ink-600">{word.translation}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
