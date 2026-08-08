/**
 * Shartli CSS sinflarini birlashtiruvchi kichik yordamchi.
 * Tashqi kutubxona (clsx) o'rniga — bog'liqliklarni kam saqlash uchun.
 *
 * cn('p-4', isActive && 'bg-brand-500') → "p-4 bg-brand-500"
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
