import { describe, expect, it } from 'vitest'
import type { ExerciseType } from '@/core/types'
import { excludedTypesFor, pickNextCardId } from './select'
import { emptyProgress, type WordProgress } from './progress'

/** Test uchun qisqa holat quruvchi */
function progress(cardId: string, fields: Partial<WordProgress> = {}): WordProgress {
  return { ...emptyProgress(cardId), ...fields }
}

describe('pickNextCardId', () => {
  it('eng KAM bilingan so‘z tanlanadi', () => {
    const entries = [
      progress('a', { streak: 1 }),
      progress('b', { streak: 0 }),
      progress('c', { streak: 1 }),
    ]

    expect(pickNextCardId(entries, null)).toBe('b')
  })

  it('hisob teng bo‘lsa — kam so‘ralgani', () => {
    const entries = [progress('a', { asked: 3 }), progress('b', { asked: 1 })]

    expect(pickNextCardId(entries, null)).toBe('b')
  })

  it('o‘zlashtirilgan so‘z QAYTA tanlanmaydi', () => {
    const entries = [
      progress('a', { mastered: true, streak: 0, asked: 0 }),
      progress('b', { streak: 5, asked: 9 }),
    ]

    expect(pickNextCardId(entries, null)).toBe('b')
  })

  it('oxirgi ko‘rsatilgan so‘z KETMA-KET qaytarilmaydi', () => {
    /*
     * Bir so'z ketma-ket ikki marta berilsa, javob hali ekranda turgan
     * bo'ladi — bu nusxa ko'chirish, eslab chaqirish emas.
     */
    const entries = [progress('a', { streak: 0 }), progress('b', { streak: 1 })]

    expect(pickNextCardId(entries, 'a')).toBe('b')
  })

  it('BOSHQA nomzod qolmasa, oxirgi so‘z qaytariladi', () => {
    // Aks holda seans o'zlashtirilmagan so'z bilan tiqilib qolardi
    const entries = [progress('a', { streak: 1 }), progress('b', { mastered: true })]

    expect(pickNextCardId(entries, 'a')).toBe('a')
  })

  it('hammasi o‘zlashtirilganda null', () => {
    const entries = [progress('a', { mastered: true }), progress('b', { mastered: true })]

    expect(pickNextCardId(entries, null)).toBeNull()
  })

  it('bo‘sh ro‘yxatda null', () => {
    expect(pickNextCardId([], null)).toBeNull()
  })
})

describe('excludedTypesFor', () => {
  it('hisob 1 bo‘lsa — oxirgi tur chetlanadi', () => {
    // O'zlashtirish uchun ikkinchi javob BOSHQA turda bo'lishi shart
    const entry = progress('a', { streak: 1, lastCorrectType: 'recognition' })

    expect(excludedTypesFor(entry)).toEqual<ExerciseType[]>(['recognition'])
  })

  it('hisob 0 bo‘lsa — hech nima chetlanmaydi', () => {
    expect(excludedTypesFor(progress('a'))).toEqual([])
  })

  it('hisob 2 dan katta bo‘lsa ham chetlanadi', () => {
    /*
     * So'z bir xil turda ikki marta to'g'ri javob olgan bo'lishi mumkin
     * (hisob 2, lekin o'zlashtirilmagan). Unga yana O'SHA turni berish
     * uni hech qachon o'zlashtirilgan holatga olib chiqmasdi.
     */
    const entry = progress('a', { streak: 2, lastCorrectType: 'recall', mastered: false })

    expect(excludedTypesFor(entry)).toEqual<ExerciseType[]>(['recall'])
  })
})
