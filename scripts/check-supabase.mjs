/**
 * Liga backendi to'g'ri sozlanganini tekshiradi.
 *
 * Ilovadagi xato xabari sozlash paytida chalg'ituvchi ("internet yo'q
 * bo'lishi mumkin") — sxema qo'llanmagan yoki kalit noto'g'ri bo'lsa ham
 * o'shani ko'rsatadi. Bu skript sababni ANIQ aytadi.
 *
 * Ishga tushirish:  node scripts/check-supabase.mjs
 * Kalitlarni `.env.local` dan oladi (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 */
import { readFileSync, existsSync } from 'node:fs'

/* ----------------------------- env o'qish ----------------------------- */

function loadEnv() {
  const env = { ...process.env }

  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue

    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!match) continue

      const value = match[2].replace(/^["']|["']$/g, '')
      // Muhitdagi qiymat ustun turadi
      env[match[1]] ??= value
    }
  }

  return env
}

const env = loadEnv()
const URL = (env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
const KEY = env.VITE_SUPABASE_ANON_KEY || ''

const ok = (m) => console.log(`  ✓ ${m}`)
const bad = (m) => console.log(`  ✗ ${m}`)

if (!URL || !KEY) {
  console.log('\nKalitlar topilmadi.\n')
  console.log('`.env.local` fayliga quyidagilarni yozing:\n')
  console.log('  VITE_SUPABASE_URL=https://xxxx.supabase.co')
  console.log('  VITE_SUPABASE_ANON_KEY=eyJ...\n')
  console.log("Ular Supabase → Project Settings → API sahifasida turadi.\n")
  process.exit(1)
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }
const rest = (path, init) => fetch(`${URL}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init?.headers } })

let failed = 0
const fail = (m) => { bad(m); failed += 1 }

console.log(`\nTekshirilmoqda: ${URL}\n`)

/* 1. Ulanish va reyting ko'rinishi */
try {
  const res = await rest('yodla_week?select=code,name,xp&limit=1')

  if (res.status === 401) fail('Kalit qabul qilinmadi (401) — ANON kalitni tekshiring')
  else if (res.status === 404) fail("`yodla_week` topilmadi — sxema qo'llanmagan (supabase/yodla-schema.sql)")
  else if (!res.ok) fail(`yodla_week — kutilmagan javob ${res.status}: ${(await res.text()).slice(0, 120)}`)
  else ok(`yodla_week o'qildi (${(await res.json()).length} qator)`)
} catch (error) {
  fail(`Serverga ulanib bo'lmadi: ${error.message}`)
}

/* 2. Do'stlar va xabarlar jadvallari */
for (const table of ['yodla_links', 'yodla_cheers', 'yodla_profiles', 'yodla_daily']) {
  try {
    const res = await rest(`${table}?select=*&limit=1`)
    if (res.ok) ok(`${table} mavjud`)
    else fail(`${table} — ${res.status} (sxema to'liq qo'llanmagan bo'lishi mumkin)`)
  } catch (error) {
    fail(`${table}: ${error.message}`)
  }
}

/* 3. RPC'lar. Ataylab NOTO'G'RI kod yuboriladi: funksiya bor bo'lsa
      o'zining tekshiruv xatosini qaytaradi, yo'q bo'lsa 404. */
const rpcs = {
  yodla_upsert_day: { p_code: 'bad', p_name: 'x', p_xp: 0, p_words: 0 },
  yodla_add_friend: { p_me: 'bad', p_friend: 'bad' },
  yodla_send_cheer: { p_from: 'bad', p_to: 'bad', p_kind: 'bravo' },
}

for (const [name, body] of Object.entries(rpcs)) {
  try {
    const res = await rest(`rpc/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.status === 404) fail(`${name}() topilmadi — sxemani qayta ishga tushiring`)
    else if (res.ok) fail(`${name}() noto'g'ri kodni QABUL QILDI — tekshiruvi ishlamayapti`)
    else ok(`${name}() mavjud va noto'g'ri kodni rad etdi`)
  } catch (error) {
    fail(`${name}: ${error.message}`)
  }
}

/* 4. Sxema YANGI versiyasimi.
      `yodla_add_friend` va `yodla_send_cheer` avval `void` qaytarardi; hozir
      `boolean` — mijoz "bunday kod yo'q" va "bugun allaqachon yuborilgan"
      holatlarini shu orqali ajratadi. Eski nusxa ishga tushirilgan bo'lsa,
      ilova jimgina noto'g'ri xabar ko'rsatardi.

      Tekshiruv OpenAPI tavsifi orqali — yon ta'sirsiz (hech narsa yozilmaydi). */
try {
  const res = await rest('')
  if (!res.ok) {
    console.log(`  · sxema versiyasini tekshirib bo'lmadi (${res.status}) — o'tkazib yuborildi`)
  } else {
    const spec = await res.json()
    const paths = spec?.paths ?? {}

    for (const name of ['yodla_add_friend', 'yodla_send_cheer']) {
      const definition = JSON.stringify(paths[`/rpc/${name}`] ?? null)

      if (definition === 'null') fail(`${name}() tavsifda yo'q`)
      else if (/boolean/i.test(definition)) ok(`${name}() yangi versiya (boolean qaytaradi)`)
      else fail(`${name}() ESKI versiya — sxemani qaytadan RUN qiling`)
    }
  }
} catch (error) {
  console.log(`  · sxema versiyasi tekshirilmadi: ${error.message}`)
}

/* 5. XAVFSIZLIK: anon kalit bilan TO'G'RIDAN-TO'G'RI yozib bo'lmasligi shart.
      Anon kalit ochiq (repo ham ochiq) — yozuv ochiq qolsa, xohlagan odam
      "million XP" yozib reytingni buzardi. */
try {
  const res = await rest('yodla_daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'ZZZZZZ', d: '2020-01-01', xp: 999999, words: 0 }),
  })

  if (res.ok) fail("XAVF: anon kalit bilan to'g'ridan-to'g'ri yozib bo'ldi — RLS yoqilmagan!")
  else ok(`To'g'ridan-to'g'ri yozuv bloklandi (${res.status}) — RLS ishlayapti`)
} catch (error) {
  fail(`Yozuv tekshiruvi: ${error.message}`)
}

console.log(
  failed === 0
    ? '\nHammasi joyida — liga backendi tayyor.\n'
    : `\n${failed} ta muammo topildi (yuqoriga qarang).\n`,
)

process.exit(failed === 0 ? 0 : 1)
