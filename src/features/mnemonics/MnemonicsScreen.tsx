import { useEffect, useMemo, useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { getAllCards, getMnemonicCards, setMnemonic, type CardRecord } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { MnemonicRow } from './MnemonicRow'

/**
 * Qidiruv natijalari chegarasi.
 *
 * Lug'atda ~10 000 karta bor; hammasini chizish telefonni qotirardi.
 * Chegara foydalanuvchidan yashirilmaydi — pastda ochiq yoziladi.
 */
const MAX_RESULTS = 50

/**
 * "Assotsiatsiyalarim" — mnemonikalarni bir joyda boshqarish.
 *
 * Ochilganda faqat yozilganlari ko'rinadi; qidiruv esa BUTUN lug'at bo'ylab
 * ishlaydi, shu tariqa istalgan so'zga yangi assotsiatsiya qo'shiladi.
 *
 * Qidiruv XOTIRADA bajariladi: har harfda bazaga so'rov yuborish minglab
 * kartada ortiqcha yuk bo'lardi.
 */
export function MnemonicsScreen() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)

  const [withMnemonic, setWithMnemonic] = useState<CardRecord[] | null>(null)
  const [allCards, setAllCards] = useState<CardRecord[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!learningLanguage) return

    let cancelled = false

    void Promise.all([getMnemonicCards(learningLanguage), getAllCards(learningLanguage)])
      .then(([mine, all]) => {
        if (cancelled) return
        setWithMnemonic(mine)
        setAllCards(all)
      })
      .catch((error: unknown) => {
        console.error('Assotsiatsiyalarni yuklab bo‘lmadi:', error)
        if (!cancelled) setWithMnemonic([])
      })

    return () => {
      cancelled = true
    }
  }, [learningLanguage])

  const trimmed = query.trim().toLowerCase()

  const matches = useMemo(() => {
    if (!trimmed) return []

    return allCards.filter(
      (card) =>
        card.word.toLowerCase().includes(trimmed) ||
        card.translation.toLowerCase().includes(trimmed),
    )
  }, [allCards, trimmed])

  /** Bazaga yozib, ekrandagi ro'yxatni ham yangilaydi */
  async function persist(cardId: string, text: string) {
    try {
      await setMnemonic(cardId, text)
    } catch (error) {
      console.error('Assotsiatsiyani saqlab bo‘lmadi:', error)
      return
    }

    const apply = (card: CardRecord): CardRecord =>
      card.id === cardId ? { ...card, mnemonic: text || undefined } : card

    const updatedAll = allCards.map(apply)
    setAllCards(updatedAll)

    // Ro'yxat bazadan qayta so'ralmaydi — yangilangan kartalardan qayta
    // yig'iladi, shunda ekran darhol javob beradi
    setWithMnemonic(
      updatedAll
        .filter((card) => card.mnemonic?.trim())
        .sort((a, b) => a.word.localeCompare(b.word)),
    )
  }

  const shown = trimmed ? matches.slice(0, MAX_RESULTS) : (withMnemonic ?? [])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Assotsiatsiyalarim</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="mnemonic-search" className="text-sm font-semibold text-ink-600">
          So'z qidirish
        </label>
        <input
          id="mnemonic-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="so'z yoki tarjima…"
          autoComplete="off"
          className="h-12 w-full rounded-2xl border-2 border-ink-300 bg-white px-4 focus:border-brand-500 focus:outline-none"
        />
      </div>

      {withMnemonic === null && <Panel className="text-ink-600">Yuklanmoqda…</Panel>}

      {withMnemonic !== null && shown.length === 0 && (
        <Panel className="text-sm text-ink-600">
          {trimmed
            ? 'Bunday so‘z topilmadi.'
            : 'Hali assotsiatsiya yozmagansiz. Takrorlash paytida xato qilganingizda yoki shu yerda qidirib qo‘shing.'}
        </Panel>
      )}

      <ul className="flex flex-col gap-2">
        {shown.map((card) => (
          <MnemonicRow
            key={card.id}
            card={card}
            onSave={(cardId, text) => void persist(cardId, text)}
            onDelete={(cardId) => void persist(cardId, '')}
          />
        ))}
      </ul>

      {trimmed && matches.length > MAX_RESULTS && (
        <p className="text-center text-xs text-ink-600">
          Yana {matches.length - MAX_RESULTS} ta — qidiruvni aniqlashtiring.
        </p>
      )}
    </div>
  )
}
