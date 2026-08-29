import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { RequireOnboarding } from '@/app/guards/RequireOnboarding'
import { AppShell } from '@/app/layouts/AppShell'
import { FocusLayout } from '@/app/layouts/FocusLayout'
import { useStarterDeck } from '@/hooks/useStarterDeck'
import { useDailyMaintenance } from '@/hooks/useProgress'
import { HomeScreen } from '@/features/home/HomeScreen'
import { LeagueScreen } from '@/features/league/LeagueScreen'
import { LessonScreen } from '@/features/lesson/LessonScreen'
import { MnemonicsScreen } from '@/features/mnemonics/MnemonicsScreen'
import { NotFoundScreen } from '@/features/misc/NotFoundScreen'
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen'
import { ProfileScreen } from '@/features/profile/ProfileScreen'
import { StatsScreen } from '@/features/stats/StatsScreen'
import { ReviewScreen } from '@/features/review/ReviewScreen'

/**
 * Ilova ildizi: marshrutlar daraxti.
 *
 * Ikki qobiq (layout) ishlatiladi:
 *  - AppShell   → pastki navigatsiyali asosiy ekranlar
 *  - FocusLayout → chalg'itmaydigan ekranlar (onboarding, dars)
 */
export function App() {
  // Tanlangan til uchun boshlang'ich so'zlar bazaga yoziladi (idempotent)
  useStarterDeck()
  // Streak muzlatishi va bosqich mukofotlari (kun almashganda ham qayta ishlaydi)
  useDailyMaintenance()

  return (
    <BrowserRouter>
      <Routes>
        {/* --- Chalg'itmaydigan ekranlar --- */}
        <Route element={<FocusLayout />}>
          <Route path={PATHS.onboarding} element={<OnboardingScreen />} />
          <Route
            path={PATHS.lesson}
            element={
              <RequireOnboarding>
                <LessonScreen />
              </RequireOnboarding>
            }
          />
          <Route
            path={`${PATHS.lesson}/:lessonId`}
            element={
              <RequireOnboarding>
                <LessonScreen />
              </RequireOnboarding>
            }
          />
        </Route>

        {/* --- Navigatsiyali asosiy ekranlar --- */}
        <Route
          element={
            <RequireOnboarding>
              <AppShell />
            </RequireOnboarding>
          }
        >
          <Route path={PATHS.home} element={<HomeScreen />} />
          <Route path={PATHS.review} element={<ReviewScreen />} />
          <Route path={PATHS.league} element={<LeagueScreen />} />
          <Route path={PATHS.stats} element={<StatsScreen />} />
          <Route path={PATHS.profile} element={<ProfileScreen />} />
          <Route path={PATHS.mnemonics} element={<MnemonicsScreen />} />
        </Route>

        {/* --- Xatolik va yo'naltirishlar --- */}
        <Route path="/index.html" element={<Navigate to={PATHS.home} replace />} />
        <Route
          path="*"
          element={
            <FocusLayout>
              <NotFoundScreen />
            </FocusLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
