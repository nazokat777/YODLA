/**
 * VAPID kalit juftini generatsiya qiladi.
 *
 * NEGA `web-push` PAKETI EMAS: bizga uning bitta funksiyasi kerak, u ham
 * bir marta. Node'ning o'z kriptografiyasi yetarli — loyihaga doimiy
 * bog'liqlik qo'shish ortiqcha.
 *
 * Ishlatish:  node scripts/generate-vapid.mjs
 */
import { generateKeyPairSync } from 'node:crypto'

const { publicKey, privateKey } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
})

/** DER (SPKI) oxiridagi 65 bayt — siqilmagan egri chiziq nuqtasi */
const raw = publicKey.export({ format: 'der', type: 'spki' }).subarray(-65)

const jwk = privateKey.export({ format: 'jwk' })

console.log('VITE_VAPID_PUBLIC_KEY =', raw.toString('base64url'))
console.log('VAPID_PRIVATE_KEY     =', jwk.d)
console.log()
console.log('Ochiq kalitni .env.local ga yozing.')
console.log('MAXFIY kalitni FAQAT Supabase secrets ichiga qo‘ying —')
console.log('uni hech qachon repoga commit qilmang.')
