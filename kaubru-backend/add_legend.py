from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
import datetime

def add_folkstory():
    db = SessionLocal()
    try:
        # Check if story already exists
        existing = db.query(models.Story).filter(models.Story.title == "The Legend of the Brass Pan").first()
        if existing:
            print("Story already exists.")
            return

        # 1. Create or get some vocabulary words for the story
        vocab_data = [
            {"english": "Queen", "kaubru": "Maharani", "category": "people"},
            {"english": "Mother", "kaubru": "Ama", "category": "family"},
            {"english": "Chief", "kaubru": "Rai", "category": "people"},
            {"english": "Sacred", "kaubru": "Kthar", "category": "culture"},
        ]
        
        vocab_ids = []
        for v in vocab_data:
            word = db.query(models.Word).filter(models.Word.english == v["english"]).first()
            if not word:
                word = models.Word(**v)
                db.add(word)
                db.commit()
                db.refresh(word)
            vocab_ids.append(word.id)

        # 2. Add the Story
        new_story = models.Story(
            title="The Legend of the Brass Pan",
            title_kaubru="Biangma-ni Kacha",
            category="legend",
            summary="The sacred tale of how the Reang tribe and the Royal Family of Tripura became one through a queen's compassion.",
            content_english=(
                "Long ago, during a time of great migration and strife, the chiefs of the Reang (Bru) people "
                "sought refuge in the kingdom of Tripura. They were a strong and proud people, but they "
                "arrived as strangers in a new land.\n\n"
                "Initially, the royal guards were suspicious, and conflict seemed inevitable. However, "
                "Queen Gunavati, known for her wisdom and immense heart, saw the truth in their eyes. "
                "She ordered the chiefs to be brought before her.\n\n"
                "In a legendary gesture of peace and adoption, the Queen filled a massive brass pan (Kacha) "
                "with milk. She treated the tribal chiefs as her own sons, symbolically feeding them to "
                "establish a bond that could never be broken by sword or time. This 'mother-child' bond "
                "is why the Reang people remained loyal guardians of the kingdom for centuries.\n\n"
                "To this day, the brass pan is remembered as a sacred artifact of unity, a symbol of the "
                "day the Reang people found their home."
            ),
            content_kaubru=(
                "Haga msi ba-o, Reang ra-rao Tripura ha-o phai-o. "
                "Maharani Gunavati boro-no b-sa g-thang h-n-wi ladi-o. "
                "Bini kacha ba-o mchu-toi t-wi boro-no ladi-wi, b-sa g-m-wi khlai-o. "
                "Abo-ni bagwi Reang ra-rao Maharani-no Ama h-n-wi m-n-di-o."
            ),
            cover_image_url="/static/images/legend_brass_pan.png", # Placeholder, will be linked to generated asset
            read_time_minutes=4,
            is_premium=False
        )
        
        db.add(new_story)
        db.commit()
        db.refresh(new_story)

        # 3. Link vocabulary to the story
        for word_id in vocab_ids:
            story_word = models.StoryWord(story_id=new_story.id, word_id=word_id)
            db.add(story_word)
        
        db.commit()
        print(f"Successfully added story: {new_story.title}")

    finally:
        db.close()

if __name__ == "__main__":
    add_folkstory()
