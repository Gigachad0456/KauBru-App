"""
Seed KauBru folktales and cultural stories.
Run: python seed_stories.py
"""
from app.database import SessionLocal, engine
from app import models

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

count = db.query(models.Story).count()
if count > 0:
    print(f"Stories already seeded ({count} found). Delete them first to re-seed.")
    db.close()
    exit()

STORIES = [
    {
        "title": "The Origin of the Hozagiri Dance",
        "title_kaubru": "Hozagiri Nritya-ni Utpatti",
        "summary": "Long ago, the goddess Laxmi descended to earth and taught the Reang women the sacred Hozagiri dance as a blessing for prosperity and grace.",
        "content_english": (
            "Long ago, in the lush hills of Tripura, the Reang people lived in harmony with nature. "
            "One harvest season, when the crops were plentiful and the rivers ran clear, the goddess Laxmi descended from the heavens.\n\n"
            "She appeared before the women of the village as a radiant figure, her feet barely touching the ground. "
            "She showed them how to balance earthen pots on their heads while moving with perfect grace — each step a prayer, each sway a blessing.\n\n"
            "\"This dance,\" she told them, \"is my gift to you. Perform it with devotion, and prosperity will never leave your homes.\"\n\n"
            "From that day forward, the Hozagiri dance became the most sacred tradition of the Reang people — "
            "performed at every harvest, every wedding, and every celebration of life."
        ),
        "content_kaubru": (
            "Betha khe, Tripura-ni mphang-sa le, Reang nouhkhung le sal-tui-sa-ni kaham-ma tong ou. "
            "Ha sal-cha-ni tini le, mairung ktor sei, tui-sa kaham khe hiolkhlai ha.\n\n"
            "Laxmi broi sal-ni phai di ro ou. Broi le nouh-ni among-rao-ni phai di ro ou, nythau ma sei. "
            "Broi le among-rao-ni Hozagiri nritya-ni samung tang grao sei.\n\n"
            "\"Bo nritya,\" broi le ang ou, \"aini nung-rao-ni khachang ha. "
            "Bo nritya kaham-ma cha di, nouhkhung-ni kaham-ma tong ha.\"\n\n"
            "Bo tini-ni phai di, Hozagiri nritya le Reang nouhkhung-ni betha khe kaham-ma tong ha — "
            "sal-cha, nouh-ni mai, ang kaham-ma tong-ni tini le cha di."
        ),
        "category": "folktale",
        "is_premium": False,
        "read_time_minutes": 4,
    },
    {
        "title": "The Brave Hunter and the Forest Spirit",
        "title_kaubru": "Brouh Ang ang Mphang-ni Broi",
        "summary": "A young hunter ventures deep into the sacred forest and encounters a spirit who tests his courage and wisdom.",
        "content_english": (
            "In the time of our ancestors, there lived a young hunter named Raju in a village at the foot of the great hills. "
            "He was known for his courage and his skill with the bow.\n\n"
            "One day, Raju ventured deeper into the forest than any man had gone before. "
            "The trees grew tall and ancient, their roots like the fingers of giants. "
            "As the sun began to set, he heard a voice — neither human nor animal.\n\n"
            "\"Why do you enter my forest, young one?\" the voice asked.\n\n"
            "Raju stood firm. \"I hunt to feed my family. I take only what I need and leave the rest in peace.\"\n\n"
            "The forest spirit was pleased. \"You speak with wisdom. I will guide you safely home, "
            "and the forest will always provide for those who respect it.\"\n\n"
            "From that day, Raju became the guardian of the forest, teaching his people to live in balance with nature."
        ),
        "content_kaubru": (
            "Aini among-rao-ni tini le, ha nouh-ni mphang-sa le Raju mmung khe ang brouh tong ou. "
            "Broi le ang-ni samung-tang-grao sei-ni mmung khe pho ou.\n\n"
            "Ha tini le, Raju le mphang-sa le betha khe ang phai di ro ou. "
            "Mphang le ktor ang klao sei. Sal le phai di ro ou, broi le ha mmung pho ou.\n\n"
            "\"Mtoi ou thang ny nung ba, chrai ang?\" mmung le ang ou.\n\n"
            "Raju le brouh tong ou. \"Ang aini nouhkhung-ni mai cha di samung tang grao ou. "
            "Ang nang tong-ni ha khe cha di, ang kaham-ma tong ha.\"\n\n"
            "Mphang-ni broi le kaham-ma tong ou. \"Nung le kaham-ma ang ou. "
            "Ang nung-ni nouh-ni thang gra nu, mphang le kaham-ma tong-ni rao-ni mai cha di ha.\"\n\n"
            "Bo tini-ni phai di, Raju le mphang-ni samung-tang-grao sei tong ou."
        ),
        "category": "legend",
        "is_premium": False,
        "read_time_minutes": 5,
    },
    {
        "title": "The River That Remembered",
        "title_kaubru": "Tui-Sa Le Pho Tong Ha",
        "summary": "A wise elder teaches the village children why the river Gomati is sacred to the Reang people through an ancient story.",
        "content_english": (
            "Grandmother Rani gathered the children around the evening fire and began to speak.\n\n"
            "\"Long ago,\" she said, \"the river Gomati was just water — cold and indifferent. "
            "But one terrible drought came, and the crops withered, the animals fled, and the people wept.\n\n"
            "A young girl named Mala walked to the river's edge and sang to it — not asking for water, "
            "but thanking it for all the years it had given life. "
            "She sang of the fish it carried, the fields it watered, the children who played in its shallows.\n\n"
            "The river heard her. It remembered every life it had touched. "
            "And it began to flow again — not because it had to, but because it wanted to.\"\n\n"
            "The children sat in silence. Then the youngest asked, \"Is that why we always thank the river before we drink?\"\n\n"
            "Grandmother Rani smiled. \"Now you understand.\""
        ),
        "content_kaubru": (
            "Among Rani le chrai-rao-ni hor-ni phai di ro ou ang kaham-ma tong ou.\n\n"
            "\"Betha khe,\" broi le ang ou, \"tui-sa Gomati le tui khe — ste ang kaham ehi. "
            "Ha tini le ha brouh tini phai di ro ou, mairung le phai di ro ou, tao-rao le phai di ro ou.\n\n"
            "Mala mmung khe ha chrai broi le tui-sa-ni phai di ro ou ang rcha krung ou — "
            "tui-sa-ni nang tong-ni ang ehi, betha khe broi le sal cha di-ni khachang ha ang rcha krung ou.\n\n"
            "Tui-sa le pho ou. Broi le ang-ni phai di ro-ni sal-rao-ni pho tong ou. "
            "Ang le hiolkhlai tong ou — ang nang tong-ni ehi, ang nang tong-ni kaham-ma tong ou.\"\n\n"
            "Chrai-rao le kaham-ma tong ou. Ang le ste chrai ang ou, "
            "\"Bo khe aini tui cha di-ni phai di tui-sa-ni khachang ha ang ou ba?\"\n\n"
            "Among Rani le kaham-ma tong ou. \"Taoh ou pho ou.\""
        ),
        "category": "folktale",
        "is_premium": False,
        "read_time_minutes": 4,
    },
    {
        "title": "The Weaver's Secret",
        "title_kaubru": "Samung-Tang-Grao Sei Broi-ni Mmung",
        "summary": "A master weaver discovers that the patterns in KauBru cloth carry the prayers of every woman who wove before her.",
        "content_english": (
            "Every KauBru woman learns to weave. But old Meena knew something the others did not.\n\n"
            "Each pattern in the cloth — the triangles, the diamonds, the flowing lines — was not just decoration. "
            "They were words. Ancient words woven by the grandmothers of grandmothers, "
            "prayers for health, for love, for safe journeys.\n\n"
            "When Meena's granddaughter sat at the loom for the first time, she asked, \"What should I weave?\"\n\n"
            "Meena placed her hands over the girl's. \"Close your eyes. Think of someone you love. "
            "Now weave that feeling into the cloth.\"\n\n"
            "The girl wove slowly, carefully. When she opened her eyes, "
            "the pattern was unlike anything she had made before — but it was perfect.\n\n"
            "\"That pattern,\" Meena said softly, \"will keep her safe.\"\n\n"
            "And it did."
        ),
        "content_kaubru": (
            "Reang broi-rao le samung tang grao sei pho ou. Ang Meena le ang-rao-ni pho ehi-ni mmung pho ou.\n\n"
            "Nouh-ni samung-tang-grao sei-ni mmung — tham-ni mmung, brui-ni mmung, hiolkhlai-ni mmung — "
            "le nythau khe ehi. Broi-rao le mmung sei. "
            "Among-rao-ni among-rao-ni betha khe ang-rao le samung tang grao sei, "
            "kaham-ma tong-ni, maiya-ni, kaham-ma thang gra-ni ang ou.\n\n"
            "Meena-ni chrai broi le ha tini le samung tang grao sei-ni phai di ro ou, "
            "broi le ang ou, \"Ang mtoi samung tang grao sei ba?\"\n\n"
            "Meena le broi-ni mmung-ni phai di ro ou. \"Nung-ni mmung khe phai di. "
            "Nung le maiya-ni ang pho. Taoh ou bo kaham-ma tong-ni nouh-ni samung tang grao sei.\"\n\n"
            "Chrai broi le kaham-ma tong ou, brouh tong ou. "
            "Broi le mmung phai di ro ou, samung tang grao sei le nythau ma sei.\n\n"
            "\"Bo samung tang grao sei,\" Meena le kaham-ma ang ou, \"broi-ni kaham-ma tong ha.\"\n\n"
            "Ang kaham-ma tong ha."
        ),
        "category": "legend",
        "is_premium": True,
        "read_time_minutes": 3,
    },
    {
        "title": "Why the Bamboo Bends",
        "title_kaubru": "Mphang-Ste Mtoi Khe Hiolkhlai Ha",
        "summary": "A short proverb-story explaining why the bamboo bends in the wind but never breaks — a lesson in resilience for the Reang people.",
        "content_english": (
            "The old ones say: watch the bamboo in the storm.\n\n"
            "The great oak tree stands rigid against the wind. It does not bend. "
            "And when the storm is strong enough, it breaks.\n\n"
            "But the bamboo — the bamboo bends. It bows low, almost to the ground. "
            "The wind passes over it, through it, around it. "
            "And when the storm is gone, the bamboo stands tall again.\n\n"
            "\"Be like the bamboo,\" the elders teach. "
            "\"Bend when life is hard. Do not break. "
            "The storm always passes, and you will stand again.\"\n\n"
            "This is the way of the Reang people."
        ),
        "content_kaubru": (
            "Among-rao le ang ou: mphang-ste le hor-ni tini le pho di.\n\n"
            "Ktor mphang le hor-ni phai di brouh tong ha. Broi le hiolkhlai ehi. "
            "Ang hor le betha khe brouh sei, broi le phai di ro ha.\n\n"
            "Ang mphang-ste — mphang-ste le hiolkhlai ha. Broi le sal-ni phai di ro, "
            "mphang-sa-ni phai di ro. Hor le broi-ni phai di ro, broi-ni ang, broi-ni mphang-sa le. "
            "Ang hor le phai di ro ou, mphang-ste le klao tong ha.\n\n"
            "\"Mphang-ste khe tong di,\" among-rao le ang ou. "
            "\"Sal le brouh sei, hiolkhlai di. Phai di ro ehi. "
            "Hor le kaham-ma phai di ro ha, ang nung le klao tong ha.\"\n\n"
            "Bo le Reang nouhkhung-ni samung tang grao sei."
        ),
        "category": "proverb",
        "is_premium": False,
        "read_time_minutes": 2,
    },
]

for s in STORIES:
    db.add(models.Story(**s))

db.commit()
print(f"Seeded {len(STORIES)} KauBru folktales successfully!")
db.close()
