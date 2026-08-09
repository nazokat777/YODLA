import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { buildUnits, slugifyTopic, unitIdOf } from './units'

/** Test uchun minimal karta */
function card(id: string, partial: Partial<CardRecord> = {}): CardRecord {
  return {
    id,
    word: id,
    translation: id,
    language: 'en',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    ...partial,
  }
}

describe('slugifyTopic', () => {
  it('tutuq belgisini TUSHIRADI, chiziqchaga aylantirmaydi', () => {
    // "fe-llar" bo'lib qolsa havola o'qib bo'lmas edi
    expect(slugifyTopic("Kundalik fe'llar")).toBe('kundalik-fellar')
    expect(slugifyTopic("Sog'liq")).toBe('sogliq')
    expect(slugifyTopic("His-tuyg'u")).toBe('his-tuygu')
  })

  it('oddiy nomni kichik harfga o‘tkazadi', () => {
    expect(slugifyTopic('Oila')).toBe('oila')
    expect(slugifyTopic('Mavhum tushunchalar')).toBe('mavhum-tushunchalar')
  })
})

describe('unitIdOf', () => {
  it('daraja va mavzudan barqaror id yasaydi', () => {
    expect(unitIdOf('A1', 'Oila')).toBe('a1-oila')
    expect(unitIdOf('B1', "His-tuyg'u")).toBe('b1-his-tuygu')
  })
})

describe('buildUnits', () => {
  it('daraja va mavzu bo‘yicha guruhlaydi', () => {
    const units = buildUnits([
      card('a', { level: 'A1', topic: 'Oila' }),
      card('b', { level: 'A1', topic: 'Oila' }),
      card('c', { level: 'A1', topic: 'Ovqat' }),
    ])

    expect(units).toHaveLength(2)
    expect(units[0]).toMatchObject({ id: 'a1-oila', topic: 'Oila', total: 2, learned: 0 })
    expect(units[1]).toMatchObject({ id: 'a1-ovqat', total: 1 })
  })

  it('darajalar tartibida joylashtiradi', () => {
    const units = buildUnits([
      card('b1', { level: 'B1', topic: 'Jamiyat' }),
      card('a1', { level: 'A1', topic: 'Oila' }),
      card('a2', { level: 'A2', topic: 'Ish' }),
    ])

    expect(units.map((unit) => unit.level)).toEqual(['A1', 'A2', 'B1'])
  })

  it('mavzu tartibi kontentdan olinadi', () => {
    const units = buildUnits(
      [
        card('a', { level: 'A1', topic: 'Ovqat' }),
        card('b', { level: 'A1', topic: 'Oila' }),
      ],
      { topicOrder: ['Oila', 'Ovqat'] },
    )

    expect(units.map((unit) => unit.topic)).toEqual(['Oila', 'Ovqat'])
  })

  it('barcha so‘zi ko‘rilgan bo‘lim tugallangan', () => {
    const units = buildUnits([
      card('a', { level: 'A1', topic: 'Oila', totalReviews: 3 }),
      card('b', { level: 'A1', topic: 'Oila', totalReviews: 1 }),
    ])

    expect(units[0]).toMatchObject({ state: 'completed', learned: 2 })
  })

  it('birinchi tugallanmagan bo‘lim joriy, keyingilari qulflangan', () => {
    const units = buildUnits([
      card('a', { level: 'A1', topic: 'Oila', totalReviews: 2 }),
      card('b', { level: 'A1', topic: 'Ovqat' }),
      card('c', { level: 'A1', topic: 'Ranglar' }),
    ])

    expect(units.map((unit) => unit.state)).toEqual(['completed', 'current', 'locked'])
  })

  it('boshlang‘ich darajadan past bo‘lim "skipped"', () => {
    // Daraja testida A2 chiqqan: A1 o'rganilmagan, lekin qulflanmaydi
    const units = buildUnits(
      [
        card('a', { level: 'A1', topic: 'Oila' }),
        card('b', { level: 'A2', topic: 'Ish' }),
      ],
      { minLevel: 'A2' },
    )

    expect(units.map((unit) => unit.state)).toEqual(['skipped', 'current'])
  })

  it('past darajadagi bo‘lim tugallangan bo‘lsa "completed" qoladi', () => {
    const units = buildUnits(
      [
        card('a', { level: 'A1', topic: 'Oila', totalReviews: 1 }),
        card('b', { level: 'A2', topic: 'Ish' }),
      ],
      { minLevel: 'A2' },
    )

    expect(units.map((unit) => unit.state)).toEqual(['completed', 'current'])
  })

  it('darajasi yoki mavzusi yo‘q kartalar yo‘lga kirmaydi', () => {
    const units = buildUnits([card('a'), card('b', { level: 'A1' })])

    expect(units).toEqual([])
  })

  it('bo‘sh ro‘yxatda bo‘sh natija', () => {
    expect(buildUnits([])).toEqual([])
  })
})
