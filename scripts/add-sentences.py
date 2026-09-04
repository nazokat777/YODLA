#!/usr/bin/env python3
"""Ingliz, rus va arab so'zlariga "gap ichida" mashqi uchun jumla biriktiradi.

Manba: Tatoeba (tatoeba.org) — odamlar yozgan jumlalar to'plami, CC-BY 2.0 FR.
Har til uchun alohida eksport yuklab olinadi (rus ~15 MB, ingliz ~25 MB,
arab ~5 MB).

NEGA TATOEBA: Enterprise darsligidagi `example` maydonlari skanerdan olingan
OCR parchalari edi ("kts cloudy amd windy") — ular mashq uchun yaroqsiz.
Tatoeba jumlalari esa qo'lda yozilgan, qisqa va tabiiy.

QOIDALAR:
  - jumla 3-8 so'zdan iborat, nuqta/undov/so'roq bilan tugaydi;
  - faqat o'sha tilning harflari, bo'sh joy va oddiy tinish belgilari;
  - so'z jumlada AYNAN shu shaklda, alohida so'z sifatida uchraydi
    (turlangan shakl bo'lsa bo'sh joy noto'g'ri joyga tushardi);
  - bir so'zga eng qisqa jumla olinadi, atoqli otli variantlar (Tom, Mary —
    Tatoeba'da juda ko'p uchraydi) oxirgi navbatda.

Arab tilida qidirish HARAKATSIZ shakl bo'yicha boradi: lug'atda so'z
harakatli, Tatoeba jumlalarida esa deyarli har doim harakatsiz yoziladi.

Natija: src/content/decks/sentences-{en,ru,ar}.ts (repoga commit qilinadi).
Ishga tushirish:  python scripts/add-sentences.py       (hammasi)
                  python scripts/add-sentences.py ar    (bittasi)
"""
import bz2
import os
import re
import sys
import urllib.request

BASE = 'https://downloads.tatoeba.org/exports/per_language'
TMP = os.environ.get('TEMP', '/tmp')

CONFIG = {
    'en': {
        'code': 'eng',
        'const': 'EN_SENTENCES',
        'decks': ['en.ts', 'imported-en-app.ts', 'imported-en.ts'],
        'letters': 'A-Za-z',
        'names': ('Tom', 'Mary', 'John'),
    },
    'ar': {
        'code': 'ara',
        'const': 'AR_SENTENCES',
        'decks': ['ar.ts', 'imported-ar.ts'],
        'letters': 'ء-ي',
        'names': ('توم', 'ماري'),
        # Arab yozuvida lug'atdagi so'z HARAKATLI ("مَرْحَبًا"), Tatoeba
        # jumlalari esa deyarli har doim HARAKATSIZ ("مرحبا"). Aynan
        # taqqoslansa bironta ham moslik topilmasdi.
        'strip': '[ً-ْٰٟـ]',
        'end': '.!?؟',
        'extra': '،؛',
    },
    'ru': {
        'code': 'rus',
        'const': 'RU_SENTENCES',
        'decks': ['ru.ts', 'ru-extra.ts', 'imported-ru.ts'],
        'letters': 'А-Яа-яЁё',
        'names': ('Том', 'Мэри'),
    },
}


def deck_words(files, strip=None):
    """Lug'at so'zlari: {qidiriladigan shakl: lug'atdagi asl shakl}.

    Arab tilida ikkisi FARQ QILADI: qidirish harakatsiz shakl bo'yicha
    boradi (jumlalarda harakat yo'q), natija fayli esa lug'atdagi harakatli
    so'z bilan kalitlanishi kerak — ilova aynan shu bilan qidiradi.
    """
    words = {}
    for name in files:
        text = open(f'src/content/decks/{name}', encoding='utf-8').read()
        for m in re.finditer(r"word: (?:'([^']*)'|\"([^\"]*)\")", text):
            original = (m.group(1) or m.group(2)).lower()
            key = strip.sub('', original) if strip else original
            if not key:
                continue
            # To'qnashuvda birinchisi qoladi: turli harakatli so'zlar bir xil
            # harakatsiz shaklga ega bo'lishi mumkin ("kitob" va "kutub")
            words.setdefault(key, original)
    return words


def download(code):
    path = os.path.join(TMP, f'tatoeba_{code}.tsv.bz2')
    if not os.path.exists(path):
        print(f'{code}: Tatoeba eksporti yuklanmoqda…')
        urllib.request.urlretrieve(f'{BASE}/{code}/{code}_sentences.tsv.bz2', path)
    return path


# Bolalar ilovasiga mos kelmaydigan mavzular.
#
# Tatoeba — kattalar uchun umumiy korpus, unda spirtli ichimlik, qurol,
# o'lim va jinsiy mavzudagi jumlalar bor. Ular tasodifiy tanlanib,
# bola "I am drunk" yoki "Buy a gun" ni mashq qilib o'tirardi.
#
# ARABCHA ATAYLAB YO'Q: arab kursi Qiroat darsligiga asoslangan va
# diniy matn uning MAZMUNI. Ro'yxatda faqat lotin va kirill tokenlari
# bor, shuning uchun arabcha jumlalar filtrga umuman tushmaydi.
#
# TOKEN bo'yicha solishtiriladi, `re` bilan emas: `` kirill harflarida
# ishlamaydi (shu fayldagi `standalone` ham aynan shu sababdan qo'lda
# yozilgan), va o'zak bo'yicha qidirish `whiskers` ni `whisky` deb,
# `вина` (ayb) ni `вино` (may) deb belgilardi.
UNSUITABLE = {
    # inglizcha
    'sex', 'sexy', 'gay', 'lesbian', 'naked', 'nude', 'virgin', 'pregnant',
    'drunk', 'beer', 'wine', 'vodka', 'whisky', 'whiskey', 'alcohol',
    'cigarette', 'cigarettes', 'smoking', 'smoked',
    'gun', 'guns', 'weapon', 'weapons', 'bomb', 'bombs',
    'kill', 'kills', 'killed', 'killer', 'murder', 'murdered', 'suicide', 'corpse',
    'drug', 'drugs', 'cocaine', 'heroin', 'marijuana',
    'idiot', 'stupid', 'damn',
    # o'lim
    'die', 'dies', 'died', 'dying', 'dead', 'death', 'deaths', 'grave', 'funeral',
    # din — Tatoeba tasodifiy diniy jumlalar beradi ("Hannah is a Reform
    # Jew", "I'm at church"). Ular dars materiali emas va o'zbek oilalari
    # uchun begona kontekst.
    'god', 'jesus', 'christ', 'church', 'muslim', 'christian', 'jew', 'jews',
    'jewish', 'priest', 'pray', 'prayer', 'bible', 'quran',
    # ruscha
    'гей', 'гея', 'гею', 'геем', 'геи', 'геев', 'лесбиянка', 'секс', 'сексом',
    'голый', 'голая', 'голым', 'нагота', 'наготу', 'девственница', 'беременна',
    'пьян', 'пьяный', 'пьяная', 'пьяного', 'пиво', 'пива', 'пивом',
    'вино', 'вина́', 'вином', 'вине', 'водка', 'водки', 'водку',
    'сигарета', 'сигареты', 'сигарету', 'курит', 'курить', 'алкоголь',
    'пистолет', 'пистолета', 'оружие', 'оружия', 'бомба', 'бомбы',
    'убил', 'убила', 'убить', 'убийца', 'убийство', 'труп', 'самоубийство',
    'наркотик', 'наркотики', 'кокаин', 'героин',
    'идиот', 'дурак', 'дура',
    'умер', 'умерла', 'умереть', 'умирает', 'смерть', 'смерти', 'мёртв',
    'мертвый', 'мёртвый', 'могила', 'похороны',
    'бог', 'бога', 'богу', 'боже', 'богом', 'иисус', 'христос', 'церковь',
    'церкви', 'мусульманин', 'христианин', 'еврей', 'еврейка', 'проповедник',
    'молитва', 'молиться', 'библия', 'коран',
}


def unsuitable(sentence):
    """Jumlada bolalar ilovasiga mos kelmaydigan so'z bormi."""
    for token in re.split(r'[^\w]+', sentence.lower(), flags=re.UNICODE):
        if token in UNSUITABLE:
            return True
    return False


def standalone(sentence, word):
    """So'z jumlada ALOHIDA so'z sifatida turibdimi.

    `re` moduli Unicode harf sinflarini bilmaydi, shuning uchun chegara
    qo'shni belgining harfligi bilan tekshiriladi — bu kirill uchun ham
    to'g'ri ishlaydi.
    """
    low = sentence.lower()
    start = 0
    while True:
        i = low.find(word, start)
        if i < 0:
            return False
        before = low[i - 1] if i > 0 else ''
        after = low[i + len(word)] if i + len(word) < len(low) else ''
        if not before.isalpha() and not after.isalpha():
            return True
        start = i + 1


def build(lang, cfg):
    words = deck_words(cfg['decks'], re.compile(cfg['strip']) if cfg.get('strip') else None)
    end = cfg.get('end', '.!?')
    extra = cfg.get('extra', '')
    strip = re.compile(cfg['strip']) if cfg.get('strip') else None
    shape = re.compile(
        rf"^[{cfg['letters']}][{cfg['letters']}{cfg.get('strip_chars', '')}{extra} ,'’-]*[{end}]$"
    )

    best = {}
    with bz2.open(download(cfg['code']), 'rt', encoding='utf-8') as fh:
        for line in fh:
            parts = line.split('\t')
            if len(parts) < 3:
                continue
            sentence = parts[2].strip()
            if not shape.match(sentence):
                continue
            if unsuitable(sentence):
                continue

            tokens = sentence[:-1].replace(',', ' ').split()
            if not 3 <= len(tokens) <= 8:
                continue

            has_name = any(n in sentence for n in cfg['names'])
            for token in tokens:
                w = token.lower().strip("'’-،؛")
                if strip:
                    w = strip.sub('', w)
                if w not in words:
                    continue
                # Afzallik: atoqli otsiz, so'ng qisqaroq
                key = (has_name, len(sentence))
                if w not in best or key < best[w][0]:
                    best[w] = (key, sentence)

    # Yakuniy tekshiruv: so'z jumlada haqiqatan alohida turibdimi.
    # Kalit LUG'ATDAGI shaklga qaytariladi — ilova shu bilan qidiradi.
    pairs = {
        words[w]: s
        for w, (_, s) in best.items()
        if standalone(strip.sub('', s) if strip else s, w)
    }
    dropped = len(best) - len(pairs)

    body = ''.join(
        f'  {esc(w)}: {esc(s)},\n' for w, s in sorted(pairs.items())
    )
    out = (
        '/**\n'
        " * AVTOMATIK YARATILGAN — qo'lda tahrirlamang.\n"
        ' * Manba: Tatoeba (tatoeba.org), CC-BY 2.0 FR. scripts/add-sentences.py\n'
        ' *\n'
        " * So'z → o'sha so'z qatnashgan qisqa jumla. \"Gap ichida\" mashqi\n"
        ' * shundan bo\'sh joyli savol yasaydi. Tarjimasi yo\'q — bu mashqqa\n'
        ' * kerak emas ("jumla qurish" esa shu sababli berilmaydi).\n'
        ' */\n'
        f"export const {cfg['const']}: Record<string, string> = {{\n"
        + body
        + '}\n'
    )
    open(f'src/content/decks/sentences-{lang}.ts', 'w', encoding='utf-8').write(out)
    print(f'{lang}: +{len(pairs)} jumla ({len(pairs) / len(words) * 100:.0f}% so\'zga) — tashlandi {dropped}')


def esc(value):
    return f'"{value}"' if "'" in value else f"'{value}'"


# Til nomi berilsa faqat o'sha qayta quriladi:
#   python scripts/add-sentences.py ar
only = sys.argv[1:]

for lang, cfg in CONFIG.items():
    if only and lang not in only:
        continue
    build(lang, cfg)
