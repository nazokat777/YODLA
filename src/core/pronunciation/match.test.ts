import { describe, expect, it } from 'vitest'
import { matchesSpoken } from './match'

describe('matchesSpoken', () => {
  it('aniq mos kelganda true', () => {
    expect(matchesSpoken('water', ['water'], 'en')).toBe(true)
  })

  it('katta harf va nuqtani hisobga olmaydi', () => {
    expect(matchesSpoken('water', ['Water.'], 'en')).toBe(true)
  })

  it('birinchisi noto‘g‘ri, keyingisi to‘g‘ri bo‘lsa ham true', () => {
    expect(matchesSpoken('water', ['waiter', 'water'], 'en')).toBe(true)
  })

  it('uzun so‘zda bitta harf farqiga yo‘l qo‘yadi', () => {
    expect(matchesSpoken('brother', ['brothers'], 'en')).toBe(true)
  })

  it('mutlaqo boshqa so‘zda false', () => {
    expect(matchesSpoken('water', ['bread'], 'en')).toBe(false)
  })

  it('bo‘sh ro‘yxatda false', () => {
    expect(matchesSpoken('water', [], 'en')).toBe(false)
  })

  it('bo‘sh matnli variantda false', () => {
    expect(matchesSpoken('water', ['   '], 'en')).toBe(false)
  })

  it('arab harakatlari farq qilsa ham true', () => {
    expect(matchesSpoken('كِتَاب', ['كتاب'], 'ar')).toBe(true)
  })

  it('ruscha ё va е farqini kechiradi', () => {
    expect(matchesSpoken('ёлка', ['елка'], 'ru')).toBe(true)
  })

  it('qisqa so‘zda bitta harf farqi yetarli emas', () => {
    // typoTolerance(3) === 0 — qisqa so'zda har harf ma'noni o'zgartiradi
    expect(matchesSpoken('cat', ['cut'], 'en')).toBe(false)
  })
})
