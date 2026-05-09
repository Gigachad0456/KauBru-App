"""
Rule-based / dictionary-based translation service for KauBru language.

Translation pipeline (in order of priority):
  1. Exact full-phrase match
  2. Number translation (digits and English number words)
  3. Longest-phrase greedy match (multi-word chunks)
  4. Grammar-rule transformations (tense, negation, question patterns)
  5. Word-by-word fallback
"""

import re
from typing import Tuple, List, Dict
from sqlalchemy.orm import Session
from app import models


# ─── Normalisation ────────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    """Lowercase, strip punctuation (preserve math operators), collapse whitespace."""
    text = text.lower().strip()
    # Preserve math operator symbols, strip other punctuation
    text = re.sub(r"[^\w\s'+\-*/]", " ", text)
    # Add spaces around math operators so they tokenise correctly
    text = re.sub(r"([+\-*/])", r" \1 ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# ─── KauBru Number System ─────────────────────────────────────────────────────
#
# Based on the traditional KauBru counting system from the grammar reference.
#
# Units (1–9):
#   1=ha  2=knoi  3=ktham  4=broi  5=ba  6=douh  7=sning  8=chaih  9=skuh
#
# Tens:
#   10=chi   20=khol   40=kurnoi   60=kurtham   80=kurbroi   100=rzaha
#
# Compound rules:
#   11–19  : chi + unit suffix  (11=chisa, 12=chingnoi, 13=chiktham ...)
#   21–29  : kholpheh + unit    (21=kholphehha, 22=kholphehnoi ...)
#   30     : kholphehchi
#   31–39  : kholphehchi + unit suffix
#   41–49  : kurnoi + unit      (41=kurnoikeha, 42=kurnoi-knoi ...)
#   50     : kurnoi-chi
#   51–59  : kurnoi-chi + unit suffix
#   61–69  : kurtham + unit
#   70     : kurtham-chi
#   71–79  : kurtham-chi + unit suffix
#   81–89  : kurbroi + unit
#   90     : kurtham-chi  (note: book shows 90=kurtham-chi same as 70 — use kurbroi-chi)
#   91–99  : kurbroi-chi + unit suffix

_UNITS = {
    0: '',
    1: 'ha',
    2: 'knoi',
    3: 'ktham',
    4: 'broi',
    5: 'ba',
    6: 'douh',
    7: 'sning',
    8: 'chaih',
    9: 'skuh',
}

# Suffix forms used after chi/kholphehchi/kurnoi-chi etc.
_UNIT_SUFFIX = {
    1: 'sa',    # chisa, not chiha
    2: 'ngnoi',
    3: 'ktham',
    4: 'broi',
    5: 'ra',    # chara (15), not chiba
    6: 'douh',
    7: 'sning',
    8: 'chaih',
    9: 'skuh',
}

# Exact values from the book for irregular forms
_EXACT: Dict[int, str] = {
    0:  'phang',   # zero (not in book, placeholder)
    1:  'ha',
    2:  'knoi',
    3:  'ktham',
    4:  'broi',
    5:  'ba',
    6:  'douh',
    7:  'sning',
    8:  'chaih',
    9:  'skuh',
    10: 'chi',
    11: 'chisa',
    12: 'chingnoi',
    13: 'chiktham',
    14: 'chibroi',
    15: 'chara',
    16: 'chidouh',
    17: 'chisning',
    18: 'chichaih',
    19: 'chiskuh',
    20: 'khol',
    30: 'kholphehchi',
    40: 'kurnoi',
    50: 'kurnoi-chi',
    60: 'kurtham',
    70: 'kurtham-chi',
    80: 'kurbroi',
    90: 'kurbroi-chi',
    100: 'rzaha',
}


def number_to_kaubru(n: int) -> str:
    """Convert an integer (0–100) to its KauBru word form."""
    if n in _EXACT:
        return _EXACT[n]
    if n < 0 or n > 100:
        return str(n)  # out of range, return as-is

    tens = (n // 10) * 10
    unit = n % 10

    if tens == 20:
        # 21–29: kholpheh + unit
        return f"kholpheh{_UNITS[unit]}"
    elif tens == 30:
        # 31–39: kholphehchi + unit suffix
        return f"kholphehchi{_UNIT_SUFFIX[unit]}"
    elif tens == 40:
        # 41–49: kurnoi + unit (41=kurnoikeha special, rest kurnoi-unit)
        if unit == 1:
            return "kurnoikeha"
        return f"kurnoi-{_UNITS[unit]}"
    elif tens == 50:
        # 51–59: kurnoi-chi + unit suffix
        return f"kurnoi-chi{_UNIT_SUFFIX[unit]}"
    elif tens == 60:
        # 61–69: kurtham + unit
        if unit == 1:
            return "kurtham-keha"
        return f"kurtham-{_UNITS[unit]}"
    elif tens == 70:
        # 71–79: kurtham-chi + unit suffix
        return f"kurtham-chi{_UNIT_SUFFIX[unit]}"
    elif tens == 80:
        # 81–89: kurbroi + unit
        if unit == 1:
            return "kurbroi-keha"
        return f"kurbroi-{_UNITS[unit]}"
    elif tens == 90:
        # 91–99: kurbroi-chi + unit suffix
        return f"kurbroi-chi{_UNIT_SUFFIX[unit]}"

    return str(n)


# English number words → integer
_EN_ONES = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
    'eighteen': 18, 'nineteen': 19,
}
_EN_TENS = {
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
    'hundred': 100,
}


def english_words_to_int(tokens: List[str]) -> Tuple[int, int] | None:
    """
    Try to parse English number words from the start of tokens.
    Returns (value, tokens_consumed) or None if no match.
    Handles: "forty two", "twenty one", "one hundred", etc.
    """
    if not tokens:
        return None

    t0 = tokens[0]

    # Single word: ones or tens
    if t0 in _EN_ONES:
        return _EN_ONES[t0], 1
    if t0 in _EN_TENS:
        val = _EN_TENS[t0]
        # Check for following ones word: "twenty one"
        if len(tokens) > 1 and tokens[1] in _EN_ONES and _EN_ONES[tokens[1]] < 10:
            return val + _EN_ONES[tokens[1]], 2
        return val, 1
    # "one hundred"
    if t0 == 'one' and len(tokens) > 1 and tokens[1] == 'hundred':
        return 100, 2

    return None


def translate_numbers_in_tokens(tokens: List[str], direction: str) -> List[str]:
    """
    Scan tokens and replace digit strings, English number words, and math
    operator symbols (+, -, *, /) with their KauBru equivalents (en_to_kb).
    """
    _MATH_SYMBOLS = {'+': 'dalaomo', '-': 'skaohmo', '*': 'songpangmo', '/': 'baohmo'}

    result = []
    i = 0
    while i < len(tokens):
        tok = tokens[i]

        if direction == "en_to_kb":
            # Math operator symbols
            if tok in _MATH_SYMBOLS:
                result.append(_MATH_SYMBOLS[tok])
                i += 1
                continue

            # Digit token: "42" → "kurnoi-knoi"
            if tok.isdigit():
                n = int(tok)
                if 0 <= n <= 100:
                    result.append(number_to_kaubru(n))
                else:
                    result.append(tok)
                i += 1
                continue

            # English number words
            parsed = english_words_to_int(tokens[i:])
            if parsed is not None:
                val, consumed = parsed
                result.append(number_to_kaubru(val))
                i += consumed
                continue

        result.append(tok)
        i += 1

    return result


# ─── Grammar rules ────────────────────────────────────────────────────────────

EN_TO_KB_GRAMMAR: List[Tuple[str, str]] = [
    # ── Possessive + kinship → KauBru kinship form ─────────────────────────
    # Handled by dictionary (multi-word phrases via greedy matcher)

    # ── Progressive → base verb (strip -ing) ──────────────────────────────
    # "i am going" → "i go" then dictionary maps go → thanng + tong ou
    (r"\b(i|he|she|they|we|you)\s+(?:am|is|are|was|were)\s+(\w+)ing\b",
     lambda m: f"{m.group(1)} {m.group(2)}"),

    # ── Future → base verb (will/shall → nai handled post-lookup) ─────────
    (r"\b(i|he|she|they|we|you)\s+will\s+(\w+)\b",
     lambda m: f"{m.group(1)} {m.group(2)}"),
    (r"\b(i|he|she|they|we|you)\s+shall\s+(\w+)\b",
     lambda m: f"{m.group(1)} {m.group(2)}"),

    # ── Simple past -ed → base ─────────────────────────────────────────────
    (r"\b(\w+)ed\b",
     lambda m: m.group(1)),

    # ── Negation ───────────────────────────────────────────────────────────
    (r"\bdo(?:n't| not)\b", "not"),
    (r"\bdoes(?:n't| not)\b", "not"),
    (r"\bdid(?:n't| not)\b", "not"),

    # ── Question words ─────────────────────────────────────────────────────
    (r"\bwhere\s+(?:are|is|am)\s+(\w+)\s+going\b",
     lambda m: "where you go"),

    # ── Plural stripping ───────────────────────────────────────────────────
    (r"\b(\w{3,})(?:es|s)\b",
     lambda m: m.group(1)),
]

KB_TO_EN_GRAMMAR: List[Tuple[str, str]] = [
    # ── Progressive event auxiliaries (must check before simple ones) ──────
    # "tong ha" = perfect progressive (has/have been doing)
    (r"\btong ha\b$", "has been"),
    # "tong nai" = un-occurred progressive (will be doing)
    (r"\btong nai\b$", "will be"),
    # "tong ou" = imperfect progressive (is/was doing)
    (r"\btong ou\b$", "is"),

    # ── Simple event auxiliaries ───────────────────────────────────────────
    # "ha" = completed/perfect event
    (r"\bha\b$", ""),
    # "nai" = un-occurred event (will/shall)
    (r"\bnai\b$", "will"),
    # "ou" = imperfect/ongoing event
    (r"\bou\b$", ""),
    # "ba" = question marker
    (r"\bba\b$", "?"),
    # "na" = suggestion / let's
    (r"\bna\b$", "let us"),
]


def apply_grammar(text: str, direction: str) -> str:
    rules = EN_TO_KB_GRAMMAR if direction == "en_to_kb" else KB_TO_EN_GRAMMAR
    for pattern, replacement in rules:
        if callable(replacement):
            text = re.sub(pattern, replacement, text)
        else:
            text = re.sub(pattern, replacement, text)
        text = re.sub(r"\s+", " ", text).strip()
    return text


# ─── Lookup builder ───────────────────────────────────────────────────────────

def build_lookup(db: Session) -> Tuple[Dict[str, str], Dict[str, str]]:
    words = db.query(models.Word).all()
    en_to_kb: Dict[str, str] = {}
    kb_to_en: Dict[str, str] = {}
    for w in words:
        en_to_kb[normalize(w.english)] = w.kaubru
        kb_to_en[normalize(w.kaubru)] = w.english
    return en_to_kb, kb_to_en


# ─── Longest-phrase greedy match ─────────────────────────────────────────────

def greedy_translate(tokens: List[str], lookup: Dict[str, str]) -> Tuple[List[str], List[str]]:
    result: List[str] = []
    unknown: List[str] = []
    i = 0
    max_phrase = 6

    while i < len(tokens):
        matched = False
        for length in range(min(max_phrase, len(tokens) - i), 1, -1):
            phrase = " ".join(tokens[i: i + length])
            if phrase in lookup:
                result.append(lookup[phrase])
                i += length
                matched = True
                break

        if not matched:
            word = tokens[i]
            if word in lookup:
                result.append(lookup[word])
            else:
                result.append(word)
                unknown.append(word)
            i += 1

    return result, unknown


# ─── Public API ───────────────────────────────────────────────────────────────

def translate(text: str, direction: str, db: Session) -> Tuple[str, List[str]]:
    """
    Translate text using the full pipeline:
      1. Exact phrase match (fast path)
      2. Number translation (digits and English number words → KauBru)
      3. Grammar rule pre-processing
      4. Longest-phrase greedy match
      5. Word-by-word fallback for unknowns
    """
    en_to_kb, kb_to_en = build_lookup(db)
    lookup = en_to_kb if direction == "en_to_kb" else kb_to_en

    normalized = normalize(text)

    # ── Step 1: exact full-phrase match ──────────────────────────────────────
    if normalized in lookup:
        return lookup[normalized], []

    # ── Step 2: apply grammar rules ──────────────────────────────────────────
    transformed = apply_grammar(normalized, direction)

    if transformed in lookup:
        return lookup[transformed], []

    # ── Step 3: number translation ───────────────────────────────────────────
    tokens = transformed.split()
    tokens = translate_numbers_in_tokens(tokens, direction)

    # ── Step 4 & 5: greedy longest-phrase + word-by-word fallback ────────────
    translated_tokens, unknown = greedy_translate(tokens, lookup)

    translated = " ".join(translated_tokens)

    # ── Post-processing for KB→EN ─────────────────────────────────────────────
    if direction == "kb_to_en" and translated:
        translated = translated[0].upper() + translated[1:]
        if normalized.rstrip().endswith("ba") and not translated.endswith("?"):
            translated = translated.rstrip(".") + "?"

    return translated, unknown
