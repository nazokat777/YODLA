import { describe, expect, it } from 'vitest'
import { addDays, calendarDaysBetween, isSameDay, MS_PER_DAY, startOfDay } from './date'

/**
 * Sana matematikasi SRS ning dueDate hisobining asosi — bu yerdagi
 * xato butun takrorlash jadvalini buzadi. Shuning uchun chegara
 * holatlari alohida tekshiriladi.
 */

describe('startOfDay', () => {
  it('vaqtni lokal kun boshiga tushiradi', () => {
    const midday = new Date(2026, 0, 15, 13, 37, 42, 500).getTime()

    expect(startOfDay(midday)).toBe(new Date(2026, 0, 15, 0, 0, 0, 0).getTime())
  })

  it('kun boshining o‘zi o‘zgarmaydi (idempotent)', () => {
    const dayStart = new Date(2026, 0, 15, 0, 0, 0, 0).getTime()

    expect(startOfDay(dayStart)).toBe(dayStart)
    expect(startOfDay(startOfDay(dayStart))).toBe(dayStart)
  })

  it('23:59:59.999 hali ham o‘sha kunga tegishli', () => {
    const lastMs = new Date(2026, 0, 15, 23, 59, 59, 999).getTime()

    expect(startOfDay(lastMs)).toBe(new Date(2026, 0, 15).getTime())
  })
})

describe('addDays', () => {
  it('oy chegarasidan o‘tadi', () => {
    const jan30 = new Date(2026, 0, 30, 9, 0).getTime()

    expect(addDays(jan30, 6)).toBe(new Date(2026, 1, 5, 9, 0).getTime())
  })

  it('yil chegarasidan o‘tadi', () => {
    const dec28 = new Date(2026, 11, 28, 9, 0).getTime()

    expect(addDays(dec28, 5)).toBe(new Date(2027, 0, 2, 9, 0).getTime())
  })

  it('kabisa yilini to‘g‘ri hisoblaydi', () => {
    // 2028 — kabisa yili, fevralda 29 kun bor
    const feb28 = new Date(2028, 1, 28, 9, 0).getTime()

    expect(addDays(feb28, 1)).toBe(new Date(2028, 1, 29, 9, 0).getTime())
    expect(addDays(feb28, 2)).toBe(new Date(2028, 2, 1, 9, 0).getTime())
  })

  it('kabisa bo‘lmagan yilda fevral 28 kun', () => {
    const feb28 = new Date(2026, 1, 28, 9, 0).getTime()

    expect(addDays(feb28, 1)).toBe(new Date(2026, 2, 1, 9, 0).getTime())
  })

  it('0 kun qo‘shilganda vaqt o‘zgarmaydi', () => {
    const moment = new Date(2026, 0, 15, 13, 37).getTime()

    expect(addDays(moment, 0)).toBe(moment)
  })

  it('manfiy qiymat orqaga siljitadi', () => {
    const mar1 = new Date(2026, 2, 1, 9, 0).getTime()

    expect(addDays(mar1, -1)).toBe(new Date(2026, 1, 28, 9, 0).getTime())
  })

  it('kalendar kunini siljitadi — soat qo‘shishdan farqli', () => {
    // Bu `timestamp + days * MS_PER_DAY` yondashuvidan farqni ko'rsatadi:
    // kalendar kuni har doim o'sha soatga tushadi, DST bo'lsa ham.
    const start = new Date(2026, 2, 20, 10, 0).getTime()
    const result = new Date(addDays(start, 30))

    expect(result.getHours()).toBe(10)
    expect(result.getMinutes()).toBe(0)
  })
})

describe('calendarDaysBetween', () => {
  it('soat farqiga qaramay kalendar kunlarini sanaydi', () => {
    const lateEvening = new Date(2026, 0, 15, 23, 30).getTime()
    const earlyMorning = new Date(2026, 0, 16, 0, 30).getTime()

    // Orasi atigi 1 soat, lekin kalendar kuni bo‘yicha — 1 kun
    expect(calendarDaysBetween(lateEvening, earlyMorning)).toBe(1)
  })

  it('bir kun ichidagi vaqtlar orasida 0', () => {
    const morning = new Date(2026, 0, 15, 8, 0).getTime()
    const evening = new Date(2026, 0, 15, 22, 0).getTime()

    expect(calendarDaysBetween(morning, evening)).toBe(0)
  })

  it('orqaga qarab manfiy qiymat qaytaradi', () => {
    const a = new Date(2026, 0, 20).getTime()
    const b = new Date(2026, 0, 15).getTime()

    expect(calendarDaysBetween(a, b)).toBe(-5)
  })

  it('uzoq oraliqda ham to‘g‘ri (yil chegarasi)', () => {
    const dec20 = new Date(2026, 11, 20, 15, 0).getTime()
    const jan10 = new Date(2027, 0, 10, 3, 0).getTime()

    expect(calendarDaysBetween(dec20, jan10)).toBe(21)
  })
})

describe('isSameDay', () => {
  it('bir kunning turli soatlari — true', () => {
    expect(isSameDay(new Date(2026, 0, 15, 0, 0).getTime(), new Date(2026, 0, 15, 23, 59).getTime())).toBe(true)
  })

  it('ketma-ket kunlar — false', () => {
    expect(
      isSameDay(new Date(2026, 0, 15, 23, 59).getTime(), new Date(2026, 0, 16, 0, 0).getTime()),
    ).toBe(false)
  })
})

describe('MS_PER_DAY', () => {
  it('bir kundagi millisekundlar soni', () => {
    expect(MS_PER_DAY).toBe(24 * 60 * 60 * 1000)
  })
})
