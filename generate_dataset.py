"""
generate_dataset.py  (FULL VERSION)
Run from workspace root:  python generate_dataset.py
Fills in: pronunciation, word_breakdown, related_words, cultural_notes,
          grammar_points, lesson_id, usage_notes, cultural_context
"""
import json, ast, os

# ── Load WORDS from seed.py ──────────────────────────────────────────────────
SEED_PATH = os.path.join("kaubru-backend", "seed.py")
with open(SEED_PATH, encoding="utf-8") as f:
    source = f.read()
tree = ast.parse(source)
RAW_WORDS = None
for node in ast.walk(tree):
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id == "WORDS":
                RAW_WORDS = ast.literal_eval(node.value)
print(f"Loaded {len(RAW_WORDS)} entries from seed.py")

# ── Pronunciation map (romanised phonetics for every kaubru word/phrase) ─────
PRON = {
    "Hoh": "hoh",
    "bye": "bye",
    "khachang ha": "kha-chang ha",
    "em": "em",
    "ehi": "eh-hi",
    "kaham de tong?": "ka-ham de tong",
    "nini mmung kma?": "ni-ni mmung kma",
    "aini mmung khe ": "ai-ni mmung khe",
    "among/mma": "a-mong / mma",
    "apa/mpha": "a-pa / m-pha",
    "mta/ata": "m-ta / a-ta",
    "mbi/aibi": "m-bi / ai-bi",
    "chrai msa": "chrai m-sa",
    "nouhkhung": "nouh-khung",
    "tui": "tui",
    "mairung": "mai-rung",
    "nouh": "nouh",
    "hor": "hor",
    "sal": "sal",
    "tal": "tal",
    "tui-sa": "tui-sa",
    "mphang": "m-phang",
    "ha": "ha",
    "knoi": "k-noi",
    "ktham": "k-tham",
    "broi": "b-roi",
    "ba": "ba",
    "douh": "douh",
    "sning": "s-ning",
    "chaih": "chaih",
    "skuh": "s-kuh",
    "chi": "chi",
    "khol": "khol",
    "kurnoi": "kur-noi",
    "kurtham": "kur-tham",
    "kurbroi": "kur-broi",
    "rzaha": "r-za-ha",
    "dalaomo": "da-lao-mo",
    "skaohmo": "s-kaoh-mo",
    "songpangmo": "song-pang-mo",
    "baohmo": "baoh-mo",
    "salka": "sal-ka",
    "salthang": "sal-thang",
    "hakang": "ha-kang",
    "aola": "ao-la",
    "hatinggol": "ha-ting-gol",
    "kaukti sal": "kauk-ti sal",
    "tangra sal": "tang-ra sal",
    "kraoh sal": "kraoh sal",
    "bdu sal": "b-du sal",
    "songrong sal": "song-rong sal",
    "souhkra sal": "souh-kra sal",
    "chani sal": "cha-ni sal",
    "bar ni": "bar ni",
    "khasoing tal": "kha-soing tal",
    "phraing tal": "phraing tal",
    "choileing tal": "choi-leing tal",
    "sajlang tal": "saj-lang tal",
    "asari tal": "a-sa-ri tal",
    "srao tal": "srao tal",
    "drumboi tal": "drum-boi tal",
    "keingrai tal": "keing-rai tal",
    "osa tal": "o-sa tal",
    "kehchi tal": "keh-chi tal",
    "maogru tal": "mao-gru tal",
    "maosru tal": "mao-sru tal",
    "kaham": "ka-ham",
    "ktor": "k-tor",
    "ste": "ste",
    "nythau": "ny-thau",
    "ang": "ang",
    "chung": "chung",
    "nung": "nung",
    "nrao": "n-rao",
    "bung": "bung",
    "brao": "b-rao",
    "aini": "ai-ni",
    "nini": "ni-ni",
    "bini": "bi-ni",
    "mia": "mi-a",
    "tini": "ti-ni",
    "taoh": "taoh",
    "salboi": "sal-boi",
    "jug": "jug",
    "khnai": "kh-nai",
    "apa": "a-pa",
    "amou": "a-mou",
    "ata": "a-ta",
    "aibi": "ai-bi",
    "angphaiyong": "ang-phai-yong",
    "anghanao": "ang-ha-nao",
    "achwu": "ach-wu",
    "achui": "a-chui",
    "mama": "ma-ma",
    "atoi": "a-toi",
    "npha": "n-pha",
    "nma": "n-ma",
    "nta": "n-ta",
    "nbi": "n-bi",
    "mpha": "m-pha",
    "mma": "m-ma",
    "mta": "m-ta",
    "mbi": "m-bi",
    "thanng": "thanng",
    "phai": "phai",
    "cha": "cha",
    "bahcha": "bah-cha",
    "chom": "chom",
    "kai": "kai",
    "khui": "khui",
    "sau": "sau",
    "tang": "tang",
    "sa": "sa",
    "hinng": "hinng",
    "pore": "po-re",
    "tau": "tau",
    "nai": "nai",
    "ang nouh thang ganu": "ang nouh thang ga-nu",
    "ang nung no maiya ong ou": "ang nung no mai-ya ong ou",
    "mtoi ou thang ny nung ba?": "m-toi ou thang ny nung ba",
    "phai di ro": "phai di ro",
    "mai cha di": "mai cha di",
    "borsa": "bor-sa",
}

# ── Related words map (by english key) ───────────────────────────────────────
RELATED = {
    "hello":        ["goodbye", "how are you", "thank you"],
    "goodbye":      ["hello", "tomorrow", "see you"],
    "thank you":    ["yes", "hello"],
    "yes":          ["no"],
    "no":           ["yes"],
    "how are you":  ["hello", "good", "today"],
    "what is your name": ["my name is", "your"],
    "my name is":   ["what is your name", "my"],
    "mother":       ["father", "family", "my mother"],
    "father":       ["mother", "family", "my father"],
    "brother":      ["sister", "family", "my elder brother"],
    "sister":       ["brother", "family", "my elder sister"],
    "child":        ["family", "small"],
    "family":       ["mother", "father", "brother", "sister"],
    "water":        ["river", "fire"],
    "rice":         ["eat", "food"],
    "house":        ["family", "go", "i am going home"],
    "fire":         ["water", "burn", "sun"],
    "sun":          ["moon", "day", "east"],
    "moon":         ["sun", "night", "beautiful"],
    "river":        ["water", "north", "tree"],
    "tree":         ["river", "nature", "big"],
    "one":          ["two", "three", "numbers"],
    "two":          ["one", "three"],
    "three":        ["two", "four"],
    "four":         ["three", "five"],
    "five":         ["four", "six"],
    "six":          ["five", "seven"],
    "seven":        ["six", "eight", "week"],
    "eight":        ["seven", "nine"],
    "nine":         ["eight", "ten"],
    "ten":          ["nine", "twenty"],
    "twenty":       ["ten", "forty"],
    "forty":        ["twenty", "sixty"],
    "sixty":        ["forty", "eighty"],
    "eighty":       ["sixty", "hundred"],
    "hundred":      ["eighty"],
    "addition":     ["plus", "add", "subtraction"],
    "plus":         ["addition", "add"],
    "add":          ["plus", "addition"],
    "subtraction":  ["minus", "subtract", "addition"],
    "minus":        ["subtraction", "subtract"],
    "subtract":     ["minus", "subtraction"],
    "multiplication": ["multiply", "times", "addition"],
    "multiply":     ["multiplication", "times"],
    "times":        ["multiply", "multiplication"],
    "division":     ["divide", "multiplication"],
    "divide":       ["division"],
    "east":         ["west", "north", "south", "sun"],
    "west":         ["east", "north", "south", "sun"],
    "north":        ["south", "east", "west"],
    "south":        ["north", "east", "west"],
    "direction":    ["east", "west", "north", "south"],
    "sunday":       ["monday", "week", "day"],
    "monday":       ["sunday", "tuesday", "week"],
    "tuesday":      ["monday", "wednesday"],
    "wednesday":    ["tuesday", "thursday"],
    "thursday":     ["wednesday", "friday"],
    "friday":       ["thursday", "saturday"],
    "saturday":     ["friday", "sunday"],
    "week":         ["day", "sunday", "monday"],
    "day":          ["week", "today", "sun"],
    "january":      ["february", "month", "year"],
    "february":     ["january", "march"],
    "march":        ["february", "april"],
    "april":        ["march", "may"],
    "may":          ["april", "june"],
    "june":         ["may", "july"],
    "july":         ["june", "august"],
    "august":       ["july", "september"],
    "september":    ["august", "october"],
    "october":      ["september", "november"],
    "november":     ["october", "december"],
    "december":     ["november", "month", "year"],
    "month":        ["year", "january", "december"],
    "year":         ["month", "borsa"],
    "good":         ["beautiful", "big", "small"],
    "big":          ["small", "good"],
    "small":        ["big", "child"],
    "beautiful":    ["good", "moon"],
    "i":            ["we", "my", "you"],
    "we":           ["i", "they", "you all"],
    "you":          ["i", "your", "you all"],
    "you all":      ["you", "they"],
    "he":           ["she", "they", "his"],
    "she":          ["he", "they", "her"],
    "they":         ["he", "she", "we"],
    "my":           ["your", "his", "her", "i"],
    "your":         ["my", "his", "you"],
    "his":          ["her", "my", "he"],
    "her":          ["his", "my", "she"],
    "yesterday":    ["today", "tomorrow"],
    "today":        ["yesterday", "tomorrow", "now"],
    "now":          ["today", "always"],
    "daily":        ["always", "today"],
    "always":       ["daily", "now"],
    "tomorrow":     ["yesterday", "today", "goodbye"],
    "go":           ["come", "walk", "i am going home"],
    "come":         ["go", "come here"],
    "eat":          ["rice", "eat food"],
    "stand":        ["walk", "go"],
    "hide":         ["see", "look for"],
    "plant":        ["sow", "rice"],
    "sow":          ["plant"],
    "throw":        ["burn"],
    "burn":         ["fire", "throw"],
    "do":           ["work", "say"],
    "work":         ["do", "say"],
    "say":          ["do", "read"],
    "walk":         ["go", "stand"],
    "read":         ["say", "see"],
    "look for":     ["see", "hide"],
    "see":          ["look for", "read"],
    "i am going home": ["go", "house", "come here"],
    "i love you":   ["you", "my", "come here"],
    "where are you going": ["go", "direction", "you"],
    "come here":    ["come", "i am going home"],
    "eat food":     ["eat", "rice"],
}

# ── Cultural notes map ────────────────────────────────────────────────────────
CULTURAL = {
    "hello":        "The KauBru greeting 'Hoh' is used at any time of day, unlike many languages that have separate morning/evening greetings.",
    "goodbye":      "KauBru speakers often say 'khnai malai phi na' (see you tomorrow) as a warm farewell even when parting for longer periods.",
    "thank you":    "'Khachang ha' literally means 'I am grateful'. Gratitude is expressed verbally and through reciprocal acts of service in KauBru culture.",
    "family":       "The KauBru clan system (nouhkhung) is central to social identity. Family ties determine roles in ceremonies, land use, and community decisions.",
    "mother":       "Mothers hold a revered position in KauBru society. The term 'among' is used respectfully in formal contexts, 'mma' in everyday speech.",
    "father":       "'Apa' is the intimate address for one's own father; 'mpha' is used when referring to someone else's father.",
    "rice":         "Rice (mairung) is the staple food and holds deep cultural significance. The rice harvest festival is one of the most important KauBru celebrations.",
    "house":        "Traditional KauBru houses (nouh) are built on stilts using bamboo and wood, reflecting the community's forest-dwelling heritage.",
    "fire":         "Fire (hor) plays a central role in KauBru rituals, cooking, and warmth. The hearth is considered sacred in traditional homes.",
    "sun":          "The sun (sal) is also the word for 'day' in KauBru, reflecting the community's deep connection to natural cycles.",
    "moon":         "The moon (tal) is also the word for 'month', showing how the KauBru lunar calendar shaped their language.",
    "river":        "Rivers (tui-sa) are sacred in KauBru culture. Many settlements are named after nearby rivers, and water spirits are part of traditional belief.",
    "water":        "Water (tui) is considered a life-giving force. The word 'tui-sa' (river) literally means 'flowing water'.",
    "east":         "The KauBru directional system is based on the sun's path. 'Salka' (east) means 'where the sun comes from'.",
    "west":         "'Salthang' (west) means 'where the sun goes', reflecting the sun-based orientation of KauBru geography.",
    "sunday":       "The KauBru week names blend traditional and modern influences. 'Kaukti sal' (Sunday) is the day of rest.",
    "hojagiri":     "The Hojagiri dance, performed during the Kojagiri full-moon festival, is UNESCO-recognised as an Intangible Cultural Heritage.",
    "i love you":   "Expressing love directly is a modern influence; traditionally affection was shown through acts of care and provision.",
    "eat food":     "Sharing food (mai cha) is a central act of hospitality in KauBru culture. Refusing food is considered impolite.",
    "come here":    "Direct commands in KauBru are softened by context and tone. 'Phai di ro' is a warm invitation rather than an order.",
}

# ── Grammar points map (which rules apply to each sentence) ──────────────────
GRAMMAR_POINTS = {
    "greetings":    ["grammar_rule_0001"],
    "family":       ["grammar_rule_0001", "grammar_rule_0003"],
    "nature":       ["grammar_rule_0001", "grammar_rule_0002"],
    "food":         ["grammar_rule_0001", "grammar_rule_0002"],
    "places":       ["grammar_rule_0001", "grammar_rule_0002"],
    "numbers":      ["grammar_rule_0001"],
    "math":         ["grammar_rule_0001"],
    "directions":   ["grammar_rule_0001", "grammar_rule_0002"],
    "days":         ["grammar_rule_0001"],
    "months":       ["grammar_rule_0001"],
    "adjectives":   ["grammar_rule_0001"],
    "pronouns":     ["grammar_rule_0001", "grammar_rule_0003"],
    "time":         ["grammar_rule_0001", "grammar_rule_0002"],
    "verbs":        ["grammar_rule_0001", "grammar_rule_0002"],
    "phrases":      ["grammar_rule_0001", "grammar_rule_0002"],
}

# ── Lesson ID map ─────────────────────────────────────────────────────────────
LESSON_MAP = {
    "greetings":    "lesson_greetings",
    "family":       "lesson_family",
    "numbers":      "lesson_numbers",
    "phrases":      "lesson_daily_conversations",
    "verbs":        "lesson_daily_conversations",
    "pronouns":     "lesson_daily_conversations",
    "time":         "lesson_daily_conversations",
    "adjectives":   "lesson_daily_conversations",
    "nature":       "lesson_daily_conversations",
    "food":         "lesson_daily_conversations",
    "places":       "lesson_daily_conversations",
    "math":         "lesson_daily_conversations",
    "directions":   "lesson_daily_conversations",
    "days":         "lesson_daily_conversations",
    "months":       "lesson_daily_conversations",
}

# ── Word breakdown map for sentences ─────────────────────────────────────────
BREAKDOWNS = {
    "Hoh, kaham de tong?": [
        {"kaubru": "Hoh", "english": "hello", "role": "greeting"},
        {"kaubru": "kaham", "english": "good/how", "role": "adjective"},
        {"kaubru": "de", "english": "are", "role": "copula"},
        {"kaubru": "tong", "english": "being", "role": "auxiliary"},
    ],
    "Bye, khnai malai phi na": [
        {"kaubru": "Bye", "english": "goodbye", "role": "farewell"},
        {"kaubru": "khnai", "english": "tomorrow", "role": "time"},
        {"kaubru": "malai", "english": "again", "role": "adverb"},
        {"kaubru": "phi na", "english": "see/meet", "role": "verb"},
    ],
    "betha khe khachangha.": [
        {"kaubru": "betha", "english": "very much", "role": "adverb"},
        {"kaubru": "khe", "english": "indeed", "role": "particle"},
        {"kaubru": "khachangha", "english": "thank you", "role": "expression"},
    ],
    "em, ang mchi ou/ha.": [
        {"kaubru": "em", "english": "yes", "role": "affirmation"},
        {"kaubru": "ang", "english": "I", "role": "subject"},
        {"kaubru": "mchi", "english": "understand", "role": "verb"},
        {"kaubru": "ou/ha", "english": "ongoing/completed", "role": "tense marker"},
    ],
    "ehi, cya ang pho": [
        {"kaubru": "ehi", "english": "no", "role": "negation"},
        {"kaubru": "cya", "english": "know", "role": "verb"},
        {"kaubru": "ang", "english": "I", "role": "subject"},
        {"kaubru": "pho", "english": "not", "role": "negation marker"},
    ],
    "kaham de tong tini le?": [
        {"kaubru": "kaham", "english": "good/how", "role": "adjective"},
        {"kaubru": "de", "english": "are", "role": "copula"},
        {"kaubru": "tong", "english": "being", "role": "auxiliary"},
        {"kaubru": "tini", "english": "today", "role": "time"},
        {"kaubru": "le", "english": "question marker", "role": "particle"},
    ],
    "Aini mma le brouh kaham ma sei.": [
        {"kaubru": "Aini", "english": "my", "role": "possessive"},
        {"kaubru": "mma", "english": "mother", "role": "subject"},
        {"kaubru": "le", "english": "topic marker", "role": "particle"},
        {"kaubru": "brouh", "english": "person", "role": "noun"},
        {"kaubru": "kaham", "english": "good/kind", "role": "adjective"},
        {"kaubru": "ma sei", "english": "is (she)", "role": "copula"},
    ],
    "Aini mpha le samung tang grao sei.": [
        {"kaubru": "Aini", "english": "my", "role": "possessive"},
        {"kaubru": "mpha", "english": "father", "role": "subject"},
        {"kaubru": "le", "english": "topic marker", "role": "particle"},
        {"kaubru": "samung", "english": "work", "role": "noun"},
        {"kaubru": "tang", "english": "do", "role": "verb"},
        {"kaubru": "grao", "english": "hard", "role": "adverb"},
        {"kaubru": "sei", "english": "is (he)", "role": "copula"},
    ],
    "ang tui nang tong ha.": [
        {"kaubru": "ang", "english": "I", "role": "subject"},
        {"kaubru": "tui", "english": "water", "role": "object"},
        {"kaubru": "nang", "english": "need/want", "role": "verb"},
        {"kaubru": "tong ha", "english": "present completed", "role": "tense marker"},
    ],
    "Ang nouh thang gra nu.": [
        {"kaubru": "Ang", "english": "I", "role": "subject"},
        {"kaubru": "nouh", "english": "home", "role": "destination"},
        {"kaubru": "thang", "english": "go", "role": "verb"},
        {"kaubru": "gra nu", "english": "going (present)", "role": "tense marker"},
    ],
    "ang mai cha ha": [
        {"kaubru": "ang", "english": "I", "role": "subject"},
        {"kaubru": "mai", "english": "food", "role": "object"},
        {"kaubru": "cha", "english": "eat", "role": "verb"},
        {"kaubru": "ha", "english": "completed", "role": "tense marker"},
    ],
    "chung mai cha ha.": [
        {"kaubru": "chung", "english": "we", "role": "subject"},
        {"kaubru": "mai", "english": "food", "role": "object"},
        {"kaubru": "cha", "english": "eat", "role": "verb"},
        {"kaubru": "ha", "english": "completed", "role": "tense marker"},
    ],
    "bung phai ou.": [
        {"kaubru": "bung", "english": "he/she", "role": "subject"},
        {"kaubru": "phai", "english": "come", "role": "verb"},
        {"kaubru": "ou", "english": "ongoing", "role": "tense marker"},
    ],
    "brao mai cha ha.": [
        {"kaubru": "brao", "english": "they", "role": "subject"},
        {"kaubru": "mai", "english": "food", "role": "object"},
        {"kaubru": "cha", "english": "eat", "role": "verb"},
        {"kaubru": "ha", "english": "completed", "role": "tense marker"},
    ],
    "aini nouh ktor ha.": [
        {"kaubru": "aini", "english": "my", "role": "possessive"},
        {"kaubru": "nouh", "english": "house", "role": "subject"},
        {"kaubru": "ktor", "english": "big", "role": "adjective"},
        {"kaubru": "ha", "english": "is (statement)", "role": "copula"},
    ],
    "khnai ang nouh wo thanng nai.": [
        {"kaubru": "khnai", "english": "tomorrow", "role": "time"},
        {"kaubru": "ang", "english": "I", "role": "subject"},
        {"kaubru": "nouh", "english": "home", "role": "destination"},
        {"kaubru": "wo", "english": "to (direction)", "role": "particle"},
        {"kaubru": "thanng", "english": "go", "role": "verb"},
        {"kaubru": "nai", "english": "will (future)", "role": "tense marker"},
    ],
    "ang lama se hinng tong ha.": [
        {"kaubru": "ang", "english": "I", "role": "subject"},
        {"kaubru": "lama", "english": "road/path", "role": "location"},
        {"kaubru": "se", "english": "on/along", "role": "particle"},
        {"kaubru": "hinng", "english": "walk", "role": "verb"},
        {"kaubru": "tong ha", "english": "present continuous", "role": "tense marker"},
    ],
    "ang nung no nai ou.": [
        {"kaubru": "ang", "english": "I", "role": "subject"},
        {"kaubru": "nung", "english": "you", "role": "object"},
        {"kaubru": "no", "english": "object marker", "role": "particle"},
        {"kaubru": "nai", "english": "see", "role": "verb"},
        {"kaubru": "ou", "english": "ongoing", "role": "tense marker"},
    ],
    "taoh ou nouh thang gra nu .": [
        {"kaubru": "taoh", "english": "now", "role": "time"},
        {"kaubru": "ou", "english": "I (emphatic)", "role": "subject"},
        {"kaubru": "nouh", "english": "home", "role": "destination"},
        {"kaubru": "thang", "english": "go", "role": "verb"},
        {"kaubru": "gra nu", "english": "going (present)", "role": "tense marker"},
    ],
    "ang nung no maiya ong ou": [
        {"kaubru": "ang", "english": "I", "role": "subject"},
        {"kaubru": "nung", "english": "you", "role": "object"},
        {"kaubru": "no", "english": "object marker", "role": "particle"},
        {"kaubru": "maiya", "english": "love", "role": "noun"},
        {"kaubru": "ong ou", "english": "feel/have (ongoing)", "role": "verb"},
    ],
    "Mtoi ou thang ny nung ba?": [
        {"kaubru": "Mtoi", "english": "where", "role": "question word"},
        {"kaubru": "ou", "english": "going", "role": "auxiliary"},
        {"kaubru": "thang", "english": "go", "role": "verb"},
        {"kaubru": "ny", "english": "are", "role": "copula"},
        {"kaubru": "nung", "english": "you", "role": "subject"},
        {"kaubru": "ba", "english": "question marker", "role": "particle"},
    ],
    "phut khe phai di ro ou.": [
        {"kaubru": "phut", "english": "quickly", "role": "adverb"},
        {"kaubru": "khe", "english": "please/indeed", "role": "particle"},
        {"kaubru": "phai", "english": "come", "role": "verb"},
        {"kaubru": "di", "english": "here", "role": "location"},
        {"kaubru": "ro", "english": "imperative marker", "role": "particle"},
        {"kaubru": "ou", "english": "ongoing", "role": "tense marker"},
    ],
    "Mai cha lai na.": [
        {"kaubru": "Mai", "english": "food", "role": "object"},
        {"kaubru": "cha", "english": "eat", "role": "verb"},
        {"kaubru": "lai na", "english": "let us (inclusive)", "role": "particle"},
    ],
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def guess_pos(category):
    return {"verbs":"verb","pronouns":"pronoun","adjectives":"adjective",
            "numbers":"numeral","time":"adverb","math":"noun",
            "greetings":"phrase","family":"noun","nature":"noun",
            "food":"noun","places":"noun","directions":"noun",
            "days":"noun","months":"noun"}.get(category, "noun")

def get_pron(kaubru):
    return PRON.get(kaubru.strip(), kaubru.lower().replace(" ", "-"))

def get_related(english):
    return RELATED.get(english.lower(), [])

def get_cultural(english, category):
    return CULTURAL.get(english.lower(), CULTURAL.get(category, ""))

def get_breakdown(sentence_kaubru):
    return BREAKDOWNS.get(sentence_kaubru.strip(), [])

# ── Build word/phrase lists ───────────────────────────────────────────────────
PHRASE_CATS = {"phrases"}
words_out, phrases_out = [], []

for i, w in enumerate(RAW_WORDS):
    cat = w.get("category", "general")
    entry_id = f"{cat}_{i+1:04d}"
    base = {
        "id": entry_id,
        "kaubru": w["kaubru"],
        "english": w["english"],
        "pronunciation": get_pron(w["kaubru"]),
        "audio_url": f"/audio/{cat}/{entry_id}.mp3",
        "category": cat,
        "difficulty_level": 1,
        "tags": [cat],
        "usage_examples": [{"kaubru": w.get("example_kaubru",""), "english": w.get("example_english","")}],
        "related_words": get_related(w["english"]),
        "image_url": f"/images/words/{entry_id}.jpg",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    }
    if cat in PHRASE_CATS:
        phrases_out.append({
            **base,
            "context": "informal",
            "usage_notes": get_cultural(w["english"], cat),
            "related_phrases": get_related(w["english"]),
            "word_breakdown": get_breakdown(w.get("example_kaubru","")),
            "cultural_context": get_cultural(w["english"], cat),
        })
    else:
        words_out.append({**base, "part_of_speech": guess_pos(cat)})

# ── Build sentences ───────────────────────────────────────────────────────────
sentences_out, seen = [], set()
for w in RAW_WORDS:
    ex_k = w.get("example_kaubru","").strip()
    ex_e = w.get("example_english","").strip()
    if ex_k and ex_k not in seen:
        seen.add(ex_k)
        cat = w.get("category","general")
        sid = f"sentence_{len(sentences_out)+1:04d}"
        sentences_out.append({
            "id": sid,
            "kaubru": ex_k,
            "english": ex_e,
            "pronunciation": get_pron(ex_k),
            "audio_url": f"/audio/sentences/{sid}.mp3",
            "difficulty_level": 1,
            "category": cat,
            "tags": [cat],
            "grammar_points": GRAMMAR_POINTS.get(cat, ["grammar_rule_0001"]),
            "word_breakdown": get_breakdown(ex_k),
            "phrase_components": [],
            "context": "example sentence",
            "cultural_notes": get_cultural(w["english"], cat),
            "lesson_id": LESSON_MAP.get(cat, "lesson_daily_conversations"),
            "related_sentences": [],
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z",
        })

# ── Grammar rules (fully populated) ──────────────────────────────────────────
grammar_rules_out = [
  {
    "id": "grammar_rule_0001",
    "title": "Basic Sentence Structure (SOV)",
    "title_kaubru": "Brouh Kaubru Songpang (SOV)",
    "category": "syntax",
    "difficulty_level": 1,
    "description": "KauBru follows Subject-Object-Verb order. The verb always comes at the end of the sentence.",
    "description_kaubru": "KauBru le brouh-mai-tang songpang se tong ha. Tang le salmung phui phai tong ha.",
    "rule_pattern": "Subject + Object + Verb + [Tense Marker]",
    "examples": [
      {"kaubru":"ang mai cha ha","english":"I have eaten food.",
       "breakdown":"ang (I) + mai (food) + cha (eat) + ha (completed)","audio_url":"/audio/grammar/grammar_rule_0001_ex1.mp3"},
      {"kaubru":"bung nouh thang gra nu","english":"He is going home.",
       "breakdown":"bung (he) + nouh (home) + thang (go) + gra nu (present continuous)","audio_url":"/audio/grammar/grammar_rule_0001_ex2.mp3"},
      {"kaubru":"ang tui nang tong ha","english":"I need water.",
       "breakdown":"ang (I) + tui (water) + nang (need) + tong ha (present)","audio_url":"/audio/grammar/grammar_rule_0001_ex3.mp3"},
    ],
    "exceptions": [
      {"description":"Questions can place the question word first: 'Mtoi ou thang ny nung ba?' (Where are you going?)","example_kaubru":"Mtoi ou thang ny nung ba?","example_english":"Where are you going?"}
    ],
    "related_rules": ["grammar_rule_0002","grammar_rule_0003"],
    "practice_exercises": [
      {"type":"arrange_words","question_english":"Arrange: I / rice / eat / completed","correct_answer":"ang mairung cha ha","options":["ang mairung cha ha","mairung ang cha ha","cha ang mairung ha"]},
      {"type":"translate","question_english":"Translate: She is reading a book.","correct_answer":"bung boi pore tong ha","options":["bung boi pore tong ha","boi bung pore ha","pore bung boi tong ha"]},
    ],
    "tags": ["beginner","essential","syntax"],
    "lesson_id": "lesson_daily_conversations",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
  },
  {
    "id": "grammar_rule_0002",
    "title": "Tense Markers",
    "title_kaubru": "Sal Talmung (Tense Markers)",
    "category": "morphology",
    "difficulty_level": 2,
    "description": "KauBru uses sentence-final particles to mark tense. 'ha' marks completed action, 'tong ou' marks ongoing action, 'nai' marks future action.",
    "description_kaubru": "KauBru le salmung phui khe tang talmung tong ha. 'ha' le cha ha tang, 'tong ou' le tong tang, 'nai' le khnai tang.",
    "rule_pattern": "Sentence + [ha | tong ou | nai]",
    "examples": [
      {"kaubru":"bung phai ha","english":"He came. (completed)","breakdown":"bung (he) + phai (come) + ha (past/completed)","audio_url":"/audio/grammar/grammar_rule_0002_ex1.mp3"},
      {"kaubru":"bung phai tong ou","english":"He is coming. (ongoing)","breakdown":"bung (he) + phai (come) + tong ou (present continuous)","audio_url":"/audio/grammar/grammar_rule_0002_ex2.mp3"},
      {"kaubru":"bung phai nai","english":"He will come. (future)","breakdown":"bung (he) + phai (come) + nai (future marker)","audio_url":"/audio/grammar/grammar_rule_0002_ex3.mp3"},
      {"kaubru":"hor sau tong ou","english":"The fire is burning.","breakdown":"hor (fire) + sau (burn) + tong ou (ongoing)","audio_url":"/audio/grammar/grammar_rule_0002_ex4.mp3"},
    ],
    "exceptions": [
      {"description":"Some stative verbs use 'ha' for present state, not past: 'aini nouh ktor ha' (My house is big)","example_kaubru":"aini nouh ktor ha","example_english":"My house is big."}
    ],
    "related_rules": ["grammar_rule_0001"],
    "practice_exercises": [
      {"type":"fill_in_blank","question_kaubru":"bung phai ___","question_english":"He came. (use past marker)","correct_answer":"ha","options":["ha","tong ou","nai"]},
      {"type":"fill_in_blank","question_kaubru":"ang samung tang ___ ___","question_english":"I am working. (use ongoing marker)","correct_answer":"tong ou","options":["ha","tong ou","nai"]},
    ],
    "tags": ["beginner","essential","tense"],
    "lesson_id": "lesson_daily_conversations",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
  },
  {
    "id": "grammar_rule_0003",
    "title": "Possessive Pronouns",
    "title_kaubru": "Aini-Nini-Bini Talmung",
    "category": "morphology",
    "difficulty_level": 1,
    "description": "Possessives are formed by adding 'ni' after the pronoun: ang (I) → aini (my), nung (you) → nini (your), bung (he/she) → bini (his/her).",
    "description_kaubru": "Aini le ang + ni, nini le nung + ni, bini le bung + ni. 'ni' le maiya talmung.",
    "rule_pattern": "Pronoun + ni → Possessive",
    "examples": [
      {"kaubru":"aini nouh ktor ha","english":"My house is big.","breakdown":"aini (my) + nouh (house) + ktor (big) + ha","audio_url":"/audio/grammar/grammar_rule_0003_ex1.mp3"},
      {"kaubru":"nini mmung kaham ha","english":"Your name is good.","breakdown":"nini (your) + mmung (name) + kaham (good) + ha","audio_url":"/audio/grammar/grammar_rule_0003_ex2.mp3"},
      {"kaubru":"bini mpha phai ou","english":"His father came.","breakdown":"bini (his) + mpha (father) + phai (come) + ou (ongoing)","audio_url":"/audio/grammar/grammar_rule_0003_ex3.mp3"},
    ],
    "exceptions": [
      {"description":"Kinship terms have special possessive forms: apa (my father), npha (your father), mpha (his/her father)","example_kaubru":"apa kaham ha","example_english":"My father is kind."}
    ],
    "related_rules": ["grammar_rule_0001","grammar_rule_0004"],
    "practice_exercises": [
      {"type":"fill_in_blank","question_english":"___ house is big. (my)","correct_answer":"aini","options":["aini","nini","bini"]},
      {"type":"translate","question_english":"Your name is good.","correct_answer":"nini mmung kaham ha","options":["nini mmung kaham ha","aini mmung kaham ha","bini mmung kaham ha"]},
    ],
    "tags": ["beginner","pronouns","possessive"],
    "lesson_id": "lesson_daily_conversations",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
  },
  {
    "id": "grammar_rule_0004",
    "title": "Personal Pronouns",
    "title_kaubru": "Brouh Talmung (Personal Pronouns)",
    "category": "morphology",
    "difficulty_level": 1,
    "description": "KauBru has distinct pronouns for singular and plural. Notably, 'bung' is used for both he and she (no gender distinction in third person singular).",
    "description_kaubru": "ang (I), chung (we), nung (you), nrao (you all), bung (he/she), brao (they).",
    "rule_pattern": "Singular: ang / nung / bung | Plural: chung / nrao / brao",
    "examples": [
      {"kaubru":"ang nouh thang gra nu","english":"I am going home.","breakdown":"ang (I) + nouh (home) + thang (go) + gra nu (present)","audio_url":"/audio/grammar/grammar_rule_0004_ex1.mp3"},
      {"kaubru":"bung phai tong ou","english":"He/She is coming.","breakdown":"bung (he/she) + phai (come) + tong ou (ongoing)","audio_url":"/audio/grammar/grammar_rule_0004_ex2.mp3"},
      {"kaubru":"brao mai cha ha","english":"They have eaten food.","breakdown":"brao (they) + mai (food) + cha (eat) + ha (completed)","audio_url":"/audio/grammar/grammar_rule_0004_ex3.mp3"},
    ],
    "exceptions": [
      {"description":"'bung' covers both he and she — KauBru does not distinguish gender in third person pronouns","example_kaubru":"bung nythau ha","example_english":"He/She is beautiful."}
    ],
    "related_rules": ["grammar_rule_0003"],
    "practice_exercises": [
      {"type":"choose","question_english":"Which pronoun means 'they'?","correct_answer":"brao","options":["bung","brao","nrao","chung"]},
      {"type":"translate","question_english":"We are going.","correct_answer":"chung thang gra nu","options":["chung thang gra nu","ang thang gra nu","brao thang gra nu"]},
    ],
    "tags": ["beginner","pronouns","essential"],
    "lesson_id": "lesson_daily_conversations",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
  },
  {
    "id": "grammar_rule_0005",
    "title": "Negation",
    "title_kaubru": "Ehi / Pho Talmung (Negation)",
    "category": "syntax",
    "difficulty_level": 2,
    "description": "Negation in KauBru uses 'ehi' (no) as a standalone response, or 'pho' placed after the verb to negate a statement.",
    "description_kaubru": "'ehi' le salmung phui khe tang pho. 'pho' le tang phui khe tong ha.",
    "rule_pattern": "Subject + Object + Verb + pho",
    "examples": [
      {"kaubru":"ehi, cya ang pho","english":"No, I don't know.","breakdown":"ehi (no) + cya (know) + ang (I) + pho (not)","audio_url":"/audio/grammar/grammar_rule_0005_ex1.mp3"},
      {"kaubru":"ang phai pho","english":"I am not coming.","breakdown":"ang (I) + phai (come) + pho (not)","audio_url":"/audio/grammar/grammar_rule_0005_ex2.mp3"},
    ],
    "exceptions": [],
    "related_rules": ["grammar_rule_0001","grammar_rule_0002"],
    "practice_exercises": [
      {"type":"translate","question_english":"I am not going.","correct_answer":"ang thang pho","options":["ang thang pho","ang pho thang","pho ang thang"]},
    ],
    "tags": ["intermediate","negation","syntax"],
    "lesson_id": "lesson_daily_conversations",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
  },
  {
    "id": "grammar_rule_0006",
    "title": "Counting System",
    "title_kaubru": "Phang Talmung (Counting System)",
    "category": "semantics",
    "difficulty_level": 2,
    "description": "KauBru uses a vigesimal (base-20) counting system. Numbers above ten are formed using 'khol' (20) as the base unit: khol (20), kurnoi (40=2x20), kurtham (60=3x20), kurbroi (80=4x20).",
    "description_kaubru": "KauBru le phang talmung khol (20) se tong ha. kurnoi le knoi khol, kurtham le ktham khol.",
    "rule_pattern": "Base numbers: ha knoi ktham broi ba douh sning chaih skuh chi | Tens: khol kurnoi kurtham kurbroi rzaha",
    "examples": [
      {"kaubru":"brouh khol","english":"Twenty people.","breakdown":"brouh (people) + khol (twenty)","audio_url":"/audio/grammar/grammar_rule_0006_ex1.mp3"},
      {"kaubru":"sal kurnoi","english":"Forty days.","breakdown":"sal (day) + kurnoi (forty = 2x20)","audio_url":"/audio/grammar/grammar_rule_0006_ex2.mp3"},
      {"kaubru":"rzaha","english":"One hundred.","breakdown":"rzaha (hundred, borrowed term)","audio_url":"/audio/grammar/grammar_rule_0006_ex3.mp3"},
    ],
    "exceptions": [
      {"description":"'rzaha' (hundred) is a borrowed term, not derived from the base-20 system","example_kaubru":"rzaha","example_english":"One hundred."}
    ],
    "related_rules": ["grammar_rule_0001"],
    "practice_exercises": [
      {"type":"choose","question_english":"What is 40 in KauBru?","correct_answer":"kurnoi","options":["khol","kurnoi","kurtham","kurbroi"]},
    ],
    "tags": ["intermediate","numbers","counting"],
    "lesson_id": "lesson_numbers",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
  },
]

# ── Write JSON files ──────────────────────────────────────────────────────────
def write_json(filename, data, root_key, categories, extra_meta=None):
    payload = {
        root_key: data,
        "metadata": {
            "version": "1.0",
            f"total_{root_key}": len(data),
            "last_updated": "2026-01-01T00:00:00Z",
            "categories": categories,
            **(extra_meta or {}),
        },
    }
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"  OK  {filename}  ({len(data)} entries)")

print("\nWriting JSON files...")
write_json("words.json", words_out, "words",
    sorted({w["category"] for w in words_out}),
    {"parts_of_speech": ["noun","verb","adjective","adverb","pronoun","numeral","phrase"]})
write_json("phrases.json", phrases_out, "phrases",
    sorted({p["category"] for p in phrases_out}),
    {"contexts": ["formal","informal","casual"]})
write_json("sentences.json", sentences_out, "sentences",
    sorted({s["category"] for s in sentences_out}),
    {"difficulty_levels": [1,2,3,4,5]})
write_json("grammar_rules.json", grammar_rules_out, "grammar_rules",
    ["syntax","morphology","phonology","semantics","pragmatics"])

print(f"""
Summary
-------
  words.json         -> {len(words_out)} words  (with pronunciation, related_words, part_of_speech)
  phrases.json       -> {len(phrases_out)} phrases  (with word_breakdown, cultural_context, usage_notes)
  sentences.json     -> {len(sentences_out)} sentences  (with grammar_points, word_breakdown, cultural_notes, lesson_id)
  grammar_rules.json -> {len(grammar_rules_out)} rules  (with Kaubru titles, descriptions, exercises)
""")
