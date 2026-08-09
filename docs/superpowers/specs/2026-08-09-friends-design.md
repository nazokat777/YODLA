# Do'stlar va taklif (dizayn)

**Sana:** 2026-08-09
**Holat:** tasdiqlangan
**Qamrov:** Liga ustiga do'stlar qatlami — kod bilan qo'shish, taklif havolasi, do'stlar reytingi.

## Muammo

Umumiy reyting begonalar ro'yxati. Duolingo'da motivatsiya asosan
**tanish odamlar** bilan raqobatdan keladi — "Ali mendan 30 XP oldinda"
degan his begona `X7QK2M` dan kuchliroq.

## Yechim

Focus AI'ning `links` jadvali naqshi: har kim boshqasini **kodi orqali**
qo'shadi. Bir tomonlama (kuzatish) — tasdiqlash talab qilinmaydi, chunki
ma'lumot allaqachon ommaviy (reyting).

## 1. Jadval

```sql
yodla_links (follower text, target_code text, created_at timestamptz,
             primary key (follower, target_code))
```

O'qish ochiq; yozuv **RPC orqali** (`yodla_add_friend`) — kod formati
tekshiriladi va o'zini o'ziga qo'shish taqiqlanadi.

`yodla_remove_friend` — do'stni olib tashlash.

## 2. Taklif havolasi

`https://yodla-five.vercel.app/league?add=N2NAWS`

Havola ochilganda kod maydoni **oldindan to'ldiriladi**, lekin
**avtomatik qo'shilmaydi** — foydalanuvchi tasdiqlashi kerak. Aks holda
havolani bosgan odam bilmagan holda kimnidir kuzata boshlardi.

Ulashish `navigator.share` orqali; qo'llab-quvvatlanmasa — havolani
nusxalash (`clipboard`) va matn ko'rsatiladi.

## 3. Ekran

Liga ekraniga ikkita ko'rinish qo'shiladi:

- **Hammasi** — barcha foydalanuvchilar (mavjud)
- **Do'stlar** — men qo'shganlar + o'zim

Pastda: "Do'st qo'shish" (kod maydoni) va "Taklif qilish" tugmasi.

Do'stlar ro'yxati bo'sh bo'lsa: *"Hali do'st qo'shmadingiz. Kodingizni
ulashing yoki do'stingiz kodini kiriting."*

## 4. Sof funksiyalar

`core/league/friends.ts`:

- `normalizeCode(input: string): string | null` — bo'shliqlar olib
  tashlanadi, katta harfga o'tkaziladi; format noto'g'ri bo'lsa `null`
- `filterFriends(rows, myCode, friendCodes): LeagueRow[]` — o'zim va
  do'stlarim; tartib `rankEntries` da
- `buildInviteUrl(origin: string, code: string): string`

## 5. Testlar

- `normalizeCode` — kichik harf, bo'shliq, noto'g'ri uzunlik, taqiqlangan
  belgi (`0`, `O`, `1`, `I`)
- `filterFriends` — o'zim doim ro'yxatda; noma'lum kod tushib qoladi
- `buildInviteUrl` — kod parametri to'g'ri
- Ekran: do'st bo'lmaganda taklif matni; `?add=` havolasi maydonni
  to'ldiradi lekin qo'shmaydi

## 6. Qamrovdan tashqarida

- Do'stni tasdiqlash (ikki tomonlama) — ma'lumot ommaviy, ma'nosi yo'q
- Chat/xabarlar
- Do'stlar soni cheklovi

## Xavf

Kimdir begona kodni topib qo'shishi mumkin. Zarari yo'q: u faqat ism va
haftalik XP'ni ko'radi — bu ma'lumot umumiy reytingda allaqachon ochiq.
