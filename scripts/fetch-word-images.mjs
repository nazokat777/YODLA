/**
 * So'z rasmlarini OpenMoji'dan yuklab oladi.
 *
 * ISHLATISH: `node scripts/fetch-word-images.mjs`
 *
 * Rasmlar `public/word-images/` ga tushadi va git'ga QO'SHILADI — ilova
 * oflayn ishlaydi, ya'ni ishga tushirish paytida tarmoqqa bog'lanib
 * bo'lmaydi. Skript faqat lug'at o'zgarganda qayta yuritiladi.
 *
 * MANBA: openmoji.org — CC BY-SA 4.0. Atribut `docs/ASSETS.md` da.
 *
 * NEGA KALIT SO'Z BO'YICHA QIDIRUV YO'Q: rasmlar aniq Unicode kodi
 * bo'yicha olinadi, ya'ni natija oldindan ma'lum. Qidiruv esa bolalar
 * uchun mo'ljallangan ilovaga tasodifiy rasm olib kelishi mumkin edi.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const BASE = 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg'
const OUT = 'public/word-images'

/** Bir vaqtda nechta so'rov — GitHub'ni bo'g'ib qo'ymaslik uchun */
const CONCURRENCY = 8

/**
 * Kodlar ro'yxatini TS manbasidan o'qiydi.
 *
 * Modulni `import` qilib bo'lmaydi: u `.ts` va Node uni tushunmaydi.
 * Shuning uchun qiymatlar oddiy matn sifatida ajratib olinadi — format
 * qat'iy (`'1F34E'`), shuning uchun bu ishonchli.
 */
async function readCodes() {
  const source = await readFile('src/content/wordImages.ts', 'utf8')
  const body = source.slice(
    source.indexOf('const WORD_IMAGES'),
    source.indexOf('function normalize'),
  )

  return [...new Set([...body.matchAll(/'([0-9A-F]{4,5}(?:-[0-9A-F]{4,5})*)'/g)].map((m) => m[1]))]
}

async function fetchOne(code) {
  const target = `${OUT}/${code}.svg`
  if (existsSync(target)) return { code, status: 'bor' }

  const response = await fetch(`${BASE}/${code}.svg`)
  if (!response.ok) return { code, status: 'YO‘Q' }

  const svg = await response.text()
  await writeFile(target, svg, 'utf8')

  return { code, status: 'yuklandi', bytes: svg.length }
}

const codes = await readCodes()
await mkdir(OUT, { recursive: true })

console.log(`${codes.length} ta rasm tekshirilmoqda…`)

const results = []
for (let i = 0; i < codes.length; i += CONCURRENCY) {
  results.push(...(await Promise.all(codes.slice(i, i + CONCURRENCY).map(fetchOne))))
}

const missing = results.filter((r) => r.status === 'YO‘Q')
const fetched = results.filter((r) => r.status === 'yuklandi')
const bytes = fetched.reduce((sum, r) => sum + r.bytes, 0)

console.log(`yuklandi: ${fetched.length} (${Math.round(bytes / 1024)} KB)`)
console.log(`allaqachon bor: ${results.length - fetched.length - missing.length}`)

if (missing.length > 0) {
  console.log(`\nOpenMoji'da YO'Q (xaritadan olib tashlang):`)
  for (const item of missing) console.log(`  ${item.code}`)
  process.exitCode = 1
}
