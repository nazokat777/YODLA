import { PATHS } from '@/app/paths'
import { LinkButton } from '@/components/ui/LinkButton'

/** 404 — mavjud bo'lmagan manzil */
export function NotFoundScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl" aria-hidden="true">
        🧭
      </div>
      <h1 className="text-xl font-extrabold">Bunday sahifa yo'q</h1>
      <p className="text-sm text-ink-600">Havola eskirgan yoki noto'g'ri bo'lishi mumkin.</p>
      <LinkButton to={PATHS.home}>Bosh sahifaga qaytish</LinkButton>
    </div>
  )
}
