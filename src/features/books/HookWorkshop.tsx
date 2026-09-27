import { useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { LANGUAGES } from '@/core/config/languages'
import { setMnemonic, type CardRecord } from '@/core/db'
import { transliterate } from '@/core/text/transliterate'

interface HookWorkshopProps {
  /** Bugun ko'rilgan, ilgagi hali yo'q so'zlar (eng ko'pi 3 ta) */
  cards: CardRecord[]
}

/**
 * ILGAK USTAXONASI — bugungi so'zga shu yerning o'zida ilgak yozish.
 *
 * Mnemonika algoritmining 3–4-qadamlari: begona tovushni tanish
 * o'zbekcha tovushga ulash (kalit-so'z usuli, Atkinson 1975) va
 * tovush bilan ma'noni BITTA kadrga joylash. O'z qo'li bilan yasalgan
 * obraz tayyor berilganidan ancha mustahkam (generation effect).
 *
 * Ikki maydon ataylab alohida: "o'xshash so'z" va "sahna". Bittada
 * bo'lsa bola faqat tarjimani qayta yozib qo'yardi — bu ilgak emas.
 */
export function HookWorkshop({ cards }: HookWorkshopProps) {
  return (
    <Panel padding="sm" data-testid="hook-workshop">
      <h2 className="font-bold">🔗 Bugungi so‘zlarga ilgak</h2>
      <p className="mt-0.5 text-xs text-ink-600">
        So‘z qaysi o‘zbekcha so‘zga o‘xshab eshitiladi? Ikkalasini bitta kulgili sahnaga joylang —
        masalan: <i>pillow → pilov: yostiq yorilib, ichidan pilov uchib chiqdi</i>.
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {cards.map((card) => (
          <li key={card.id}>
            <HookForm card={card} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function HookForm({ card }: { card: CardRecord }) {
  const language = LANGUAGES[card.language]
  const reading = transliterate(card.word, language.script)
  const [sound, setSound] = useState('')
  const [scene, setScene] = useState('')
  const [saved, setSaved] = useState(false)

  const canSave = sound.trim().length > 0 && scene.trim().length > 0

  const save = async () => {
    if (!canSave) return
    try {
      await setMnemonic(card.id, `${sound.trim()} — ${scene.trim()}`)
      setSaved(true)
    } catch (error) {
      console.error('Ilgakni saqlab bo‘lmadi:', error)
    }
  }

  if (saved) {
    return (
      <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">
        ✓ {card.word} — ilgak saqlandi. Takrorlashda ko‘rinadi.
      </p>
    )
  }

  return (
    <form
      className="flex flex-col gap-1.5 rounded-xl border-2 border-ink-300/60 p-2.5"
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      <p className="text-sm">
        <b dir={language.dir} lang={language.code} className={language.dir === 'rtl' ? 'text-lg' : ''}>
          {card.word}
        </b>
        {reading && <span className="text-ink-600"> ({reading})</span>}
        <span className="text-ink-600"> — {card.translation}</span>
      </p>
      <input
        value={sound}
        onChange={(event) => setSound(event.target.value)}
        placeholder="O‘xshash o‘zbekcha so‘z (masalan: pilov)"
        aria-label={`${card.word} — o‘xshash so‘z`}
        className="h-10 rounded-lg border-2 border-ink-300 px-2.5 text-sm focus:border-brand-500 focus:outline-none"
      />
      <input
        value={scene}
        onChange={(event) => setScene(event.target.value)}
        placeholder="Sahna: ikkalasi birga nima qilyapti?"
        aria-label={`${card.word} — sahna`}
        className="h-10 rounded-lg border-2 border-ink-300 px-2.5 text-sm focus:border-brand-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!canSave}
        className="tap-highlight-none self-end rounded-xl bg-brand-700 px-3 py-1.5 text-sm font-extrabold text-white disabled:opacity-40"
      >
        Saqlash
      </button>
    </form>
  )
}
