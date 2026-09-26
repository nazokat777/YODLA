import { describe, expect, it } from 'vitest'
import { buildDailyReminderIcs } from './calendarReminder'

describe('buildDailyReminderIcs', () => {
  const ics = buildDailyReminderIcs({
    hour: 19,
    title: 'YODLA: bugungi so‘zlar',
    description: '5 ta yangi so‘z, takrorlash',
    url: 'https://yodla-five.vercel.app/books',
    from: new Date(2026, 8, 27, 8, 30),
  })

  it('har kuni takrorlanadigan hodisa va signal', () => {
    expect(ics).toContain('RRULE:FREQ=DAILY')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics).toContain('TRIGGER:PT0M')
  })

  it('tanlangan soatda boshlanadi, 15 daqiqa davom etadi', () => {
    expect(ics).toContain('DTSTART:20260927T190000')
    expect(ics).toContain('DTEND:20260927T191500')
  })

  it('vergul va nuqtali vergul ekranlanadi, qatorlar CRLF', () => {
    expect(ics).toContain('5 ta yangi so‘z\\, takrorlash')
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true)
  })
})
