import type { CheerKind, LeagueRow } from '@/core/league'

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

interface QueryBuilder<T> extends PromiseLike<{ data: T[] | null; error: unknown }> {
  eq: (column: string, value: string) => PromiseLike<{ data: T[] | null; error: unknown }>
}

interface MinimalClient {
  from: (table: string) => {
    select: <T>(columns: string) => QueryBuilder<T>
  }
  rpc: (
    name: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>
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
    const { data, error } = await client.from('yodla_week').select<LeagueRow>('code,name,xp')
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

/** Men qo'shgan do'stlarning kodlari */
export async function fetchFriendCodes(myCode: string): Promise<string[]> {
  const client = await getClient()
  if (!client) return []

  try {
    const { data, error } = await client
      .from('yodla_links')
      .select<{ target_code: string }>('target_code')
      .eq('follower', myCode)
    if (error) throw error

    return (data ?? []).map((row) => row.target_code)
  } catch (error) {
    console.error('Do‘stlarni olib bo‘lmadi:', error)
    return []
  }
}

/** Do'st qo'shish natijasi */
export type AddFriendResult =
  /** Qo'shildi (yoki allaqachon ro'yxatda edi) */
  | 'added'
  /** Bunday kodli foydalanuvchi yo'q */
  | 'unknown-code'
  /** Serverga yetib bo'lmadi */
  | 'failed'

/**
 * Do'st qo'shish.
 *
 * Server `false` qaytarsa — kod hech kimga tegishli emas. Buni tarmoq
 * xatosidan ajratish shart: foydalanuvchi kodni QO'LDA kiritadi va bitta
 * harf adashishi mumkin, "internetni tekshiring" esa uni chalg'itardi.
 */
export async function addFriend(myCode: string, friendCode: string): Promise<AddFriendResult> {
  const client = await getClient()
  if (!client) return 'failed'

  try {
    const { data, error } = await client.rpc('yodla_add_friend', {
      p_me: myCode,
      p_friend: friendCode,
    })
    if (error) throw error

    return data === false ? 'unknown-code' : 'added'
  } catch (error) {
    console.error('Do‘st qo‘shib bo‘lmadi:', error)
    return 'failed'
  }
}

/**
 * Tayyor xabar yuborish.
 *
 * `false` — bugun shu xabar shu kishiga allaqachon yuborilgan (baza
 * darajasidagi kunlik chegara) yoki yuborib bo'lmadi.
 */
export async function sendCheer(
  fromCode: string,
  toCode: string,
  kind: CheerKind,
): Promise<boolean> {
  const client = await getClient()
  if (!client) return false

  try {
    const { data, error } = await client.rpc('yodla_send_cheer', {
      p_from: fromCode,
      p_to: toCode,
      p_kind: kind,
    })
    if (error) throw error

    // Server aynan shu holatni ajratadi: yangi yozuv qo'shilganmi
    return data !== false
  } catch (error) {
    console.error('Xabar yuborib bo‘lmadi:', error)
    return false
  }
}

export interface ReceivedCheer {
  from_code: string
  kind: string
  d: string
}

/** Menga kelgan xabarlar */
export async function fetchCheers(myCode: string): Promise<ReceivedCheer[]> {
  const client = await getClient()
  if (!client) return []

  try {
    const { data, error } = await client
      .from('yodla_cheers')
      .select<ReceivedCheer>('from_code,kind,d')
      .eq('to_code', myCode)
    if (error) throw error

    return data ?? []
  } catch (error) {
    console.error('Xabarlarni olib bo‘lmadi:', error)
    return []
  }
}
