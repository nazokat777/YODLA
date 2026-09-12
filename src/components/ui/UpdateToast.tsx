import { useEffect, useState } from 'react'
import { onUpdateAvailable } from '@/lib/pwa'

/**
 * "Yangi versiya tayyor" — pastdan chiqadigan kichik xabar.
 *
 * Yangilash foydalanuvchining qo'lida: dars o'rtasida majburiy qayta
 * yuklash javoblarni yo'qotardi. Yopish ham mumkin — keyingi ochilishda
 * baribir yangi versiya.
 */
export function UpdateToast() {
  const [ready, setReady] = useState(false)

  useEffect(() => onUpdateAvailable(() => setReady(true)), [])

  if (!ready) return null

  return (
    <div
      role="status"
      data-testid="update-toast"
      className="fixed inset-x-4 bottom-20 z-30 mx-auto flex max-w-[448px] items-center gap-3 rounded-2xl bg-ink-900 px-4 py-3 text-sm text-white shadow-pop-lg"
    >
      <span className="flex-1">✨ Yangi versiya tayyor</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="tap-highlight-none rounded-xl bg-white px-3 py-1.5 font-bold text-ink-900"
      >
        Yangilash
      </button>
      <button
        type="button"
        aria-label="Yopish"
        onClick={() => setReady(false)}
        className="tap-highlight-none px-1 text-white/70"
      >
        ✕
      </button>
    </div>
  )
}
