"""
Seed script — run once to populate the database with sample data.
Usage:  python seed.py
"""

from app.database import SessionLocal, engine
from app import models
from app.auth import hash_password

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ─── Words / Dictionary ───────────────────────────────────────────────────────

WORDS = [
    # Greetings
    {"english": "hello", "kaubru": "Hou", "category": "greetings",
     "example_english": "Hello, how are you?", "example_kaubru": "hou, kaham de tong?"},
    {"english": "goodbye", "kaubru": "N/A", "category": "greetings",
     "example_english": "Goodbye, see you tomorrow.", "example_kaubru": "Khnai malai phi na"},
    {"english": "thank you", "kaubru": "khachang ha", "category": "greetings",
     "example_english": "Thank you very much.", "example_kaubru": "betha khe khachangha."},
    {"english": "yes", "kaubru": "em", "category": "greetings",
     "example_english": "Yes, I understand.", "example_kaubru": "em, ang mchi ou/ha."},
    {"english": "no", "kaubru": "ehi", "category": "greetings",
     "example_english": "No, I don't know.", "example_kaubru": "ehi, cya ang pho"},
    {"english": "how are you", "kaubru": "kaham de tong?", "category": "greetings",
     "example_english": "How are you today?", "example_kaubru": "kaham de tong tini le?"},
    {"english": "what is your name", "kaubru": "nini mmung kma?", "category": "greetings",
     "example_english": "What is your name?", "example_kaubru": "Nini mmung kma?"},
    {"english": "my name is", "kaubru": "aini mmung khe ", "category": "greetings",
     "example_english": "My name is Raju.", "example_kaubru": "Aini mmung khe Raju."},

    # Family
    {"english": "mother", "kaubru": "among/mma", "category": "family",
     "example_english": "My mother is kind.", "example_kaubru": "Aini mma le brouh kaham ma sei."},
    {"english": "father", "kaubru": "apa/mpha", "category": "family",
     "example_english": "My father works hard.", "example_kaubru": "Aini mpha le samung tang grao sei."},
    {"english": "brother", "kaubru": "mta/ata", "category": "family",
     "example_english": "My brother is tall.", "example_kaubru": "aini mta le klau ma sei."},
    {"english": "sister", "kaubru": "mbi/aibi", "category": "family",
     "example_english": "My sister sings well.", "example_kaubru": "aini mbi le rcha krung ma sei"},
    {"english": "child", "kaubru": "chrai msa", "category": "family",
     "example_english": "The child is playing.", "example_kaubru": "chraiha rao thung pai tong ou"},
    {"english": "family", "kaubru": "nouhkhung", "category": "family",
     "example_english": "My family is big.", "example_kaubru": "aini le nouhkhung ktor sei."},

    # Nature / Daily
    {"english": "water", "kaubru": "tui", "category": "nature",
     "example_english": "I need water.", "example_kaubru": "ang tui nang tong ha."},
    {"english": "rice", "kaubru": "mairung", "category": "food",
     "example_english": "Rice is our staple food.", "example_kaubru": "Mairung sei chini sal boini mai."},
    {"english": "house", "kaubru": "nouh", "category": "places",
     "example_english": "I am going home.", "example_kaubru": "Ang nouh thang gra nu."},
    {"english": "fire", "kaubru": "hor", "category": "nature",
     "example_english": "The fire is burning.", "example_kaubru": "hor kham tong ha."},
    {"english": "sun", "kaubru": "sal", "category": "nature",
     "example_english": "The sun is bright.", "example_kaubru": "sal kara ha."},
    {"english": "moon", "kaubru": "tal", "category": "nature",
     "example_english": "The moon is beautiful.", "example_kaubru": "tal nythau ha."},
    {"english": "river", "kaubru": "tui-sa", "category": "nature",
     "example_english": "The river flows fast.", "example_kaubru": "Tui-sa betha khe hiolkhlai ha."},
    {"english": "tree", "kaubru": "mphang", "category": "nature",
     "example_english": "The tree is tall.", "example_kaubru": "bo mphang le klao ha le."},

    # Numbers
    {"english": "one", "kaubru": "ha", "category": "numbers",
     "example_english": "One apple.", "example_kaubru": "thaiha appel"},
    {"english": "two", "kaubru": "knoi", "category": "numbers",
     "example_english": "Two birds.", "example_kaubru": "kenoi tao."},
    {"english": "three", "kaubru": "tham", "category": "numbers",
     "example_english": "Three children.", "example_kaubru": "chrai rao khrauktham."},
    {"english": "four", "kaubru": "brui", "category": "numbers",
     "example_english": "Four houses.", "example_kaubru": "nouh kebrui."},
    {"english": "five", "kaubru": "ba", "category": "numbers",
     "example_english": "Five rivers.", "example_kaubru": "keba tuisa."},
    {"english": "ten", "kaubru": "chi", "category": "numbers",
     "example_english": "Ten days.", "example_kaubru": "sal chi."},

    # Adjectives
    {"english": "good", "kaubru": "kaham", "category": "adjectives",
     "example_english": "This is good.", "example_kaubru": "bo le kaham no."},
    {"english": "big", "kaubru": "ktor", "category": "adjectives",
     "example_english": "A big house.", "example_kaubru": "Nouh ktor."},
    {"english": "small", "kaubru": "ste", "category": "adjectives",
     "example_english": "A small bird.", "example_kaubru": "taopi."},
    {"english": "beautiful", "kaubru": "nythau", "category": "adjectives",
     "example_english": "She is beautiful.", "example_kaubru": "broi nythau sei."},

    # Common phrases
    {"english": "i am going home", "kaubru": "ang nouh thang ganu", "category": "phrases",
     "example_english": "I am going home now.", "example_kaubru": "taoh ou nouh thang gra nu ."},
    {"english": "i love you", "kaubru": "ang nung no maiya ong ou", "category": "phrases",
     "example_english": "I love you, mother.", "example_kaubru": "among nung no maiya ong ou ang."},
    {"english": "where are you going", "kaubru": "mtoi ou thang ny nung ba?", "category": "phrases",
     "example_english": "Where are you going?", "example_kaubru": "Mtoi ou thang ny nung ba?"},
    {"english": "come here", "kaubru": "phai di ro", "category": "phrases",
     "example_english": "Come here quickly.", "example_kaubru": "phut khe phai di ro ou."},
    {"english": "eat food", "kaubru": "mai cha di", "category": "phrases",
     "example_english": "Let us eat food.", "example_kaubru": "Mai cha lai na."},
]

# ─── Lessons ──────────────────────────────────────────────────────────────────

LESSONS = [
    {
        "title": "Common Greetings",
        "description": "Learn everyday greetings in KauBru language.",
        "category": "greetings",
        "progress": 0.0,
        "is_premium": False,
    },
    {
        "title": "Family Words",
        "description": "Names for family members in KauBru.",
        "category": "family",
        "progress": 0.0,
        "is_premium": False,
    },
    {
        "title": "Numbers 1–10",
        "description": "Count from one to ten in KauBru.",
        "category": "numbers",
        "progress": 0.0,
        "is_premium": False,
    },
    {
        "title": "Daily Conversations",
        "description": "Useful phrases for everyday conversations.",
        "category": "phrases",
        "progress": 0.0,
        "is_premium": False,
    },
    {
        "title": "Folk Stories",
        "description": "Traditional KauBru folk stories with vocabulary.",
        "category": "culture",
        "progress": 0.0,
        "is_premium": True,
    },
    {
        "title": "Pronunciation Practice",
        "description": "Master the sounds and tones of KauBru.",
        "category": "pronunciation",
        "progress": 0.0,
        "is_premium": True,
    },
]

# ─── Demo User ────────────────────────────────────────────────────────────────

def seed():
    # Words
    existing_words = db.query(models.Word).count()
    if existing_words == 0:
        for w in WORDS:
            db.add(models.Word(**w))
        print(f"[OK] Seeded {len(WORDS)} words.")
    else:
        print(f"[SKIP] Words already seeded ({existing_words} found).")

    # Lessons
    existing_lessons = db.query(models.Lesson).count()
    if existing_lessons == 0:
        for l in LESSONS:
            db.add(models.Lesson(**l))
        print(f"[OK] Seeded {len(LESSONS)} lessons.")
    else:
        print(f"[SKIP] Lessons already seeded ({existing_lessons} found).")

    # Demo user
    demo = db.query(models.User).filter(models.User.email == "demo@kaubru.app").first()
    if not demo:
        db.add(models.User(
            name="Demo User",
            email="demo@kaubru.app",
            password_hash=hash_password("demo1234"),
            points=50,
            is_premium=False,
        ))
        print("[OK] Seeded demo user  →  email: demo@kaubru.app  |  password: demo1234")
    else:
        print("[SKIP] Demo user already exists.")

    db.commit()
    print("\n[DONE] Seed complete!")


def seed_admin():
    """Create a default admin account."""
    admin = db.query(models.User).filter(models.User.email == "admin@kaubru.app").first()
    if not admin:
        db.add(models.User(
            name="Admin",
            email="admin@kaubru.app",
            password_hash=hash_password("admin1234"),
            role="admin",
            points=0,
            is_premium=True,
        ))
        db.commit()
        print("[OK] Seeded admin  →  email: admin@kaubru.app  |  password: admin1234")
    else:
        print("[SKIP] Admin already exists.")


if __name__ == "__main__":
    seed()
    seed_admin()
    db.close()
