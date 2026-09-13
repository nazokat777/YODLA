/**
 * Matnni ulashish: Web Share API (telefon), bo'lmasa buferga nusxa.
 *
 * Qaytaradi: nima bo'ldi — chaqiruvchi shunga qarab xabar ko'rsatadi.
 * Ulashish oynasini foydalanuvchi yopsa (`AbortError`) — bu xato emas.
 */
export type ShareOutcome = 'shared' | 'copied' | 'failed'

export async function shareText(title: string, text: string): Promise<ShareOutcome> {
  if (typeof navigator === 'undefined') return 'failed'

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') return 'failed'
      // Ulashish qo'llanmasa — nusxa yo'liga tushamiz
    }
  }

  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}

/** Haftalik hisobot matni — ota-onaga yoki do'stga */
export function weeklyReportText(input: {
  activeDays: number
  words: number
  xp: number
  streak: number
}): string {
  return [
    '📚 YODLA — bu hafta:',
    `🗓️ ${input.activeDays} kun mashq`,
    `📝 ${input.words} ta so‘z`,
    `⭐ ${input.xp} XP`,
    `🔥 ${input.streak} kunlik streak`,
  ].join('\n')
}
