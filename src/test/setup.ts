// jsdom'da IndexedDB yo'q — Dexie testlari uchun soxta implementatsiya.
// Bu import Dexie yuklanishidan OLDIN bajarilishi shart.
import 'fake-indexeddb/auto'

import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { db } from '@/core/db/db'
import { useSettingsStore } from '@/stores/useSettingsStore'

// Har testdan OLDIN manzilni "/" ga qaytarish.
// jsdom'da history testlar orasida saqlanib qoladi: agar oldingi test
// <Navigate> orqali boshqa manzilga o'tgan bo'lsa, keyingi test o'sha
// manzildan boshlanib, kutilmagan ekranni ko'rsatadi.
beforeEach(() => {
  window.history.replaceState({}, '', '/')
})

// Har testdan keyin DOM'ni, saqlangan holatni va bazani tozalash.
// Zustand do'koni ham tiklanadi: u modul darajasidagi singleton, ya'ni
// localStorage tozalansa ham xotiradagi qiymat keyingi testga oqib o'tardi.
afterEach(async () => {
  cleanup()
  useSettingsStore.getState().reset()
  localStorage.clear()
  await Promise.all([db.cards.clear(), db.dailyStats.clear(), db.profile.clear()])
})
