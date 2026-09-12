import { Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { RequireOnboarding } from '@/app/guards/RequireOnboarding'
import { AppShell } from '@/app/layouts/AppShell'
import { FocusLayout } from '@/app/layouts/FocusLayout'
import { useStarterDeck } from '@/hooks/useStarterDeck'
import { useDailyMaintenance } from '@/hooks/useProgress'
import { useLanguageAccent } from '@/hooks/useLanguageAccent'
import { HomeScreen } from '@/features/home/HomeScreen'
import { LessonScreen } from '@/features/lesson/LessonScreen'
import { NotFoundScreen } from '@/features/misc/NotFoundScreen'
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen'
import { ReviewScreen } from '@/features/review/ReviewScreen'
import { Panel } from '@/components/ui/Panel'

/*
 * IKKINCHI DARAJALI ekranlar DANGASA yuklanadi.
 *
 * Bola ilovani "dars" uchun ochadi: bosh ekran, dars, takrorlash —
 * asosiy yo'l. Liga (Supabase mijozi bilan), statistika, o'yinlar,
 * profil va mnemonikalar shu yo'lda kerak emas — ular alohida
 * bo'laklarga chiqadi va faqat kirilganda yuklanadi. Sekin telefonda
 * birinchi ochilish shuncha tezroq.
 */
const LeagueScreen = lazy(() =>
  import('@/features/league/LeagueScreen').then((m) => ({ default: m.LeagueScreen })),
)
const StatsScreen = lazy(() =>
  import('@/features/stats/StatsScreen').then((m) => ({ default: m.StatsScreen })),
)
const ProfileScreen = lazy(() =>
  import('@/features/profile/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
)
const MnemonicsScreen = lazy(() =>
  import('@/features/mnemonics/MnemonicsScreen').then((m) => ({ default: m.MnemonicsScreen })),
)
const GamesScreen = lazy(() =>
  import('@/features/games/GamesScreen').then((m) => ({ default: m.GamesScreen })),
)
const SpeedGame = lazy(() =>
  import('@/features/games/SpeedGame').then((m) => ({ default: m.SpeedGame })),
)
const MemoryGame = lazy(() =>
  import('@/features/games/MemoryGame').then((m) => ({ default: m.MemoryGame })),
)
const TrueFalseGame = lazy(() =>
  import('@/features/games/TrueFalseGame').then((m) => ({ default: m.TrueFalseGame })),
)

/** Dangasa bo'lak yuklanguncha — bo'sh ekran emas, tanish panel */
function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Panel className="text-ink-600">Yuklanmoqda…</Panel>}>{children}</Suspense>
}

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
  // Til aksenti — butun ilova bo'ylab (dars ekrani ham)
  useLanguageAccent()

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
          {/* Qiyin so'zlar mashqi — profildagi "Ustida ishlash kerak" dan */}
          <Route path={PATHS.weakReview} element={<ReviewScreen focus="weak" />} />
          <Route path={PATHS.games} element={<Lazy><GamesScreen /></Lazy>} />
          <Route path={PATHS.speedGame} element={<Lazy><SpeedGame /></Lazy>} />
          <Route path={PATHS.memoryGame} element={<Lazy><MemoryGame /></Lazy>} />
          <Route path={PATHS.trueFalseGame} element={<Lazy><TrueFalseGame /></Lazy>} />
          <Route path={PATHS.league} element={<Lazy><LeagueScreen /></Lazy>} />
          <Route path={PATHS.stats} element={<Lazy><StatsScreen /></Lazy>} />
          <Route path={PATHS.profile} element={<Lazy><ProfileScreen /></Lazy>} />
          <Route path={PATHS.mnemonics} element={<Lazy><MnemonicsScreen /></Lazy>} />
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
