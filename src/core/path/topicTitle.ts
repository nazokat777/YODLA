/** Mavzu nomining ikki qismi */
export interface TopicParts {
  /** Barcha qo'shni bo'limlarda TAKRORLANADIGAN qism (bo'lmasa `null`) */
  section: string | null
  /** Shu bo'limni boshqalardan AJRATIB turadigan qism */
  title: string
}

/** Bo'lak ajratgich — importerlar shu belgini qo'yadi */
const SEPARATOR = ' · '

/** "Qiroat 1-kitob 10-dars" — oxiridagi dars raqami */
const LESSON_SUFFIX = /^(.+?)\s+(\d+-dars)$/

/** "Ruscha lug'at A1-10" — daraja va tartib raqami */
const LEVEL_SUFFIX = /^(.+?)\s+([A-C][12])-(\d+)$/

/**
 * Mavzu nomini "seksiya" va "sarlavha"ga ajratadi.
 *
 * NEGA KERAK: importerlar nomga manba haqidagi ma'lumotni qo'shadi va u
 * HAR bo'limda bir xil takrorlanadi — "Enterprise 1 · " yuz marta,
 * "Qiroat 1-kitob " ikki yuz marta. Bu 375 px li ekranda joyning yarmini
 * yeb qo'yadi va bo'limlarni bir-biridan ajratmaydi: takrorlangan matn
 * ma'lumot emas, shovqin.
 *
 * Yechim — takroriy qismni bo'limdan chiqarib, ro'yxatda BIR MARTA,
 * sarlavha sifatida ko'rsatish.
 *
 * Nom bu qoidalarning hech biriga tushmasa (qo'lda yozilgan
 * "Salomlashish" kabi) u o'zgarishsiz qoladi — bu ATAYLAB: tushunarsiz
 * nomni "aqlli" tarzda kesishga urinish undan ham yomonroq natija berardi.
 */
export function splitTopic(topic: string): TopicParts {
  const trimmed = topic.trim()

  const separatorAt = trimmed.indexOf(SEPARATOR)
  if (separatorAt > 0) {
    const section = trimmed.slice(0, separatorAt).trim()
    const title = trimmed.slice(separatorAt + SEPARATOR.length).trim()

    /*
     * Ajratgichdan keyin hech nima qolmasa, ajratmaymiz. Aks holda
     * bo'lim SARLAVHASIZ qolar va yo'lda nomsiz doira turardi —
     * foydalanuvchi uning qaysi dars ekanini bilmasdi.
     */
    if (title) return { section, title }

    return { section: null, title: trimmed }
  }

  const lesson = LESSON_SUFFIX.exec(trimmed)
  if (lesson) return { section: lesson[1]!, title: lesson[2]! }

  const level = LEVEL_SUFFIX.exec(trimmed)
  if (level) {
    return { section: `${level[1]}${SEPARATOR}${level[2]}`, title: `${level[3]}-qism` }
  }

  return { section: null, title: trimmed }
}
