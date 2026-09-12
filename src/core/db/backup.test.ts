import { beforeEach, describe, expect, it } from 'vitest'
import { addMissingCards, gradeCard, recordAnswer, ensureProfile, setMnemonic } from '@/core/db'
import { db } from './db'
import { createBackup, parseBackup, restoreBackup } from './backup'

describe('zaxira nusxa', () => {
  beforeEach(async () => {
    await db.cards.clear()
    await db.dailyStats.clear()
    await db.profile.clear()
    await addMissingCards([
      { word: 'apple', translation: 'olma', language: 'en' },
      { word: 'bread', translation: 'non', language: 'en' },
    ])
  })

  it('faqat ko‘rilgan kartalarning PROGRESSI saqlanadi, kontent emas', async () => {
    await gradeCard('en:apple', 4)
    await setMnemonic('en:apple', 'olma — apple, qizil')

    const backup = await createBackup('{"x":1}')

    expect(backup.cards).toHaveLength(1)
    expect(backup.cards[0]).not.toHaveProperty('word')
    expect(backup.cards[0]).toMatchObject({ id: 'en:apple', totalReviews: 1, mnemonic: 'olma — apple, qizil' })
    expect(backup.settings).toBe('{"x":1}')
  })

  it('tiklash progressni qaytaradi, kontentni saqlaydi, yo‘q kartani o‘tkazib yuboradi', async () => {
    await gradeCard('en:apple', 5)
    await recordAnswer({ cardId: 'en:apple', verdict: 'correct', dailyGoalWords: 20 })
    const backup = await createBackup(null)
    const xpBefore = (await ensureProfile()).totalXp

    // "Yangi qurilma": progress yo'q
    await db.cards.update('en:apple', { totalReviews: 0, repetitions: 0, interval: 0 })
    await db.dailyStats.clear()
    await db.profile.clear()
    backup.cards.push({ ...backup.cards[0]!, id: 'en:yoq-karta' })

    const result = await restoreBackup(backup)

    expect(result).toEqual({ restored: 1, skipped: 1 })
    const apple = await db.cards.get('en:apple')
    expect(apple?.word).toBe('apple')
    expect(apple?.totalReviews).toBe(1)
    expect((await ensureProfile()).totalXp).toBe(xpBefore)
    expect(await db.dailyStats.count()).toBe(1)
  })

  it('buzuq fayl rad etiladi', () => {
    expect(parseBackup('bu json emas')).toBeNull()
    expect(parseBackup('{"version":99,"cards":[],"dailyStats":[]}')).toBeNull()
    expect(parseBackup('{"version":1,"cards":[{"nope":1}],"dailyStats":[]}')).toBeNull()
    expect(parseBackup('{"version":1,"cards":[],"dailyStats":[]}')).not.toBeNull()
  })
})
