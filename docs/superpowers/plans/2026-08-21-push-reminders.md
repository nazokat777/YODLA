# Push eslatmalar — implementatsiya rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Foydalanuvchi o'zi tanlagan soatda telefoniga eslatma keladi — ilova yopiq bo'lsa ham.

**Architecture:** Haqiqiy Web Push. Obuna Supabase jadvalida saqlanadi, `pg_cron` har soatda Edge Function'ni chaqiradi, u o'sha mintaqada belgilangan soat bo'lgan va bugun mashq qilmagan obunachilarga push yuboradi. Mijoz tomonda: `src/lib/push.ts` (qobiq), `public/sw.js` (ishlovchilar), Profil ekranida sozlama.

**Tech Stack:** Web Push API, Supabase (Postgres + RLS + `security definer` RPC + Edge Functions + pg_cron/pg_net), Deno `npm:web-push`, React 19, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-21-push-reminders-design.md`

## Global Constraints

- **Yangi npm paketi QO'SHILMAYDI** (mijoz tomonida). VAPID kalitlari `node:crypto` bilan generatsiya qilinadi. Edge Function Deno'da ishlaydi va `npm:` specifier'dan foydalanadi — u `package.json` ga tegmaydi.
- **MAXFIY VAPID kaliti hech qachon repoga tushmasin.** U faqat Supabase secrets ichida yashaydi. Ochiq kalit `.env.local` da (`VITE_VAPID_PUBLIC_KEY`), u ochiq bo'lishi normal.
- **`service_role` kaliti mijozda ISHLATILMAYDI.** Faqat Edge Function ichida.
- **Yozish faqat RPC orqali:** `anon` kaliti ochiq repoda turadi. Jadvalga to'g'ridan-to'g'ri `insert/update/delete` taqiqlanadi.
- **`npm test | grep` ISHLATMANG** — quvur chiqish kodini yashiradi. Har doim: `npm test -- --run > /dev/null 2>&1; echo "TEST_EXIT=$?"`
- **`tsc --noEmit` yetarli emas** — yakunda `npm run build` ham ishlatiladi.
- Bulut kalitlarisiz ilova ishlashda davom etadi: `isCloudEnabled()` `false` bo'lsa, sozlama umuman ko'rsatilmaydi.
- Izohlar o'zbek tilida, mavjud uslubda: NEGA shundayligini yozing.

## File Structure

| Fayl | Mas'uliyat |
|---|---|
| `scripts/generate-vapid.mjs` (yangi) | VAPID kalit juftini chiqarish (bir marta ishlatiladi) |
| `supabase/yodla-push-schema.sql` (yangi) | Jadval, RLS, uchta RPC |
| `supabase/functions/send-reminders/index.ts` (yangi) | Soatlik yuborish |
| `src/lib/push.ts` (yangi) | Brauzer Push API qobig'i |
| `src/lib/push.test.ts` (yangi) | Qobiq testlari |
| `src/lib/supabase.ts` (o'zg.) | `savePushSubscription`, `removePushSubscription`, `touchPushActivity` |
| `public/sw.js` (o'zg.) | `push` va `notificationclick` ishlovchilari |
| `src/stores/useSettingsStore.ts` (o'zg.) | `reminderHour`, `pushEndpoint` |
| `src/features/profile/ReminderSettings.tsx` (yangi) | Kalit + soat tanlash |
| `src/features/profile/ReminderSettings.test.tsx` (yangi) | UI testlari |
| `src/features/profile/ProfileScreen.tsx` (o'zg.) | Sozlamani joylash |
| `src/hooks/usePushActivity.ts` (yangi) | Seans tugaganda sanani yangilash |
| `scripts/check-push-backend.mjs` (yangi) | Backend tirikligini tekshirish |
| `README.md`, `docs/DEPLOY-PUSH.md` (yangi) | Qadamma-qadam yo'riqnoma |

---

### Task 1: VAPID kalitlari va yo'riqnoma

**Files:**
- Create: `scripts/generate-vapid.mjs`, `docs/DEPLOY-PUSH.md`
- Modify: `.env.example` (agar bor bo'lsa; yo'q bo'lsa yaratmang — `docs/DEPLOY-PUSH.md` yetarli)

**Interfaces:**
- Consumes: hech nima
- Produces: `VITE_VAPID_PUBLIC_KEY` (env nomi), maxfiy kalit matni

- [ ] **Step 1: Skriptni yozish**

`scripts/generate-vapid.mjs`:

```js
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
```

- [ ] **Step 2: Ishga tushirib, ikkita kalit chiqishini tekshirish**

Run: `node scripts/generate-vapid.mjs`
Expected: ikki qator; ochiq kalit 87–88 belgi, maxfiy kalit ~43 belgi.

- [ ] **Step 3: Ochiq kalitni `.env.local` ga yozish**

Faylga qo'lda qo'shing (`.env.local` gitignore'da):

```
VITE_VAPID_PUBLIC_KEY=<ochiq kalit>
```

Maxfiy kalitni HECH QAYERGA yozmang — u Task 6 da Supabase secrets ichiga kiritiladi. Terminaldan nusxa olib turing.

- [ ] **Step 4: Yo'riqnomani yozish**

`docs/DEPLOY-PUSH.md` — Task 6 dagi qadamlarni takrorlaydi; hozircha sarlavha va kalitlar bo'limini yozing, qolgani Task 6 da to'ldiriladi:

```markdown
# Push eslatmalarni ishga tushirish

## 1. VAPID kalitlari

    node scripts/generate-vapid.mjs

- Ochiq kalit → `.env.local` ga `VITE_VAPID_PUBLIC_KEY=...`
- Ochiq kalit → Vercel → Settings → Environment Variables (o'sha nom bilan)
- MAXFIY kalit → faqat Supabase secrets (2-bo'lim). Repoga hech qachon emas.

## 2. Baza sxemasi

## 3. Edge Function

## 4. Soatlik cron
```

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-vapid.mjs docs/DEPLOY-PUSH.md
git commit -m "feat: VAPID kalit generatori va deploy yo'riqnomasi"
```

---

### Task 2: Baza sxemasi va RPC'lar

**Files:**
- Create: `supabase/yodla-push-schema.sql`

**Interfaces:**
- Produces (RPC imzolari, Task 3 shularni chaqiradi):
  - `yodla_save_push(p_endpoint text, p_p256dh text, p_auth text, p_hour int, p_offset int) returns boolean`
  - `yodla_remove_push(p_endpoint text) returns boolean`
  - `yodla_touch_push(p_endpoint text, p_day date) returns boolean`

- [ ] **Step 1: SQL faylini yozish**

`supabase/yodla-push-schema.sql`:

```sql
-- ============================================================
-- YODLA (PolyglotPro) — push eslatmalar
-- Supabase → SQL Editor → New query → shu faylni joylang → RUN
-- Idempotent: qayta ishga tushirsa ham xato bermaydi.
-- ============================================================

create table if not exists public.yodla_push_subscriptions (
  endpoint           text primary key,
  p256dh             text not null,
  auth               text not null,
  -- Foydalanuvchi tanlagan MAHALLIY soat
  reminder_hour      smallint not null check (reminder_hour between 0 and 23),
  -- UTC'dan farq, daqiqada (sharqda musbat). Brauzer beradi.
  utc_offset_minutes smallint not null check (utc_offset_minutes between -840 and 840),
  last_active_on     date,
  failure_count      smallint not null default 0,
  created_at         timestamptz default now()
);

alter table public.yodla_push_subscriptions enable row level security;

-- Hech qanday policy YO'Q: `anon` bu jadvalni na o'qiy, na yoza oladi.
-- Obuna manzili — shaxsiy ma'lumot, reyting kabi ommaviy emas.
-- Yozish faqat quyidagi `security definer` funksiyalar orqali;
-- Edge Function esa `service_role` bilan RLS'dan tashqarida o'qiydi.

-- --- Obunani saqlash --------------------------------------------------
drop function if exists public.yodla_save_push(text, text, text, int, int);
create function public.yodla_save_push(
  p_endpoint text,
  p_p256dh   text,
  p_auth     text,
  p_hour     int,
  p_offset   int
) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  -- Manzil brauzer bergan HTTPS URL bo'lishi shart: bu jadvalni
  -- tasodifiy axlat bilan to'ldirishga arzimas to'siq
  if p_endpoint is null or p_endpoint !~ '^https://' then
    return false;
  end if;

  if p_hour < 0 or p_hour > 23 then
    return false;
  end if;

  insert into public.yodla_push_subscriptions
    (endpoint, p256dh, auth, reminder_hour, utc_offset_minutes)
  values (p_endpoint, p_p256dh, p_auth, p_hour, p_offset)
  on conflict (endpoint) do update set
    p256dh             = excluded.p256dh,
    auth               = excluded.auth,
    reminder_hour      = excluded.reminder_hour,
    utc_offset_minutes = excluded.utc_offset_minutes,
    -- Qayta obuna bo'lganda oldingi nosozliklar hisobi tozalanadi
    failure_count      = 0;

  return true;
end $$;

-- --- Obunani o'chirish ------------------------------------------------
drop function if exists public.yodla_remove_push(text);
create function public.yodla_remove_push(p_endpoint text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from public.yodla_push_subscriptions where endpoint = p_endpoint;
  return found;
end $$;

-- --- "Bugun mashq qildim" ---------------------------------------------
drop function if exists public.yodla_touch_push(text, date);
create function public.yodla_touch_push(p_endpoint text, p_day date)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.yodla_push_subscriptions
     set last_active_on = p_day
   where endpoint = p_endpoint;

  return found;
end $$;

grant execute on function public.yodla_save_push(text, text, text, int, int) to anon;
grant execute on function public.yodla_remove_push(text) to anon;
grant execute on function public.yodla_touch_push(text, date) to anon;
```

**Xavfsizlik eslatmasi (`docs/DEPLOY-PUSH.md` ga ham yoziladi):** obunani
o'chirish yoki yangilash uchun `endpoint` ni bilish kerak. U brauzer
generatsiya qiladigan uzun, taxmin qilib bo'lmaydigan manzil — ya'ni
kalit vazifasini bajaradi. Liga kodlaridagi mantiqning o'zi.

- [ ] **Step 2: Foydalanuvchidan SQL'ni ishga tushirishni so'rash**

Supabase → SQL Editor → New query → faylni joylang → RUN.
Kutilgan natija: `Success. No rows returned`.

**BU QADAM FOYDALANUVCHI TOMONIDAN BAJARILADI.** Tasdiq kelmaguncha
Task 3 ga o'tish mumkin, lekin tekshirish skripti (Task 6) ishlamaydi.

- [ ] **Step 3: Commit**

```bash
git add supabase/yodla-push-schema.sql
git commit -m "feat: push obunalari uchun baza sxemasi"
```

---

### Task 3: Mijoz qobig'i — `push.ts` va Supabase chaqiruvlari

**Files:**
- Create: `src/lib/push.ts`, `src/lib/push.test.ts`
- Modify: `src/lib/supabase.ts`

**Interfaces:**
- Consumes: Task 2 RPC'lari
- Produces:
  ```ts
  // src/lib/push.ts
  isPushSupported(): boolean
  type PushResult = { status: 'enabled'; endpoint: string } | { status: 'denied' } | { status: 'unsupported' } | { status: 'failed' }
  enablePush(hour: number): Promise<PushResult>
  disablePush(): Promise<boolean>

  // src/lib/supabase.ts
  savePushSubscription(input: { endpoint: string; p256dh: string; auth: string; hour: number; offsetMinutes: number }): Promise<boolean>
  removePushSubscription(endpoint: string): Promise<boolean>
  touchPushActivity(endpoint: string, day: string): Promise<boolean>
  ```

- [ ] **Step 1: Supabase chaqiruvlarini qo'shish**

`src/lib/supabase.ts` oxiriga:

```ts
/** Push obunasini saqlash (yangi yoki yangilangan) */
export async function savePushSubscription(input: {
  endpoint: string
  p256dh: string
  auth: string
  hour: number
  offsetMinutes: number
}): Promise<boolean> {
  const client = await getClient()
  if (!client) return false

  try {
    const { data, error } = await client.rpc('yodla_save_push', {
      p_endpoint: input.endpoint,
      p_p256dh: input.p256dh,
      p_auth: input.auth,
      p_hour: input.hour,
      p_offset: input.offsetMinutes,
    })
    if (error) throw error

    return data !== false
  } catch (error) {
    console.error('Obunani saqlab bo‘lmadi:', error)
    return false
  }
}

/** Push obunasini o'chirish */
export async function removePushSubscription(endpoint: string): Promise<boolean> {
  const client = await getClient()
  if (!client) return false

  try {
    const { error } = await client.rpc('yodla_remove_push', { p_endpoint: endpoint })
    if (error) throw error

    return true
  } catch (error) {
    console.error('Obunani o‘chirib bo‘lmadi:', error)
    return false
  }
}

/**
 * "Bugun mashq qildim" belgisi.
 *
 * Ansiz cron bugun allaqachon mashq qilgan odamga ham eslatma yuborardi —
 * bu eslatmani o'chirishga olib keladigan eng tez yo'l. Yuboriladigan
 * yagona narsa — SANA (vaqtsiz).
 */
export async function touchPushActivity(endpoint: string, day: string): Promise<boolean> {
  const client = await getClient()
  if (!client) return false

  try {
    const { error } = await client.rpc('yodla_touch_push', {
      p_endpoint: endpoint,
      p_day: day,
    })
    if (error) throw error

    return true
  } catch (error) {
    console.error('Faollik sanasini yuborib bo‘lmadi:', error)
    return false
  }
}
```

- [ ] **Step 2: Failing testni yozish**

`src/lib/push.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enablePush, isPushSupported } from './push'
import * as supabase from './supabase'

const subscribe = vi.fn()

/** Brauzer muhitini soxtalashtirish */
function installBrowser(permission: NotificationPermission = 'granted') {
  vi.stubGlobal('Notification', {
    permission,
    requestPermission: vi.fn().mockResolvedValue(permission),
  })

  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      ready: Promise.resolve({ pushManager: { subscribe, getSubscription: vi.fn() } }),
    },
  })

  vi.stubGlobal('PushManager', function () {})
}

beforeEach(() => {
  subscribe.mockReset()
  subscribe.mockResolvedValue({
    endpoint: 'https://push.example/abc',
    toJSON: () => ({
      endpoint: 'https://push.example/abc',
      keys: { p256dh: 'KEY', auth: 'AUTH' },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  })
  vi.spyOn(supabase, 'savePushSubscription').mockResolvedValue(true)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('isPushSupported', () => {
  it('kerakli API‘lar bo‘lmasa false', () => {
    expect(isPushSupported()).toBe(false)
  })

  it('hammasi bor bo‘lsa true', () => {
    installBrowser()
    expect(isPushSupported()).toBe(true)
  })
})

describe('enablePush', () => {
  it('ruxsat berilganda obunani saqlaydi', async () => {
    installBrowser('granted')

    await expect(enablePush(19)).resolves.toEqual({
      status: 'enabled',
      endpoint: 'https://push.example/abc',
    })

    expect(supabase.savePushSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'https://push.example/abc', hour: 19 }),
    )
  })

  it('ruxsat rad etilsa denied qaytaradi', async () => {
    installBrowser('denied')

    await expect(enablePush(19)).resolves.toEqual({ status: 'denied' })
    expect(supabase.savePushSubscription).not.toHaveBeenCalled()
  })

  it('brauzer qo‘llab-quvvatlamasa unsupported qaytaradi', async () => {
    await expect(enablePush(19)).resolves.toEqual({ status: 'unsupported' })
  })

  it('server saqlay olmasa failed qaytaradi', async () => {
    installBrowser('granted')
    vi.spyOn(supabase, 'savePushSubscription').mockResolvedValue(false)

    await expect(enablePush(19)).resolves.toEqual({ status: 'failed' })
  })
})
```

- [ ] **Step 3: Testni ishga tushirib, yiqilishiga ishonch hosil qilish**

Run: `npx vitest run src/lib/push.test.ts`
Expected: FAIL — `Failed to resolve import "./push"`

- [ ] **Step 4: Implementatsiyani yozish**

`src/lib/push.ts`:

```ts
import {
  removePushSubscription,
  savePushSubscription,
} from './supabase'

/**
 * Push eslatmalar (Web Push API).
 *
 * Bu qatlam FAQAT brauzer bilan gaplashadi va natijani ochiq holat
 * sifatida qaytaradi — chunki foydalanuvchiga "ruxsat berilmadi" va
 * "server javob bermadi" butunlay boshqa xabarlar bo'lishi kerak.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

/** Brauzerda push uchun kerakli hamma narsa bormi */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'PushManager' in window &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  )
}

/**
 * base64url → Uint8Array.
 *
 * `applicationServerKey` aynan bayt massivini talab qiladi; satr berilsa
 * brauzer jimgina rad etadi.
 */
function decodeKey(base64url: string): Uint8Array {
  const padded = base64url.padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=')
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))

  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

export type PushResult =
  | { status: 'enabled'; endpoint: string }
  | { status: 'denied' }
  | { status: 'unsupported' }
  | { status: 'failed' }

/**
 * Eslatmalarni yoqish.
 *
 * DIQQAT: bu funksiya foydalanuvchi BOSGANDA chaqirilishi shart — brauzer
 * ruxsat oynasini faqat foydalanuvchi harakatidan keyin ochadi.
 */
export async function enablePush(hour: number): Promise<PushResult> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return { status: 'unsupported' }

  try {
    const permission =
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()

    if (permission !== 'granted') return { status: 'denied' }

    const registration = await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      // Brauzer talabi: har push KO'RINADIGAN bildirishnoma chiqarishi shart.
      // Shu sababli "bugun mashq qilganlarni o'tkazib yuborish" mijozda
      // emas, SERVERDA hal qilinadi.
      userVisibleOnly: true,
      applicationServerKey: decodeKey(VAPID_PUBLIC_KEY),
    })

    const json = subscription.toJSON() as {
      endpoint?: string
      keys?: { p256dh?: string; auth?: string }
    }

    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
      return { status: 'failed' }
    }

    const saved = await savePushSubscription({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      hour,
      // `getTimezoneOffset` UTC'gacha bo'lgan farqni TESKARI ishorada
      // beradi: Toshkent uchun -300. Bazada sharq musbat bo'lgani qulay.
      offsetMinutes: -new Date().getTimezoneOffset(),
    })

    return saved ? { status: 'enabled', endpoint: json.endpoint } : { status: 'failed' }
  } catch (error) {
    console.error('Eslatmalarni yoqib bo‘lmadi:', error)
    return { status: 'failed' }
  }
}

/**
 * Eslatmalarni o'chirish.
 *
 * Avval SERVERDAN o'chiriladi: brauzer obunasi yo'qolib, server yozuvi
 * qolib ketsa, foydalanuvchi o'chirgan eslatma yuborilishda davom etardi.
 */
export async function disablePush(): Promise<boolean> {
  if (!isPushSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) return true

    await removePushSubscription(subscription.endpoint)
    await subscription.unsubscribe()

    return true
  } catch (error) {
    console.error('Eslatmalarni o‘chirib bo‘lmadi:', error)
    return false
  }
}
```

`vite-env.d.ts` da `ImportMetaEnv` interfeysi bo'lsa, unga `VITE_VAPID_PUBLIC_KEY?: string` qo'shing. Bo'lmasa — hech nima qilmang, `as` yetarli.

- [ ] **Step 5: Testlar o'tishini tekshirish**

Run: `npx vitest run src/lib/push.test.ts`
Expected: PASS (6 test)

- [ ] **Step 6: Commit**

```bash
git add src/lib/push.ts src/lib/push.test.ts src/lib/supabase.ts
git commit -m "feat: push obunasini yoqish va o'chirish"
```

---

### Task 4: Service worker ishlovchilari

**Files:**
- Modify: `public/sw.js`

**Interfaces:**
- Consumes: Edge Function yuboradigan JSON: `{ title, body, url }`

**Kontekst:** `public/sw.js` bundler'dan o'tmaydi — u oddiy JS, import yo'q. Ikonkalar `public/` ildizida: `/icon-192.png`.

- [ ] **Step 1: Ishlovchilarni qo'shish**

`public/sw.js` oxiriga:

```js
/**
 * Kelgan push.
 *
 * Mazmun serverdan JSON bo'lib keladi, lekin unga TAYANIB BO'LMAYDI:
 * ba'zi brauzerlar obunani tekshirish uchun bo'sh push yuboradi. Shuning
 * uchun har maydonning zaxira qiymati bor.
 */
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    // JSON emas — zaxira matn ishlatiladi
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'YODLA', {
      body: payload.body || "Bugungi mashqni unutmang — 5 daqiqa yetarli!",
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      lang: 'uz',
      // Bir xil `tag`: eski o'qilmagan eslatma yangisi bilan ALMASHADI,
      // ekranda o'nta bir xil bildirishnoma yig'ilib qolmaydi
      tag: 'yodla-reminder',
      data: { url: payload.url || '/review' },
    }),
  )
})

/**
 * Bildirishnoma bosilganda.
 *
 * Ilova allaqachon ochiq bo'lsa YANGI oyna ochilmaydi — mavjudi
 * fokuslanadi va kerakli manzilga o'tadi. Aks holda foydalanuvchida
 * bir xil ilovaning bir nechta nusxasi to'planardi.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = (event.notification.data && event.notification.data.url) || '/review'

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus()
          if ('navigate' in client) await client.navigate(url)
          return
        }
      }

      await self.clients.openWindow(url)
    })(),
  )
})
```

- [ ] **Step 2: Sintaksisni tekshirish**

Run: `node --check public/sw.js`
Expected: chiqish yo'q (xato yo'q).

- [ ] **Step 3: Commit**

```bash
git add public/sw.js
git commit -m "feat: service worker push va bosish ishlovchilari"
```

---

### Task 5: Profil sozlamasi

**Files:**
- Modify: `src/stores/useSettingsStore.ts`
- Create: `src/features/profile/ReminderSettings.tsx`, `src/features/profile/ReminderSettings.test.tsx`
- Modify: `src/features/profile/ProfileScreen.tsx`

**Interfaces:**
- Consumes: `enablePush`, `disablePush`, `isPushSupported` (Task 3)
- Produces: `<ReminderSettings />`; do'kon maydonlari `reminderHour: number`, `pushEndpoint: string | null`, `setReminderHour`, `setPushEndpoint`

- [ ] **Step 1: Do'konga maydon qo'shish**

`src/stores/useSettingsStore.ts` — `SettingsState` interfeysiga:

```ts
  /** Eslatma soati (0..23), mahalliy vaqt */
  reminderHour: number
  /**
   * Faol push obunasining manzili.
   *
   * Bu YAGONA identifikator: seans tugaganda "bugun mashq qildim" belgisi
   * shu manzil bo'yicha yangilanadi.
   */
  pushEndpoint: string | null

  setReminderHour: (hour: number) => void
  setPushEndpoint: (endpoint: string | null) => void
```

`INITIAL` ga: `reminderHour: 19,` va `pushEndpoint: null,`

Amallar:

```ts
      setReminderHour: (reminderHour) => set({ reminderHour }),
      setPushEndpoint: (pushEndpoint) => set({ pushEndpoint }),
```

- [ ] **Step 2: Failing testni yozish**

`src/features/profile/ReminderSettings.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ReminderSettings } from './ReminderSettings'
import { useSettingsStore } from '@/stores/useSettingsStore'
import * as push from '@/lib/push'

beforeEach(() => {
  vi.spyOn(push, 'isPushSupported').mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ReminderSettings', () => {
  it('qo‘llab-quvvatlanmasa tushuntirish ko‘rsatadi', () => {
    vi.spyOn(push, 'isPushSupported').mockReturnValue(false)

    render(<ReminderSettings />)

    expect(screen.getByText(/qo‘llab-quvvatlamaydi/i)).toBeInTheDocument()
  })

  it('yoqilganda obuna saqlanadi va manzil eslab qolinadi', async () => {
    vi.spyOn(push, 'enablePush').mockResolvedValue({
      status: 'enabled',
      endpoint: 'https://push.example/abc',
    })

    render(<ReminderSettings />)
    fireEvent.click(screen.getByRole('switch', { name: /eslatma/i }))

    await waitFor(() => {
      expect(useSettingsStore.getState().pushEndpoint).toBe('https://push.example/abc')
    })
  })

  it('ruxsat rad etilsa sabab ko‘rsatiladi', async () => {
    vi.spyOn(push, 'enablePush').mockResolvedValue({ status: 'denied' })

    render(<ReminderSettings />)
    fireEvent.click(screen.getByRole('switch', { name: /eslatma/i }))

    expect(await screen.findByText(/ruxsat/i)).toBeInTheDocument()
    expect(useSettingsStore.getState().pushEndpoint).toBeNull()
  })

  it('soat tanlash saqlanadi', () => {
    render(<ReminderSettings />)

    fireEvent.change(screen.getByLabelText(/eslatma vaqti/i), { target: { value: '8' } })

    expect(useSettingsStore.getState().reminderHour).toBe(8)
  })
})
```

- [ ] **Step 3: Testni ishga tushirib, yiqilishiga ishonch hosil qilish**

Run: `npx vitest run src/features/profile/ReminderSettings.test.tsx`
Expected: FAIL — `Failed to resolve import "./ReminderSettings"`

- [ ] **Step 4: Komponentni yozish**

`src/features/profile/ReminderSettings.tsx`:

```tsx
import { useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { disablePush, enablePush, isPushSupported } from '@/lib/push'
import { isCloudEnabled } from '@/lib/supabase'
import { useSettingsStore } from '@/stores/useSettingsStore'

/** Tanlash mumkin bo'lgan soatlar — tunda eslatma bermaymiz */
const HOURS = [7, 8, 9, 12, 15, 18, 19, 20, 21]

/**
 * Kunlik eslatma sozlamasi.
 *
 * Ruxsat FOYDALANUVCHI BOSGANDA so'raladi: brauzer avtomatik so'rovni
 * bloklaydi, ustiga so'ralmagan ruxsat oynasi bezor qiladi.
 */
export function ReminderSettings() {
  const reminderHour = useSettingsStore((s) => s.reminderHour)
  const setReminderHour = useSettingsStore((s) => s.setReminderHour)
  const pushEndpoint = useSettingsStore((s) => s.pushEndpoint)
  const setPushEndpoint = useSettingsStore((s) => s.setPushEndpoint)

  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!isCloudEnabled() || !isPushSupported()) {
    return (
      <Panel className="text-sm text-ink-600">
        <p className="font-bold text-ink-900">Kunlik eslatma</p>
        <p className="mt-1">
          Bu brauzer eslatmalarni qo‘llab-quvvatlamaydi. iPhone’da ilovani
          avval bosh ekranga qo‘shing.
        </p>
      </Panel>
    )
  }

  async function toggle(next: boolean) {
    setIsBusy(true)
    setMessage(null)

    if (!next) {
      await disablePush()
      setPushEndpoint(null)
      setIsBusy(false)
      return
    }

    const result = await enablePush(reminderHour)
    setIsBusy(false)

    switch (result.status) {
      case 'enabled':
        setPushEndpoint(result.endpoint)
        break
      case 'denied':
        setMessage(
          'Bildirishnomaga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering.',
        )
        break
      default:
        setMessage('Hozir yoqib bo‘lmadi — keyinroq urinib ko‘ring.')
    }
  }

  /** Yoqilgan holatda soat o'zgarsa, obuna qayta yoziladi */
  async function changeHour(hour: number) {
    setReminderHour(hour)
    if (!pushEndpoint) return

    const result = await enablePush(hour)
    if (result.status === 'enabled') setPushEndpoint(result.endpoint)
  }

  return (
    <Panel className="flex flex-col gap-3">
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span>
          <span className="block font-bold">Kunlik eslatma</span>
          <span className="text-sm text-ink-600">
            Mashq qilmagan kuningizda bildirishnoma keladi
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          aria-label="Kunlik eslatma"
          checked={pushEndpoint !== null}
          disabled={isBusy}
          onChange={(event) => void toggle(event.target.checked)}
          className="h-6 w-6 accent-brand-500"
        />
      </label>

      <div className="flex items-center justify-between gap-4">
        <label htmlFor="reminder-hour" className="text-sm font-semibold text-ink-600">
          Eslatma vaqti
        </label>
        <select
          id="reminder-hour"
          value={reminderHour}
          onChange={(event) => void changeHour(Number(event.target.value))}
          className="h-11 rounded-xl border-2 border-ink-300 bg-white px-3 font-semibold"
        >
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {String(hour).padStart(2, '0')}:00
            </option>
          ))}
        </select>
      </div>

      {message && <p className="text-sm text-wrong-600">{message}</p>}

      <p className="text-xs text-ink-600">
        iPhone’da eslatma faqat ilova bosh ekranga qo‘shilgan bo‘lsa ishlaydi.
      </p>
    </Panel>
  )
}
```

- [ ] **Step 5: Profil ekraniga joylash**

`src/features/profile/ProfileScreen.tsx` — importlarga:

```tsx
import { ReminderSettings } from './ReminderSettings'
```

"Javob tovushlari" panelidan KEYIN, "Assotsiatsiyalarim" panelidan OLDIN:

```tsx
      <ReminderSettings />
```

- [ ] **Step 6: Testlar o'tishini tekshirish**

```bash
npm test -- --run > /dev/null 2>&1; echo "TEST_EXIT=$?"
```
Expected: `TEST_EXIT=0`

- [ ] **Step 7: Commit**

```bash
git add src/stores/useSettingsStore.ts src/features/profile
git commit -m "feat: profilda kunlik eslatma sozlamasi"
```

---

### Task 6: Faollik belgisi, Edge Function va yakuniy tekshiruv

**Files:**
- Create: `src/hooks/usePushActivity.ts`, `src/hooks/usePushActivity.test.ts`
- Modify: `src/features/session/SessionRunner.tsx`
- Create: `supabase/functions/send-reminders/index.ts`, `scripts/check-push-backend.mjs`
- Modify: `docs/DEPLOY-PUSH.md`, `README.md`

**Interfaces:**
- Consumes: `touchPushActivity` (Task 3), `pushEndpoint` (Task 5)

- [ ] **Step 1: Failing testni yozish**

`src/hooks/usePushActivity.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePushActivity } from './usePushActivity'
import { useSettingsStore } from '@/stores/useSettingsStore'
import * as supabase from '@/lib/supabase'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePushActivity', () => {
  it('obuna bo‘lmasa hech nima yubormaydi', () => {
    const touch = vi.spyOn(supabase, 'touchPushActivity').mockResolvedValue(true)

    renderHook(() => usePushActivity('finished'))

    expect(touch).not.toHaveBeenCalled()
  })

  it('seans tugaganda bugungi sanani yuboradi', async () => {
    useSettingsStore.setState({ pushEndpoint: 'https://push.example/abc' })
    const touch = vi.spyOn(supabase, 'touchPushActivity').mockResolvedValue(true)

    renderHook(() => usePushActivity('finished'))

    await waitFor(() => {
      expect(touch).toHaveBeenCalledWith(
        'https://push.example/abc',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      )
    })
  })
})
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishiga ishonch hosil qilish**

Run: `npx vitest run src/hooks/usePushActivity.test.ts`
Expected: FAIL — `Failed to resolve import "./usePushActivity"`

- [ ] **Step 3: Hook'ni yozish**

`src/hooks/usePushActivity.ts`:

```ts
import { useEffect } from 'react'
import { touchPushActivity } from '@/lib/supabase'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * "Bugun mashq qildim" belgisini serverga yuboradi.
 *
 * NEGA KERAK: eslatmani kim OLMASLIGI kerakligini server hal qiladi —
 * Web Push kelgan bildirishnomani yashirishga ruxsat bermaydi
 * (`userVisibleOnly`). Yuboriladigan yagona narsa — SANA.
 *
 * Xatolik jimgina yutiladi: eslatma qulaylik, o'rganishga xalaqit
 * bermasligi kerak. Keyingi seansda qayta urinadi.
 */
export function usePushActivity(trigger: unknown) {
  const pushEndpoint = useSettingsStore((s) => s.pushEndpoint)

  useEffect(() => {
    if (!pushEndpoint) return

    // Mahalliy sana: server ham foydalanuvchining mintaqasi bo'yicha
    // solishtiradi, UTC bo'yicha emas
    const now = new Date()
    const day = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-')

    void touchPushActivity(pushEndpoint, day).catch((error: unknown) => {
      console.error('Faollik sanasini yuborib bo‘lmadi:', error)
    })
  }, [pushEndpoint, trigger])
}
```

- [ ] **Step 4: Seansga ulash**

`src/features/session/SessionRunner.tsx` — importlarga:

```tsx
import { usePushActivity } from '@/hooks/usePushActivity'
```

`useLeagueSync(...)` chaqiruvidan keyin:

```tsx
  // Bugun mashq qilgan odamga kechqurun eslatma yuborilmasligi uchun
  usePushActivity(index >= queue.length ? 'finished' : 'running')
```

- [ ] **Step 5: Testlar o'tishini tekshirish**

Run: `npx vitest run src/hooks/usePushActivity.test.ts`
Expected: PASS (2 test)

- [ ] **Step 6: Edge Function'ni yozish**

`supabase/functions/send-reminders/index.ts`:

```ts
/**
 * Soatlik eslatma yuboruvchi.
 *
 * `pg_cron` uni har soat boshida chaqiradi. Vazifasi: shu daqiqada
 * MAHALLIY vaqti foydalanuvchi tanlagan soatga teng bo'lgan va bugun
 * hali mashq qilmagan obunachilarga push yuborish.
 *
 * `service_role` bilan ishlaydi — jadval RLS ostida yopiq va uni
 * `anon` na o'qiy, na yoza oladi.
 */
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

interface Row {
  endpoint: string
  p256dh: string
  auth: string
  reminder_hour: number
  utc_offset_minutes: number
  last_active_on: string | null
}

/** Berilgan ofsetdagi mahalliy vaqt */
function localNow(offsetMinutes: number): Date {
  return new Date(Date.now() + offsetMinutes * 60_000)
}

/** YYYY-MM-DD, UTC maydonlari bo'yicha (localNow allaqachon siljitilgan) */
function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  const { data, error } = await supabase
    .from('yodla_push_subscriptions')
    .select('endpoint,p256dh,auth,reminder_hour,utc_offset_minutes,last_active_on')

  if (error) {
    console.error('Obunalarni o‘qib bo‘lmadi:', error)
    return new Response('db error', { status: 500 })
  }

  const rows = (data ?? []) as Row[]

  // Tanlov KODDA qilinadi, SQL'da emas: mintaqa hisobini o'qish va
  // sinash osonroq bo'lsin
  const due = rows.filter((row) => {
    const local = localNow(row.utc_offset_minutes)
    if (local.getUTCHours() !== row.reminder_hour) return false

    return row.last_active_on === null || row.last_active_on < isoDay(local)
  })

  const payload = JSON.stringify({
    title: 'YODLA',
    body: 'Bugungi mashqni unutmang — 5 daqiqa yetarli!',
    url: '/review',
  })

  let sent = 0
  const dead: string[] = []

  for (const row of due) {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        payload,
      )
      sent += 1
    } catch (pushError) {
      const status = (pushError as { statusCode?: number }).statusCode

      // 404/410 — obuna o'lgan (brauzer o'chirilgan, ruxsat olib tashlangan).
      // Bunday yozuvni saqlab turish har soatda behuda so'rov demakdir.
      if (status === 404 || status === 410) dead.push(row.endpoint)
      else console.error('Yuborib bo‘lmadi:', status, row.endpoint)
    }
  }

  if (dead.length > 0) {
    await supabase.from('yodla_push_subscriptions').delete().in('endpoint', dead)
  }

  return Response.json({ candidates: due.length, sent, removed: dead.length })
})
```

- [ ] **Step 7: Tekshirish skriptini yozish**

`scripts/check-push-backend.mjs`:

```js
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

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

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
const read = await fetch(`${URL}/rest/v1/yodla_push_subscriptions?select=endpoint`, { headers })
const rows = read.ok ? JSON.parse(await read.text()) : null
check('anon jadvalni o‘qiy olmaydi', !read.ok || rows.length === 0, `status ${read.status}`)

// 5. Tozalash
const removed = await rpc('yodla_remove_push', { p_endpoint: GHOST })
check('sinov yozuvi o‘chirildi', removed.text.trim() === 'true', removed.text.trim())

process.exit(failed ? 1 : 0)
```

- [ ] **Step 8: Yo'riqnomani to'ldirish**

`docs/DEPLOY-PUSH.md` dagi bo'sh bo'limlarni to'ldiring:

```markdown
## 2. Baza sxemasi

Supabase → SQL Editor → New query → `supabase/yodla-push-schema.sql` ni
joylang → RUN. Kutilgan javob: `Success. No rows returned`.

Keyin tekshiring:

    node scripts/check-push-backend.mjs

Hamma qator ✅ bo'lishi kerak.

## 3. Edge Function

Supabase CLI kerak (`npm i -g supabase`), keyin:

    supabase login
    supabase link --project-ref <PROJECT_REF>
    supabase secrets set VAPID_PUBLIC_KEY=<ochiq> VAPID_PRIVATE_KEY=<maxfiy> VAPID_SUBJECT=mailto:<pochtangiz>
    supabase functions deploy send-reminders

`SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY` avtomatik beriladi —
ularni qo'lda kiritish shart emas.

Sinash:

    supabase functions invoke send-reminders

Javob `{"candidates":0,"sent":0,"removed":0}` bo'lsa — ishlayapti
(hozircha hech kim tanlagan soatda emas).

## 4. Soatlik cron

Supabase → SQL Editor:

    create extension if not exists pg_cron;
    create extension if not exists pg_net;

    select cron.schedule(
      'yodla-reminders',
      '0 * * * *',
      $$
      select net.http_post(
        url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer <ANON_KEY>'
        )
      );
      $$
    );

Tekshirish: `select * from cron.job;`
```

- [ ] **Step 9: README yangilash**

`README.md` papka tuzilmasida `lib/` bo'limiga qo'shing:

```
│   ├── push.ts              # Web Push obunasi (yoqish/o'chirish)
```

- [ ] **Step 10: Yakuniy tekshiruv**

```bash
npm run lint
npx tsc --noEmit && echo "tsc ok"
npm test -- --run > /dev/null 2>&1; echo "TEST_EXIT=$?"
npm run build > /dev/null 2>&1; echo "BUILD_EXIT=$?"
node --check public/sw.js && echo "sw ok"
```
Expected: lint toza, `tsc ok`, `TEST_EXIT=0`, `BUILD_EXIT=0`, `sw ok`

- [ ] **Step 11: Commit va push**

```bash
git add -A
git commit -m "feat: kunlik push eslatmalar (backend + mijoz)"
git push
```

- [ ] **Step 12: Foydalanuvchiga topshirish**

`docs/DEPLOY-PUSH.md` bo'yicha qadamlarni bajarishni so'rang: SQL, secrets,
`functions deploy`, cron. Keyin `node scripts/check-push-backend.mjs` ni
birga ishga tushiring.

**Ochiq qoladi:** haqiqiy push telefonga yetib borishi — buni faqat
foydalanuvchi tasdiqlay oladi.
