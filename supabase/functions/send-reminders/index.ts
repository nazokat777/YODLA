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
