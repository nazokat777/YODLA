import { type RandomSource } from '@/lib/random'

/**
 * Kod alifbosi — `0/O` va `1/I` YO'Q.
 * Kod og'zaki aytiladi va qo'lda kiritiladi; o'xshash belgilar xatoga
 * olib kelardi.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const CODE_LENGTH = 6

/** Foydalanuvchi kodi — qurilmada yaratiladi, serverga birinchi yozuvda boradi */
export function generateCode(random: RandomSource = Math.random): string {
  let code = ''

  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[Math.floor(random() * ALPHABET.length)]
  }

  return code
}
