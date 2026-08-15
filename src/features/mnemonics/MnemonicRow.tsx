import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { LANGUAGES } from '@/core/config/languages'
import type { CardRecord } from '@/core/db'

interface MnemonicRowProps {
  card: CardRecord
  onSave: (cardId: string, text: string) => void
  onDelete: (cardId: string) => void
}

/**
 * Ro'yxatdagi bitta so'z: mnemonikani ko'rsatadi yoki tahrirlaydi.
 *
 * Bazaga O'ZI yozmaydi — ota komponent yozadi. Sabab: ro'yxatni yangilash
 * ham o'sha yerda bo'ladi, ikki joyda yozish holatni ikkiga bo'lardi
 * ("o'chirdim-u ekranda turibdi" kabi nosozlik shundan chiqadi).
 */
export function MnemonicRow({ card, onSave, onDelete }: MnemonicRowProps) {
  const language = LANGUAGES[card.language]
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(card.mnemonic ?? '')

  function handleSave() {
    const trimmed = value.trim()
    if (trimmed.length === 0) return

    onSave(card.id, trimmed)
    setIsEditing(false)
  }

  return (
    <li className="flex flex-col gap-2 rounded-2xl border-2 border-ink-300 bg-white p-3">
      <p className="flex flex-wrap items-baseline gap-2">
        <span dir={language.dir} lang={language.code} className="font-bold">
          {card.word}
        </span>
        <span className="text-sm text-ink-600">— {card.translation}</span>
      </p>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`mn-${card.id}`} className="text-sm text-ink-600">
            Assotsiatsiya
          </label>
          <input
            id={`mn-${card.id}`}
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSave()
            }}
            placeholder="masalan: «birodar non olib keldi»"
            className="h-12 w-full rounded-xl border-2 border-ink-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={value.trim().length === 0}>
              Saqlash
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setValue(card.mnemonic ?? '')
                setIsEditing(false)
              }}
            >
              Bekor qilish
            </Button>
          </div>
        </div>
      ) : card.mnemonic ? (
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm text-ink-600 italic">💡 {card.mnemonic}</p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`${card.word} — tahrirlash`}
            className="tap-highlight-none flex h-11 w-11 items-center justify-center rounded-full hover:bg-brand-50"
          >
            <span aria-hidden="true">✏️</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            aria-label={`${card.word} — o'chirish`}
            className="tap-highlight-none flex h-11 w-11 items-center justify-center rounded-full hover:bg-wrong-500/10"
          >
            <span aria-hidden="true">🗑️</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="tap-highlight-none min-h-11 text-start text-sm font-semibold text-brand-700 underline underline-offset-4"
        >
          Assotsiatsiya qo'shish
        </button>
      )}
    </li>
  )
}
