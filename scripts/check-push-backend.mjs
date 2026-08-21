/**
 * Push backend tirikmi.
 *
 * Sxema qo'yilgandan keyin ishlatiladi:
 *   node scripts/check-push-backend.mjs
 *
 * Tekshiradi:
 *  1. RPC'lar mavjudmi va to'g'ri javob beradimi;
 *  2. `anon` jadvalni O'QIY OLMASLIGI (obuna manzillari shaxsiy).
 */
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => {
      const index = line.indexOf('=')
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
    }),
)

const URL = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY

if (!URL || !KEY) {
  console.error('.env.local da VITE_SUPABASE_URL yoki VITE_SUPABASE_ANON_KEY yo‘q')
  process.exit(1)
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
}

async function rpc(name, body) {
  const response = await fetch(`${URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  return { ok: response.ok, status: response.status, text: await response.text() }
}

const GHOST = 'https://push.example.invalid/check-' + Date.now()

let failed = false
function check(label, condition, detail = '') {
  console.log(`${condition ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!condition) failed = true
}

// 1. Noto'g'ri manzil rad etilishi kerak
const bad = await rpc('yodla_save_push', {
  p_endpoint: 'not-a-url',
  p_p256dh: 'x',
  p_auth: 'y',
  p_hour: 19,
  p_offset: 300,
})
check('yodla_save_push mavjud', bad.ok, `status ${bad.status}`)
check('HTTPS bo‘lmagan manzil rad etiladi', bad.text.trim() === 'false', bad.text.trim())

// 2. To'g'ri obuna saqlanadi
const saved = await rpc('yodla_save_push', {
  p_endpoint: GHOST,
  p_p256dh: 'KEY',
  p_auth: 'AUTH',
  p_hour: 19,
  p_offset: 300,
})
check('obuna saqlanadi', saved.text.trim() === 'true', saved.text.trim())

// 3. Faollik sanasi yoziladi
const touched = await rpc('yodla_touch_push', { p_endpoint: GHOST, p_day: '2026-01-01' })
check('yodla_touch_push ishlaydi', touched.text.trim() === 'true', touched.text.trim())

// 4. Jadval anon uchun YOPIQ
const read = await fetch(`${URL}/rest/v1/yodla_push_subscriptions?select=endpoint`, {
  headers,
})
const body = await read.text()
const rows = read.ok ? JSON.parse(body) : null
check('anon jadvalni o‘qiy olmaydi', !read.ok || rows.length === 0, `status ${read.status}`)

// 5. Tozalash
const removed = await rpc('yodla_remove_push', { p_endpoint: GHOST })
check('sinov yozuvi o‘chirildi', removed.text.trim() === 'true', removed.text.trim())

process.exit(failed ? 1 : 0)
