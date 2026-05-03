from app.database import SessionLocal
from app import models
import datetime

def populate_stories():
    db = SessionLocal()
    try:
        # 1. Bring "The Legend of the Brass Pan" to the top
        legend = db.query(models.Story).filter(models.Story.title == "The Legend of the Brass Pan").first()
        if legend:
            legend.created_at = datetime.datetime.utcnow()
        
        # 2. Add content to "The Origin of the Hozagiri Dance"
        hozagiri = db.query(models.Story).filter(models.Story.title == "The Origin of the Hozagiri Dance").first()
        if hozagiri:
            hozagiri.content_english = (
                "The Hozagiri dance is the most famous pride of the Reang people. Legend says it was "
                "inspired by the movements of the gods during the creation of the world.\n\n"
                "The dancers must balance jars on their heads and move with the grace of a mountain stream. "
                "It is a dance of balance, strength, and devotion to the harvest goddess, Mainuma."
            )
            hozagiri.summary = "Discover the divine origin of the world-famous Hozagiri dance."
            hozagiri.cover_image_url = "/uploads/culture1.jpg" # Using existing asset
            
        # 3. Add content to "Why the Bamboo Bends"
        bamboo = db.query(models.Story).filter(models.Story.title == "Why the Bamboo Bends").first()
        if bamboo:
            bamboo.content_english = (
                "In the deep forests of Tripura, the bamboo is the king of plants. But long ago, the "
                "bamboo was stiff and proud, refusing to bow to the wind.\n\n"
                "One day, a great storm came. The stiff trees snapped, but the wise bamboo learned to bend "
                "with the wind to survive. It teaches us that flexibility is the greatest strength."
            )
            bamboo.summary = "A wise forest fable about strength through flexibility."
            bamboo.cover_image_url = "/uploads/story_forest.png"

        db.commit()
        print("Stories updated successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    populate_stories()
