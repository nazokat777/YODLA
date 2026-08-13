#!/usr/bin/env python3
"""Ruscha-o'zbekcha lug'atdan import (bir martalik, qo'lda yugurtiriladi).

Manba: github.com/Mahmudxon/Ru-Uz-Dictionary — ru.db (SQLite, 26k yozuv).
Har yozuv: {word (ruscha), meaning (to'liq lug'at ta'rifi)}.

Bu skript birinchi ma'noni ajratib oladi va o'zbekcha-kirillni lotinga
o'giradi, so'ng QAT'IY filtr qo'llaydi: faqat bitta toza lotin so'z qoladi
(bo'sh joy, noma'lum belgi yoki ruscha harf bo'lsa — tashlanadi). Bu axlat
ta'riflarni avtomatik chetlab o'tadi (~17% saqlanadi).

Natija: src/content/decks/imported-ru.ts (repoga commit qilinadi).
Ishga tushirish:  python scripts/import-ru-dict.py
  (ru.db bo'lmasa GitHub'dan yuklab oladi)
"""
import os, re, sqlite3, urllib.request

DB_URL = 'https://github.com/Mahmudxon/Ru-Uz-Dictionary/raw/master/app/src/main/assets/ru.db'
DB_PATH = os.path.join(os.environ.get('TEMP', '/tmp'), 'ru-uz.db')

# Chastota ro'yxati (OpenSubtitles) — so'zlar ko'p ishlatilishiga qarab tartiblangan
FREQ_URL = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ru/ru_50k.txt'
FREQ_PATH = os.path.join(os.environ.get('TEMP', '/tmp'), 'ru_freq.txt')


def load_freq_rank():
    """So'z -> chastota o'rni (kichik = ko'p ishlatiladi)."""
    if not os.path.exists(FREQ_PATH):
        print('chastota roʻyxati yuklanmoqda…')
        urllib.request.urlretrieve(FREQ_URL, FREQ_PATH)
    rank = {}
    for i, line in enumerate(open(FREQ_PATH, encoding='utf-8')):
        w = line.split(' ', 1)[0].strip().lower()
        if w and w not in rank:
            rank[w] = i
    return rank

# O'zbek kirill -> lotin (DB da ќ ѓ ћ = uzbek q g' h)
M = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z','и':'i','й':'y',
'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
'х':'x','ц':'ts','ч':'ch','ш':'sh','щ':'sh','ъ':"'",'ь':'','э':'e','ю':'yu','я':'ya',
'ў':"o'",'ќ':'q','ѓ':"g'",'ћ':'h','қ':'q','ғ':"g'",'ҳ':'h'}
CLEAN = re.compile(r"^[a-z][a-z'-]{1,15}$")
STRIP = (r'(только|ед|мн|астр|биол|спец|тех|перен|разг|прост|книжн|уст|обл|хим|физ|мат|'
         r'воен|мор|юр|грам|муз|анат|бот|зоол|геол|полит|эк|кого|что|чего|чему|чем|кому|'
         r'кем|в знач|собир|сущ)')


def translit(s):
    out = ''
    for ch in s:
        l = ch.lower()
        if l in M:
            out += M[l]
        elif ch in " '-":
            out += ch
        else:
            return None  # noma'lum belgi -> rad
    return out


def extract(word, meaning):
    seg = meaning.split(';')[0]
    mt = re.search(r'\b1\b\s*(.+)', seg)
    body = mt.group(1) if mt else seg
    body = re.sub(STRIP + r'\.?', '', body)
    body = body.strip(" -–—.,()")
    first = body.split(',')[0].strip()
    if ' ' in first:
        return None  # ko'p so'zli/axlat
    lat = translit(first)
    if not lat or not CLEAN.match(lat):
        return None
    if translit(word) == lat:
        return None  # ruscha bosh so'z sizib chiqqan
    if is_russian_leak(word, lat):
        return None
    return lat


# Ruscha qaytim fe'llari lotinchada shu bilan tugaydi; o'zbekchada bunday
# qo'shimcha yo'q
REFLEXIVE = re.compile(r'(ts|s)ya$')

VOWELS = 'аеёиоуыэюя'


def is_infinitive(word):
    """Ruscha FE'L noaniq shaklimi.

    Fe'l `-ть` dan oldin UNLI oladi (приходи-ть, переда-ть), ot esa undosh
    (смер-ть, гос-ть, час-ть). Shu farq muhim: otlarning tarjimasi to'g'ri
    ("гость → mehmon"), ularni tekshiruvga tortish shart emas.
    """
    if word.endswith('ться'):
        return len(word) > 4 and word[-5] in VOWELS
    if word.endswith('ть'):
        return len(word) > 2 and word[-3] in VOWELS
    return False


def edit_distance(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def is_russian_leak(word, lat):
    """Tarjima o'rniga RUSCHA so'zning lotinchasi tushib qolganmi.

    Manbadagi ta'rif ba'zan o'zbekcha emas, ruscha sinonim bo'ladi. U ham
    kirillda yozilgani uchun transliteratsiyadan bemalol o'tadi va natijada
    "приходить → priezjat" kabi yozuv chiqadi — bu tarjima emas.

    Ikki belgi ishlatiladi:
      - lotincha "-sya/-tsya" bilan tugashi (ruscha qaytim fe'li);
      - BOSH SO'Z FE'L bo'lsa va tarjima uning transliteratsiyasiga juda
        o'xshasa.

    Fe'l sharti muhim: o'zbek tilida ruschadan o'zlashgan OTLAR ko'p
    ("restoran", "telefon", "muzey") va ular to'g'ri tarjima — ularni
    o'chirib yubormaslik kerak. Ruscha fe'l NOANIQ SHAKLI esa hech qachon
    o'zlashmaydi.
    """
    if REFLEXIVE.search(lat):
        return True

    # To'g'ri o'zbek fe'li — ildizi ruschadan olingan bo'lsa ham ("filtrlamoq",
    # "garantiyalamoq") bu haqiqiy tarjima
    if lat.endswith('moq'):
        return False

    if not is_infinitive(word):
        return False

    # Ruscha fe'lning lotinchasiga JUDA yaqin bo'lsa — bu tarjima emas.
    # Chegara nisbiy: "perat" ↔ "peredat" (0.40) va "priezjat" ↔ "prixodit"
    # (0.50) ilinadi, to'g'ri tarjimalar esa uzoqda qoladi
    # ("yod" ↔ "pamyat" 2.0, "tirsak" ↔ "lokot" 1.2).
    head = translit(word) or ''
    return edit_distance(head, lat) / max(1, min(len(head), len(lat))) <= 0.6


def taken():
    """Mavjud ruscha deck'lardan band qiymatlar."""
    words, trans, norms = set(), set(), set()
    for f in ('ru.ts', 'ru-extra.ts'):
        src = open(f'src/content/decks/{f}', encoding='utf-8').read()
        for kind, a, b in re.findall(r"(word|translation): (?:'([^']*)'|\"([^\"]*)\")", src):
            v = a or b
            if kind == 'translation':
                trans.add(v.lower())
            else:
                words.add(v)
                norms.add(v.lower().replace('ё', 'е'))
    return words, trans, norms


def main():
    if not os.path.exists(DB_PATH):
        print('ru.db yuklanmoqda…')
        urllib.request.urlretrieve(DB_URL, DB_PATH)

    tw, tt, tn = taken()
    rank = load_freq_rank()
    c = sqlite3.connect(DB_PATH)
    seenW, seenT, seenN = set(), set(), set()
    dropped = 0
    clean = []  # (rank, word, uz)

    for word, meaning in c.execute('select word, meaning from WORDS'):
        if not re.match(r'^[а-яё]{3,14}$', word or ''):
            dropped += 1
            continue
        uz = extract(word, meaning or '')
        if not uz:
            dropped += 1
            continue
        norm = word.lower().replace('ё', 'е')
        if word in tw or word in seenW:
            dropped += 1; continue
        if norm in tn or norm in seenN:
            dropped += 1; continue
        if uz.lower() in tt or uz.lower() in seenT:
            dropped += 1; continue
        seenW.add(word); seenN.add(norm); seenT.add(uz.lower())
        clean.append((rank.get(word.lower(), 10**9), word, uz))

    # Daraja CHASTOTA bo'yicha: ko'p ishlatiladigan so'z pastroq darajada.
    # Chastota tartibida taqsimlaymiz: 30% A1, 35% A2, 35% B1
    clean.sort(key=lambda x: x[0])
    n = len(clean)
    a1_end, a2_end = int(n * 0.30), int(n * 0.65)
    buckets = {'A1': [], 'A2': [], 'B1': []}
    for i, (_, word, uz) in enumerate(clean):
        level = 'A1' if i < a1_end else 'A2' if i < a2_end else 'B1'
        buckets[level].append((word, uz))

    def esc(s):
        return f'"{s}"' if "'" in s else f"'{s}'"

    body = ''
    for level in ('A1', 'A2', 'B1'):
        body += f'  {level}: [\n'
        for i, (word, uz) in enumerate(buckets[level]):
            topic = f'Ruscha lug\'at {level}-{i // 20 + 1}'
            body += ('    {\n'
                     f'      word: {esc(word)},\n'
                     f'      translation: {esc(uz)},\n'
                     "      language: 'ru',\n"
                     f'      topic: {esc(topic)},\n'
                     f"      level: '{level}',\n"
                     '    },\n')
        body += '  ],\n'

    out = ("import type { NewCardRecordInput } from '@/core/db'\n"
           "import type { LevelCode } from '@/core/types'\n\n"
           '/**\n'
           " * AVTOMATIK YARATILGAN — qo'lda tahrirlamang.\n"
           ' * Manba: Mahmudxon/Ru-Uz-Dictionary (ru.db). scripts/import-ru-dict.py.\n'
           ' * Daraja CHASTOTA bo\'yicha (OpenSubtitles ru_50k chastota ro\'yxati).\n'
           ' */\n'
           'export const RU_DICT: Record<LevelCode, NewCardRecordInput[]> = {\n'
           + body + '}\n')
    open('src/content/decks/imported-ru.ts', 'w', encoding='utf-8').write(out)
    total = sum(len(v) for v in buckets.values())
    print(f"rus (lug'at): +{total} (A1 {len(buckets['A1'])}, "
          f"A2 {len(buckets['A2'])}, B1 {len(buckets['B1'])}) — tashlandi {dropped}")


if __name__ == '__main__':
    main()
