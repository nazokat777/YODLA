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

  it('oxiridagi qo‘shimchani kechiradi', () => {
    expect(matchesSpoken('brother', ['brothers'], 'en')).toBe(true)
    expect(matchesSpoken('watch', ['watches'], 'en')).toBe(true)
  })

  it('o‘rtasidagi tovush farqini kechirmaydi', () => {
    // "waiter" ↔ "water" bir tahrir masofasida, lekin aynan shu farq bu
    // mashq tutishi kerak bo'lgan talaffuz xatosi
    expect(matchesSpoken('water', ['waiter'], 'en')).toBe(false)
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
    expect(matchesSpoken('cat', ['cut'], 'en')).toBe(false)
  })

  it('qisqa so‘zga qo‘shimcha ham kechirilmaydi', () => {
    // Uch harfli so'zda qo'shimcha butunlay boshqa so'z bo'lishi mumkin
    expect(matchesSpoken('car', ['card'], 'en')).toBe(false)
  })
})
