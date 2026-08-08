import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'

interface FocusLayoutProps {
  /**
   * Ixtiyoriy kontent. Berilmasa <Outlet /> ishlatiladi —
   * shu tufayli qobiq ham marshrut qobig'i, ham oddiy o'rov sifatida ishlaydi.
   */
  children?: ReactNode
}

/**
 * Diqqatni chalg'itmaydigan qobiq: onboarding, dars va 404 uchun.
 * Pastki navigatsiya yo'q — foydalanuvchi mashqqa to'liq berilib ketadi
 * (Flow nazariyasi: tashqi uzilishlarni kamaytirish).
 */
export function FocusLayout({ children }: FocusLayoutProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col bg-white">
      {children ?? <Outlet />}
    </div>
  )
}
