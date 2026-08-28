/**
 * Doimiy saqlash (persistent storage).
 *
 * NEGA KERAK: brauzer disk to'lganda IndexedDB'ni O'CHIRIB YUBORISHI
 * mumkin — bu "eviction" deb ataladi va ogohlantirishsiz sodir bo'ladi.
 * Bizda esa foydalanuvchining oylab to'plagan takrorlash progressi
 * (interval, easeFactor, streak) faqat shu yerda yashaydi va zaxirasi
 * yo'q. Ya'ni eviction — butun o'quv tarixining yo'qolishi.
 *
 * `navigator.storage.persist()` shu xavfni yo'q qiladi: ruxsat berilgan
 * saytning ma'lumoti faqat foydalanuvchi o'zi o'chirgandagina ketadi.
 */

/** Doimiy saqlash allaqachon so'ralganini eslab qolish kaliti */
const ASKED_KEY = 'polyglotpro:storage-persist-asked'

/**
 * Doimiy saqlashni so'raydi. Natija — endi himoyalanganmi.
 *
 * QACHON CHAQIRILADI: foydalanuvchi BIRINCHI SEANSNI tugatgach, ilova
 * ochilishida emas. Sabab — Firefox bu so'rovda ruxsat oynasini
 * ko'rsatadi; hali hech nima qilmagan odamga tushunarsiz oyna chiqarish
 * o'rniga, allaqachon progress to'plagan odamdan so'ralgani to'g'riroq.
 * (Chrome oyna ko'rsatmaydi — u faollikka qarab o'zi hal qiladi.)
 *
 * Bir marta so'raladi: rad javobidan keyin qayta-qayta so'rash bezor
 * qiladi va Chrome'da natijani ham o'zgartirmaydi.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false

  try {
    // Allaqachon himoyalangan bo'lsa (o'rnatilgan PWA odatda shunday) —
    // hech nima so'ralmaydi
    if (await navigator.storage.persisted()) return true

    if (localStorage.getItem(ASKED_KEY)) return false

    localStorage.setItem(ASKED_KEY, '1')

    return await navigator.storage.persist()
  } catch (error) {
    // Xatolik o'quv jarayoniga xalaqit bermasligi kerak
    console.error('Doimiy saqlashni so‘rab bo‘lmadi:', error)
    return false
  }
}
