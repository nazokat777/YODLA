#!/usr/bin/env python3
"""Ingliz va rus so'zlariga "gap ichida" mashqi uchun jumla biriktiradi.

Manba: Tatoeba (tatoeba.org) — odamlar yozgan jumlalar to'plami, CC-BY 2.0 FR.
Har til uchun alohida eksport yuklab olinadi (rus ~15 MB, ingliz ~25 MB).

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

Natija: src/content/decks/sentences-{en,ru}.ts (repoga commit qilinadi).
Ishga tushirish:  python scripts/add-sentences.py
"""
import bz2
import os
import re
import urllib.request

BASE = 'https://downloads.tatoeba.org/exports/per_language'
TMP = os.environ.get('TEMP', '/tmp')

CONFIG = {
    'en': {
        'code': 'eng',
        'const': 'EN_SENTENCES',
        'decks': ['en.ts', 'imported-en.ts'],
        'letters': 'A-Za-z',
        'names': ('Tom', 'Mary', 'John'),
    },
    'ru': {
        'code': 'rus',
        'const': 'RU_SENTENCES',
        'decks': ['ru.ts', 'ru-extra.ts', 'imported-ru.ts'],
        'letters': 'А-Яа-яЁё',
        'names': ('Том', 'Мэри'),
    },
}


def deck_words(files):
    """Lug'at fayllaridagi barcha so'zlar (kichik harfda)."""
    words = set()
    for name in files:
        text = open(f'src/content/decks/{name}', encoding='utf-8').read()
        for m in re.finditer(r"word: (?:'([^']*)'|\"([^\"]*)\")", text):
            words.add((m.group(1) or m.group(2)).lower())
    return words


def download(code):
    path = os.path.join(TMP, f'tatoeba_{code}.tsv.bz2')
    if not os.path.exists(path):
        print(f'{code}: Tatoeba eksporti yuklanmoqda…')
        urllib.request.urlretrieve(f'{BASE}/{code}/{code}_sentences.tsv.bz2', path)
    return path


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
    words = deck_words(cfg['decks'])
    shape = re.compile(rf"^[{cfg['letters']}][{cfg['letters']} ,'’-]*[.!?]$")

    best = {}
    with bz2.open(download(cfg['code']), 'rt', encoding='utf-8') as fh:
        for line in fh:
            parts = line.split('\t')
            if len(parts) < 3:
                continue
            sentence = parts[2].strip()
            if not shape.match(sentence):
                continue

            tokens = sentence[:-1].replace(',', ' ').split()
            if not 3 <= len(tokens) <= 8:
                continue

            has_name = any(n in sentence for n in cfg['names'])
            for token in tokens:
                w = token.lower().strip("'’-")
                if w not in words:
                    continue
                # Afzallik: atoqli otsiz, so'ng qisqaroq
                key = (has_name, len(sentence))
                if w not in best or key < best[w][0]:
                    best[w] = (key, sentence)

    # Yakuniy tekshiruv: so'z jumlada haqiqatan alohida turibdimi
    pairs = {w: s for w, (_, s) in best.items() if standalone(s, w)}
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


for lang, cfg in CONFIG.items():
    build(lang, cfg)
