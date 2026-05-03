"""
Rule-based / dictionary-based translation service for KauBru language.

Translation pipeline (in order of priority):
  1. Exact full-phrase match
  2. Longest-phrase greedy match (multi-word chunks)
  3. Grammar-rule transformations (tense, negation, question patterns)
  4. Word-by-word fallback
"""

import re
from typing import Tuple, List, Dict
from sqlalchemy.orm import Session
from app import models


# ─── Normalisation ────────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s']", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# ─── Grammar rules ────────────────────────────────────────────────────────────
#
# Each rule is a (pattern, replacement) pair applied to the *normalised* source
# string BEFORE dictionary lookup.  Rules run in order; first match wins.
#
# EN → KB rules handle common English morphology so the dictionary can store
# base forms only.
#
# KB → EN rules handle common KauBru particles / suffixes.

EN_TO_KB_GRAMMAR: List[Tuple[str, str]] = [
    # ── Tense markers ──────────────────────────────────────────────────────
    # "i am going"  → "i go"  (progressive → base)
    (r"\b(i|he|she|they|we|you)\s+(?:am|is|are|was|were)\s+(\w+)ing\b",
     lambda m: f"{m.group(1)} {m.group(2)}"),

    # "i will go"   → "i go"  (future → base)
    (r"\b(i|he|she|they|we|you)\s+will\s+(\w+)\b",
     lambda m: f"{m.group(1)} {m.group(2)}"),

    # "i went / i walked" → "i go / i walk"  (simple past -ed → base)
    (r"\b(\w+)ed\b",
     lambda m: m.group(1)),

    # ── Negation ───────────────────────────────────────────────────────────
    # "do not / don't" → "not"
    (r"\bdo(?:n't| not)\b", "not"),
    (r"\bdoes(?:n't| not)\b", "not"),
    (r"\bdid(?:n't| not)\b", "not"),

    # ── Question words ─────────────────────────────────────────────────────
    # "what is your name" is already in the dictionary; keep as-is.
    # "where are you going" → "where you go"
    (r"\bwhere\s+(?:are|is|am)\s+(\w+)\s+going\b",
     lambda m: f"where you go"),

    # ── Plural stripping ───────────────────────────────────────────────────
    # "trees" → "tree", "houses" → "house"  (naive -s/-es strip)
    (r"\b(\w{3,})(?:es|s)\b",
     lambda m: m.group(1)),
]

KB_TO_EN_GRAMMAR: List[Tuple[str, str]] = [
    # KauBru sentence-final particles (common in Tibeto-Burman languages)
    # "... ha"  (affirmative marker) → strip
    (r"\bha\b$", ""),
    # "... ou"  (progressive/present marker) → strip
    (r"\bou\b$", ""),
    # "... nu"  (future/going-to marker) → "will"
    (r"\bnu\b$", "will"),
    # "... ba"  (question marker) → "?"
    (r"\bba\b$", "?"),
    # "... na"  (let's / suggestion) → "let us"
    (r"\bna\b$", "let us"),
]


def apply_grammar(text: str, direction: str) -> str:
    """Apply grammar transformation rules to normalised text."""
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
    """
    Build two lookup dicts from the Word table.
    Sorted by descending key length so longest-phrase matching works correctly.
    """
    words = db.query(models.Word).all()
    en_to_kb: Dict[str, str] = {}
    kb_to_en: Dict[str, str] = {}
    for w in words:
        en_to_kb[normalize(w.english)] = w.kaubru
        kb_to_en[normalize(w.kaubru)] = w.english
    return en_to_kb, kb_to_en


# ─── Longest-phrase greedy match ─────────────────────────────────────────────

def greedy_translate(tokens: List[str], lookup: Dict[str, str]) -> Tuple[List[str], List[str]]:
    """
    Scan left-to-right; at each position try the longest matching phrase first,
    then progressively shorter ones, then single-word fallback.

    Returns (translated_tokens, unknown_tokens).
    """
    result: List[str] = []
    unknown: List[str] = []
    i = 0
    max_phrase = 6  # max words to try as a phrase

    while i < len(tokens):
        matched = False
        # Try longest phrase down to 2 words
        for length in range(min(max_phrase, len(tokens) - i), 1, -1):
            phrase = " ".join(tokens[i: i + length])
            if phrase in lookup:
                result.append(lookup[phrase])
                i += length
                matched = True
                break

        if not matched:
            # Single-word lookup
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
      2. Grammar rule pre-processing
      3. Longest-phrase greedy match
      4. Word-by-word fallback for unknowns

    Returns (translated_text, unknown_words_list).
    """
    en_to_kb, kb_to_en = build_lookup(db)
    lookup = en_to_kb if direction == "en_to_kb" else kb_to_en

    normalized = normalize(text)

    # ── Step 1: exact full-phrase match ──────────────────────────────────────
    if normalized in lookup:
        return lookup[normalized], []

    # ── Step 2: apply grammar rules ──────────────────────────────────────────
    transformed = apply_grammar(normalized, direction)

    # Re-check exact match after grammar transformation
    if transformed in lookup:
        return lookup[transformed], []

    # ── Step 3 & 4: greedy longest-phrase + word-by-word fallback ────────────
    tokens = transformed.split()
    translated_tokens, unknown = greedy_translate(tokens, lookup)

    translated = " ".join(translated_tokens)

    # ── Post-processing for KB→EN: capitalise first word, add "?" if needed ──
    if direction == "kb_to_en" and translated:
        translated = translated[0].upper() + translated[1:]
        # If original ended with "ba" (question particle), ensure "?"
        if normalized.rstrip().endswith("ba") and not translated.endswith("?"):
            translated = translated.rstrip(".") + "?"

    return translated, unknown
