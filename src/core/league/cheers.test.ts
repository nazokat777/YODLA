import { describe, expect, it } from 'vitest'
import { CHEERS, cheerByKind } from './cheers'

describe('CHEERS', () => {
  it('turlar takrorlanmaydi', () => {
    const kinds = CHEERS.map((cheer) => cheer.kind)

    expect(new Set(kinds).size).toBe(kinds.length)
  })

  it('har xabarda ikonka va matn bor', () => {
    CHEERS.forEach((cheer) => {
      expect(cheer.icon).toBeTruthy()
      expect(cheer.label).toBeTruthy()
    })
  })
})

describe('cheerByKind', () => {
  it('mavjud turni topadi', () => {
    expect(cheerByKind('bravo')?.label).toBe('Barakalla')
  })

  it('noma’lum turda null — eski yozuv ilovani buzmaydi', () => {
    expect(cheerByKind('yoq-bunday')).toBeNull()
  })
})
