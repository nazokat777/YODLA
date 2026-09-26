/**
 * Har kungi eslatma — telefon KALENDARIGA qo'shiladigan .ics fayl.
 *
 * NEGA KALENDAR: brauzer push-eslatmasi server talab qiladi (Supabase
 * ulanmaguncha ishlamaydi), sahifa ichidagi taymer esa ilova yopilganda
 * o'ladi. Kalendar hodisasi esa telefonning O'Z eslatmasi: ilova
 * yopiq, internet yo'q bo'lsa ham har kuni o'z vaqtida jiringlaydi.
 * `RRULE:FREQ=DAILY` — bir marta qo'shiladi, har kuni takrorlanadi.
 */

/** Ikki xonali son */
const pad = (value: number) => String(value).padStart(2, '0')

/** Mahalliy vaqt — `YYYYMMDDTHHMMSS` (TZID siz: telefon o'z mintaqasida) */
function localStamp(date: Date): string {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  )
}

/** ICS matnidagi maxsus belgilar */
function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export interface ReminderInput {
  /** Soat (0–23) */
  hour: number
  /** Qisqa sarlavha — bildirishnomada ko'rinadi */
  title: string
  /** Batafsil */
  description: string
  /** Ilova havolasi */
  url: string
  /** Boshlanish kuni (sukut — bugun) */
  from?: Date
}

/**
 * Har kuni takrorlanadigan hodisa (15 daqiqa) + shu vaqtdagi signal.
 *
 * Soat o'tib ketgan bo'lsa ham bugundan boshlanadi — kalendar o'tgan
 * hodisani ko'rsatmaydi, ertadan jiringlay boshlaydi.
 */
export function buildDailyReminderIcs(input: ReminderInput): string {
  const start = new Date(input.from ?? new Date())
  start.setHours(input.hour, 0, 0, 0)
  const end = new Date(start.getTime() + 15 * 60 * 1000)
  const stamp = new Date()

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//YODLA//Mnemonika//UZ',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:yodla-daily-${start.getTime()}@yodla`,
    `DTSTAMP:${localStamp(stamp)}`,
    `DTSTART:${localStamp(start)}`,
    `DTEND:${localStamp(end)}`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${escapeText(input.title)}`,
    `DESCRIPTION:${escapeText(`${input.description}\n${input.url}`)}`,
    `URL:${input.url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(input.title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/**
 * Faylni yuklab beradi — telefon uni kalendar ilovasida ochadi.
 * Qaytaradi: yuklash boshlandimi (brauzer bloklasa — `false`).
 */
export function downloadIcs(ics: string, fileName = 'yodla-eslatma.ics'): boolean {
  try {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return true
  } catch {
    return false
  }
}
