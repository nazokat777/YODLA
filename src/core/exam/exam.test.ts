import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import type { PathUnit } from '@/core/path'
import { examCoverage, examKey, examResultsFor, hasExam, pendingExam } from './checkpoint'
import { pickExamCards } from './select'

function unit(id: string, state: PathUnit['state']): PathUnit {
  return { id, level: 'A1', topic: id, section: null, title: id, total: 4, learned: 4, state }
}

function card(id: string, topic: string, partial: Partial<CardRecord> = {}): CardRecord {
  return {
    id,
    word: id,
    translation: id,
    language: 'en',
    level: 'A1',
    topic,
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: 0,
    totalReviews: 1,
    lapses: 0,
    ...partial,
  }
}

describe('pendingExam', () => {
  it('birinchi darsdan keyin imtihon yo‘q', () => {
    expect(pendingExam([unit('a', 'completed'), unit('b', 'current')], {})).toBeNull()
  })

  it('ikkinchi dars tugagach 1–2 imtihoni kutiladi', () => {
    const units = [unit('a', 'completed'), unit('b', 'completed'), unit('c', 'current')]
    expect(pendingExam(units, {})).toEqual({ unitId: 'b', covered: units.slice(0, 2) })
  })

  it('topshirilgan imtihon qayta so‘ralmaydi', () => {
    const units = [unit('a', 'completed'), unit('b', 'completed'), unit('c', 'current')]
    expect(pendingExam(units, { b: { at: 1 } })).toBeNull()
  })

  it('bir nechta dars imtihonsiz o‘tilgan bo‘lsa — faqat ENG OXIRGISI (yig‘ma)', () => {
    const units = [unit('a', 'completed'), unit('b', 'completed'), unit('c', 'completed')]
    expect(pendingExam(units, {})?.unitId).toBe('c')
    expect(pendingExam(units, {})?.covered).toHaveLength(3)
  })

  it('o‘tkazib yuborilgan bo‘limlar qamrovga kirmaydi', () => {
    const units = [unit('a', 'skipped'), unit('b', 'skipped'), unit('c', 'completed')]
    expect(examCoverage(units, 'c')).toEqual([units[2]])
    // Yolg'iz bitta o'qilgan bo'lim — hali imtihon yo'q
    expect(pendingExam(units, {})).toBeNull()
    expect(hasExam(units, units[2]!)).toBe(false)
  })
})

describe('pickExamCards', () => {
  const now = 10 * 24 * 60 * 60 * 1000
  const units = [unit('a1-a', 'completed'), unit('a1-b', 'completed'), unit('a1-c', 'completed')]
  const cards = [
    ...['a1', 'a2', 'a3', 'a4'].map((id) => card(id, 'a')),
    ...['b1', 'b2', 'b3', 'b4'].map((id) => card(id, 'b')),
    ...['c1', 'c2', 'c3', 'c4'].map((id) => card(id, 'c')),
  ]

  it('kichik lug‘atda hamma so‘z kiradi', () => {
    const picked = pickExamCards(units, cards, now, () => 0.5)
    expect(picked.map((c) => c.id).sort()).toEqual(cards.map((c) => c.id).sort())
  })

  it('cheklangan hajmda HAR bo‘limdan kamida bitta so‘z bor', () => {
    const picked = pickExamCards(units, cards, now, () => 0.5, 6)
    const topics = new Set(picked.map((c) => c.topic))
    expect(picked).toHaveLength(6)
    expect(topics).toEqual(new Set(['a', 'b', 'c']))
  })

  it('bo‘lim ichida eng zaif so‘z birinchi tanlanadi', () => {
    const weak = cards.map((c) => (c.id === 'a3' ? { ...c, lapses: 5 } : c))
    const picked = pickExamCards(units, weak, now, () => 0.5, 5)
    expect(picked.some((c) => c.id === 'a3')).toBe(true)
  })

  it('so‘zlar aralashtiriladi — mavzular ketma-ket kelmaydi', () => {
    let seed = 7
    const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    const picked = pickExamCards(units, cards, now, random)
    const topics = picked.map((c) => c.topic).join('')
    expect(topics).not.toBe('ccccaaaabbbb')
  })

  it('qamrov bo‘sh bo‘lsa — bo‘sh', () => {
    expect(pickExamCards([], cards, now)).toEqual([])
  })
})

describe('examKey / examResultsFor', () => {
  it('til prefiksi bilan kalitlaydi va faqat o‘sha tilnikini qaytaradi', () => {
    expect(examKey('en', 'a1-oila')).toBe('en:a1-oila')
    const all = { 'en:a1-oila': 1, 'ru:a1-oila': 2, 'a1-ovqat': 3 }
    // Inglizcha + tilsiz eski yozuv; ruscha emas
    expect(examResultsFor(all, 'en')).toEqual({ 'a1-oila': 1, 'a1-ovqat': 3 })
    expect(examResultsFor(all, 'ru')).toEqual({ 'a1-oila': 2, 'a1-ovqat': 3 })
    expect(examResultsFor(undefined, 'en')).toEqual({})
  })
})
