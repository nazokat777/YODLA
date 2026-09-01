import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { MAX_LESSON_STEPS, buildLessonQueue } from './queue'

function card(id: string, totalReviews = 0): CardRecord {
  return {
    id,
    word: id,
    translation: `${id}-uz`,
    language: 'en',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews,
    lapses: 0,
  }
}

/** Har kartaga uchtadan bosqich */
const THREE = () => 3

describe('buildLessonQueue', () => {
  it('har karta uchun berilgan sondagi qadam yaratadi', () => {
    const queue = buildLessonQueue([card('a'), card('b')], THREE)

    expect(queue).toHaveLength(6)
    expect(queue.filter((step) => step.card.id === 'a')).toHaveLength(3)
  })

  it('bosqichlar 0 dan boshlab o‘sadi', () => {
    const queue = buildLessonQueue([card('a')], THREE)

    expect(queue.map((step) => step.stage)).toEqual([0, 1, 2])
  })

  it('bir so‘zning ikki qadami YONMA-YON turmaydi', () => {
    const queue = buildLessonQueue([card('a'), card('b'), card('c')], THREE)

    // Ketma-ket ikki marta bir xil so'z so'ralsa, bu eslab chaqirish emas,
    // ekrandan nusxa ko'chirish bo'lardi
    for (let i = 1; i < queue.length; i += 1) {
      expect(queue[i].card.id).not.toBe(queue[i - 1].card.id)
    }
  })

  it('kartaga qarab bosqich soni har xil bo‘lishi mumkin', () => {
    // Takrorlanadigan so'zni qayta o'rgatish shart emas — u tekshiriladi
    const queue = buildLessonQueue(
      [card('yangi'), card('eski', 5)],
      (item) => (item.totalReviews === 0 ? 3 : 1),
    )

    expect(queue.filter((step) => step.card.id === 'yangi')).toHaveLength(3)
    expect(queue.filter((step) => step.card.id === 'eski')).toHaveLength(1)
  })

  it('chegaradan oshmaydi', () => {
    const many = Array.from({ length: 10 }, (_, i) => card(`c${i}`))

    expect(buildLessonQueue(many, THREE).length).toBeLessThanOrEqual(MAX_LESSON_STEPS)
  })

  it('bo‘sh ro‘yxat — bo‘sh navbat', () => {
    expect(buildLessonQueue([], THREE)).toEqual([])
  })

  it('nol bosqich so‘ralsa ham kamida bitta qadam beradi', () => {
    // Chaqiruvchi xato hisob bersa ham dars bo'sh qolmasligi kerak
    expect(buildLessonQueue([card('a')], () => 0)).toHaveLength(1)
  })
})
