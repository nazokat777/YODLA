import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getProgressSnapshot, runDailyMaintenance, type ProgressSnapshot } from '@/core/db'
import { useNowTick } from './useNowTick'

/**
 * Geymifikatsiya progressi — jonli.
 *
 * `useNowTick` bog'liqlik sifatida qo'shilgan: streak va kunlik maqsad
 * VAQTGA bog'liq, `useLiveQuery` esa faqat bazaga yozuv bo'lganda qayta
 * hisoblaydi. Usiz yarim tundan o'tganda ko'rsatkichlar eskirib qolardi.
 */
export function useProgress(): ProgressSnapshot | undefined {
  const now = useNowTick()

  return useLiveQuery(() => getProgressSnapshot(now), [now])
}

/**
 * Kunlik xizmat ko'rsatish: ilova ochilganda streak muzlatishini qo'llaydi
 * va bosqich mukofotlarini beradi.
 *
 * Bir marta emas, KUN o'zgarganda ham qayta ishga tushadi — foydalanuvchi
 * ilovani ochiq qoldirib, ertasi kuni qaytsa ham streak to'g'ri saqlanadi.
 */
export function useDailyMaintenance() {
  // Soatlik aniqlik yetarli — har daqiqada bazaga yozish ortiqcha
  const now = useNowTick(60 * 60 * 1000)
  const day = new Date(now).toDateString()

  useEffect(() => {
    runDailyMaintenance().catch((error: unknown) => {
      console.error('Kunlik xizmat ko‘rsatishni bajarib bo‘lmadi:', error)
    })
  }, [day])
}
