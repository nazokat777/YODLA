import type { LeagueRow } from '@/core/league'

/**
 * Supabase qatlami.
 *
 * Kalitlar env orqali beriladi. Ular BO'LMASA ilova lokal rejimda
 * ishlaydi — bulut qo'shimcha imkoniyat, majburiyat emas.
 *
 * Kutubxona dangasa yuklanadi: liga ochilmasa umuman yuklanmaydi.
 */
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isCloudEnabled(): boolean {
  return Boolean(URL && KEY)
}

interface MinimalClient {
  from: (table: string) => {
    select: (columns: string) => Promise<{ data: LeagueRow[] | null; error: unknown }>
  }
  rpc: (name: string, params: Record<string, unknown>) => Promise<{ error: unknown }>
}

let clientPromise: Promise<MinimalClient> | null = null

async function getClient(): Promise<MinimalClient | null> {
  if (!isCloudEnabled()) return null

  clientPromise ??= import('@supabase/supabase-js').then(
    (module) =>
      module.createClient(URL!, KEY!, {
        auth: { persistSession: false },
      }) as unknown as MinimalClient,
  )

  try {
    return await clientPromise
  } catch (error) {
    console.error('Supabase yuklanmadi:', error)
    return null
  }
}

/** Haftalik reyting; `null` — bulut yo'q yoki so'rov muvaffaqiyatsiz */
export async function fetchWeeklyLeague(): Promise<LeagueRow[] | null> {
  const client = await getClient()
  if (!client) return null

  try {
    const { data, error } = await client.from('yodla_week').select('code,name,xp')
    if (error) throw error

    return data ?? []
  } catch (error) {
    // Tarmoq yo'qligi kutilgan holat: ilova offline ham ishlaydi
    console.error('Reytingni olib bo‘lmadi:', error)
    return null
  }
}

/** Bugungi natijani yuboradi. Muvaffaqiyat — `true` */
export async function pushToday(input: {
  code: string
  name: string
  xp: number
  words: number
}): Promise<boolean> {
  const client = await getClient()
  if (!client) return false

  try {
    const { error } = await client.rpc('yodla_upsert_day', {
      p_code: input.code,
      p_name: input.name,
      p_xp: input.xp,
      p_words: input.words,
    })
    if (error) throw error

    return true
  } catch (error) {
    console.error('Natijani yuborib bo‘lmadi:', error)
    return false
  }
}
