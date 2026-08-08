/**
 * Sana bilan ishlash yordamchilari.
 *
 * MUHIM: barcha hisoblar foydalanuvchining LOKAL vaqt mintaqasida bajariladi.
 * Sabab: "kun" tushunchasi bu yerda kalendar kuni (streak, kunlik maqsad,
 * takrorlash navbati) — UTC emas.
 */

/** Bir kundagi millisekundlar (faqat oraliqlarni taqqoslash uchun) */
export const MS_PER_DAY = 86_400_000

/** Berilgan vaqtning lokal kun boshi (00:00:00.000) */
export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/**
 * Kalendar kunlarini qo'shish.
 *
 * `timestamp + days * MS_PER_DAY` emas: yozgi/qishki vaqtga o'tish (DST)
 * kunlari 23 yoki 25 soat bo'ladi. `setDate` esa kalendar kunini to'g'ri
 * siljitadi.
 */
export function addDays(timestamp: number, days: number): number {
  const date = new Date(timestamp)
  date.setDate(date.getDate() + days)
  return date.getTime()
}

/** Ikki vaqt bir xil kalendar kunigami? */
export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b)
}

/**
 * `a` va `b` orasidagi to'liq kalendar kunlari farqi.
 * Kun boshlariga tekislab hisoblanadi, shuning uchun soat farqi ta'sir qilmaydi.
 * Musbat qiymat — `b` kechroq degani.
 */
export function calendarDaysBetween(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / MS_PER_DAY)
}
