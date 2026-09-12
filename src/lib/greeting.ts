/** Kun vaqtiga qarab salom — ilova "tirik" va shu lahzada gapiradi */
export function greetingFor(hour: number): string {
  if (hour < 5) return 'Xayrli tun'
  if (hour < 11) return 'Xayrli tong'
  if (hour < 17) return 'Xayrli kun'
  return 'Xayrli kech'
}
