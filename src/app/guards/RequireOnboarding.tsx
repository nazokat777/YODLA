import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Marshrut qorovuli: onboarding tugallanmagan bo'lsa,
 * foydalanuvchini til tanlash ekraniga qaytaradi.
 */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const onboardingCompleted = useSettingsStore((s) => s.onboardingCompleted)

  if (!onboardingCompleted) {
    return <Navigate to={PATHS.onboarding} replace />
  }

  return <>{children}</>
}
